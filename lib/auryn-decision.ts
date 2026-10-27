import type { Research } from "./types";
import {
  annualRows,
  latestFinancialEvidence,
  perspective,
} from "./analysis.ts";
import { researchBrief } from "./research-brief.ts";

import { financingContext, metricEvidence } from "./research-integrity.ts";
import { comparableGrowth, reportedCashPerShare } from "./research-summary.ts";
import { selectPriceReference } from "./price-reference.ts";
import { amount, percent } from "./format.ts";

export type DecisionAction =
  | "Buy"
  | "Add"
  | "Hold"
  | "Reduce"
  | "Sell"
  | "Wait"
  | "Avoid";
export type DecisionInput = {
  ownsPosition: boolean;
  priceUsable: boolean;
  financialsUsable: boolean;
  business: "strong" | "developing" | "weak" | "missing";
  value: "attractive" | "fair" | "expensive" | "unassessed";
  extended: boolean;
  distress: boolean;
  deterioration: boolean;
  insolvency: boolean;
};
/** Published screening policy. Thresholds are transparent heuristics, not fitted probabilities. */
export function evaluateDecision(x: DecisionInput): DecisionAction {
  if (!x.financialsUsable) return "Wait";
  if (x.insolvency) return x.ownsPosition ? "Sell" : "Avoid";
  if (x.distress || x.deterioration) return x.ownsPosition ? "Reduce" : "Avoid";
  if (!x.priceUsable || x.value === "unassessed") return "Wait";
  if (x.business === "strong" && x.value === "attractive" && !x.extended)
    return x.ownsPosition ? "Add" : "Buy";
  if (x.ownsPosition && x.business === "strong") return "Hold";
  return "Wait";
}
export function annualizedReturn(
  target: number,
  price: number,
  years: number,
): number | null {
  if (
    ![target, price, years].every(Number.isFinite) ||
    target < 0 ||
    price <= 0 ||
    years <= 0
  )
    return null;
  const value = ((target / price) ** (1 / years) - 1) * 100;
  return Number.isFinite(value) ? value : null;
}
/** Levered cash-flow sensitivity; no enterprise-value/debt subtraction is mixed into equity cash flow. */
export function cashFlowValuation(x: {
  cashPerShare: number;
  growth: number;
  dilution: number;
}) {
  if (
    !Object.values(x).every(Number.isFinite) ||
    x.cashPerShare <= 0 ||
    x.dilution < 0
  )
    return null;
  const growth = Math.max(0, Math.min(10, x.growth));
  const presentValue = (
    startGrowth: number,
    discount: number,
    terminal: number,
  ) => {
    let cash = x.cashPerShare,
      pv = 0;
    for (let year = 1; year <= 10; year++) {
      const companyGrowth =
        startGrowth - ((startGrowth - terminal) * (year - 1)) / 9;
      cash *= (1 + companyGrowth / 100) / (1 + x.dilution / 100);
      pv += cash / (1 + discount / 100) ** year;
    }
    const perShareTerminal = (1 + terminal / 100) / (1 + x.dilution / 100) - 1;
    const terminalValue =
      (cash * (1 + perShareTerminal)) / (discount / 100 - perShareTerminal);
    const value = pv + terminalValue / (1 + discount / 100) ** 10;
    return Number.isFinite(value) && value > 0 ? value : null;
  };
  const bear = presentValue(0, 15, 1),
    base = presentValue(growth, 12, 2),
    bull = presentValue(Math.min(15, growth + 5), 10, 3);
  return bear != null &&
    base != null &&
    bull != null &&
    bear <= base &&
    base <= bull
    ? { bear, base, bull, growth, dilution: x.dilution }
    : null;
}
export type DecisionValuation = {
  basis: "cash-flow" | "earnings";
  label: string;
  bear: number;
  base: number;
  bull: number;
  years: number | null;
  annualReturn: number | null;
  downside: number;
  upside: number;
  entryPrice: number;
  assumptions: string;
  end: string | null;
};
export function aurynDecision(
  r: Research,
  options: { ownsPosition?: boolean; now?: number } = {},
) {
  const now = options.now ?? Date.now(),
    ownsPosition = options.ownsPosition ?? false;
  const reference = selectPriceReference(r, now);
  // Financial knowledge remains cut to its retrieval date. Price checks use wall-clock time.
  const { latest: p, prior: q } = latestFinancialEvidence(r),
    brief = researchBrief(r),
    funding = financingContext(r);
  const growth = p ? comparableGrowth(p, q) : null;
  const family = brief.coverage.family;
  const specialist = [
    "financial",
    "insurance",
    "specialized-financial",
    "real-estate",
  ].includes(family);
  const bank = ["financial", "insurance", "specialized-financial"].includes(
    family,
  );
  const conflictMetrics = (
    bank
      ? ["revenue", "netIncome", "equity"]
      : [
          "revenue",
          "operatingIncome",
          "operatingCashFlow",
          "capex",
          "cash",
          "debt",
          "equity",
        ]
  ) as (
    | "revenue"
    | "netIncome"
    | "equity"
    | "operatingIncome"
    | "operatingCashFlow"
    | "capex"
    | "cash"
    | "debt"
  )[];
  const conflicts = p
    ? conflictMetrics.filter(
        (metric) => metricEvidence(r, [metric]).status === "Conflicting",
      )
    : [];
  const financialsUsable =
    !conflicts.length &&
    r.company.assetType === "stock" &&
    !!p &&
    Number.isFinite(now) &&
    now - Date.parse(p.end) <= 550 * 86400000 &&
    Date.parse(p.end) <= now;
  const hasPositive = (v: number | null | undefined) =>
    v != null && Number.isFinite(v) && v > 0;
  const roe =
    p &&
    q &&
    p.netIncome != null &&
    p.equity != null &&
    q.equity != null &&
    p.equity > 0 &&
    q.equity > 0
      ? (p.netIncome / ((p.equity + q.equity) / 2)) * 100
      : null;
  const strong = bank
    ? hasPositive(p?.netIncome) &&
      roe != null &&
      roe >= 8 &&
      growth != null &&
      growth >= 0
    : !specialist &&
      hasPositive(p?.fcf) &&
      hasPositive(p?.operatingIncome) &&
      growth != null &&
      growth >= 0;
  const weak =
    !!p &&
    !specialist &&
    p.fcf != null &&
    p.fcf < 0 &&
    p.operatingIncome != null &&
    p.operatingIncome < 0 &&
    growth != null &&
    growth < 0;
  const business: DecisionInput["business"] = !p
    ? "missing"
    : strong
      ? "strong"
      : weak
        ? "weak"
        : "developing";
  // Negative investment cash flow alone is not a solvency diagnosis.
  const operatingBurn =
    !specialist && p?.operatingCashFlow != null && p.operatingCashFlow < 0;
  const shortRunway =
    operatingBurn &&
    funding.operatingRunway != null &&
    funding.operatingRunway < 12;
  const interestPressure =
    !specialist &&
    p?.interestCoverage != null &&
    p.interestCoverage < 1 &&
    p.netDebt != null &&
    p.netDebt > 0 &&
    p.fcf != null &&
    p.fcf < 0;
  const insolvency =
    financialsUsable &&
    operatingBurn &&
    funding.operatingRunway != null &&
    funding.operatingRunway < 6 &&
    p?.equity != null &&
    p.equity < 0 &&
    p.debt != null &&
    p.debt > 0;
  const distress = financialsUsable && (shortRunway || interestPressure);
  const deterioration =
    financialsUsable && weak && growth! < -10 && q?.fcf != null && q.fcf < 0;
  const reasons: string[] = [],
    risks: string[] = [],
    changeConditions: string[] = [];
  if (p && r.company.assetType === "stock") {
    if (growth != null)
      reasons.push(
        `Revenue ${growth >= 0 ? "grew" : "fell"} ${percent(Math.abs(growth))} over the comparable year.`,
      );
    if (!specialist && p.fcf != null)
      reasons.push(
        `${amount(p.fcf, p.currency, true)} cash ${p.fcf >= 0 ? "generated" : "used"} after capital spending.`,
      );
    if (bank && roe != null)
      reasons.push(`${percent(roe)} return on average equity.`);
    else if (p.margin != null)
      reasons.push(
        `${percent(p.margin)} operating margin in the latest complete period.`,
      );
    if (shortRunway)
      risks.push(
        `Cash covers about ${funding.operatingRunway!.toFixed(1)} months of the reported operating cash burn, before new financing.`,
      );
    if (interestPressure)
      risks.push(
        `Operating profit covers interest ${p.interestCoverage!.toFixed(1)}× while cash after capex is negative and net debt is positive.`,
      );
    if (insolvency)
      risks.unshift(
        "Negative reported equity and less than six months of operating cash runway put the funding case under acute pressure.",
      );
    if (deterioration)
      risks.push(
        "Revenue fell more than 10%, operations lost money and cash after capex was negative in both comparable periods.",
      );
    if (funding.dilution != null && funding.dilution > 3)
      risks.push(
        `Weighted diluted shares rose ${percent(funding.dilution)}; per-share progress must keep up.`,
      );
    if (p.sbcRevenue != null && p.sbcRevenue > 10)
      risks.push(
        `Share-based compensation is ${percent(p.sbcRevenue)} of revenue.`,
      );
    if (!specialist && p.fcf != null && p.fcf < 0 && !operatingBurn)
      risks.push(
        "Capital spending exceeds operating cash generation; future funding and investment returns matter.",
      );
  }
  let valuation: DecisionValuation | null = null;
  const price = reference?.price;
  // Prefer a dated forward earnings sensitivity where applicable; its horizon is never ignored.
  if (reference && financialsUsable) {
    const priced = {
      ...r,
      priceObservedAt: new Date(now).toISOString(),
      quote: {
        ...r.quote,
        price: reference.price,
        asOf: reference.asOf,
        stale: false,
        session:
          reference.basis === "settled-close"
            ? "Settled close"
            : r.quote.session,
      },
    };
    const pricedBrief = researchBrief(priced),
      s = pricedBrief.scenario;
    if (
      s &&
      pricedBrief.scenarioEligible &&
      s.currency === reference.currency &&
      s.years > 0 &&
      s.years <= 4 &&
      s.low > 0 &&
      s.low <= s.base &&
      s.base <= s.high
    ) {
      const annual = annualizedReturn(s.base, reference.price, s.years);
      valuation = {
        basis: "earnings",
        label: "Earnings sensitivity",
        bear: s.low,
        base: s.base,
        bull: s.high,
        years: s.years,
        annualReturn: annual,
        downside: (s.low / reference.price - 1) * 100,
        upside: (s.base / reference.price - 1) * 100,
        entryPrice: s.base / 1.12 ** s.years,
        end: s.end,
        assumptions:
          "Published annual EPS estimates × 80% / 100% / 120% of the reported forward P/E. This sensitivity keeps the current market multiple as an anchor; it is not intrinsic value.",
      };
    }
    // Analysts are optional. A mature, cash-generating business can use observed cash flow.
    if (
      !valuation &&
      family === "operating-company" &&
      !r.company.foreignListing &&
      strong &&
      p &&
      q &&
      p.currency === reference.currency
    ) {
      const rows = annualRows(r)
        .filter(
          (x) =>
            x.currency === p.currency && x.basis === p.basis && x.end <= p.end,
        )
        .slice(-3);
      const share = reportedCashPerShare(priced, p, now);
      const diluted = funding.dilution;
      if (
        rows.length >= 3 &&
        rows.every((x) => hasPositive(x.fcf)) &&
        rows.slice(1).every((row, i) => {
          const days =
            (Date.parse(row.end) - Date.parse(rows[i].end)) / 86400000;
          return days >= 330 && days <= 400;
        }) &&
        hasPositive(q.fcf) &&
        share &&
        share.cash != null &&
        p.fcf != null &&
        p.fcf > 0
      ) {
        const cashes = rows.map((x) => x.fcf!).sort((a, b) => a - b),
          normal = Math.min(p.fcf, cashes[1]);
        const v = cashFlowValuation({
          cashPerShare: (share.cash * normal) / p.fcf,
          growth: growth ?? 0,
          dilution: Math.max(0, diluted ?? 0),
        });
        if (v)
          valuation = {
            basis: "cash-flow",
            label: "Cash-flow valuation",
            bear: v.bear,
            base: v.base,
            bull: v.bull,
            years: null,
            annualReturn: null,
            downside: (v.bear / reference.price - 1) * 100,
            upside: (v.base / reference.price - 1) * 100,
            entryPrice: v.base * 0.8,
            end: null,
            assumptions: `Starting cash is the lower of latest cash after capex and the median of the latest three consecutive annual observations, all positive. Company cash-flow growth starts at ${v.growth.toFixed(1)}% and fades over ten years. Shares grow ${v.dilution.toFixed(1)}% annually throughout the forecast and terminal period. Bear/base/bull discount rates: 15%/12%/10%; terminal growth: 1%/2%/3%. These are explicit model assumptions, not company guidance.${diluted == null ? " Future dilution is assumed 0% because comparable share counts were not reported." : ""}`,
          };
      }
    }
  }
  // A dated quote, not the price's location in a chart, anchors valuation conditions.
  let value: DecisionInput["value"] = "unassessed";
  if (valuation && price) {
    const favorable =
      valuation.basis === "cash-flow"
        ? price <= valuation.entryPrice && valuation.downside >= -35
        : valuation.annualReturn != null &&
          valuation.annualReturn >= 12 &&
          valuation.downside >= -35;
    value = favorable
      ? "attractive"
      : valuation.upside < 0
        ? "expensive"
        : "fair";
    reasons.push(
      valuation.basis === "earnings"
        ? `Base sensitivity implies ${percent(valuation.annualReturn, true)} a year over ${valuation.years!.toFixed(1)} years.`
        : `Base cash-flow value is ${percent(Math.abs(valuation.upside))} ${valuation.upside >= 0 ? "above" : "below"} the dated price.`,
    );
    changeConditions.push(
      `Reassess entry at ${amount(valuation.entryPrice, reference!.currency)} or below if the underlying assumptions hold.`,
    );
  }
  const tech = perspective(r).tech;
  const extended = tech.rsi != null && tech.rsi >= 75;
  const action = evaluateDecision({
    ownsPosition,
    priceUsable: !!reference,
    financialsUsable,
    business,
    value,
    extended,
    distress,
    deterioration,
    insolvency,
  });
  const paused = !reference || !financialsUsable;
  let headline = "The price needs a stronger margin of safety.";
  if (action === "Buy" || action === "Add")
    headline = "Business strength and the price case align.";
  else if (action === "Hold")
    headline = extended
      ? "The business holds up. Momentum is stretched."
      : "The operating case holds. Adding needs a better price.";
  else if (action === "Sell")
    headline =
      "Cash runway and balance-sheet weakness threaten the holding case.";
  else if (action === "Reduce" || action === "Avoid")
    headline = distress
      ? "Funding pressure takes priority."
      : "The operating case has materially weakened.";
  else if (!reference)
    headline = "Refresh the price before making an entry decision.";
  else if (r.company.assetType !== "stock")
    headline = "Follow price and Pace for this instrument.";
  else if (conflicts.length)
    headline =
      "Source reports disagree on a decision input. Review the affected figures.";
  else if (!financialsUsable)
    headline = p
      ? "Refresh the financial report before sizing an entry."
      : "Price and Pace are ready; company analysis is still developing.";
  else if (value === "unassessed")
    headline =
      business === "strong"
        ? "Cash generation is healthy. An entry price is not yet established."
        : "Follow operating progress and funding before starting.";
  else if (extended) headline = "The price has run ahead of the entry setup.";
  else if (business === "developing")
    headline = "The business needs stronger operating confirmation.";
  if (conflicts.length)
    changeConditions.unshift(
      `Reconcile conflicting ${conflicts.map((x) => x.replace(/([A-Z])/g, " $1").toLowerCase()).join(", ")} observations for ${p?.end}. Other company facts remain available.`,
    );
  if (!reference)
    changeConditions.unshift(
      "Load a current quote or a recent completed daily close.",
    );
  if (distress || insolvency)
    changeConditions.unshift(
      "Reassess after disclosed financing or improving operating cash flow extends the funding runway.",
    );
  if (deterioration)
    changeConditions.unshift(
      "Look for renewed revenue growth and positive operating cash generation in the next comparable report.",
    );
  if (business === "developing" && !distress)
    changeConditions.push(
      bank
        ? "Track return on equity and credit/capital disclosures in the next report."
        : "Track operating profitability and cash generation in the next report.",
    );
  if (extended)
    changeConditions.push(
      "Reassess after momentum cools or earnings support the higher price.",
    );
  if (!valuation && financialsUsable)
    changeConditions.push(
      specialist
        ? `Use ${brief.coverage.drivers.slice(0, 2).join(" and ")} to establish an applicable valuation.`
        : "Complete the dated earnings or funded cash-flow assumptions in Value.",
    );
  if (!changeConditions.length)
    changeConditions.push(
      "Reassess after the next earnings report or a material change in the price.",
    );
  if (!reasons.length && reference)
    reasons.push(
      `${amount(reference.price, reference.currency)} · ${reference.basis === "settled-close" ? "completed session" : "dated quote"} · ${reference.asOf.slice(0, 10)}.`,
    );
  const tone =
    action === "Buy" || action === "Add"
      ? "positive"
      : action === "Sell" || action === "Reduce" || action === "Avoid"
        ? "risk"
        : action === "Hold"
          ? "neutral"
          : "caution";
  return {
    version: "auryn-decision-v1",
    action,
    tone,
    headline,
    reasons: reasons.slice(0, 4),
    risks,
    changeConditions,
    status: paused
      ? "paused"
      : value === "unassessed"
        ? "developing"
        : "assessed",
    business,
    value,
    reference,
    valuation,
    horizon: valuation?.years
      ? `${valuation.years.toFixed(1)} years · to ${valuation.end}`
      : valuation?.basis === "cash-flow"
        ? "Long term · 10-year cash-flow model"
        : r.company.assetType === "stock"
          ? "Long-term business assessment"
          : "Price & accumulation",
    period: p?.end ?? null,
    model: brief.coverage.family,
    ownsPosition,
    confidence: paused
      ? "Assessment paused"
      : valuation && strong
        ? "Supported by current inputs"
        : "Developing case",
    method:
      "Rules-based research assessment, not a probability of profit. Review the stated model assumptions and portfolio concentration.",
  };
}
