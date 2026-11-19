import type { Candle } from "./types";
import {
  researchAccumulation as previousPolicy,
  adaptiveSettledBars,
  type CycleSignal,
} from "./accumulation-policy-v5.ts";
import { makePacePriceEvaluator } from "./pace-price-evaluator.ts";
import { classifyPace, paceFeatures } from "./pace-classifier.ts";
import { paceModel } from "./pace-model-v6.ts";
import { evidenceMemo } from "./evidence-memo.ts";
export { adaptiveSettledBars, cycleReading } from "./accumulation-policy-v5.ts";
export const ACCUMULATION_VERSION = "monthly-v6";
export type CalibratedSignal = CycleSignal & {
  policyVersion: "monthly-v5" | "monthly-v6";
  conditionalBoundary?: {
    price: number;
    level: number;
    operator: string;
    distancePercent: number;
  } | null;
};
export type { CycleSignal } from "./accumulation-policy-v5.ts";
/** Frozen technical model applies to its snapshot and later observations only.
 * Earlier historical readings retain v5: never backfill a fitted model as a past live signal.
 */
function compute(bars: Candle[], asOf: string, market: "us-equity" | "crypto") {
  const base = previousPolicy(bars, asOf, market);
  const settled = adaptiveSettledBars(bars, asOf, market);
  const convert = (
    signal: CycleSignal | null,
    boundary: boolean,
  ): CalibratedSignal | null => {
    if (!signal) return null;
    const old: CalibratedSignal = { ...signal, policyVersion: "monthly-v5" };
    if (
      market === "crypto" ||
      asOf.slice(0, 10) < paceModel.availableFrom ||
      signal.date < paceModel.trainedThrough
    )
      return old;
    const rows = settled.filter((b) => b.time <= signal.date);
    const features = paceFeatures(rows, signal.z, signal.deviation / 100);
    const level = features && classifyPace(features);
    if (level == null) return old;
    // Retain existing extension handling, matching the evaluated candidate exactly.
    const multiplier = signal.multiplier === 0 ? 0 : level;
    const result: CalibratedSignal = {
      ...signal,
      multiplier,
      policyVersion: "monthly-v6",
      conditionalBoundary: null,
      reason:
        multiplier === 0
          ? signal.reason
          : `P${multiplier} from monthly price position, daily trend, volatility and momentum.`,
      // Legacy simple-rule boundaries must never be presented as classifier thresholds.
      buy2: 0,
      buy3: 0,
      buy4: 0,
    };
    if (!boundary) return result;
    const last = rows.at(-1)!;
    const at = makePacePriceEvaluator(rows, true);
    // Nearest sampled transition, not a claim that all more distant prices share a zone.
    const candidates = [];
    for (const direction of [-1, 1]) {
      let inside = last.close;
      for (let step = 1; step <= 20; step++) {
        let outside = last.close * (1 + direction * step * 0.02);
        const other = at(outside);
        if (other != null && other !== multiplier) {
          for (let j = 0; j < 14; j++) {
            const mid = (inside + outside) / 2;
            if (at(mid) === multiplier) inside = mid;
            else outside = mid;
          }
          const next = at(outside);
          if (next != null)
            candidates.push({
              price: outside,
              level: next,
              operator: "near",
              distancePercent: (outside / last.close - 1) * 100,
            });
          break;
        }
        inside = outside;
      }
    }
    result.conditionalBoundary =
      candidates.sort(
        (a, b) => Math.abs(a.distancePercent) - Math.abs(b.distancePercent),
      )[0] ?? null;
    return result;
  };
  const history = base.history.map((s) => convert(s, false)!);
  const confirmed = convert(base.confirmed, true),
    forming = convert(base.forming, true);
  const enabled =
    confirmed?.policyVersion === ACCUMULATION_VERSION ||
    forming?.policyVersion === ACCUMULATION_VERSION;
  return {
    ...base,
    version: enabled ? ACCUMULATION_VERSION : base.version,
    history,
    confirmed,
    forming,
  };
}
const memo = evidenceMemo<ReturnType<typeof compute>>();
export function researchAccumulation(
  bars: Candle[],
  asOf: string,
  market: "us-equity" | "crypto" = "us-equity",
) {
  return memo(bars, `${asOf}:${market}:v6`, () => compute(bars, asOf, market));
}
