import type { IntelligenceRow } from "./sentisense-view";
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v)
    ? v.toLocaleString("en-US")
    : "Not supplied";
export function institutionRows(
  input: unknown,
  history: boolean,
): IntelligenceRow[] {
  const d = obj(input),
    raw = history ? d.quarters : d.holdings;
  return (Array.isArray(raw) ? raw : [])
    .slice(0, history ? 8 : 50)
    .map((value) => {
      const r = obj(value),
        comparable =
          (history ? r.comparisonStatus : d.comparisonStatus) === "AVAILABLE";
      return {
        label: String(
          history ? (r.label ?? r.reportDate) : (r.companyName ?? r.ticker),
        ),
        date:
          typeof (history ? r.reportDate : d.latestReportDate) === "string"
            ? String(history ? r.reportDate : d.latestReportDate)
            : null,
        href: null,
        cells: history
          ? [
              { label: "Reported equity (USD)", value: num(r.totalValueUsd) },
              { label: "Positions held", value: num(r.positionsHeld) },
              { label: "Top10 concentration %", value: num(r.top10Pct) },
              {
                label: "Filing state",
                value: String(r.status ?? "Not supplied"),
              },
              {
                label: "Estimated net flow (USD)",
                value: comparable ? num(r.netFlowUsd) : "Not comparable",
              },
            ]
          : [
              { label: "Ticker", value: String(r.ticker ?? "Not supplied") },
              { label: "Shares", value: num(r.shares) },
              { label: "Reported value (USD)", value: num(r.valueUsd) },
              { label: "Portfolio weight %", value: num(r.portfolioWeight) },
              {
                label: "Change",
                value: comparable
                  ? String(r.changeType ?? "Not supplied")
                  : "Not comparable",
              },
              {
                label: "Share change %",
                value: !comparable
                  ? "Not comparable"
                  : r.changeType === "NEW"
                    ? "New position · no prior basis"
                    : num(r.sharesChangePct),
              },
            ],
      };
    });
}
