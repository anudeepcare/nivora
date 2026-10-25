import type { Research } from "./types";
import { researchBrief } from "./research-brief.ts";
import { researchDecision } from "./decision-research.ts";
import { edgeReading } from "./auryn-edge.ts";

export function researchEdge(r: Research, ownsPosition = false) {
  const brief = researchBrief(r),
    decision = researchDecision(r),
    n = brief.businessNumbers;
  const strong =
    n.fcf != null &&
    n.fcf > 0 &&
    n.operatingMargin != null &&
    n.operatingMargin > 0 &&
    n.revenueGrowth != null &&
    n.revenueGrowth >= 0;
  const business = !brief.period
    ? "missing"
    : strong
      ? "strong"
      : n.fcf != null &&
          n.fcf < 0 &&
          n.operatingMargin != null &&
          n.operatingMargin < 0 &&
          n.revenueGrowth != null &&
          n.revenueGrowth < 0
        ? "weak"
        : "mixed";
  const price = r.quote.price,
    scenario = brief.scenario;
  // Scenarios remain assumptions, not intrinsic values. Large upside or narrow
  // cases are never silently certified as an attractive purchase.
  const usable =
    brief.scenarioEligible &&
    scenario &&
    price != null &&
    price > 0 &&
    [scenario.low, scenario.base, scenario.high].every(
      (x) => Number.isFinite(x) && x > 0,
    ) &&
    scenario.low <= scenario.base &&
    scenario.base <= scenario.high;
  const baseChange = usable ? (scenario.base / price! - 1) * 100 : null;
  const downside = usable ? (scenario.low / price! - 1) * 100 : null;
  const value =
    !usable ||
    baseChange == null ||
    baseChange > 100 ||
    downside == null ||
    downside > 0
      ? "unestablished"
      : baseChange >= 15 && downside >= -40
        ? "supported"
        : "demanding";
  const timing =
    brief.timing.rsi != null && brief.timing.rsi >= 75
      ? "extended"
      : brief.timing.trend === "Constructive"
        ? "favorable"
        : "mixed";
  const quoteAt = Date.parse(r.quote.asOf ?? ""),
    referenceAt = Date.parse(r.priceObservedAt ?? r.retrievedAt);
  const matchingClose = r.history.findLast(
    (bar) =>
      bar.time.length === 10 && bar.time === (r.quote.asOf ?? "").slice(0, 10),
  );
  const settledReference =
    !!matchingClose &&
    /close|end.of.day/i.test(r.quote.session) &&
    r.quote.currency === r.company.currency &&
    price != null &&
    Number.isFinite(price) &&
    price > 0 &&
    Number.isFinite(quoteAt) &&
    Number.isFinite(referenceAt) &&
    quoteAt <= referenceAt + 60000 &&
    referenceAt - quoteAt <= 4 * 86400000 &&
    Number.isFinite(matchingClose.close) &&
    Math.abs(matchingClose.close - price) <= Math.max(0.01, price * 0.0001);
  const currentReference =
    brief.checks.find((c) => c.label === "Price observation")?.status ===
    "available";
  const referenceBasis = currentReference
    ? "quote"
    : settledReference
      ? "settled-close"
      : "unavailable";
  const severe = decision.flags.find((f) => f.severe);
  const reading = edgeReading({
    business,
    value,
    timing,
    severeRisk: !!severe,
    conflicting: brief.conflicting,
    freshQuote: currentReference || settledReference,
    confirmedPace: brief.accumulation.multiplier,
    formingPace: brief.accumulation.forming?.multiplier ?? null,
    assetType: r.company.assetType,
    ownsPosition,
    specialistModel: [
      "financial",
      "insurance",
      "specialized-financial",
      "real-estate",
    ].includes(brief.coverage.family),
  });
  const trajectory = brief.trajectory.filter(
    (t) => t.fcf != null && t.shares != null && t.shares > 0,
  );
  const first = trajectory[0],
    last = trajectory.at(-1);
  const cashPerShareChange =
    first && last && first !== last && first.fcf! > 0
      ? (last.fcf! / last.shares! / (first.fcf! / first.shares!) - 1) * 100
      : null;
  const disconnect =
    !brief.conflicting && strong && brief.timing.trend === "Weak"
      ? {
          title: "Cash generation positive. Price trend weak.",
          text: "Positive cash generation and price weakness tell different stories. Review valuation before treating a decline as an opportunity.",
        }
      : !brief.conflicting && strong && value === "demanding"
        ? {
            title:
              "Cash generation supports the business. Price limits the entry.",
            text: "Operating strength does not automatically establish a sufficient valuation cushion.",
          }
        : !brief.conflicting &&
            business === "weak" &&
            brief.timing.trend === "Constructive"
          ? {
              title: "Price improving. Cash generation still under pressure.",
              text: "A stronger chart does not resolve operating losses or funding requirements.",
            }
          : null;
  return {
    ...reading,
    brief,
    business,
    value,
    timing,
    disconnect,
    cashPerShareChange,
    referenceBasis,
    risk:
      severe?.text ??
      brief.counterCase[0] ??
      "Review scenario assumptions and your total exposure.",
    confidence:
      brief.conflicting || business === "missing"
        ? "Limited"
        : usable && decision.scoredLenses >= 6
          ? "Moderate"
          : "Limited",
    businessLabel: [
      "financial",
      "insurance",
      "specialized-financial",
      "real-estate",
    ].includes(brief.coverage.family)
      ? "Sector evidence"
      : business === "strong"
        ? "Strong"
        : business === "weak"
          ? "Under pressure"
          : business === "missing"
            ? "Not assessed"
            : "Mixed",
    valueLabel:
      value === "supported"
        ? "Conditional cushion"
        : value === "demanding"
          ? "Demanding"
          : "Not established",
    timingLabel:
      timing === "favorable"
        ? "Constructive"
        : timing === "extended"
          ? "Extended"
          : "Mixed",
  };
}
