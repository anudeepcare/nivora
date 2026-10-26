import type { Candle } from "./types";
import { adaptiveSettledBars } from "./accumulation-policy-v3.ts";
import { evidenceMemo } from "./evidence-memo.ts";

/**
 * Rewind: for every completed session, what the simple price signals said that day and what the
 * price did afterwards. Everything is computed from the company's own completed daily bars. It
 * describes history. It does not predict, and the "days like this" statistics overlap in time.
 */
export type Trend = "above" | "below" | "mixed";
export type RsiBand = "low" | "mid" | "high";
export const REWIND_HORIZONS = [21, 63, 126] as const;
export type Horizon = (typeof REWIND_HORIZONS)[number];
export type RewindDay = {
  time: string;
  close: number;
  ma50: number | null;
  ma200: number | null;
  rsi: number | null;
  /** Percent below the highest close of the trailing 252 sessions (0 or negative). */
  drawdown: number;
  trend: Trend | null;
  rsiBand: RsiBand | null;
  /** Percent change from this close to the close `h` sessions later, or null if not yet observed. */
  forward: Record<Horizon, number | null>;
};

function wilderRsi(closes: number[], n = 14): (number | null)[] {
  const out: (number | null)[] = closes.map(() => null);
  if (closes.length <= n) return out;
  let gain = 0,
    loss = 0;
  for (let i = 1; i <= n; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  gain /= n;
  loss /= n;
  out[n] = loss === 0 ? (gain === 0 ? 50 : 100) : 100 - 100 / (1 + gain / loss);
  for (let i = n + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gain = (gain * (n - 1) + Math.max(d, 0)) / n;
    loss = (loss * (n - 1) + Math.max(-d, 0)) / n;
    out[i] = loss === 0 ? (gain === 0 ? 50 : 100) : 100 - 100 / (1 + gain / loss);
  }
  return out;
}
function smaSeries(values: number[], n: number): (number | null)[] {
  const out: (number | null)[] = values.map(() => null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= n) sum -= values[i - n];
    if (i >= n - 1) out[i] = sum / n;
  }
  return out;
}
export function rewindSeries(bars: readonly Candle[]): RewindDay[] {
  const closes = bars.map((b) => b.close);
  const ma50 = smaSeries(closes, 50),
    ma200 = smaSeries(closes, 200),
    rsi = wilderRsi(closes);
  return bars.map((b, i) => {
    const from = Math.max(0, i - 251);
    let high = -Infinity;
    for (let j = from; j <= i; j++) high = Math.max(high, closes[j]);
    const m50 = ma50[i],
      m200 = ma200[i],
      r = rsi[i];
    const trend: Trend | null =
      m50 == null || m200 == null ? null : b.close > m50 && b.close > m200 ? "above" : b.close < m50 && b.close < m200 ? "below" : "mixed";
    const forward = Object.fromEntries(
      REWIND_HORIZONS.map((h) => [h, i + h < closes.length ? (closes[i + h] / b.close - 1) * 100 : null]),
    ) as Record<Horizon, number | null>;
    return {
      time: b.time,
      close: b.close,
      ma50: m50,
      ma200: m200,
      rsi: r,
      drawdown: (b.close / high - 1) * 100,
      trend,
      rsiBand: r == null ? null : r < 30 ? "low" : r > 70 ? "high" : "mid",
      forward,
    };
  });
}
const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y),
    m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const summary = (values: number[], horizon: number) => ({
  days: values.length,
  /** Rough number of separate, non-overlapping windows the days represent. */
  windows: Math.floor(values.length / horizon),
  median: values.length ? median(values) : null,
  positiveShare: values.length ? (100 * values.filter((v) => v > 0).length) / values.length : null,
});
/** Same trend state and RSI band as the chosen day, versus every observed day. */
export function rewindStats(days: readonly RewindDay[], index: number, horizon: Horizon = 63) {
  const day = days[index];
  if (!day || day.trend == null || day.rsiBand == null) return null;
  const observed = days.filter((d) => d.forward[horizon] != null);
  const like = observed.filter((d) => d.trend === day.trend && d.rsiBand === day.rsiBand);
  return {
    horizon,
    state: { trend: day.trend, rsiBand: day.rsiBand },
    like: summary(like.map((d) => d.forward[horizon]!), horizon),
    all: summary(observed.map((d) => d.forward[horizon]!), horizon),
  };
}
const memo = evidenceMemo<RewindDay[]>();
export function rewindFor(input: Candle[], asOf: string, market: "us-equity" | "crypto" = "us-equity", keep = 1260) {
  return memo(input, `${asOf}:${market}:${keep}`, () => {
    const bars = adaptiveSettledBars(input, asOf, market).filter((b) => b.time < asOf.slice(0, 10));
    const all = rewindSeries(bars);
    // Indicators use the full history for warm-up; only the most recent `keep` sessions are shown.
    return all.slice(-keep);
  });
}
