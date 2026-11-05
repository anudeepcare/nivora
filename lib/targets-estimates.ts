import type { Research } from "./types";
import { consensusOutlook, researchOutlook } from "./outlook.ts";
import { priceRiskScenarios } from "./price-risk-scenarios.ts";

const DAY = 86400000;
const finite = (n: number | null | undefined): n is number =>
  n != null && Number.isFinite(n);
export function estimateGrowth(
  current: number | null,
  prior: number | null,
): string {
  if (!finite(current) || !finite(prior)) return "Comparison unavailable";
  if (prior === 0)
    return current === 0
      ? "Unchanged"
      : "Zero prior base; percentage unavailable";
  if (prior < 0 && current === 0) return "Loss to breakeven";
  if (prior < 0 && current > 0) return "Loss to profit";
  if (prior >= 0 && current < 0) return "Profit to loss";
  if (prior <= 0)
    return current > prior
      ? "Loss narrows"
      : current < prior
        ? "Loss widens"
        : "Unchanged";
  return `${current > prior ? "+" : ""}${((current / prior - 1) * 100).toFixed(1)}%`;
}
export function orderedEstimateRange(
  low: number | null,
  value: number | null,
  high: number | null,
) {
  return finite(low) &&
    finite(value) &&
    finite(high) &&
    low <= value &&
    value <= high
    ? { low, high }
    : null;
}
export function targetsEstimates(r: Research) {
  const now = Date.parse(r.priceObservedAt ?? r.retrievedAt);
  const stamp = Date.parse(r.evidence?.updatedAt ?? "");
  const fresh =
    Number.isFinite(now) &&
    Number.isFinite(stamp) &&
    stamp <= now + DAY &&
    now - stamp <= 120 * DAY;
  const rows =
    fresh && r.company.assetType === "stock"
      ? (r.evidence?.estimates ?? [])
          .filter((x) => {
            const end = Date.parse(x.date);
            const fiscal = /^FY(\d{4})$/i.exec(x.period);
            return (
              /annual/i.test(x.frequency) &&
              Number.isFinite(end) &&
              end >= now - 120 * DAY &&
              end <= now + 1461 * DAY &&
              !r.facts.some(
                (fact) =>
                  fact.scope === "annual" &&
                  fact.end === x.date &&
                  (fact.metric === "revenue" || fact.metric === "eps") &&
                  Date.parse(fact.filed) <= now,
              ) &&
              (!fiscal ||
                Math.abs(Number(fiscal[1]) - Number(x.date.slice(0, 4))) <=
                  1) &&
              !!x.currency &&
              /^[A-Z]{3}$/.test(x.currency) &&
              x.currency === r.evidence?.reportingCurrency &&
              (finite(x.eps) || (finite(x.revenue) && x.revenue >= 0))
            );
          })
          .sort((a, b) => a.date.localeCompare(b.date))
          .filter(
            (x, index, all) =>
              all.findIndex(
                (v) => v.date === x.date && v.currency === x.currency,
              ) === index,
          )
          .slice(0, 6)
          .map((x) => ({
            ...x,
            eps: finite(x.eps) ? x.eps : null,
            revenue: finite(x.revenue) && x.revenue >= 0 ? x.revenue : null,
            epsRange: orderedEstimateRange(x.epsLow, x.eps, x.epsHigh),
            revenueRange:
              x.revenueLow != null && x.revenueLow >= 0
                ? orderedEstimateRange(x.revenueLow, x.revenue, x.revenueHigh)
                : null,
            analysts:
              finite(x.analysts) &&
              x.analysts > 0 &&
              Number.isInteger(x.analysts)
                ? x.analysts
                : null,
          }))
      : [];
  return {
    consensus: consensusOutlook(r),
    targetAnalysts: null,
    estimates: rows,
    asOf: fresh ? r.evidence!.updatedAt : null,
    estimatesReason: !fresh
      ? "A current, dated estimate dataset is unavailable."
      : "No annual estimates with valid fiscal dates and a known reporting currency are available.",
    forecast: researchOutlook(r),
    risk: priceRiskScenarios(r),
  };
}
