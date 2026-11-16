/** Contract checked 2026-11-16: https://sentisense.ai/docs/api/analyst-ratings/#estimates
 * The documented estimates values are USD, not inferred from the listing.
 * This endpoint does not document an observation timestamp; retrieval is not freshness.
 */
export type SentiSenseEstimate = {
  periodType: "CURRENT_QUARTER" | "NEXT_QUARTER" | "CURRENT_YEAR" | "NEXT_YEAR";
  period: string;
  date: string | null;
  frequency: "annual" | "quarterly";
  currency: "USD";
  eps: number | null;
  epsLow: number | null;
  epsHigh: number | null;
  revenue: number | null;
  revenueLow: number | null;
  revenueHigh: number | null;
  analysts: number | null;
  revenueAnalysts: number | null;
};
export type SentiSenseEstimates = {
  ticker: string;
  asOf: null;
  estimates: SentiSenseEstimate[];
  rejectedRows: number;
};
const record = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
const number = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const count = (v: unknown) =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? v : null;
function date(v: unknown): string | null {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const at = Date.parse(v + "T00:00:00Z");
  return Number.isFinite(at) && new Date(at).toISOString().slice(0, 10) === v
    ? v
    : null;
}
const periods = [
  "CURRENT_QUARTER",
  "NEXT_QUARTER",
  "CURRENT_YEAR",
  "NEXT_YEAR",
] as const;
function range(
  low: unknown,
  mean: unknown,
  high: unknown,
  nonnegative = false,
) {
  const values = [low, mean, high].map(number);
  if (nonnegative && values.some((v) => v !== null && v < 0)) return null;
  const [l, m, h] = values;
  if (
    (l !== null && m !== null && l > m) ||
    (m !== null && h !== null && m > h) ||
    (l !== null && h !== null && l > h)
  )
    return null;
  return { low: l, mean: m, high: h };
}
/** null = unsupported/invalid envelope, not an empty coverage response.
 * Strict ticker identity deliberately rejects primary-share-class redirects.
 * Missing fiscal dates are retained as null and MUST NOT enter a dated model.
 */
export function normalizeSentiSenseEstimates(
  raw: unknown,
  expectedTicker: string,
): SentiSenseEstimates | null {
  const envelope = record(raw),
    data = record(envelope?.data);
  if (
    envelope?.isPreview !== false ||
    !data ||
    typeof data.ticker !== "string" ||
    data.ticker !== expectedTicker.trim().toUpperCase() ||
    !Array.isArray(data.estimates) ||
    data.estimates.length > 4
  )
    return null;
  const output: SentiSenseEstimate[] = [];
  const seen = new Set<string>();
  let rejectedRows = 0;
  for (const value of data.estimates) {
    const row = record(value);
    if (
      !row ||
      !periods.includes(row.periodType as (typeof periods)[number]) ||
      typeof row.periodLabel !== "string"
    ) {
      rejectedRows++;
      continue;
    }
    const type = row.periodType as (typeof periods)[number];
    if (seen.has(type)) return null; // Ambiguous duplicate fiscal observation, not last-write-wins.
    seen.add(type);
    const eps = range(row.estimateLow, row.estimateMean, row.estimateHigh);
    const revenue = range(
      row.revenueLow,
      row.revenueMean,
      row.revenueHigh,
      true,
    );
    if (!eps || !revenue) {
      rejectedRows++;
      continue;
    }
    if (
      [
        eps.low,
        eps.mean,
        eps.high,
        revenue.low,
        revenue.mean,
        revenue.high,
      ].every((v) => v === null)
    ) {
      rejectedRows++;
      continue;
    }
    // The endpoint may return an all-zero book for an untracked symbol.
    // Zero EPS is legitimate when supported by actual contributors.
    if (
      count(row.numberOfAnalysts) === 0 &&
      count(row.numberOfAnalystsRevenue) === 0 &&
      [
        eps.low,
        eps.mean,
        eps.high,
        revenue.low,
        revenue.mean,
        revenue.high,
      ].every((v) => v === null || v === 0)
    ) {
      rejectedRows++;
      continue;
    }
    output.push({
      periodType: type,
      period: row.periodLabel.slice(0, 80),
      date: date(row.fiscalPeriodEnd),
      frequency: type.endsWith("YEAR") ? "annual" : "quarterly",
      currency: "USD",
      eps: eps.mean,
      epsLow: eps.low,
      epsHigh: eps.high,
      revenue: revenue.mean,
      revenueLow: revenue.low,
      revenueHigh: revenue.high,
      analysts: count(row.numberOfAnalysts),
      revenueAnalysts: count(row.numberOfAnalystsRevenue),
    });
  }
  output.sort(
    (a, b) => periods.indexOf(a.periodType) - periods.indexOf(b.periodType),
  );
  return { ticker: data.ticker, asOf: null, estimates: output, rejectedRows };
}
