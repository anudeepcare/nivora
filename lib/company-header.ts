import { modelCoverage } from "./research-depth.ts";
import type { Research } from "./types";
import type { FinancialPeriod } from "./types";
/** Dated business facts only. Never substitutes missing or sector-inapplicable values. */
export function headerBusinessMetrics(
  latest: FinancialPeriod | null,
  prior: FinancialPeriod | null,
  financialBusiness: boolean,
  day: string,
) {
  const rows: { label: string; value: number; date: string; help: string }[] =
    [];
  if (!latest || latest.end > day || !Number.isFinite(Date.parse(latest.end)))
    return rows;
  const finite = (x: unknown): x is number =>
    typeof x === "number" && Number.isFinite(x);
  const comparable =
    prior &&
    prior.end < latest.end &&
    prior.currency === latest.currency &&
    prior.basis === latest.basis;
  if (
    comparable &&
    finite(latest.revenue) &&
    finite(prior.revenue) &&
    prior.revenue > 0
  )
    rows.push({
      label: "Revenue growth",
      value: (latest.revenue / prior.revenue - 1) * 100,
      date: latest.end,
      help: `Change versus the comparable period ending ${prior.end}. Revenue growth alone does not establish profitability.`,
    });
  if (
    !financialBusiness &&
    finite(latest.revenue) &&
    latest.revenue > 0 &&
    finite(latest.fcf)
  )
    rows.push({
      label: "Cash-flow margin",
      value: (latest.fcf / latest.revenue) * 100,
      date: latest.end,
      help: "Operating cash flow after reported capital spending, divided by revenue for this period. This is historical cash generation.",
    });
  else if (
    financialBusiness &&
    comparable &&
    finite(latest.netIncome) &&
    finite(latest.equity) &&
    finite(prior.equity) &&
    latest.equity > 0 &&
    prior.equity > 0
  )
    rows.push({
      label: "Return on average equity",
      value: (latest.netIncome / ((latest.equity + prior.equity) / 2)) * 100,
      date: latest.end,
      help: "Reported net income divided by average equity across the comparable annual or TTM endpoints. It is not an insurance underwriting or reserve assessment.",
    });
  else if (!financialBusiness && finite(latest.margin))
    rows.push({
      label: "Operating margin",
      value: latest.margin,
      date: latest.end,
      help: "Operating profit as a percentage of revenue for the stated reporting period.",
    });
  return rows;
}

export function headerBusinessFamily(r: Research) {
  return modelCoverage(r.company.symbol, r.company.assetType, {
    sector: r.evidence?.profile?.sector ?? r.company.sector,
    industry: r.evidence?.profile?.industry,
  }).family;
}
