import type { Research } from "./types";
import type { aurynDecision } from "./auryn-decision.ts";
import { researchOutlook, type Outlook } from "./outlook.ts";
import { scenarioHeadline } from "./scenario-headline.ts";

export type ScenarioCases = {
  bear: number;
  base: number;
  bull: number;
  source: string;
  kind: "model" | "analyst" | "history";
};
/** Stated plausibility limits for a revenue-multiple model. */
export const REVENUE_MODEL_LIMITS = { multiple: 20, priceRatio: 3 } as const;
/** A trailing EV/revenue multiple applied to a much larger forecast is not a usable case. */
export function extremeRevenueModel(
  o: Extract<Outlook, { available: true }>,
  price: number | null | undefined,
) {
  return (
    o.basis === "revenue" &&
    (o.cases[1].multiple > REVENUE_MODEL_LIMITS.multiple ||
      (price != null &&
        price > 0 &&
        o.cases[1].target > REVENUE_MODEL_LIMITS.priceRatio * price))
  );
}
/** The one bear / base / bull set for a stock, used wherever cases are shown so that
 * every panel agrees: a qualifying model first, then the named non-model headline. */
export function scenarioCases(
  r: Research,
  d: ReturnType<typeof aurynDecision>,
  options: { fundamentalsOnly?: boolean } = {},
): ScenarioCases | null {
  if (r.company.assetType !== "stock") return null;
  const input = d.reference
    ? {
        ...r,
        quote: {
          ...r.quote,
          price: d.reference.price,
          asOf: d.reference.asOf,
          currency: d.reference.currency,
          stale: false,
        },
      }
    : r;
  // The decision engine has already qualified this model against business,
  // currency, consecutive cash-flow history and dilution safeguards. Keep the
  // headline on the same valuation rather than replacing it with market multiples.
  const valuation = d.valuation;
  const validValuation =
    valuation &&
    [valuation.bear, valuation.base, valuation.bull].every(
      (value) => Number.isFinite(value) && value > 0,
    ) &&
    valuation.bear <= valuation.base &&
    valuation.base <= valuation.bull;
  const valuationCases: ScenarioCases | null = validValuation
    ? {
        bear: valuation.bear,
        base: valuation.base,
        bull: valuation.bull,
        source: valuation.label,
        kind: "model",
      }
    : null;
  if (valuation?.basis === "cash-flow" && valuationCases) return valuationCases;
  const o = researchOutlook(input);
  if (o.available && !extremeRevenueModel(o, d.reference?.price))
    return {
      bear: o.cases[0].target,
      base: o.cases[1].target,
      bull: o.cases[2].target,
      source:
        o.basis === "revenue" ? "AURYN revenue model" : "AURYN earnings model",
      kind: "model",
    };
  if (valuationCases) return valuationCases;
  if (options.fundamentalsOnly) return null;
  const h = scenarioHeadline(r);
  return h
    ? {
        bear: h.bear,
        base: h.base,
        bull: h.bull,
        source: h.eyebrow,
        kind: h.source === "history" ? "history" : "analyst",
      }
    : null;
}
