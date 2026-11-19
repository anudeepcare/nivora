export const entityMetrics = {
  mentions: { label: "Mentions", enum: "MENTIONS", unit: "mentions" },
  sentiment: {
    label: "Sentiment polarity",
    enum: "SENTIMENT",
    unit: "−1 to +1",
  },
  sentisense: {
    label: "Composite score",
    enum: "SENTISENSE_SCORE",
    unit: "unbounded score",
  },
  social_dominance: {
    label: "Social share of voice",
    enum: "SOCIAL_DOMINANCE",
    unit: "fraction",
  },
} as const;
export type EntityMetric = keyof typeof entityMetrics;
export const entityMetric = (x: unknown): EntityMetric | null =>
  typeof x === "string" && Object.hasOwn(entityMetrics, x)
    ? (x as EntityMetric)
    : null;
const object = (x: unknown): Record<string, unknown> | null =>
  x !== null && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : null;
const finite = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x);
const count = (x: unknown): x is number =>
  finite(x) && Number.isSafeInteger(x) && x >= 0;
export function metricHistory(
  raw: unknown,
  symbol: string,
  metric: unknown,
  days: number,
  start: number,
  end: number,
) {
  const kind = entityMetric(metric);
  if (
    !kind ||
    ![30, 90].includes(days) ||
    !/^[A-Z0-9.-]{1,24}$/.test(symbol) ||
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    end - start !== days * 86400000 ||
    !Array.isArray(raw) ||
    raw.length > 90
  )
    return null;
  const seen = new Set<number>();
  const points = [];
  for (const value of raw) {
    const r = object(value);
    if (
      !r ||
      !Number.isSafeInteger(r.timestamp) ||
      Number(r.timestamp) < start ||
      Number(r.timestamp) > end ||
      seen.has(Number(r.timestamp)) ||
      r.metricType !== entityMetrics[kind].enum ||
      (r.ticker !== undefined && r.ticker !== symbol) ||
      (r.symbol !== undefined && r.symbol !== symbol)
    )
      return null;
    const timestamp = Number(r.timestamp);
    seen.add(timestamp);
    let n = finite(r.value) ? r.value : null;
    if (
      n !== null &&
      ((kind === "mentions" && !count(n)) ||
        (kind === "sentiment" && (n < -1 || n > 1)) ||
        (kind === "social_dominance" && (n < 0 || n > 1)))
    )
      n = null;
    const properties = object(object(r.metricValue)?.properties);
    let bull: number | null = null,
      bear: number | null = null,
      directional: number | null = null;
    if (
      kind === "sentisense" &&
      properties &&
      count(properties.bull) &&
      count(properties.bear) &&
      count(properties.directional) &&
      properties.bull + properties.bear === properties.directional
    ) {
      bull = properties.bull;
      bear = properties.bear;
      directional = properties.directional;
    }
    points.push({
      timestamp,
      at: new Date(timestamp).toISOString(),
      value: n,
      bull,
      bear,
      directional,
    });
  }
  points.sort((a, b) => a.timestamp - b.timestamp);
  return {
    symbol,
    metric: kind,
    days,
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
    points,
    identityBasis: "requested-stock-endpoint" as const,
  };
}
export type EntityMetricHistory = NonNullable<ReturnType<typeof metricHistory>>;
