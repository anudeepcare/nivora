export type InsightMode = "current" | "month";
export function insightRequest(
  symbol: unknown,
  mode: unknown,
  now = Date.now(),
) {
  if (
    typeof symbol !== "string" ||
    !/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol) ||
    !["current", "month"].includes(String(mode)) ||
    !Number.isFinite(now)
  )
    return null;
  const end = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
  const start = new Date(Date.parse(end + "T00:00:00Z") - 29 * 86400000)
    .toISOString()
    .slice(0, 10);
  return {
    symbol,
    mode: mode as InsightMode,
    path: `/stock/${symbol}${mode === "month" ? `/range?startDate=${start}&endDate=${end}` : ""}`,
    start: mode === "month" ? start : null,
    end: mode === "month" ? end : null,
  };
}
export type StockInsight = {
  id: string;
  type: string;
  category: string;
  text: string | null;
  confidence: number | null;
  urgency: string;
  generatedAt: string;
  sources: { url: string; type: string | null }[];
};
export type StockInsightsData = {
  symbol: string;
  preview: boolean;
  previewReason: string | null;
  sampleCompany: boolean;
  total: number | null;
  rows: StockInsight[];
};
const obj = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
const text = (v: unknown, max = 10000): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= max;
export function stockInsights(
  raw: unknown,
  symbol: string,
  now = Date.now(),
): StockInsightsData | null {
  const r = obj(raw);
  if (
    !r ||
    typeof r.isPreview !== "boolean" ||
    !Array.isArray(r.data) ||
    r.data.length > 500 ||
    !insightRequest(symbol, "current", now)
  )
    return null;
  if (
    r.totalCount != null &&
    (typeof r.totalCount !== "number" ||
      !Number.isSafeInteger(r.totalCount) ||
      r.totalCount < r.data.length)
  )
    return null;
  const rows: StockInsight[] = [];
  const ids = new Set<string>();
  for (const value of r.data) {
    const x = obj(value);
    if (
      !x ||
      x.ticker !== symbol ||
      !text(x.insightId, 200) ||
      ids.has(x.insightId) ||
      !text(x.insightType, 100) ||
      ![
        "SENTIMENT",
        "TRENDING",
        "TECHNICAL",
        "FUNDAMENTAL",
        "PERSONALIZED",
      ].includes(String(x.category)) ||
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
    const sources: StockInsight["sources"] = [];
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
    symbol,
    preview: r.isPreview,
    previewReason: text(r.previewReason, 200) ? r.previewReason : null,
    sampleCompany: r.sampleCompany === true,
    total: typeof r.totalCount === "number" ? r.totalCount : null,
    rows,
  };
}
