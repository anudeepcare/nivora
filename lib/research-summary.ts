import type { Research, FinancialPeriod } from "./types";
import { ratio } from "./financial-formulas.ts";
export function marketMultiples(r: Research, p?: FinancialPeriod | null) {
  const empty = {
    marketCap: null,
    pe: null,
    ps: null,
    pfcf: null,
    fcfYield: null,
  };
  const today = r.retrievedAt.slice(0, 10);
  const share = r.facts
    .filter(
      (f) =>
        f.metric === "shares" &&
        f.scope === "instant" &&
        f.unit === "shares" &&
        Number.isFinite(f.value) &&
        f.value > 0 &&
        f.end <= today &&
        f.filed <= today,
    )
    .sort(
      (a, b) => b.end.localeCompare(a.end) || b.filed.localeCompare(a.filed),
    )[0];
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
    gaps: string[] = [];
  if (!p)
    return {
      positive,
      risks,
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
          ? "Positive free cash flow can support reinvestment and financing flexibility."
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
  if (p.netDebt != null && p.netDebt > 0)
    risks.push({
      key: "debt",
      title: "Net debt to service",
      value: p.netDebt,
      unit: "money",
      text: "Debt exceeds cash. Maturities, covenants and cash generation determine the burden.",
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
  return { positive: positive.slice(0, 3), risks: risks.slice(0, 3), gaps };
}
