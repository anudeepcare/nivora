export type MarketSummary = {
  headline: string | null;
  expandedContent: string | null;
  generatedAt: string | null;
  servedAt: string;
  receivedAt: string;
};
export function marketSummary(
  raw: unknown,
  now = Date.now(),
): MarketSummary | null {
  if (
    !raw ||
    typeof raw !== "object" ||
    Array.isArray(raw) ||
    !Number.isFinite(now)
  )
    return null;
  const r = raw as Record<string, unknown>;
  if (
    typeof r.lastUpdated !== "number" ||
    !Number.isFinite(r.lastUpdated) ||
    r.lastUpdated <= 0 ||
    r.lastUpdated > now + 60000
  )
    return null;
  for (const [key, max] of [
    ["headline", 4000],
    ["expandedContent", 100000],
  ] as const)
    if (
      r[key] !== null &&
      (typeof r[key] !== "string" || (r[key] as string).length > max)
    )
      return null;
  if (
    r.generatedAt !== null &&
    (typeof r.generatedAt !== "number" ||
      !Number.isFinite(r.generatedAt) ||
      r.generatedAt <= 0 ||
      r.generatedAt * 1000 > Math.min(now + 60000, r.lastUpdated + 60000))
  )
    return null;
  return {
    headline: typeof r.headline === "string" ? r.headline.trim() || null : null,
    expandedContent:
      typeof r.expandedContent === "string"
        ? r.expandedContent.trim() || null
        : null,
    generatedAt:
      typeof r.generatedAt === "number"
        ? new Date(r.generatedAt * 1000).toISOString()
        : null,
    servedAt: new Date(r.lastUpdated).toISOString(),
    receivedAt: new Date(now).toISOString(),
  };
}
