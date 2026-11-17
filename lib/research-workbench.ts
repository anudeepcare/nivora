import type { FinancialPeriod, Research } from "./types";
import { researchPeriods, type FinancialScope } from "./financial-catalog.ts";
export function safeChange(
  current: number | null | undefined,
  prior: number | null | undefined,
) {
  return current != null &&
    prior != null &&
    Number.isFinite(current) &&
    Number.isFinite(prior) &&
    prior > 0
    ? Math.round((current / prior - 1) * 10000) / 100
    : null;
}
export function comparablePeriods(
  a: FinancialPeriod | undefined,
  b: FinancialPeriod | undefined,
) {
  return (
    !!a &&
    !!b &&
    a.currency === b.currency &&
    a.basis === b.basis &&
    (Date.parse(a.end) - Date.parse(a.start)) / 86400000 >= 300 &&
    (Date.parse(b.end) - Date.parse(b.start)) / 86400000 >= 300 &&
    Math.abs(
      Date.parse(a.end) -
        Date.parse(a.start) -
        (Date.parse(b.end) - Date.parse(b.start)),
    ) <=
      35 * 86400000 &&
    Math.abs(Date.parse(a.end) - Date.parse(b.end)) <= 120 * 86400000
  );
}
export function trendPoints(periods: FinancialPeriod[]) {
  return periods.slice(-8).map((p) => ({
    date: p.end,
    currency: p.currency,
    revenue: p.revenue,
    margin: p.margin,
    fcf: p.fcf,
    shares: p.weightedShares ?? null,
  }));
}
export function financialTrend(r: Research, scope: FinancialScope = "annual") {
  return trendPoints(researchPeriods(r, scope));
}
export function comparisonRows(items: Research[]) {
  const scopes = items.map((r) =>
    researchPeriods(r, "ttm").length ? "TTM" : "Annual",
  );
  const periods = items.map((r, i) =>
    researchPeriods(r, scopes[i] === "TTM" ? "ttm" : "annual").at(-1),
  );
  const base = periods[0];
  return items.map((r, i) => ({
    symbol: r.company.symbol,
    name: r.company.name,
    sector: r.evidence?.profile.sector || r.company.sector || "Unclassified",
    currency: periods[i]?.currency ?? null,
    end: periods[i]?.end ?? null,
    start: periods[i]?.start ?? null,
    scope: periods[i] ? scopes[i] : "Unavailable",
    basis: periods[i]?.basis ?? null,
    comparable: scopes[i] === scopes[0] && comparablePeriods(base, periods[i]),
    revenue: periods[i]?.revenue ?? null,
    margin: periods[i]?.margin ?? null,
    fcfMargin: periods[i]?.fcfMargin ?? null,
    netDebt: periods[i]?.netDebt ?? null,
    forwardPE: r.evidence?.multiples.ForwardPE ?? null,
    asOf: r.retrievedAt,
  }));
}
export function csvRows(rows: unknown[][]) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          let s = value == null ? "" : String(value);
          if (typeof value === "string" && /^[\s]*[=+@-]/.test(s)) s = "'" + s;
          return /[",\r\n]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s;
        })
        .join(","),
    )
    .join("\r\n");
}
export function earningsSurprise(
  actual: number | null,
  estimate: number | null,
) {
  return actual != null &&
    estimate != null &&
    Number.isFinite(actual) &&
    Number.isFinite(estimate) &&
    estimate !== 0
    ? ((actual - estimate) / Math.abs(estimate)) * 100
    : null;
}
export function researchCoverage(r: Research) {
  const rows = [
    {
      key: "quote",
      label: "Price",
      count:
        r.quote.price != null &&
        Number.isFinite(r.quote.price) &&
        r.quote.price > 0
          ? 1
          : 0,
      date: r.quote.asOf,
      older: r.quote.stale,
    },
    {
      key: "history",
      label: "Price history",
      count: r.history.length,
      date: r.history.at(-1)?.time,
    },
    {
      key: "financials",
      label: "Financial observations",
      count: r.facts.length,
      date: r.facts
        .map((f) => f.end)
        .sort()
        .at(-1),
    },
    {
      key: "forecasts",
      label: "Forecast periods",
      count: r.evidence?.estimates.length ?? 0,
      date: r.evidence?.updatedAt,
    },
    {
      key: "earnings",
      label: "Earnings records",
      count: r.evidence?.earnings.length ?? 0,
      date: r.evidence?.updatedAt,
    },
    {
      key: "insiders",
      label: "Insider records",
      count: r.evidence?.insiders.length ?? 0,
      date: r.evidence?.insiders
        .map((x) => x.date)
        .sort()
        .at(-1),
    },
    {
      key: "holders",
      label: "Ownership records",
      count: r.evidence?.holders.length ?? 0,
      date: r.evidence?.holders
        .map((x) => x.date)
        .sort()
        .at(-1),
    },
    {
      key: "filings",
      label: "Company filings",
      count: r.filings.length,
      date: r.filings
        .map((x) => x.date)
        .sort()
        .at(-1),
    },
  ];
  return rows.map((row) => ({
    ...row,
    state: !row.count
      ? "Unavailable"
      : row.older
        ? "Older observation"
        : "Returned",
  }));
}
