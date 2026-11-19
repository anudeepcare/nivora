import type { FinancialPeriod, Research } from "./types";
import { financialPeriods } from "./engine.ts";
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
export function businessIndicatorPeriods(input: FinancialPeriod[]) {
  const periods = [...input]
    .sort((a, b) => a.end.localeCompare(b.end))
    .slice(-9);
  const definitions = [
    {
      key: "revenueGrowth",
      label: "Revenue growth",
      note: "Year-over-year reported annual revenue, only comparable currency and accounting basis.",
    },
    {
      key: "operatingMargin",
      label: "Operating margin",
      note: "Reported operating income divided by annual revenue; not net margin.",
    },
    {
      key: "cashMargin",
      label: "Free-cash-flow margin",
      note: "Annual free cash flow divided by revenue. Negative cash flow remains negative.",
    },
    {
      key: "dilution",
      label: "Weighted-share dilution",
      note: "Year-over-year change in annual weighted shares. Not change in spot shares outstanding.",
    },
  ] as const;
  return definitions.map((def) => ({
    ...def,
    unit: "%",
    points: periods
      .map((p, i) => {
        const previous = periods[i - 1],
          days = previous
            ? (Date.parse(p.end) - Date.parse(previous.end)) / 86400000
            : 0,
          comparable =
            previous &&
            previous.currency === p.currency &&
            previous.basis === p.basis &&
            days >= 330 &&
            days <= 400;
        let value: number | null = null;
        if (
          def.key === "revenueGrowth" &&
          comparable &&
          finite(p.revenue) &&
          finite(previous.revenue) &&
          previous.revenue > 0
        )
          value = (p.revenue / previous.revenue - 1) * 100;
        if (
          def.key === "dilution" &&
          comparable &&
          finite(p.weightedShares) &&
          finite(previous.weightedShares) &&
          previous.weightedShares > 0 &&
          p.weightedShares > 0
        )
          value = (p.weightedShares / previous.weightedShares - 1) * 100;
        if (
          def.key === "operatingMargin" &&
          finite(p.operatingIncome) &&
          finite(p.revenue) &&
          p.revenue > 0
        )
          value = (p.operatingIncome / p.revenue) * 100;
        if (
          def.key === "cashMargin" &&
          finite(p.fcf) &&
          finite(p.revenue) &&
          p.revenue > 0
        )
          value = (p.fcf / p.revenue) * 100;
        return {
          date: p.end,
          value: value !== null && Number.isFinite(value) ? value : null,
          currency: p.currency,
          basis: p.basis,
          filed: p.filed,
          sourceUrl: p.sourceUrl,
        };
      })
      .slice(-8),
  }));
}
export function businessIndicatorOverview(research: Research) {
  if (research.company?.assetType !== "stock") return [];
  return businessIndicatorPeriods(
    financialPeriods(research.facts ?? [], "annual", research.retrievedAt),
  );
}
