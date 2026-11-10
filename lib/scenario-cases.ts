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
  if (!o.available && d.valuation)
    return {
      bear: d.valuation.bear,
      base: d.valuation.base,
      bull: d.valuation.bull,
      source: d.valuation.label,
      kind: "model",
    };
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
