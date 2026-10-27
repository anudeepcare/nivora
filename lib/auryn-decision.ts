import { pacePresentation } from "./pace-presentation.ts";
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
  | "Watch"
  | "Review"
  | "Avoid";
export type DecisionInput = {
  ownsPosition: boolean;
  growthEligible?: boolean;
  confirmedPace?: number | null;
  priceUsable: boolean;
  financialsUsable: boolean;
  business: "strong" | "developing" | "weak" | "missing";
  value: "attractive" | "fair" | "expensive" | "unassessed";
  extended: boolean;
  distress: boolean;
  deterioration: boolean;
  insolvency: boolean;
};
/** Funding pressure requires operating liquidity evidence, not expansion capex alone. */
export function fundingRisk(x: {
  applicable: boolean;
  operatingCashFlow: number | null | undefined;
  freeCashFlow: number | null | undefined;
  interestCoverage: number | null | undefined;
  netDebt: number | null | undefined;
  operatingRunway: number | null | undefined;
  cash: number | null | undefined;
}) {
  const finite = (n: number | null | undefined): n is number =>
    n != null && Number.isFinite(n);
  const operatingBurn =
    x.applicable && finite(x.operatingCashFlow) && x.operatingCashFlow < 0;
  const shortRunway =
    operatingBurn &&
    finite(x.operatingRunway) &&
    x.operatingRunway >= 0 &&
    x.operatingRunway < 12;
  const interestPressure =
    x.applicable &&
    finite(x.interestCoverage) &&
    x.interestCoverage < 1 &&
    finite(x.netDebt) &&
    x.netDebt > 0 &&
    finite(x.freeCashFlow) &&
    x.freeCashFlow < 0;
  // Interest coverage is an accrual-profit warning. It is not proof that debt payments cannot be funded.
  const distress =
    shortRunway ||
    (operatingBurn && interestPressure && finite(x.cash) && x.cash <= 0);
  return { operatingBurn, shortRunway, interestPressure, distress };
}
/** Conservative funded-growth screen. These disclosed thresholds are heuristics, not backtested probabilities. */
export function fundedGrowthCase(x: {
  applicable: boolean;
  financialsUsable: boolean;
  growth: number | null | undefined;
  margin: number | null | undefined;
  priorMargin: number | null | undefined;
  cash: number | null | undefined;
  netDebt: number | null | undefined;
  operatingCashFlow: number | null | undefined;
  freeCashFlow: number | null | undefined;
  operatingRunway: number | null | undefined;
  investmentRunway: number | null | undefined;
  dilution: number | null | undefined;
}) {
  const finite = (v: number | null | undefined): v is number =>
    v != null && Number.isFinite(v);
  const checks = {
    comparableReports: x.applicable && x.financialsUsable,
    growth: finite(x.growth) && x.growth >= 20,
    marginProgress:
      finite(x.margin) &&
      finite(x.priorMargin) &&
      x.margin - x.priorMargin >= 5,
    netCash:
      finite(x.cash) && x.cash > 0 && finite(x.netDebt) && x.netDebt <= 0,
    dilution: finite(x.dilution) && x.dilution <= 10,
    operationsFunded:
      finite(x.operatingCashFlow) &&
      (x.operatingCashFlow >= 0 ||
        (finite(x.operatingRunway) && x.operatingRunway >= 24)),
    investmentFunded:
      finite(x.freeCashFlow) &&
      (x.freeCashFlow >= 0 ||
        (finite(x.investmentRunway) && x.investmentRunway >= 18)),
  };
  const descriptions: Record<keyof typeof checks, string> = {
    comparableReports: "Current, comparable reports without conflicting inputs",
    growth: "Revenue growth of at least 20%",
    marginProgress:
      "Operating margin improvement of at least 5 percentage points",
    netCash: "Positive cash and no net debt",
    dilution: "Reported diluted share growth of 10% or less",
    operationsFunded:
      "Nonnegative operating cash flow or at least 24 months of operating runway",
    investmentFunded:
      "Nonnegative cash after capex or at least 18 months of investment runway",
  };
  const requirements = (Object.keys(checks) as (keyof typeof checks)[]).map(
    (key) => ({ key, label: descriptions[key], met: checks[key] }),
  );
  return {
    eligible: Object.values(checks).every(Boolean),
    checks,
    requirements,
  };
}
/** Published screening policy. Thresholds are transparent heuristics, not fitted probabilities. */
export function assessDecision(x: DecisionInput): {
  action: DecisionAction;
  code:
    | "financials"
    | "insolvency"
    | "funding"
    | "deterioration"
    | "price"
    | "accumulation"
    | "history"
    | "pace"
    | "zone"
    | "entry"
    | "business";
} {
  if (!x.financialsUsable) return { action: "Review", code: "financials" };
  if (x.insolvency)
    return { action: x.ownsPosition ? "Sell" : "Avoid", code: "insolvency" };
  if (x.distress || x.deterioration)
    return {
      action: x.ownsPosition ? "Reduce" : "Avoid",
      code: x.distress ? "funding" : "deterioration",
    };
  if (!x.priceUsable) return { action: "Review", code: "price" };
  const supported = x.business === "strong" || x.growthEligible === true;
  if (!supported) return { action: "Review", code: "business" };
  if (x.confirmedPace === 0)
    return { action: x.ownsPosition ? "Hold" : "Wait", code: "pace" };
  if (x.confirmedPace === 1)
    return { action: x.ownsPosition ? "Hold" : "Watch", code: "zone" };
  // Confirmed accumulation zones require a supported business.
  // Do not let forming readings, RSI or a conservative model rewrite this plan.
  if (
    Number.isInteger(x.confirmedPace) &&
    x.confirmedPace! >= 2 &&
    x.confirmedPace! <= 4
  )
    return { action: x.ownsPosition ? "Add" : "Buy", code: "accumulation" };
  if (x.value === "attractive" && !x.extended)
    return { action: x.ownsPosition ? "Add" : "Buy", code: "entry" };
  return {
    action: "Review",
    code: "history",
  };
}
export function evaluateDecision(x: DecisionInput): DecisionAction {
  return assessDecision(x).action;
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
          "weightedShares",
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
    | "weightedShares"
  )[];
  const priorMetrics = bank
    ? (["revenue", "equity"] as const)
    : ([
        "revenue",
        "operatingIncome",
        "weightedShares",
        "operatingCashFlow",
        "capex",
      ] as const);
  const conflicts = [
    ...(p
      ? conflictMetrics.filter(
          (metric) => metricEvidence(r, [metric]).status === "Conflicting",
        )
      : []),
    ...(q
      ? priorMetrics
          .filter(
            (metric) =>
              metricEvidence(r, [metric], false, "prior").status ===
              "Conflicting",
          )
          .map((metric) => `prior ${metric}`)
      : []),
  ];
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
  const businessChecks = bank
    ? [
        {
          label: "positive net income",
          value: p?.netIncome,
          met: hasPositive(p?.netIncome),
        },
        {
          label: "return on average equity of at least 8%",
          value: roe,
          met: roe != null && roe >= 8,
        },
        {
          label: "comparable revenue growth of zero or more",
          value: growth,
          met: growth != null && growth >= 0,
        },
      ]
    : [
        {
          label: "positive cash generation after capex",
          value: p?.fcf,
          met: hasPositive(p?.fcf),
        },
        {
          label: "positive operating profit",
          value: p?.operatingIncome,
          met: hasPositive(p?.operatingIncome),
        },
        {
          label: "comparable revenue growth of zero or more",
          value: growth,
          met: growth != null && growth >= 0,
        },
      ];
  const businessGaps = businessChecks
    .filter((check) => !check.met)
    .map(
      (check) =>
        `${check.value == null || !Number.isFinite(check.value) ? "Missing evidence for" : "Not met:"} ${check.label}`,
    );
  const business: DecisionInput["business"] = !p
    ? "missing"
    : strong
      ? "strong"
      : weak
        ? "weak"
        : "developing";
  const growthAssessment = fundedGrowthCase({
    applicable: !specialist && funding.annualBasis && growth != null,
    financialsUsable,
    growth,
    margin: p?.margin,
    priorMargin: q?.margin,
    cash: p?.cash,
    netDebt: p?.netDebt,
    operatingCashFlow: p?.operatingCashFlow,
    freeCashFlow: p?.fcf,
    operatingRunway: funding.operatingRunway,
    investmentRunway: funding.investmentRunway,
    dilution: funding.dilution,
  });
  // Negative investment cash flow alone is not a solvency diagnosis.
  const fundingAssessment = fundingRisk({
    applicable: !specialist,
    operatingCashFlow: p?.operatingCashFlow,
    freeCashFlow: p?.fcf,
    interestCoverage: p?.interestCoverage,
    netDebt: p?.netDebt,
    operatingRunway: funding.operatingRunway,
    cash: p?.cash,
  });
  const { operatingBurn, shortRunway, interestPressure } = fundingAssessment;
  const insolvency =
    financialsUsable &&
    operatingBurn &&
    funding.operatingRunway != null &&
    funding.operatingRunway < 6 &&
    p?.equity != null &&
    p.equity < 0 &&
    p.debt != null &&
    p.debt > 0;
  const distress = financialsUsable && fundingAssessment.distress;
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
        p.interestCoverage! < 0
          ? "Operations reported a loss, so operating profit did not cover interest. Review debt maturities and disclosed financing alongside cash and expansion spending."
          : `Operating profit covers ${p.interestCoverage!.toFixed(1)}× interest expense. Review debt maturities and financing; this ratio alone does not establish a cash shortfall.`,
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
  // Earnings sensitivities are a fallback. A market multiple must not displace
  // an eligible independent cash-flow model merely because analyst coverage exists.
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
        entryPrice: Math.min(s.base / 1.12 ** s.years, s.low / 0.65),
        end: s.end,
        assumptions:
          "Published annual EPS estimates × 80% / 100% / 120% of the reported forward P/E. This sensitivity keeps the current market multiple as an anchor; it is not intrinsic value.",
      };
    }
    // Prefer observed cash flow only when the existing mature-business safeguards pass.
    if (
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
            entryPrice: Math.min(v.base * 0.8, v.bear / 0.65),
            end: null,
            assumptions: `Starting cash is the lower of latest cash after capex and the median of the latest three consecutive annual observations, all positive. Company cash-flow growth starts at ${v.growth.toFixed(1)}% and fades over ten years. Shares grow ${v.dilution.toFixed(1)}% annually throughout the forecast and terminal period. Bear/base/bull discount rates: 15%/12%/10%; terminal growth: 1%/2%/3%. These are explicit model assumptions, not company guidance.${diluted == null ? " Future dilution is assumed 0% because comparable share counts were not reported." : ""}`,
          };
      }
    }
  }
  // A dated quote, not the price's location in a chart, anchors valuation conditions.
  let value: DecisionInput["value"] = "unassessed";
  if (valuation && price) {
    // entryPrice includes both constraints. Comparing the price directly avoids
    // floating-point drift at the displayed return/downside boundary.
    const favorable = price <= valuation.entryPrice;
    value = favorable
      ? "attractive"
      : valuation.upside < 0
        ? "expensive"
        : "fair";
    reasons.push(
      valuation.basis === "earnings"
        ? `Modelled annual return: ${percent(valuation.annualReturn, true)} over ${valuation.years!.toFixed(1)} years.`
        : `Base cash-flow value is ${percent(Math.abs(valuation.upside))} ${valuation.upside >= 0 ? "above" : "below"} the dated price.`,
    );
    if (!favorable)
      risks.push(
        `Price is above the conservative ${valuation.basis === "cash-flow" ? "cash-flow" : "earnings"} model screen of ${amount(valuation.entryPrice, reference!.currency)}. Review growth, cash conversion and downside assumptions before committing more capital; this sensitivity is not a complete valuation verdict.`,
      );
  }
  const tech = perspective(r).tech;
  const extended = tech.rsi != null && tech.rsi >= 75;
  const decisionInputs = {
    ownsPosition,
    growthEligible: growthAssessment.eligible,
    confirmedPace: brief.accumulation.multiplier,
    priceUsable: !!reference,
    financialsUsable,
    business,
    value,
    extended,
    distress,
    deterioration,
    insolvency,
  };
  const actions = {
    entry: evaluateDecision({ ...decisionInputs, ownsPosition: false }),
    holding: evaluateDecision({ ...decisionInputs, ownsPosition: true }),
  };
  const action = ownsPosition ? actions.holding : actions.entry;
  const assessment = assessDecision(decisionInputs);
  const actionLabel = pacePresentation(
    action,
    brief.accumulation.multiplier,
  ).actionLabel;
  const actionLabels = {
    entry: pacePresentation(actions.entry, brief.accumulation.multiplier)
      .actionLabel,
    holding: pacePresentation(actions.holding, brief.accumulation.multiplier)
      .actionLabel,
  };
  if (assessment.code === "accumulation") {
    changeConditions.push(
      "Review the business after earnings and adjust the contribution pace when the next completed monthly reading changes. Stay within your planned cash budget and position limit.",
    );
    if (!valuation)
      risks.push(
        "A suitable valuation model is not established. Gradual accumulation is supported by the business screen and confirmed Pace, not a claim that this stock is cheap.",
      );
  }
  const paused = !reference || !financialsUsable;
  let headline = "The price needs a stronger margin of safety.";
  if (action === "Buy" || action === "Add")
    headline =
      assessment.code === "accumulation"
        ? `Business supported; ${brief.accumulation.multiplier === 2 ? "initial" : brief.accumulation.multiplier === 3 ? "deeper" : "deep"} accumulation conditions met.`
        : "The business and valuation screens support a gradual entry.";
  else if (action === "Hold" || action === "Watch")
    headline =
      assessment.code === "zone"
        ? "Business supported; accumulation conditions not established."
        : "The business case holds; confirmed Pace pauses new contributions.";
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
  else if (assessment.code === "history")
    headline = "The business screen passes. Confirmed Pace needs more history.";
  else if (assessment.code === "business")
    headline =
      "Review operating progress and funding before committing more capital.";
  if (
    (action === "Hold" || action === "Wait") &&
    brief.accumulation.multiplier === 0 &&
    financialsUsable &&
    reference &&
    (strong || growthAssessment.eligible)
  ) {
    headline =
      "The business case holds; confirmed Pace pauses new contributions.";
    changeConditions.unshift(
      "Reassess additions when a completed monthly Pace reading reaches P2 or higher and the business still qualifies.",
    );
  }
  if (assessment.code === "zone")
    changeConditions.unshift(
      "Consider a small entry only after a completed reading reaches P2 or higher and the business still qualifies. A healthy company can remain outside an accumulation zone.",
    );
  if (growthAssessment.eligible && !strong) {
    reasons.splice(
      1,
      0,
      "Growth and improving margins meet the funded-growth screen, with net cash and measured dilution.",
    );
    risks.push(
      "The growth path uses disclosed screening thresholds; future profitability and investment returns remain uncertain.",
    );
  }
  if (conflicts.length)
    changeConditions.unshift(
      `Reconcile conflicting ${conflicts.map((x) => x.replace(/([A-Z])/g, " $1").toLowerCase()).join(", ")} observations in the current or comparable reporting period. Other company facts remain available.`,
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
  if (
    !specialist &&
    !strong &&
    growth != null &&
    growth >= 20 &&
    !growthAssessment.eligible &&
    financialsUsable &&
    !distress
  ) {
    const outstanding = growthAssessment.requirements.filter(
      (rule) => !rule.met,
    );
    changeConditions.unshift(
      `For the funded-growth path, establish: ${outstanding.map((rule) => rule.label.toLowerCase()).join("; ")}.`,
    );
  }
  if (business === "developing" && !distress)
    changeConditions.push(
      bank
        ? "Track return on equity and credit/capital disclosures in the next report."
        : "Track operating profitability and cash generation in the next report.",
    );
  if (extended)
    risks.push(
      "Short-term momentum is stretched (RSI at least 75). Use staged purchases and respect your position limit; this does not change the confirmed monthly Pace.",
    );
  if (
    !valuation &&
    financialsUsable &&
    reference &&
    !distress &&
    !insolvency &&
    !deterioration
  )
    changeConditions.push(
      specialist
        ? `Use ${brief.coverage.drivers.slice(0, 2).join(" and ")} to establish an applicable valuation.`
        : "Complete the dated earnings or funded cash-flow assumptions in Value.",
    );
  if (!changeConditions.length)
    changeConditions.push(
      "Reassess after the next earnings report or a material change in the price.",
    );
  const businessReview =
    specialist && !bank
      ? `This sector needs its own business assessment using ${brief.coverage.drivers.slice(0, 2).join(" and ")}; the ordinary-company cash-generation screen does not apply.`
      : `${businessGaps.join("; ")}. ${growth != null && growth >= 20 ? "The alternative funded-growth requirements must also be reviewed below." : "Price weakness alone does not establish a supported business case."}`;
  if (assessment.code === "business") changeConditions.unshift(businessReview);
  if (!reasons.length && reference)
    reasons.push(
      `${amount(reference.price, reference.currency)} · ${reference.basis === "settled-close" ? "completed session" : "dated quote"} · ${reference.asOf.slice(0, 10)}.`,
    );
  const explanationText: Record<
    ReturnType<typeof assessDecision>["code"],
    { label: string; detail: string }
  > = {
    financials: {
      label:
        r.company.assetType !== "stock"
          ? "Price research only"
          : "Report check pending",
      detail: conflicts.length
        ? `Reports disagree on ${conflicts.map((x) => x.replace(/([A-Z])/g, " $1").toLowerCase()).join(", ")}. Other figures and Pace remain available.`
        : r.company.assetType !== "stock"
          ? "Company buy/sell rules do not apply to this instrument. Use its price history and accumulation reading."
          : "A current, comparable financial report is needed to assess the business. This is an incomplete assessment, not a negative business verdict.",
    },
    insolvency: {
      label: "Acute funding pressure",
      detail:
        "Reported cash covers less than six months of operating burn, with negative equity and outstanding debt.",
    },
    funding: {
      label: "Funding risk",
      detail:
        risks.find((x) => x.includes("months")) ??
        "Operating cash burn, uncovered interest and exhausted cash weaken the funding case.",
    },
    deterioration: {
      label: "Business deterioration",
      detail:
        "Revenue fell more than 10%, operations lost money and cash after capex was negative in both comparable periods.",
    },
    price: {
      label: "Price refresh needed",
      detail:
        "A current quote or recent completed close is needed to compare price with the business case.",
    },
    pace: {
      label: "P0 pauses additions",
      detail:
        "The confirmed monthly reading is P0. Pause new contributions, not the business assessment. Reassess after a completed month reaches P2 or higher if the business still qualifies. P0 is not a sell signal.",
    },
    zone: {
      label: "P1 · Outside the accumulation zone",
      detail:
        "The business screen passes, but a qualifying accumulation zone is not established. Watch for a new entry; hold an existing position if the business case remains intact. P1 does not prescribe a purchase amount.",
    },
    accumulation: {
      label: `${actionLabel} · P${brief.accumulation.multiplier}`,
      detail: pacePresentation(action, brief.accumulation.multiplier).detail,
    },
    history: {
      label: "Contribution history incomplete",
      detail:
        "The business screen passes, but a confirmed Pace level is not available and the separate valuation-entry screen does not qualify. Review the available business and price evidence; missing history is not a negative business verdict.",
    },
    entry: {
      label: "Entry conditions met",
      detail:
        "The business screen and independent valuation-entry conditions qualify. A confirmed contribution level is not available; size purchases to your risk budget without assuming a Pace level.",
    },
    business: {
      label: "Business checks to review",
      detail: businessReview,
    },
  };
  const explanation = {
    code: assessment.code,
    ...explanationText[assessment.code],
  };
  const tone =
    action === "Buy" || action === "Add"
      ? "positive"
      : action === "Sell" || action === "Reduce" || action === "Avoid"
        ? "risk"
        : action === "Hold"
          ? "neutral"
          : "caution";
  return {
    version: "auryn-decision-v6-zones",
    explanation,
    actions,
    contextLabel: ownsPosition ? "For your holding" : "For new purchases",
    growthAssessment,
    growthCandidate: !specialist && !strong && growth != null && growth >= 20,
    action,
    actionLabel,
    actionLabels,
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
    fundingAssessment,
    brief,
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
      : strong || growthAssessment.eligible
        ? "Business case supported"
        : "Developing case",
    method:
      "Rules-based research assessment, not a probability of profit. Review the stated model assumptions and portfolio concentration.",
  };
}
