export const etfFields = {
  MARKET_CAP: {
    label: "Assets under management (USD)",
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
  },
  EXPENSE_RATIO: { label: "Annual expense ratio (%)", min: 0, max: 100 },
  HOLDINGS_COUNT: { label: "Reported holdings count", min: 0, max: 1000000 },
  WEIGHT_COVERED_PCT: {
    label: "Constituent data coverage (%)",
    min: 0,
    max: 100,
  },
} as const;
export type EtfInput = {
  field: keyof typeof etfFields;
  op: "GTE" | "LTE";
  value: number;
  second?: Omit<EtfInput, "second">;
};
export function etfScreenInput(raw: unknown): EtfInput | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (
    Object.keys(r).some(
      (k) => !["field", "op", "value", "second"].includes(k),
    ) ||
    typeof r.field !== "string" ||
    !Object.hasOwn(etfFields, r.field) ||
    !["GTE", "LTE"].includes(String(r.op))
  )
    return null;
  const field = r.field as EtfInput["field"];
  if (
    typeof r.value !== "number" ||
    !Number.isFinite(r.value) ||
    r.value < etfFields[field].min ||
    r.value > etfFields[field].max ||
    (field === "HOLDINGS_COUNT" && !Number.isInteger(r.value))
  )
    return null;
  let second: Omit<EtfInput, "second"> | undefined;
  if (Object.hasOwn(r, "second")) {
    if (
      !r.second ||
      typeof r.second !== "object" ||
      Array.isArray(r.second) ||
      Object.hasOwn(r.second, "second")
    )
      return null;
    const parsed = etfScreenInput(r.second);
    if (!parsed) return null;
    second = parsed;
    if (
      second.field === field &&
      (second.op === r.op ||
        (r.op === "GTE" ? r.value > second.value : second.value > r.value))
    )
      return null;
  }
  return {
    field,
    op: r.op as EtfInput["op"],
    value: r.value,
    ...(second ? { second } : {}),
  };
}
export type EtfRow = {
  ticker: string;
  name: string;
  issuer: string | null;
  assetClass: string | null;
  marketCap: number | null;
  expenseRatio: number | null;
  currentPrice: number | null;
  weightCoveredPct: number | null;
  holdingsCount: number | null;
  partial: boolean | null;
  lastUpdated: number | null;
};
export function etfScreenRows(
  raw: unknown,
  now = Date.now(),
): { matched: number; results: EtfRow[] } | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (
    !Number.isSafeInteger(r.matched) ||
    (r.matched as number) < 0 ||
    !Array.isArray(r.results) ||
    r.results.length > 100 ||
    (r.matched as number) < r.results.length
  )
    return null;
  const seen = new Set<string>();
  const results: EtfRow[] = [];
  for (const rawRow of r.results) {
    if (!rawRow || typeof rawRow !== "object" || Array.isArray(rawRow))
      return null;
    const x = rawRow as Record<string, unknown>;
    if (
      typeof x.ticker !== "string" ||
      !/^[-A-Za-z0-9.^_]{1,24}$/.test(x.ticker)
    )
      return null;
    const ticker = x.ticker.toUpperCase();
    if (seen.has(ticker)) return null;
    seen.add(ticker);
    const num = (v: unknown, max = Number.MAX_SAFE_INTEGER) =>
      typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max
        ? v
        : null;
    const text = (v: unknown) =>
      typeof v === "string" ? v.slice(0, 200) : null;
    results.push({
      ticker,
      name: text(x.name) ?? ticker,
      issuer: text(x.issuer),
      assetClass: text(x.assetClass),
      marketCap: num(x.marketCap),
      expenseRatio: num(x.expenseRatio, 100),
      currentPrice: num(x.currentPrice),
      weightCoveredPct: num(x.weightCoveredPct, 100),
      holdingsCount: Number.isSafeInteger(x.holdingsCount)
        ? num(x.holdingsCount)
        : null,
      partial: typeof x.partial === "boolean" ? x.partial : null,
      lastUpdated:
        typeof x.lastUpdated === "number" &&
        Number.isFinite(x.lastUpdated) &&
        x.lastUpdated > 0 &&
        x.lastUpdated * 1000 <= now
          ? x.lastUpdated
          : null,
    });
  }
  return { matched: r.matched as number, results };
}
