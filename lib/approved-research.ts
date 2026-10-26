import type { Research } from "./types";
import { researchEdge } from "./edge-research.ts";
import { overviewEvidence } from "./overview-evidence.ts";
import { researchDecision } from "./decision-research.ts";
import { amount, percent } from "./format.ts";
export type EvidenceSection =
  | "Thesis"
  | "Financials"
  | "Valuation"
  | "Technicals"
  | "Analysts"
  | "News"
  | "Options"
  | "Advanced";
export type BalanceFactor = {
  id: string;
  side: "buy" | "wait";
  weight: number;
  text: string;
  section: EvidenceSection;
};
/** Display weights are explicit qualitative importance, never probability or an entry rule. */
export function balanceView(factors: BalanceFactor[], excluded: string[] = []) {
  const active = factors.filter((x) => !excluded.includes(x.id));
  const buy = active
    .filter((x) => x.side === "buy")
    .reduce((n, x) => n + x.weight, 0);
  const wait = active
    .filter((x) => x.side === "wait")
    .reduce((n, x) => n + x.weight, 0);
  return { buy, wait, angle: Math.max(-9, Math.min(9, (wait - buy) * 1.4)) };
}
export function approvedResearch(r: Research, ownsPosition = false) {
  const edge = researchEdge(r, ownsPosition),
    evidence = overviewEvidence(r),
    b = edge.brief,
    n = b.businessNumbers;
  const factors: BalanceFactor[] = [];
  const add = (
    id: string,
    side: BalanceFactor["side"],
    weight: number,
    text: string,
    section: EvidenceSection,
  ) => factors.push({ id, side, weight, text, section });
  if (!evidence.crypto && !evidence.specialist && !b.conflicting) {
    if (n.fcf != null)
      add(
        "cash",
        n.fcf > 0 ? "buy" : "wait",
        3,
        `Free cash flow is ${amount(n.fcf, n.currency, true)}`,
        "Financials",
      );
    if (n.revenueGrowth != null)
      add(
        "growth",
        n.revenueGrowth >= 0 ? "buy" : "wait",
        2,
        `Revenue growth is ${percent(n.revenueGrowth, true)}`,
        "Financials",
      );
    if (n.operatingMargin != null)
      add(
        "margin",
        n.operatingMargin > 0 ? "buy" : "wait",
        2,
        `${percent(n.operatingMargin)} operating margin`,
        "Financials",
      );
  }
  if (edge.pace != null && edge.pace !== 1)
    add(
      "pace",
      edge.pace >= 2 ? "buy" : "wait",
      Math.max(1, edge.pace),
      `${edge.pace}× confirmed accumulation pace`,
      "Technicals",
    );
  if (edge.value === "supported")
    add(
      "value",
      "buy",
      3,
      "The model has a conditional price cushion",
      "Valuation",
    );
  if (edge.value === "demanding")
    add(
      "value",
      "wait",
      3,
      "The price requires sustained earnings growth",
      "Valuation",
    );
  if (edge.timing === "extended")
    add("momentum", "wait", 2, "Momentum is extended", "Technicals");
  else if (edge.timing === "favorable")
    add("trend", "buy", 1, "Price trend is constructive", "Technicals");
  if (edge.riskReview) add("risk", "wait", 4, edge.risk, "Thesis");
  if (!factors.some((x) => x.side === "wait") && b.counterCase[0])
    add("counter", "wait", 2, b.counterCase[0], "Thesis");
  const price = r.quote.price;
  const currencyAligned = r.quote.currency === r.company.currency;
  const scenario =
    b.scenarioEligible && b.scenario && b.scenario.currency === r.quote.currency
      ? b.scenario
      : null;
  const cases =
    price != null && price > 0 && currencyAligned
      ? scenario
        ? ["Bear", "Base", "Bull"].map((name, i) => ({
            name,
            target: [scenario.low, scenario.base, scenario.high][i],
            change:
              ([scenario.low, scenario.base, scenario.high][i] / price - 1) *
              100,
          }))
        : b.priceRisk.available
          ? b.priceRisk.cases.map((c) => ({
              name: c.name,
              target: c.target,
              change: c.change,
            }))
          : []
      : [];
  const safeCases =
    cases.length === 3 &&
    cases.every(
      (x) =>
        Number.isFinite(x.target) && x.target > 0 && Number.isFinite(x.change),
    )
      ? cases
      : [];
  const labels: Record<string, string> = {
    Build: ownsPosition
      ? "Add. Accumulate in stages."
      : "Buy. Accumulate in stages.",
    "Begin small": "Start small. Build with evidence.",
    "Hold & monitor": "Hold. Be selective adding.",
    "Review exposure": "Risk first. Recheck your exposure.",
    "Evidence needed": b.conflicting
      ? "Reconcile the financial evidence."
      : "Explore the price and available evidence.",
    "Sector review": "Read the business on its own terms.",
    "Price review": "Price, momentum and instrument risk.",
    Wait:
      edge.value === "demanding"
        ? "A strong case needs the right price."
        : edge.referenceBasis === "unavailable"
          ? "Start with the latest dated close."
          : "Test the price assumptions.",
  };
  return {
    edge,
    evidence,
    factors,
    fingerprint: researchDecision(r).lenses.slice(0, 6),
    cases: safeCases,
    scenarioBasis: scenario
      ? "Earnings sensitivity"
      : b.priceRisk.available
        ? "Historical volatility sensitivity"
        : "",
    scenarioEnd: scenario?.end ?? null,
    scenarioHorizon:
      !scenario && b.priceRisk.available ? b.priceRisk.horizon : null,
    scenarioReference: scenario
      ? price
      : b.priceRisk.available
        ? b.priceRisk.reference
        : null,
    scenarioReferenceDate: scenario
      ? r.quote.asOf
      : b.priceRisk.available
        ? b.priceRisk.referenceDate
        : null,
    scenarioReferenceBasis: scenario
      ? "quote"
      : b.priceRisk.available
        ? b.priceRisk.referenceBasis
        : null,
    title: labels[edge.verdict] ?? edge.assessment,
    metrics: [
      ...evidence.business,
      ...evidence.valuation,
      ...evidence.technical,
      ...evidence.ownership,
    ],
  };
}
