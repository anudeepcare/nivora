/** Bounded, documented stock-only screen. No proprietary scores or trade verdicts. */
export const screenerFields = {
  PRICE: { label: "Price (quote units)", min: 0 },
  MARKET_CAP: { label: "Market capitalization (USD)", min: 0 },
  ANALYST_COUNT: { label: "Analysts in rating buckets", min: 0 },
  ANALYST_TARGET_UPSIDE_PCT: { label: "Analyst target upside (%)", min: -100 },
  RETURN_1Y: { label: "One-year price return (%)", min: -100 },
  VOLATILITY_30D: { label: "30-day volatility (%)", min: 0 },
} as const;
export type ScreenField = keyof typeof screenerFields;
export type ScreenInput = {
  field: ScreenField;
  op: "GTE" | "LTE";
  value: number;
};
export function screenInput(value: unknown): ScreenInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const r = value as Record<string, unknown>;
  if (Object.keys(r).some((k) => !["field", "op", "value"].includes(k)))
    return null;
  if (
    typeof r.field !== "string" ||
    !Object.hasOwn(screenerFields, r.field) ||
    !["GTE", "LTE"].includes(String(r.op))
  )
    return null;
  const field = r.field as ScreenField;
  if (
    typeof r.value !== "number" ||
    !Number.isFinite(r.value) ||
    r.value < screenerFields[field].min ||
    r.value > Number.MAX_SAFE_INTEGER
  )
    return null;
  if (field === "ANALYST_COUNT" && !Number.isInteger(r.value)) return null;
  return { field, op: r.op as ScreenInput["op"], value: r.value };
}
export type ScreenRow = {
  ticker: string;
  currentPrice: number | null;
  changePercent: number | null;
  marketCap: number | null;
  analystCount: number | null;
  analystTargetUpsidePct: number | null;
  return1Y: number | null;
  volatility30D: number | null;
  priceAsOf: number | null;
};
const number = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
export function screenRows(
  value: unknown,
  now = Date.now(),
): { matched: number; results: ScreenRow[] } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const r = value as Record<string, unknown>;
  if (
    !Number.isSafeInteger(r.matched) ||
    (r.matched as number) < 0 ||
    !Array.isArray(r.results) ||
    r.results.length > 100 ||
    (r.matched as number) < r.results.length
  )
    return null;
  const seen = new Set<string>();
  const results: ScreenRow[] = [];
  for (const item of r.results) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const row = item as Record<string, unknown>;
    if (
      typeof row.ticker !== "string" ||
      !/^[A-Z][A-Z0-9.-]{0,14}$/.test(row.ticker) ||
      seen.has(row.ticker)
    )
      return null;
    seen.add(row.ticker);
    const price = number(row.currentPrice),
      cap = number(row.marketCap),
      count = number(row.analystCount),
      time = number(row.priceAsOf),
      vol = number(row.volatility30D);
    results.push({
      ticker: row.ticker,
      currentPrice: price !== null && price > 0 ? price : null,
      marketCap: cap !== null && cap >= 0 ? cap : null,
      analystCount:
        count !== null && Number.isSafeInteger(count) && count >= 0
          ? count
          : null,
      changePercent: number(row.changePercent),
      analystTargetUpsidePct: number(row.analystTargetUpsidePct),
      return1Y: number(row.return1Y),
      volatility30D: vol !== null && vol >= 0 ? vol : null,
      priceAsOf:
        time !== null && Number.isSafeInteger(time) && time > 0 && time <= now
          ? time
          : null,
    });
  }
  return { matched: r.matched as number, results };
}
