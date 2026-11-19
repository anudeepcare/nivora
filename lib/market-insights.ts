export type MarketInsight = {
  id: string;
  ticker: string | null;
  type: string;
  category: string;
  text: string | null;
  confidence: number | null;
  urgency: string;
  generatedAt: string;
  sources: { url: string; type: string | null }[];
};
export type MarketInsightsData = {
  kind: "market" | "latest";
  preview: boolean;
  previewReason: string | null;
  total: number | null;
  rows: MarketInsight[];
};
const obj = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
const text = (v: unknown, max = 10000): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= max;
export function marketInsights(
  raw: unknown,
  kind: "market" | "latest",
  now = Date.now(),
): MarketInsightsData | null {
  const r = obj(raw);
  if (
    !r ||
    typeof r.isPreview !== "boolean" ||
    !Array.isArray(r.data) ||
    r.data.length > (kind === "latest" ? 50 : 500) ||
    !["market", "latest"].includes(kind) ||
    !Number.isFinite(now)
  )
    return null;
  if (
    r.totalCount != null &&
    (typeof r.totalCount !== "number" ||
      !Number.isSafeInteger(r.totalCount) ||
      r.totalCount < r.data.length)
  )
    return null;
  const rows: MarketInsight[] = [];
  const ids = new Set<string>();
  for (const value of r.data) {
    const x = obj(value);
    if (
      !x ||
      (x.ticker != null &&
        (typeof x.ticker !== "string" ||
          !/^[A-Z][A-Z0-9.-]{0,14}$/.test(x.ticker))) ||
      !text(x.insightId, 200) ||
      ids.has(x.insightId) ||
      !text(x.insightType, 100) ||
      !["SENTIMENT", "TRENDING", "TECHNICAL", "FUNDAMENTAL"].includes(
        String(x.category),
      ) ||
      !["low", "medium", "high"].includes(String(x.urgency)) ||
      typeof x.generatedAt !== "number" ||
      !Number.isSafeInteger(x.generatedAt) ||
      x.generatedAt <= 0 ||
      x.generatedAt * 1000 > now
    )
      return null;
    if (
      x.confidence != null &&
      (typeof x.confidence !== "number" ||
        !Number.isFinite(x.confidence) ||
        x.confidence < 0 ||
        x.confidence > 1)
    )
      return null;
    if (x.insightText != null && !text(x.insightText)) return null;
    if (!r.isPreview && !text(x.insightText)) return null;
    if (
      x.docRefs != null &&
      (!Array.isArray(x.docRefs) || x.docRefs.length > 50)
    )
      return null;
    const sources: MarketInsight["sources"] = [];
    for (const source of (x.docRefs ?? []) as unknown[]) {
      const s = obj(source);
      if (!s || !text(s.url, 2048)) continue;
      try {
        const u = new URL(s.url);
        if (u.protocol === "https:" && !u.username && !u.password)
          sources.push({
            url: u.href,
            type: text(s.type, 100) ? s.type : null,
          });
      } catch {}
    }
    ids.add(x.insightId);
    rows.push({
      id: x.insightId,
      ticker: typeof x.ticker === "string" ? x.ticker : null,
      type: x.insightType,
      category: x.category as string,
      text: text(x.insightText) ? x.insightText : null,
      confidence: typeof x.confidence === "number" ? x.confidence : null,
      urgency: x.urgency as string,
      generatedAt: new Date(x.generatedAt * 1000).toISOString(),
      sources,
    });
  }
  return {
    kind,
    preview: r.isPreview,
    previewReason: text(r.previewReason, 200) ? r.previewReason : null,
    total: typeof r.totalCount === "number" ? r.totalCount : null,
    rows,
  };
}
