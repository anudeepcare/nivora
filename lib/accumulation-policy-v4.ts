import type { Candle, Signal } from "./types";
import {
  adaptiveSettledBars,
  researchAccumulation as priorPolicy,
  type AdaptiveSignal,
} from "./accumulation-policy-v3.ts";
import { evidenceMemo } from "./evidence-memo.ts";

export { adaptiveSettledBars } from "./accumulation-policy-v3.ts";
export const ACCUMULATION_VERSION = "monthly-v4";
export type CycleSignal = AdaptiveSignal & { trimTier: "light" | "strong" | null };

/** Original, empirically calibrated policy. Reference agreement is not a return forecast. */
export function cycleAccumulationReading(
  previous: Candle[],
  bar: Candle,
  legacy: AdaptiveSignal,
): CycleSignal | null {
  const window = previous.slice(-12);
  if (window.length !== 12 || !window.every(b => Number.isFinite(b.close) && b.close > 0) || !Number.isFinite(bar.close) || bar.close <= 0) return null;
  const trend = window.reduce((s,b) => s + b.close, 0) / 12;
  const spread = Math.max(trend * .10, Math.sqrt(window.reduce((s,b) => s + (b.close-trend)**2, 0) / 11));
  const deviation = (bar.close / trend - 1) * 100;
  const z = (bar.close - trend) / spread;
  const severeExtension = bar.close >= 3 * trend && z >= 2;
  const extension = legacy.multiplier === 0 || severeExtension;
  const multiplier: Signal["multiplier"] = extension ? 0
    : deviation <= -40 && z <= -1.5 ? 4
    : deviation <= -25 && z <= -1.35 ? 3
    : deviation <= -10 && z <= -.5 ? 2 : 1;
  const strong = legacy.trimReview || (severeExtension && z >= 3 && bar.close / window.at(-1)!.close >= 1.5);
  const trimTier = extension ? strong ? "strong" : "light" : null;
  const level = (distance: number, deviations: number) => Math.max(0, Math.min(trend * (1-distance), trend - deviations * spread));
  return {
    ...legacy,
    multiplier, trend, z, scale: spread / trend, deviation,
    buy2: level(.10,.5), buy3: level(.25,1.35), buy4: level(.40,1.5),
    pauseAbove: Math.min(legacy.pauseAbove, Math.max(3*trend,trend+2*spread)),
    trimTier, trimReview: !!trimTier,
    reason: extension
      ? `${trimTier === "strong" ? "Strong" : "Light"} price-extension review; no sale amount or future return is implied.`
      : multiplier === 1
        ? "Ordinary cycle-relative conditions; increased contributions are not established."
        : `${Math.abs(deviation).toFixed(1)}% below the prior 12-month average and ${Math.abs(z).toFixed(1)} prior-window spread units below it.`,
  };
}

function compute(bars: Candle[], asOf: string, market: "us-equity" | "crypto") {
  // Reuse the established 24-month continuity, settlement and stale-period guards.
  const prior = priorPolicy(bars, asOf, market);
  const months = [...new Map(adaptiveSettledBars(bars, asOf, market).map(b => [b.time.slice(0,7), b])).values()];
  const index = new Map(months.map((b,i) => [b.time,i]));
  const convert = (signal: AdaptiveSignal | null) => {
    if (!signal) return null;
    const i = index.get(signal.date);
    return i == null ? null : cycleAccumulationReading(months.slice(Math.max(0,i-12),i), months[i], signal);
  };
  return {
    version: ACCUMULATION_VERSION,
    confirmed: convert(prior.confirmed),
    forming: convert(prior.forming),
    history: prior.history.flatMap(s => {const x=convert(s); return x ? [x] : [];}),
    reason: prior.confirmed ? "Cycle-relative experimental price conditions; not company value or a return prediction." : prior.reason,
  };
}
const memo = evidenceMemo<ReturnType<typeof compute>>();
export function researchAccumulation(bars: Candle[], asOf: string, market: "us-equity" | "crypto" = "us-equity") {
  return memo(bars, `${asOf}:${market}`, () => compute(bars, asOf, market));
}
