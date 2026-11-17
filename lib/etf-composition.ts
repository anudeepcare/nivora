import type { IntelligenceRow } from "./sentisense-view";
const object = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const text = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);
export function etfComposition(input: unknown) {
  const data = object(input),
    date = text(data.asOfDate),
    validDate =
      date &&
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      Number.isFinite(Date.parse(date))
        ? date
        : null;
  const rows: IntelligenceRow[] = (
    Array.isArray(data.holdings) ? data.holdings : []
  )
    .map(object)
    .filter((r) => text(r.ticker) && text(r.name))
    .map((r) => {
      const linked = text(r.linkedTicker),
        weight =
          typeof r.weightPct === "number" &&
          Number.isFinite(r.weightPct) &&
          r.weightPct >= 0 &&
          r.weightPct <= 100
            ? r.weightPct
            : null;
      return {
        label: `${r.name} (${r.ticker})`,
        date: validDate,
        href:
          linked && /^[A-Z][A-Z0-9]{0,9}(?:[.\-][A-Z])?$/.test(linked)
            ? `/research/${encodeURIComponent(linked)}`
            : null,
        cells: [
          {
            label: "Fund weight",
            value: weight === null ? "Not supplied" : `${weight.toFixed(2)}%`,
          },
          { label: "Listing venue", value: text(r.exchange) ?? "Not supplied" },
        ],
      };
    });
  return {
    date: validDate,
    partial: data.partial === true,
    totalKnown:
      typeof data.totalKnownHoldings === "number" &&
      Number.isInteger(data.totalKnownHoldings) &&
      data.totalKnownHoldings >= 0
        ? data.totalKnownHoldings
        : null,
    rows,
  };
}
