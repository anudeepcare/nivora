/** Explicit public-topic searches only; never add private user context. */
export type SearchRequest = {
  query: string;
  kind: "stories" | "links";
  days: 7 | 14;
};
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max = 300) =>
  typeof v === "string" &&
  v.trim() &&
  v.length <= max &&
  !/[\u0000-\u001f\u007f]/.test(v)
    ? v.trim()
    : null;
export function searchRequest(v: unknown): SearchRequest | null {
  if (
    !object(v) ||
    Object.keys(v).some((k) => !["query", "kind", "days"].includes(k))
  )
    return null;
  const query = text(v.query, 240);
  return query &&
    query.length >= 2 &&
    (v.kind === "stories" || v.kind === "links") &&
    (v.days === 7 || v.days === 14)
    ? { query, kind: v.kind, days: v.days }
    : null;
}
const date = (v: unknown) =>
  typeof v === "number" &&
  Number.isSafeInteger(v) &&
  v > 0 &&
  v <= Date.now() / 1000
    ? new Date(v * 1000).toISOString()
    : null;
function safeLink(v: unknown) {
  try {
    if (typeof v !== "string" || v.length > 2000) return null;
    const u = new URL(v);
    return u.protocol === "https:" && !u.username && !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
export type SearchRow = {
  id: string;
  title: string;
  source: string;
  url: string | null;
  published: string | null;
  assembledAt: string | null;
  tickers: string[];
};
export function projectSearch(raw: unknown, request: SearchRequest) {
  if (!searchRequest(request)) return null;
  const wrapper = object(raw) && "isPreview" in raw;
  if (wrapper && typeof raw.isPreview !== "boolean") return null;
  const data = wrapper ? raw.data : raw;
  const rows: SearchRow[] = [];
  const ids = new Set<string>();
  const items =
    request.kind === "stories" ? data : object(data) ? data.documents : null;
  if (!Array.isArray(items) || items.length > 20) return null;
  if (
    request.kind === "links" &&
    (!object(data) ||
      !Number.isSafeInteger(data.totalCount) ||
      Number(data.totalCount) < items.length)
  )
    return null;
  for (const item of items) {
    if (!object(item)) return null;
    const id = text(item.id, 128);
    if (!id || ids.has(id)) return null;
    ids.add(id);
    if (request.kind === "stories") {
      const c = item.cluster;
      if (
        !object(c) ||
        !text(c.title, 2000) ||
        !["AI", "ORIGINAL"].includes(String(c.storySource)) ||
        !Array.isArray(item.tickers) ||
        item.tickers.length > 100 ||
        item.tickers.some(
          (t) => typeof t !== "string" || !/^[A-Z][A-Z0-9.-]{0,14}$/.test(t),
        )
      )
        return null;
      rows.push({
        id,
        title: text(c.title, 2000)!,
        source: c.storySource === "AI" ? "AI-written story" : "Editorial story",
        url: null,
        published: date(item.brokeAt),
        assembledAt: date(c.clusteredAt),
        tickers: item.tickers,
      });
    } else {
      if (
        !["NEWS", "REDDIT", "X", "SUBSTACK", "YOUTUBE"].includes(
          String(item.source),
        )
      )
        return null;
      rows.push({
        id,
        title: text(item.sourceName) || String(item.source),
        source: String(item.source),
        url: safeLink(item.url),
        published: date(item.published),
        assembledAt: null,
        tickers: [],
      });
    }
  }
  return {
    request,
    rows,
    preview: wrapper && raw.isPreview === true,
    previewReason: wrapper ? text(raw.previewReason) : null,
    receivedAt: new Date().toISOString(),
  };
}
export type SearchResult = NonNullable<ReturnType<typeof projectSearch>>;
