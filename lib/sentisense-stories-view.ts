/** Display only documented story authorship, source links and timestamp semantics. */
const object = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const text = (v: unknown) =>
  typeof v === "string" && v.trim() ? v.trim() : null;
const rows = (v: unknown) => (Array.isArray(v) ? v : []);
const number = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
function time(v: unknown, multiplier: number) {
  const n = number(v);
  if (n === null || n <= 0 || n * multiplier >= 8.64e15) return null;
  return new Date(n * multiplier).toISOString();
}
export function safeCitation(value: unknown): string | null {
  try {
    const u = new URL(String(value));
    return ["https:", "http:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
/** Keep authored words but do not load remote images or render raw HTML/markdown. */
function prose(value: unknown) {
  return (
    text(value)
      ?.replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .trim() || null
  );
}
export function storyListView(value: unknown) {
  return rows(value).flatMap((v) => {
    const x = object(v),
      c = object(x.cluster),
      id = text(x.id);
    if (!id || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) return [];
    return [
      {
        id,
        title: text(c.title) ?? "Untitled provider story",
        authorship:
          c.storySource === "ORIGINAL"
            ? "SentiSense editorial story"
            : "AI-written story",
        brokeAt: time(x.brokeAt, 1000),
        assembledAt: time(c.clusteredAt, 1000),
        articleCount: number(c.clusterSize),
        developing: c.isLive === true,
        tickers: rows(x.tickers).filter(
          (t): t is string =>
            typeof t === "string" && /^[A-Z][A-Z0-9.-]{0,14}$/.test(t),
        ),
      },
    ];
  });
}
export function storyDetailView(value: unknown) {
  const x = object(value);
  return {
    title: text(x.title) ?? "Provider story",
    authorship:
      x.storySource === "ORIGINAL"
        ? "SentiSense editorial story"
        : "AI-written story",
    summary: prose(x.summarizedContent),
    narrative: prose(x.narrativeBody),
    bullish: prose(x.bullishView),
    bearish: prose(x.bearishView),
    archived: x.archived === true,
    citations: Object.entries(object(x.citationLinks)).flatMap(([key, url]) => {
      const href = safeCitation(url);
      return /^doc\d+$/.test(key) && href
        ? [{ key, href, publisher: new URL(href).hostname }]
        : [];
    }),
    timeline: rows(x.timeline)
      .map((v) => {
        const r = object(v);
        return {
          date: time(r.publishedAt, 1),
          type: text(r.updateType) ?? "UPDATE",
          content: prose(r.content),
        };
      })
      .filter((x) => x.content)
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")),
  };
}
