import type { Research } from "./types";
import { perspective } from "./analysis.ts";
import { workspaceGuidance } from "./edge-research.ts";
import { providerSymbol, providerIdentity } from "./provider-symbol.ts";
import { verifiedResearch } from "./comparison.ts";

export type OpportunityFilters = {
  sector: string;
  pace: string;
  quality: string;
};
export const emptyOpportunityFilters: OpportunityFilters = {
  sector: "all",
  pace: "all",
  quality: "all",
};
export function opportunityRow(research: Research, now = Date.now()) {
  const p = perspective(research),
    guidance = workspaceGuidance(research, false, now);
  return {
    research,
    symbol: research.company.symbol,
    sector:
      research.evidence?.profile?.sector?.trim() ||
      research.company.sector?.trim() ||
      "Sector unavailable",
    pace:
      guidance.view.rawLevel != null
        ? `P${guidance.view.rawLevel}`
        : "unavailable",
    permitted: guidance.view.permitted,
    businessReview:
      guidance.view.rawLevel != null &&
      guidance.view.rawLevel >= 2 &&
      !guidance.view.permitted,
    cash: p.last?.fcf ?? null,
    growth: p.growth ?? null,
    profit: p.last?.operatingIncome ?? null,
  };
}
export type OpportunityRow = ReturnType<typeof opportunityRow>;
export function matchesOpportunity(
  row: OpportunityRow,
  filters: OpportunityFilters,
) {
  const positive = (n: number | null) =>
    n != null && Number.isFinite(n) && n > 0;
  return (
    (filters.sector === "all" || row.sector === filters.sector) &&
    (filters.pace === "all" || row.pace === filters.pace) &&
    (filters.quality === "all" ||
      (filters.quality === "cash" && positive(row.cash)) ||
      (filters.quality === "growth" && positive(row.growth)) ||
      (filters.quality === "profit" && positive(row.profit)))
  );
}
/** The denominator is the explicit requested universe, never an inferred market universe. */
export function opportunityMap(
  research: Research[],
  requested: string[],
  now = Date.now(),
) {
  const symbols = [
    ...new Map(
      requested.map((s) => [
        providerIdentity(providerSymbol(s)),
        providerSymbol(s),
      ]),
    ).values(),
  ];
  const rows = symbols.flatMap((symbol) => {
    const r = research.find((r) => verifiedResearch(r, symbol));
    return r ? [opportunityRow(r, now)] : [];
  });
  const sectors = [...new Set(rows.map((r) => r.sector))]
    .sort()
    .map((sector) => {
      const group = rows.filter((r) => r.sector === sector);
      return {
        sector,
        total: group.length,
        zones: group.filter((r) => ["P2", "P3", "P4"].includes(r.pace)).length,
        blocked: group.filter((r) => r.businessReview).length,
        cash: group.filter(
          (r) => r.cash != null && Number.isFinite(r.cash) && r.cash > 0,
        ).length,
      };
    });
  const dates = rows
    .map((r) => r.research.retrievedAt)
    .filter((d) => Number.isFinite(Date.parse(d)))
    .sort();
  return {
    rows,
    sectors,
    requested: symbols.length,
    covered: rows.length,
    missingPace: rows.filter((r) => r.pace === "unavailable").length,
    oldest: dates[0],
    newest: dates.at(-1),
  };
}
