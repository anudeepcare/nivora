import type { Candle, Signal } from "./types";
import { monthEndSession } from "./calendar.ts";
import { evidenceMemo } from "./evidence-memo.ts";
export const ACCUMULATION_VERSION = "monthly-v3";
export type AdaptiveSignal = Signal & {
  date: string;
  trend: number;
  z: number;
  scale: number;
  buy2: number;
  buy3: number;
  buy4: number;
  pauseAbove: number;
  trimReview: boolean;
  risk: string;
};
const median = (values: number[]) => {
  const a = [...values].sort((x, y) => x - y),
    i = Math.floor(a.length / 2);
  return a.length % 2 ? a[i] : (a[i - 1] + a[i]) / 2;
};
const monthIndex = (m: string) =>
  Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1;
function settlement(asOf: string, market: "us-equity" | "crypto") {
  const at = new Date(asOf);
  if (!Number.isFinite(at.getTime())) return null;
  const timeZone = market === "crypto" ? "UTC" : "America/New_York";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(at)
      .map((x) => [x.type, x.value]),
  );
  const day = `${parts.year}-${parts.month}-${parts.day}`;
  return {
    day,
    month: day.slice(0, 7),
    includeDay: market === "us-equity" && Number(parts.hour) >= 17,
  };
}
export function adaptiveSettledBars(
  bars: Candle[],
  asOf: string,
  market: "us-equity" | "crypto" = "us-equity",
) {
  const cutoff = settlement(asOf, market);
  if (!cutoff) return [];
  const seen = new Map<string, Candle>();
  for (const b of bars) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(b.time) ||
      !Number.isFinite(Date.parse(b.time)) ||
      new Date(b.time).toISOString().slice(0, 10) !== b.time ||
      b.time > cutoff.day ||
      (!cutoff.includeDay && b.time === cutoff.day) ||
      ![b.open, b.high, b.low, b.close].every(
        (x) => Number.isFinite(x) && x > 0,
      ) ||
      b.high < Math.max(b.open, b.close, b.low) ||
      b.low > Math.min(b.open, b.close, b.high)
    )
      continue;
    if (
      market === "us-equity" &&
      [0, 6].includes(new Date(b.time + "T12:00:00Z").getUTCDay())
    )
      continue;
    const previous = seen.get(b.time);
    // Conflicting duplicate closes cannot silently win by input order.
    if (
      previous &&
      [previous.open, previous.high, previous.low, previous.close].some(
        (x, i) => x !== [b.open, b.high, b.low, b.close][i],
      )
    )
      seen.set(b.time, { ...b, close: NaN });
    else if (!previous) seen.set(b.time, b);
  }
  return [...seen.values()]
    .filter((b) => Number.isFinite(b.close))
    .sort((a, b) => a.time.localeCompare(b.time));
}
function reading(previous: Candle[], bar: Candle): AdaptiveSignal {
  const logs = previous.map((b) => Math.log(b.close)),
    slopes: number[] = [];
  for (let i = 0; i < logs.length; i++)
    for (let j = i + 1; j < logs.length; j++)
      slopes.push((logs[j] - logs[i]) / (j - i));
  const slope = median(slopes),
    intercept = median(logs.map((v, i) => v - slope * i));
  const residuals = logs.map((v, i) => v - intercept - slope * i),
    centre = median(residuals);
  const returns = logs.slice(1).map((v, i) => v - logs[i]),
    returnCentre = median(returns);
  const scale = Math.max(
    0.07,
    1.4826 * median(residuals.map((x) => Math.abs(x - centre))),
    1.4826 *
      median(returns.map((x) => Math.abs(x - returnCentre))) *
      Math.sqrt(3),
  );
  const trend = Math.exp(intercept + slope * logs.length + centre),
    peak = Math.max(...previous.map((b) => b.close));
  const z = Math.log(bar.close / trend) / scale,
    drawdown = Math.min(0, (bar.close / peak - 1) * 100),
    deviation = (bar.close / trend - 1) * 100;
  const multiplier: Signal["multiplier"] =
    z >= 2 && bar.close / trend >= 1.25
      ? 0
      : drawdown <= -40 && z <= -2
        ? 4
        : drawdown <= -25 && z <= -1.35
          ? 3
          : drawdown <= -12 && z <= -0.7
            ? 2
            : 1;
  const last3 =
    [...previous.slice(-2), bar].reduce((s, b) => s + b.close, 0) / 3;
  const last6 =
    [...previous.slice(-5), bar].reduce((s, b) => s + b.close, 0) / 6;
  const falling = bar.close < last3 && last3 < last6;
  return {
    month: bar.time.slice(0, 7),
    date: bar.time,
    close: bar.close,
    multiplier,
    drawdown,
    deviation,
    trend,
    z,
    scale,
    buy2: Math.min(peak * 0.88, trend * Math.exp(-0.7 * scale)),
    buy3: Math.min(peak * 0.75, trend * Math.exp(-1.35 * scale)),
    buy4: Math.min(peak * 0.6, trend * Math.exp(-2 * scale)),
    pauseAbove: Math.max(trend * 1.25, trend * Math.exp(2 * scale)),
    trimReview: z >= 3 && bar.close / previous.at(-12)!.close >= 1.5,
    risk: falling
      ? "Downtrend persists; the zone does not confirm support."
      : "Price condition only; check business, funding and position risk.",
    reason:
      multiplier === 0
        ? `${deviation.toFixed(1)}% above its prior fitted trend; an extension condition.`
        : multiplier === 1
          ? "A stronger pullback condition is not established."
          : `${Math.abs(drawdown).toFixed(1)}% below the prior monthly high and ${Math.abs(z).toFixed(1)} robust deviations below trend.`,
  };
}
function compute(bars: Candle[], asOf: string, market: "us-equity" | "crypto") {
  const cutoff = settlement(asOf, market),
    groups = new Map<string, Candle>();
  const empty = {
    version: ACCUMULATION_VERSION,
    confirmed: null as AdaptiveSignal | null,
    forming: null as AdaptiveSignal | null,
    history: [] as AdaptiveSignal[],
    reason:
      "24 consecutive completed prior months and a settled observation are required.",
  };
  if (!cutoff) return empty;
  for (const b of adaptiveSettledBars(bars, asOf, market))
    groups.set(b.time.slice(0, 7), b);
  const rows = [...groups.entries()],
    history: AdaptiveSignal[] = [];
  let forming: AdaptiveSignal | null = null;
  for (let i = 24; i < rows.length; i++) {
    const prior = rows.slice(i - 24, i),
      [month, bar] = rows[i];
    if (
      prior.some(
        ([m, b], j) =>
          b.time !== monthEndSession(m, market) ||
          (j > 0 && monthIndex(m) - monthIndex(prior[j - 1][0]) !== 1),
      ) ||
      monthIndex(month) - monthIndex(prior.at(-1)![0]) !== 1
    )
      continue;
    const closed = bar.time === monthEndSession(month, market);
    if (month < cutoff.month && !closed) continue;
    const signal = reading(
      prior.map(([, b]) => b),
      bar,
    );
    if (
      !Object.values(signal).every(
        (v) => typeof v !== "number" || Number.isFinite(v),
      )
    )
      continue;
    if (closed) history.push(signal);
    else if (month === cutoff.month) forming = signal;
  }
  const latest = history.at(-1),
    confirmed =
      latest && monthIndex(cutoff.month) - monthIndex(latest.month) <= 1
        ? latest
        : null;
  return {
    ...empty,
    confirmed,
    forming,
    history,
    reason: confirmed
      ? "Trend-adjusted price conditions; not a return prediction or company valuation."
      : empty.reason,
  };
}
const memo = evidenceMemo<ReturnType<typeof compute>>();
export function researchAccumulation(
  bars: Candle[],
  asOf: string,
  market: "us-equity" | "crypto" = "us-equity",
) {
  return memo(bars, `${asOf}:${market}`, () => compute(bars, asOf, market));
}
