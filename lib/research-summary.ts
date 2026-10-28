import type { Research, FinancialPeriod } from "./types";
import { ratio } from "./financial-formulas.ts";
/** Resolve the actual denominator date, which can differ from the financial period. */
function reportedOutstandingShares(r: Research, p?: FinancialPeriod | null) {
  const day = r.retrievedAt.slice(0, 10);
  const candidates = r.facts
    .filter(
      (f) =>
        f.metric === "shares" &&
        f.scope === "instant" &&
        f.unit === "shares" &&
        Number.isFinite(f.value) &&
        Number.isFinite(Date.parse(f.end)) &&
        Number.isFinite(Date.parse(f.filed)) &&
        f.end <= day &&
        f.filed <= day &&
        (!p ||
          ((!f.basis || f.basis === p.basis) &&
            (f.currency == null || f.currency === p.currency))),
    )
    .sort(
      (a, b) =>
        b.end.localeCompare(a.end) ||
        b.filed.localeCompare(a.filed) ||
        b.value - a.value,
    );
  const selected = candidates[0];
  if (!selected || selected.value <= 0) return null;
  // A later filing supersedes an earlier one. Same-date disagreements cannot
  // be resolved by array order; rounding-equivalent observations use the larger count.
  const conflict = candidates.some(
    (f) =>
      f.end === selected.end &&
      f.filed === selected.filed &&
      Math.abs(f.value - selected.value) >
        Math.max(1, Math.min(Math.abs(f.value), selected.value) * 0.01),
  );
  return conflict ? null : selected;
}
export function marketMultiples(r: Research, p?: FinancialPeriod | null) {
  const empty = {
    marketCap: null,
    pe: null,
    ps: null,
    pfcf: null,
    fcfYield: null,
  };
  const today = r.retrievedAt.slice(0, 10);
  const share = reportedOutstandingShares(r, p);
  if (
    !p ||
    r.company.assetType !== "stock" ||
    r.company.foreignListing ||
    r.quote.stale ||
    r.quote.price == null ||
    !Number.isFinite(r.quote.price) ||
    r.quote.price <= 0 ||
    r.quote.currency !== p.currency ||
    !share ||
    /^(20-F|40-F)/.test(share.form) ||
    Date.parse(today) - Date.parse(share.end) > 180 * 86400000 ||
    Date.parse(today) - Date.parse(p.end) > 550 * 86400000
  )
    return empty;
  const marketCap = r.quote.price * share.value;
  return {
    marketCap,
    pe: ratio(marketCap, p.netIncome),
    ps: ratio(marketCap, p.revenue),
    pfcf: ratio(marketCap, p.fcf),
    fcfYield: ratio(p.fcf, marketCap, 100),
  };
}
export function earningsScenario(
  eps: number,
  growth: number,
  multiple: number,
  discount: number,
  dilution: number,
  years = 5,
) {
  if (
    ![eps, growth, multiple, discount, dilution, years].every(
      Number.isFinite,
    ) ||
    eps <= 0 ||
    growth <= -100 ||
    multiple <= 0 ||
    discount <= 0 ||
    dilution < 0 ||
    years < 1 ||
    years > 10
  )
    return null;
  const annual = Array.from(
    { length: years },
    (_, i) => eps * ((1 + growth / 100) / (1 + dilution / 100)) ** (i + 1),
  );
  const exitPrice = annual.at(-1)! * multiple;
  return {
    annual,
    exitPrice,
    presentValue: exitPrice / (1 + discount / 100) ** years,
  };
}
export type CaseFactor = {
  key: string;
  title: string;
  text: string;
  value: number;
  unit: "percent" | "money" | "ratio";
};
export function comparableGrowth(
  p: FinancialPeriod,
  prior?: FinancialPeriod | null,
) {
  const span = prior
    ? (Date.parse(p.end) - Date.parse(prior.end)) / 86400000
    : 0;
  return prior &&
    span >= 330 &&
    span <= 400 &&
    prior.currency === p.currency &&
    prior.basis === p.basis &&
    prior.revenue != null &&
    prior.revenue > 0 &&
    p.revenue != null
    ? (p.revenue / prior.revenue - 1) * 100
    : null;
}
export function financialCase(
  p?: FinancialPeriod | null,
  prior?: FinancialPeriod | null,
) {
  const positive: CaseFactor[] = [],
    risks: CaseFactor[] = [],
    context: CaseFactor[] = [],
    gaps: string[] = [];
  if (!p)
    return {
      positive,
      risks,
      context,
      gaps: ["Comparable company statements are not available."],
    };
  const growth = comparableGrowth(p, prior);
  if (growth != null)
    (growth >= 0 ? positive : risks).push({
      key: "growth",
      title: growth >= 0 ? "Revenue is growing" : "Revenue contracted",
      value: growth,
      unit: "percent",
      text:
        growth >= 0
          ? "Supports the growth case if demand remains durable."
          : "The business needs to demonstrate renewed demand.",
    });
  if (p.fcf != null)
    (p.fcf > 0 ? positive : risks).push({
      key: "fcf",
      title: p.fcf > 0 ? "Cash after reinvestment" : "Reinvestment uses cash",
      value: p.fcf,
      unit: "money",
      text:
        p.fcf > 0
          ? p.revenue != null && p.revenue > 0
            ? `${((p.fcf / p.revenue) * 100).toFixed(1)}% of revenue remained after operating cash flows and reported capital expenditure. Check software investment and lease treatment in the source.`
            : "Operating cash flow exceeded reported capital expenditure."
          : "Funding and the returns on capital spending need closer review.",
    });
  else
    gaps.push("Matching operating cash flow and capital spending are missing.");
  if (p.margin != null)
    (p.margin > 0 ? positive : risks).push({
      key: "margin",
      title: p.margin > 0 ? "Profitable operations" : "Operating losses",
      value: p.margin,
      unit: "percent",
      text:
        p.margin > 0
          ? "Operating profit provides a buffer; its durability still needs evidence."
          : "Growth must eventually translate into sustainable operating profit.",
    });
  if (p.sbcRevenue != null && p.sbcRevenue > 5)
    risks.push({
      key: "sbc",
      title: "Equity compensation matters",
      value: p.sbcRevenue,
      unit: "percent",
      text: "Stock compensation exceeds 5% of revenue. Check net dilution alongside buybacks.",
    });
  if (p.interestCoverage != null && p.interestCoverage < 3)
    risks.push({
      key: "interest",
      title: "Limited interest buffer",
      value: p.interestCoverage,
      unit: "ratio",
      text: "Operating earnings cover interest fewer than three times; financing costs matter.",
    });
  if (p.netDebt != null && p.netDebt > 0) {
    const hasCashGeneration = p.fcf != null && p.fcf > 0;
    const hasInterestPressure =
      p.interestCoverage != null && p.interestCoverage < 3;
    (hasCashGeneration && !hasInterestPressure ? context : risks).push({
      key: "debt",
      title: hasCashGeneration
        ? "Net debt in context"
        : "Debt and funding needs",
      value: p.netDebt,
      unit: "money",
      text: hasCashGeneration
        ? `Net debt is ${(p.netDebt / p.fcf!).toFixed(2)}× this period’s cash after capex. This is a historical comparison, not a debt repayment forecast; maturity and lease obligations still matter.`
        : "Debt exceeds cash while positive cash after capex is not established. Review financing commitments and maturities.",
    });
  }
  if (
    p.netIncome != null &&
    p.netIncome > 0 &&
    p.operatingIncome != null &&
    p.operatingIncome < 0
  )
    risks.unshift({
      key: "earnings-quality",
      title: "Net profit includes non-operating effects",
      value: p.operatingIncome,
      unit: "money",
      text: "Reported net income is positive, but operations are loss-making. Reconcile investment gains, financing, tax and other non-operating items before treating profit as recurring.",
    });
  if (p.currentRatio != null && p.currentRatio < 1)
    risks.push({
      key: "liquidity",
      title: "Near-term liquidity review",
      value: p.currentRatio,
      unit: "ratio",
      text: "Current liabilities exceed current assets; working-capital quality matters.",
    });
  if (growth == null)
    gaps.push("Comparable year-over-year revenue growth is missing.");
  if (p.debt == null)
    gaps.push("Total debt is not available from the mapped facts.");
  return { positive: positive.slice(0, 3), risks, context, gaps };
}

