import type { Research } from "./types";
import { researchBrief } from "./research-brief.ts";
import { aurynDecision } from "./auryn-decision.ts";
/** Compatibility view over the shared decision record; no second investment policy. */
export function researchEdge(
  r: Research,
  ownsPosition = false,
  now = Date.parse(r.priceObservedAt ?? r.retrievedAt),
) {
  const brief = researchBrief(r),
    d = aurynDecision(r, { ownsPosition, now });
  const business = d.business === "developing" ? "mixed" : d.business;
  const value =
    d.value === "attractive"
      ? "supported"
      : d.value === "unassessed"
        ? "unestablished"
        : "demanding";
  const timing =
    brief.timing.rsi != null && brief.timing.rsi >= 75
      ? "extended"
      : brief.timing.trend === "Constructive"
        ? "favorable"
        : "mixed";
  const specialist = [
    "financial",
    "insurance",
    "specialized-financial",
    "real-estate",
  ].includes(brief.coverage.family);
  const verdict =
    d.action === "Buy" || d.action === "Add"
      ? "Build"
      : d.action === "Hold"
        ? "Hold & monitor"
        : ["Reduce", "Sell", "Avoid"].includes(d.action)
          ? "Review exposure"
          : r.company.assetType !== "stock"
            ? "Price review"
            : specialist && d.value === "unassessed"
              ? "Sector review"
              : "Wait";
  const trajectory = brief.trajectory.filter(
      (t) => t.fcf != null && t.shares != null && t.shares > 0,
    ),
    first = trajectory[0],
    last = trajectory.at(-1);
  const cashPerShareChange =
    first && last && first !== last && first.fcf! > 0
      ? (last.fcf! / last.shares! / (first.fcf! / first.shares!) - 1) * 100
      : null;
  const disconnect =
    business === "strong" && brief.timing.trend === "Weak"
      ? {
          title: "Cash generation positive. Price trend weak.",
          text: "Operating cash generation is positive while the price trend is weak. The decision also checks valuation and funding risk.",
        }
      : business === "strong" && value === "demanding"
        ? {
            title:
              "Cash generation supports the business. Price limits the entry.",
            text: d.headline,
          }
        : null;
  return {
    version: d.version,
    brief,
    decision: d,
    business,
    value,
    timing,
    disconnect,
    cashPerShareChange,
    verdict,
    assessment: d.action,
    reason: d.headline,
    tone: d.tone,
    turningPoint: d.changeConditions[0],
    riskReview: ["Reduce", "Sell", "Avoid"].includes(d.action),
    risk:
      d.risks[0] ??
      brief.counterCase[0] ??
      "Review how the position fits your total portfolio.",
    pace: brief.accumulation.multiplier,
    pricePace: brief.accumulation.multiplier,
    formingPace: brief.accumulation.forming?.multiplier ?? null,
    referenceBasis: d.reference?.basis ?? "unavailable",
    confidence: d.confidence,
    businessLabel: specialist
      ? "Sector evidence"
      : business === "strong"
        ? "Strong"
        : business === "weak"
          ? "Under pressure"
          : business === "missing"
            ? "Developing"
            : "Developing",
    valueLabel:
      d.value === "attractive"
        ? "Entry supported"
        : d.value === "fair"
          ? "Near model value"
          : d.value === "expensive"
            ? "Above model value"
            : "Assumptions needed",
    timingLabel:
      timing === "favorable"
        ? "Constructive"
        : timing === "extended"
          ? "Extended"
          : "Mixed",
  };
}
