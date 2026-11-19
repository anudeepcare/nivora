export type MarketCapObservation = { date: string; value: number };
export type MarketCapSeries = {
  symbol: string;
  from: string;
  to: string;
  currency: "USD";
  frequency: "weekly";
  source: "EODHD";
  retrievedAt: string;
  rows: MarketCapObservation[];
};
/** EODHD's indexed object, not a price series or daily interpolated valuation. */
export function marketCapHistory(
  raw: unknown,
  from: string,
  to: string,
): MarketCapObservation[] | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const entries = Object.entries(raw);
  if (entries.length > 400) return null;
  const dates = new Map<string, number>();
  for (const [key, value] of entries) {
    if (
      !/^\d+$/.test(key) ||
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    )
      return null;
    const row = value as Record<string, unknown>,
      d = row.date,
      v = row.value;
    if (
      typeof d !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(d) ||
      !Number.isFinite(Date.parse(d)) ||
      new Date(d).toISOString().slice(0, 10) !== d ||
      d < from ||
      d > to ||
      typeof v !== "number" ||
      !Number.isFinite(v) ||
      v <= 0
    )
      return null;
    if (dates.has(d) && dates.get(d) !== v) return null;
    dates.set(d, v);
  }
  return [...dates]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}
