export function allowedPreview(host: string, enabled: string | undefined) {
  return (
    enabled === "true" &&
    /^(localhost|127\.0\.0\.1|terminal\.local)(:\d+)?$/.test(host)
  );
}
export const stages = [
  "Pause",
  "Watch",
  "Start small",
  "Add gradually",
  "Deep accumulation",
] as const;
export function stageLabel(stage: number | null) {
  return stage == null
    ? "Not established"
    : (stages[stage] ?? "Not established");
}
export type HistoryPoint = { date: string; value: number };
export function selectHistory<T extends HistoryPoint>(
  history: T[],
  range: string,
): T[] {
  const lengths: Record<string, number> = {
    "1D": 1,
    "1W": 5,
    "1M": 21,
    "3M": 63,
    "6M": 126,
    "1Y": 252,
    "5Y": 1260,
  };
  return history.slice(-(lengths[range] ?? history.length));
}
export function filteredCompanies<T extends { symbol: string; name: string }>(
  rows: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  return rows.filter((r) => `${r.symbol} ${r.name}`.toLowerCase().includes(q));
}
export const companies = [
  {
    symbol: "NOVA",
    name: "Nova Systems",
    sector: "Technology",
    price: 128.4,
    change: 2.4,
    pace: 3,
    weight: 18.5,
  },
  {
    symbol: "ARC",
    name: "Arc Energy",
    sector: "Energy",
    price: 74.82,
    change: -1.2,
    pace: 2,
    weight: 12.2,
  },
  {
    symbol: "LUMA",
    name: "Luma Health",
    sector: "Healthcare",
    price: 48.16,
    change: 1.8,
    pace: 1,
    weight: 9.6,
  },
  {
    symbol: "ATLS",
    name: "Atlas Industries",
    sector: "Industrials",
    price: 216.38,
    change: 0.7,
    pace: 2,
    weight: 15.8,
  },
  {
    symbol: "FORM",
    name: "Form Financial",
    sector: "Financials",
    price: 92.7,
    change: -0.4,
    pace: 0,
    weight: 8.4,
  },
  {
    symbol: "WAVE",
    name: "Wave Networks",
    sector: "Communication",
    price: 63.52,
    change: 3.1,
    pace: 4,
    weight: 11.5,
  },
];
const sampleValue = (i: number) =>
  85 + i * 0.16 + Math.sin(i * 0.23) * 4 + Math.cos(i * 0.63) * 1.8;
export const history: HistoryPoint[] = Array.from({ length: 252 }, (_, i) => ({
  date: new Date(Date.UTC(2026, 10, 4 - 251 + i)).toISOString().slice(0, 10),
  value: (sampleValue(i) * 128.4) / sampleValue(251),
}));
export const sections = [
  "Overview",
  "Business",
  "Valuation",
  "Technicals",
  "Analysts",
  "Options",
  "Ownership",
  "News & earnings",
  "Advanced",
] as const;