/** A price and scenario range share one numeric axis. Never clamp an
 * out-of-range quote inside the scenario band. */
export function valuationScale(values: number[], quote: number) {
  if (
    !values.length ||
    !values.every((v) => Number.isFinite(v) && v >= 0) ||
    !Number.isFinite(quote) ||
    quote <= 0
  )
    return null;
  const low = Math.min(...values),
    high = Math.max(...values);
  const floor = Math.min(low, quote),
    ceiling = Math.max(high, quote);
  const padding = Math.max((ceiling - floor) * 0.1, ceiling * 0.03, 0.01);
  const min = Math.max(0, floor - padding),
    max = ceiling + padding;
  const position = (v: number) => ((v - min) / (max - min)) * 100;
  return {
    low,
    high,
    min,
    max,
    lowPosition: position(low),
    highPosition: position(high),
    quotePosition: position(quote),
  };
}

/** Reported per-share inputs do not depend on a live market quote. */
export function reportedCashPerShare(
  r: Research,
  p?: FinancialPeriod | null,
  now = Date.parse(r.priceObservedAt ?? r.retrievedAt),
) {
  const empty = { cash: null as number | null, sbc: null as number | null };
  if (
    !p ||
    r.company.assetType !== "stock" ||
    r.company.foreignListing ||
    p.currency !== r.company.currency ||
    p.currency !== r.quote.currency ||
    now - Date.parse(p.end) > 550 * 86400000
  )
    return empty;
  const share = reportedOutstandingShares(r, p);
  if (
    !share ||
    /^(20-F|40-F)/.test(share.form) ||
    now - Date.parse(share.end) > 180 * 86400000
  )
    return empty;
  return {
    cash:
      p.fcf != null && Number.isFinite(p.fcf) && p.fcf > 0
        ? p.fcf / share.value
        : null,
    sbc:
      p.stockCompensation != null &&
      Number.isFinite(p.stockCompensation) &&
      p.stockCompensation >= 0
        ? p.stockCompensation / share.value
        : null,
  };
}
