import type { Candle } from "./types";
import { adaptiveSettledBars } from "./accumulation-policy-v3.ts";
import { evidenceMemo } from "./evidence-memo.ts";

/**
 * Additional completed-bar studies. Pure functions of settled daily bars; every study returns
 * null when its minimum history is missing. These describe past price behaviour. They do not
 * establish value and have no demonstrated edge as trading rules.
 */
const fin = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v);
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const sd = (a: number[]) => {
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
};
export type Direction = "up" | "down";

function wilderAtr(rows: Candle[], n: number): (number | null)[] {
  const out: (number | null)[] = rows.map(() => null);
  if (rows.length <= n) return out;
  const tr = rows.map((b, i) =>
    i === 0 ? b.high - b.low : Math.max(b.high - b.low, Math.abs(b.high - rows[i - 1].close), Math.abs(b.low - rows[i - 1].close)),
  );
  let a = mean(tr.slice(1, n + 1));
  out[n] = a;
  for (let i = n + 1; i < rows.length; i++) {
    a = (a * (n - 1) + tr[i]) / n;
    out[i] = a;
  }
  return out;
}
function ema(values: number[], n: number): (number | null)[] {
  const out: (number | null)[] = values.map(() => null);
  if (values.length < n) return out;
  let e = mean(values.slice(0, n));
  out[n - 1] = e;
  const k = 2 / (n + 1);
  for (let i = n; i < values.length; i++) {
    e = values[i] * k + e * (1 - k);
    out[i] = e;
  }
  return out;
}
function supertrend(rows: Candle[], n = 10, m = 3) {
  if (rows.length <= n + 1) return null;
  const atr = wilderAtr(rows, n);
  let fu: number | null = null,
    fl: number | null = null,
    dir = 0,
    line = 0;
  for (let i = n; i < rows.length; i++) {
    const hl2 = (rows[i].high + rows[i].low) / 2,
      bu = hl2 + m * atr[i]!,
      bl = hl2 - m * atr[i]!,
      pc = rows[i - 1].close;
    fu = fu == null || bu < fu || pc > fu ? bu : fu;
    fl = fl == null || bl > fl || pc < fl ? bl : fl;
    if (dir === 0) dir = rows[i].close >= hl2 ? 1 : -1;
    else if (dir === -1 && rows[i].close > fu) dir = 1;
    else if (dir === 1 && rows[i].close < fl) dir = -1;
    line = dir === 1 ? fl : fu;
  }
  return { direction: (dir === 1 ? "up" : "down") as Direction, level: line };
}
function parabolicSar(rows: Candle[], step = 0.02, max = 0.2) {
  if (rows.length < 5) return null;
  let up = rows[1].close >= rows[0].close;
  let ep = up ? Math.max(rows[0].high, rows[1].high) : Math.min(rows[0].low, rows[1].low);
  let sar = up ? Math.min(rows[0].low, rows[1].low) : Math.max(rows[0].high, rows[1].high);
  let af = step;
  for (let i = 2; i < rows.length; i++) {
    sar = sar + af * (ep - sar);
    if (up) {
      sar = Math.min(sar, rows[i - 1].low, rows[i - 2].low);
      if (rows[i].low < sar) {
        up = false;
        sar = ep;
        ep = rows[i].low;
        af = step;
      } else if (rows[i].high > ep) {
        ep = rows[i].high;
        af = Math.min(af + step, max);
      }
    } else {
      sar = Math.max(sar, rows[i - 1].high, rows[i - 2].high);
      if (rows[i].high > sar) {
        up = true;
        sar = ep;
        ep = rows[i].high;
        af = step;
      } else if (rows[i].low < ep) {
        ep = rows[i].low;
        af = Math.min(af + step, max);
      }
    }
  }
  return { direction: (up ? "up" : "down") as Direction, level: sar };
}
const midRange = (rows: Candle[], end: number, n: number) => {
  const w = rows.slice(end - n + 1, end + 1);
  return (Math.max(...w.map((b) => b.high)) + Math.min(...w.map((b) => b.low))) / 2;
};
function ichimoku(rows: Candle[]) {
  if (rows.length < 78) return null;
  const last = rows.length - 1,
    now = rows[last].close,
    past = last - 26,
    spanA = (midRange(rows, past, 9) + midRange(rows, past, 26)) / 2,
    spanB = midRange(rows, past, 52),
    top = Math.max(spanA, spanB),
    bottom = Math.min(spanA, spanB);
  return {
    tenkan: midRange(rows, last, 9),
    kijun: midRange(rows, last, 26),
    cloudTop: top,
    cloudBottom: bottom,
    position: (now > top ? "above" : now < bottom ? "below" : "inside") as "above" | "below" | "inside",
  };
}
function aroon(rows: Candle[], n = 25) {
  if (rows.length < n + 1) return null;
  const w = rows.slice(-(n + 1));
  let hi = 0,
    lo = 0;
  w.forEach((b, i) => {
    if (b.high >= w[hi].high) hi = i;
    if (b.low <= w[lo].low) lo = i;
  });
  return { up: (100 * (n - (n - hi))) / n, down: (100 * (n - (n - lo))) / n };
}
function keltner(rows: Candle[]) {
  if (rows.length < 21) return null;
  const mid = ema(rows.map((b) => b.close), 20).at(-1),
    atr = wilderAtr(rows, 10).at(-1);
  if (!fin(mid) || !fin(atr)) return null;
  const close = rows.at(-1)!.close,
    upper = mid + 2 * atr,
    lower = mid - 2 * atr;
  return { mid, upper, lower, position: (close > upper ? "above" : close < lower ? "below" : "inside") as "above" | "below" | "inside" };
}
function awesome(rows: Candle[]) {
  if (rows.length < 34) return null;
  const med = rows.map((b) => (b.high + b.low) / 2);
  return mean(med.slice(-5)) - mean(med.slice(-34));
}
function trix(rows: Candle[]) {
  const e1 = ema(rows.map((b) => b.close), 15).filter(fin),
    e2 = ema(e1, 15).filter(fin),
    e3 = ema(e2, 15).filter(fin);
  if (e3.length < 2 || e3.at(-2)! <= 0) return null;
  return 100 * (e3.at(-1)! / e3.at(-2)! - 1);
}
function ultimate(rows: Candle[]) {
  if (rows.length < 29) return null;
  const bp: number[] = [],
    tr: number[] = [];
  for (let i = 1; i < rows.length; i++) {
    const low = Math.min(rows[i].low, rows[i - 1].close),
      high = Math.max(rows[i].high, rows[i - 1].close);
    bp.push(rows[i].close - low);
    tr.push(high - low);
  }
  const avg = (n: number) => {
    const t = tr.slice(-n).reduce((s, x) => s + x, 0);
    return t > 0 ? bp.slice(-n).reduce((s, x) => s + x, 0) / t : null;
  };
  const a = avg(7),
    b = avg(14),
    c = avg(28);
  return a == null || b == null || c == null ? null : (100 * (4 * a + 2 * b + c)) / 7;
}
function risk(rows: Candle[], sessions: number) {
  const n = Math.min(sessions, rows.length - 1);
  if (n < 60) return null;
  const closes = rows.slice(-(n + 1)).map((b) => b.close),
    r = closes.slice(1).map((c, i) => c / closes[i] - 1),
    annual = mean(r) * sessions,
    vol = sd(r) * Math.sqrt(sessions),
    downside = Math.sqrt(mean(r.map((x) => Math.min(x, 0) ** 2))) * Math.sqrt(sessions);
  let peak = closes[0],
    sq = 0;
  for (const c of closes) {
    peak = Math.max(peak, c);
    sq += (100 * (c / peak - 1)) ** 2;
  }
  return {
    observations: n,
    annualReturn: annual * 100,
    volatility: vol * 100,
    // No risk-free rate is subtracted; this is return per unit of volatility only.
    returnPerVolatility: vol > 0 ? annual / vol : null,
    returnPerDownside: downside > 0 ? annual / downside : null,
    ulcerIndex: Math.sqrt(sq / closes.length),
  };
}
function volatilityPercentile(rows: Candle[], sessions: number) {
  const closes = rows.map((b) => b.close),
    r = closes.slice(1).map((c, i) => c / closes[i] - 1),
    hv: number[] = [];
  for (let i = 20; i <= r.length; i++) hv.push(sd(r.slice(i - 20, i)) * Math.sqrt(sessions));
  const window = hv.slice(-sessions);
  if (window.length < 60) return null;
  const latest = window.at(-1)!,
    below = window.slice(0, -1).filter((x) => x <= latest).length;
  return { current: latest * 100, percentile: (100 * below) / (window.length - 1) };
}
export function computeMoreStudies(rows: Candle[], sessions = 252) {
  return {
    count: rows.length,
    asOf: rows.at(-1)?.time ?? null,
    supertrend: supertrend(rows),
    parabolicSar: parabolicSar(rows),
    ichimoku: ichimoku(rows),
    aroon: aroon(rows),
    keltner: keltner(rows),
    awesome: awesome(rows),
    trix: trix(rows),
    ultimate: ultimate(rows),
    risk: risk(rows, sessions),
    volatility: volatilityPercentile(rows, sessions),
  };
}
const memo = evidenceMemo<ReturnType<typeof computeMoreStudies>>();
export function moreStudies(
  input: Candle[],
  asOf: string,
  market: "us-equity" | "crypto" = "us-equity",
  sessions = market === "crypto" ? 365 : 252,
) {
  return memo(input, `${asOf}:${market}:${sessions}`, () =>
    computeMoreStudies(
      adaptiveSettledBars(input, asOf, market).filter((b) => b.time < asOf.slice(0, 10)),
      sessions,
    ),
  );
}
