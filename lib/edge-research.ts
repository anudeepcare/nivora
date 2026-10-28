import type { Research } from "./types";
import { aurynDecision } from "./auryn-decision.ts";
import { pacePresentation, pacePeriods } from "./pace-presentation.ts";
/** Compatibility view over the shared decision record; no second investment policy. */
export function researchEdge(
  r: Research,
  ownsPosition = false,
  now = Date.parse(r.priceObservedAt ?? r.retrievedAt),
) {
  const d = aurynDecision(r, { ownsPosition, now }),
    brief = d.brief;
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
              : d.action;
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
          text: "Share-price weakness does not by itself mean the business is weakening. Check growth, cash generation and funding; confirmed Pace then guides eligible accumulation.",
        }
      : business === "strong" && value === "demanding"
        ? {
            title: "Business strength and valuation are different questions.",
            text: "Cash generation supports the business screen. Price is above the conservative model screen, so inspect the assumptions and keep purchases within your budget.",
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
    pacePresentation: pacePresentation(d.action, brief.accumulation.multiplier),
    pacePeriods: pacePeriods(brief.accumulation),
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
        ? "Below model screen"
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

/** Loaded research remains useful when monthly contribution history is incomplete. */
export function workspaceGuidance(
  r: Research,
  ownsPosition = false,
  now = Date.parse(r.retrievedAt),
) {
  const edge = researchEdge(r, ownsPosition, now);
  return {
    ...edge.brief.accumulation,
    view: edge.pacePresentation,
    action: edge.assessment,
    actions: edge.decision.actionLabels,
    contextLabel: edge.decision.contextLabel,
    periods: edge.pacePeriods,
  };
}
