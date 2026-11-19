export const appMetrics = {
  app_review_count: "New written reviews",
  app_rating: "Written reviews · mean stars",
  app_all_ratings_count: "New ratings · allocated daily count",
  app_all_ratings_avg: "All new ratings · mean stars",
} as const;
export type AppMetric = keyof typeof appMetrics;
export function appMetric(v: unknown): AppMetric | null {
  return typeof v === "string" && Object.hasOwn(appMetrics, v)
    ? (v as AppMetric)
    : null;
}
export type AppHistory = {
  handle: string;
  metric: AppMetric;
  days: number;
  start: number;
  end: number;
  points: { timestamp: number; value: number | null }[];
};
export function appHistory(
  raw: unknown,
  handle: string,
  metric: unknown,
  days: number,
  start: number,
  end: number,
): AppHistory | null {
  const kind = appMetric(metric);
  if (
    !kind ||
    ![30, 90].includes(days) ||
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    end - start !== days * 86400000 ||
    !Array.isArray(raw) ||
    raw.length > 92
  )
    return null;
  const points: AppHistory["points"] = [];
  let previous = -Infinity;
  const dates = new Set<string>();
  for (const row of raw) {
    if (
      !row ||
      typeof row !== "object" ||
      Array.isArray(row) ||
      !Number.isSafeInteger(row.timestamp) ||
      row.timestamp < start ||
      row.timestamp > end ||
      row.timestamp <= previous ||
      row.metricType !== kind.toUpperCase() ||
      ["urlSlug", "symbol", "ticker"].some(
        (key) => row[key] !== undefined && row[key] !== handle,
      )
    )
      return null;
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(row.timestamp));
    if (dates.has(day)) return null;
    dates.add(day);
    const n = row.value;
    if (
      n != null &&
      (typeof n !== "number" ||
        !Number.isFinite(n) ||
        n < 0 ||
        (kind === "app_review_count" && !Number.isSafeInteger(n)) ||
        ((kind === "app_rating" || kind === "app_all_ratings_avg") &&
          (n < 1 || n > 5)))
    )
      return null;
    points.push({ timestamp: row.timestamp, value: n == null ? null : n });
    previous = row.timestamp;
  }
  return { handle, metric: kind, days, start, end, points };
}
