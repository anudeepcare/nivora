import type { Candle, Signal } from "./types";
import {
  adaptiveSettledBars,
  trendAccumulationReading,
  type AdaptiveSignal,
} from "./accumulation-policy-v3.ts";
import { monthEndSession } from "./calendar.ts";
import { evidenceMemo } from "./evidence-memo.ts";
export { adaptiveSettledBars } from "./accumulation-policy-v3.ts";
export const ACCUMULATION_VERSION = "monthly-v5";
export type CycleSignal = AdaptiveSignal & {
  trimTier: "light" | "strong" | null;
  historyBasis: "standard" | "limited";
  priorMonths: number;
  longTrend: number;
  cycleCorroborated: boolean;
};
/** Original calibrated policy. No instrument-specific branches or future inputs. */
export function cycleReading(
  previous: Candle[],
  bar: Candle,
  legacy: AdaptiveSignal,
): CycleSignal | null {
  const window = previous.slice(-12);
  if (
    window.length !== 12 ||
    !window.every((b) => Number.isFinite(b.close) && b.close > 0) ||
    !Number.isFinite(bar.close) ||
    bar.close <= 0
  )
    return null;
  const trend = window.reduce((s, b) => s + b.close, 0) / 12;
  const spread = Math.max(
    trend * 0.1,
    Math.sqrt(window.reduce((s, b) => s + (b.close - trend) ** 2, 0) / 11),
  );
  const deviation = (bar.close / trend - 1) * 100,
    z = (bar.close - trend) / spread;
  const severeExtension = bar.close >= 3 * trend && z >= 2,
    extension = legacy.multiplier === 0 || severeExtension;
  const rawMultiplier: Signal["multiplier"] = extension
    ? 0
    : deviation <= -35 && z <= -1.3
      ? 4
      : deviation <= -25 && z <= -0.95
        ? 3
        : deviation <= -10 && z <= -0.5
          ? 2
          : 1;
  const longer = previous.slice(-24);
  if (!longer.every((b) => Number.isFinite(b.close) && b.close > 0))
    return null;
  const longTrend = longer.reduce((n, b) => n + b.close, 0) / longer.length;
  const cycleCorroborated = bar.close <= longTrend;
  const multiplier: Signal["multiplier"] =
    rawMultiplier >= 3 && !cycleCorroborated ? 2 : rawMultiplier;
  const strong =
    legacy.trimReview ||
    (severeExtension && z >= 3 && bar.close / window.at(-1)!.close >= 1.5);
  const trimTier = extension ? (strong ? "strong" : "light") : null;
  const level = (distance: number, deviations: number) =>
    Math.max(0, Math.min(trend * (1 - distance), trend - deviations * spread));
  const limited = previous.length < 24;
  return {
    ...legacy,
    multiplier,
    trend,
    z,
    scale: spread / trend,
    deviation,
    trimTier,
    trimReview: !!trimTier,
    historyBasis: limited ? "limited" : "standard",
    priorMonths: previous.length,
    longTrend,
    cycleCorroborated,
    buy2: level(0.1, 0.5),
    buy3: Math.min(level(0.25, 0.95), longTrend),
    buy4: Math.min(level(0.35, 1.3), longTrend),
    pauseAbove: Math.min(
      legacy.pauseAbove,
      Math.max(3 * trend, trend + 2 * spread),
    ),
    reason:
      (extension
        ? `${strong ? "Strong" : "Light"} price-extension review; no sale amount is implied.`
        : multiplier === 1
          ? "Ordinary cycle-relative conditions; increased contributions are not established."
          : `${Math.abs(deviation).toFixed(1)}% below the prior 12-month average and ${Math.abs(z).toFixed(2)} prior-window spread units below it.`) +
      (rawMultiplier >= 3 && !cycleCorroborated
        ? " Stronger upsize is capped at 2×: price remains above the longer-cycle average."
        : "") +
      (limited
        ? ` Limited consecutive history: ${previous.length} prior completed months.`
        : ""),
  };
}
const monthIndex = (m: string) =>
  Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1;
function compute(bars: Candle[], asOf: string, market: "us-equity" | "crypto") {
  const empty = {
    version: ACCUMULATION_VERSION,
    confirmed: null as CycleSignal | null,
    forming: null as CycleSignal | null,
    history: [] as CycleSignal[],
    reason:
      "At least 12 consecutive completed prior months and a settled observation are required.",
  };
  if (!Number.isFinite(Date.parse(asOf))) return empty;
  const month = new Intl.DateTimeFormat("en-CA", {
    timeZone: market === "crypto" ? "UTC" : "America/New_York",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(asOf));
  const current = `${month.find((x) => x.type === "year")!.value}-${month.find((x) => x.type === "month")!.value}`;
  const rows = [
    ...new Map(
      adaptiveSettledBars(bars, asOf, market).map((b) => [
        b.time.slice(0, 7),
        b,
      ]),
    ).entries(),
  ];
  const history: CycleSignal[] = [];
  let forming: CycleSignal | null = null;
  for (let i = 12; i < rows.length; i++) {
    const [m, bar] = rows[i];
    // Only the trailing uninterrupted segment can support a monthly window.
    // An older gap cannot invalidate 12 complete months, or masquerade as a
    // 24-month slow guard by pulling an even older observation into its place.
    let start = i;
    for (let j = i - 1; j >= Math.max(0, i - 24); j--) {
      const [key, previous] = rows[j],
        next = rows[j + 1][0];
      if (
        previous.time !== monthEndSession(key, market) ||
        monthIndex(next) - monthIndex(key) !== 1
      )
        break;
      start = j;
    }
    const prior = rows.slice(start, i);
    if (prior.length < 12) continue;
    const closed = bar.time === monthEndSession(m, market);
    if (m < current && !closed) continue;
    const observations = prior.map(([, b]) => b),
      reading = cycleReading(
        observations,
        bar,
        trendAccumulationReading(observations, bar),
      );
    if (
      !reading ||
      !Object.values(reading).every(
        (v) => typeof v !== "number" || Number.isFinite(v),
      )
    )
      continue;
    if (closed) history.push(reading);
    else if (m === current) forming = reading;
  }
  const last = history.at(-1),
    confirmed =
      last && monthIndex(current) - monthIndex(last.month) <= 1 ? last : null;
  return {
    ...empty,
    confirmed,
    forming,
    history,
    reason:
      confirmed || forming
        ? "Cycle-relative contribution conditions; not company value or a return prediction."
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
