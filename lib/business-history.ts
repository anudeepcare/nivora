import type { Research } from "./types";
import { companyClassification } from "./company-classification.ts";
import { annualRows } from "./analysis.ts";
export function headerMarketContext(r: Research) {
  const cap = r.evidence?.highlights?.MarketCapitalization,
    rawSector = r.evidence?.profile?.sector || r.company.sector || null,
    classification = companyClassification({
      symbol: r.company.symbol,
      assetType: r.company.assetType,
      sector: rawSector,
      industry: r.evidence?.profile?.industry,
    });
  return {
    marketCap:
      r.company.assetType === "stock" &&
      r.company.currency === r.quote.currency &&
      typeof cap === "number" &&
      Number.isFinite(cap) &&
      cap > 0
        ? cap
        : null,
    currency: r.company.currency,
    asOf: r.evidence?.updatedAt ?? null,
    sector: classification.sector,
  };
}
export function businessHistory(r: Research) {
  if (r.company.assetType !== "stock") return null;
  const annual = annualRows(r),
    latest = annual.at(-1);
  const rows = annual
    .filter((p) => p.currency === latest?.currency && p.basis === latest?.basis)
    .slice(-5);
  const first = rows[0],
    last = rows.at(-1);
  const years =
    first && last
      ? (Date.parse(last.end) - Date.parse(first.end)) / (365.25 * 86400000)
      : 0;
  const contiguous = rows.every(
    (p, i) =>
      i === 0 ||
      ((Date.parse(p.end) - Date.parse(rows[i - 1].end)) / 86400000 >= 330 &&
        (Date.parse(p.end) - Date.parse(rows[i - 1].end)) / 86400000 <= 400),
  );
  const cagr =
    contiguous &&
    years >= 0.9 &&
    first?.revenue != null &&
    first.revenue > 0 &&
    last?.revenue != null &&
    last.revenue > 0
      ? ((last.revenue / first.revenue) ** (1 / years) - 1) * 100
      : null;
  const profits = rows.filter(
    (p) => p.netIncome != null && Number.isFinite(p.netIncome),
  );
  const cash = rows.filter((p) => p.fcf != null && Number.isFinite(p.fcf));
  const shareChange =
    contiguous &&
    first?.weightedShares != null &&
    first.weightedShares > 0 &&
    last?.weightedShares != null &&
    last.weightedShares > 0
      ? (last.weightedShares / first.weightedShares - 1) * 100
      : null;
  return {
    periods: rows.length,
    start: first?.end ?? null,
    end: last?.end ?? null,
    currency: latest?.currency ?? null,
    profitYears: profits.filter((p) => p.netIncome! > 0).length,
    profitObservations: profits.length,
    cashYears: cash.filter((p) => p.fcf! > 0).length,
    cashObservations: cash.length,
    revenueCagr: cagr,
    shareChange,
    moat: null,
    rows: rows.map((p) => ({
      end: p.end,
      revenue: p.revenue,
      fcf: p.fcf,
      margin: p.margin,
      shares: p.weightedShares ?? null,
    })),
  };
}
