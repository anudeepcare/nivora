export const breakdownMetrics = ["mentions", "sentiment"] as const;
export const breakdownDimensions = ["source", "publisher", "type"] as const;
export type BreakdownMetric = (typeof breakdownMetrics)[number];
export type BreakdownDimension = (typeof breakdownDimensions)[number];
export type BreakdownMode = "distribution" | "slices";
export const breakdownMetric = (x: unknown): x is BreakdownMetric =>
  breakdownMetrics.includes(x as BreakdownMetric);
export const breakdownDimension = (x: unknown): x is BreakdownDimension =>
  breakdownDimensions.includes(x as BreakdownDimension);
const object = (x: unknown): Record<string, unknown> | null =>
  x !== null && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : null;
const text = (x: unknown): x is string =>
  typeof x === "string" && x.length > 0 && x.length <= 200;
export type MetricBreakdown = {
  symbol: string;
  metric: BreakdownMetric;
  dimension: BreakdownDimension;
  mode: BreakdownMode;
  requestedDays: number;
  unit: "SHARE_PERCENT" | "MEAN" | null;
  start: string | null;
  end: string | null;
  computedAt: string | null;
  granularity: string | null;
  partial: boolean;
  totalRows: number;
  rows: { label: string; value: number }[];
  slices: {
    dimension: BreakdownDimension;
    label: string;
    values: string[];
    totalValues: number;
  }[];
};
export function metricBreakdown(
  raw: unknown,
  symbol: string,
  metric: unknown,
  dimension: unknown,
  mode: unknown,
  start: number,
  end: number,
  now = Date.now(),
): MetricBreakdown | null {
  if (
    !/^[A-Z0-9.-]{1,24}$/.test(symbol) ||
    !breakdownMetric(metric) ||
    !breakdownDimension(dimension) ||
    !["distribution", "slices"].includes(String(mode)) ||
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start > end ||
    end > now ||
    ![30, 90].includes((end - start) / 86400000)
  )
    return null;
  const result: MetricBreakdown = {
    symbol,
    metric,
    dimension,
    mode: mode as BreakdownMode,
    requestedDays: (end - start) / 86400000,
    unit: null,
    start: null,
    end: null,
    computedAt: null,
    granularity: null,
    partial: false,
    totalRows: 0,
    rows: [],
    slices: [],
  };
  const subject = (r: Record<string, unknown>) =>
    (r.ticker === undefined || r.ticker === symbol) &&
    (r.symbol === undefined || r.symbol === symbol);
  const match = (r: Record<string, unknown>) =>
    typeof r.metricType === "string" && r.metricType.toLowerCase() === metric;
  if (mode === "slices") {
    if (!Array.isArray(raw) || raw.length > 3) return null;
    const seen = new Set<string>();
    for (const x of raw) {
      const r = object(x);
      if (
        !r ||
        !subject(r) ||
        !match(r) ||
        !breakdownDimension(r.dimension) ||
        seen.has(r.dimension) ||
        !Array.isArray(r.values) ||
        r.values.length > 10000 ||
        !r.values.every(text)
      )
        return null;
      seen.add(r.dimension);
      if (new Set(r.values).size !== r.values.length) return null;
      result.slices.push({
        dimension: r.dimension,
        label: text(r.displayName) ? r.displayName : r.dimension,
        values: r.values.slice(0, 100),
        totalValues: r.values.length,
      });
      if (r.values.length > 100) result.partial = true;
    }
    result.totalRows = result.slices.length;
    return result;
  }
  const r = object(raw),
    values = object(r?.distribution),
    unit = metric === "mentions" ? "SHARE_PERCENT" : "MEAN";
  if (
    !r ||
    !values ||
    !subject(r) ||
    !match(r) ||
    r.dimension !== dimension ||
    r.valueType !== unit
  )
    return null;
  if (r.timestamp != null) {
    if (
      !Number.isSafeInteger(r.timestamp) ||
      Number(r.timestamp) < 0 ||
      Number(r.timestamp) > now
    )
      return null;
    result.computedAt = new Date(Number(r.timestamp)).toISOString();
  }
  const entries = Object.entries(values);
  if (entries.length > 10000) return null;
  for (const [label, value] of entries) {
    if (
      !text(label) ||
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      (unit === "SHARE_PERCENT"
        ? value < 0 || value > 100
        : value < -1 || value > 1)
    )
      return null;
  }
  if (
    unit === "SHARE_PERCENT" &&
    entries.length &&
    Math.abs(entries.reduce((s, [, v]) => s + Number(v), 0) - 100) >
      Math.max(1, entries.length * 0.011)
  )
    return null;
  result.rows = entries
    .slice(0, 100)
    .map(([label, value]) => ({ label, value: Number(value) }));
  result.totalRows = entries.length;
  result.partial = entries.length > 100;
  result.unit = unit;
  result.start = new Date(start).toISOString();
  result.end = new Date(end).toISOString();
  result.granularity = text(r.granularity) ? r.granularity : null;
  return result;
}
