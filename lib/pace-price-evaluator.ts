import type { Candle } from "./types";
import { cycleReading } from "./accumulation-policy-v5.ts";
import { trendAccumulationReading } from "./accumulation-policy-v3.ts";
import { classifyPace, paceFeatures } from "./pace-classifier.ts";
/** Re-evaluate a hypothetical latest close with every historical input fixed. */
export function makePacePriceEvaluator(rows: Candle[], calibrated: boolean) {
  const monthly = new Map<string, Candle>();
  for (const bar of rows) monthly.set(bar.time.slice(0, 7), bar);
  const prior = [...monthly.values()].slice(0, -1).slice(-24),
    last = rows.at(-1);
  const earlier = rows.slice(0, -1);
  return (price: number): number | null => {
    if (!last || !Number.isFinite(price) || price <= 0) return null;
    const bar = {
      ...last,
      close: price,
      high: Math.max(last.high, price),
      low: Math.min(last.low, price),
    };
    const rule = cycleReading(prior, bar, trendAccumulationReading(prior, bar));
    if (!rule) return null;
    if (!calibrated || rule.multiplier === 0) return rule.multiplier;
    const features = paceFeatures(
      [...earlier, bar],
      rule.z,
      rule.deviation / 100,
    );
    return features ? classifyPace(features) : null;
  };
}
