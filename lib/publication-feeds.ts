export const publicationSources = [
  "NEWS",
  "REDDIT",
  "X",
  "SUBSTACK",
  "YOUTUBE",
] as const;
export type PublicationSource = (typeof publicationSources)[number];
export function publicationSource(v: unknown): PublicationSource | null {
  return typeof v === "string" &&
    (publicationSources as readonly string[]).includes(v)
    ? (v as PublicationSource)
    : null;
}
const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const label = (v: unknown, max = 250) =>
  typeof v === "string" && v.length <= max
    ? v.replace(/[\u0000-\u001f\u007f]/g, "").trim()
    : null;
function url(v: unknown) {
  try {
    if (typeof v !== "string" || v.length > 2000) return null;
    const u = new URL(v);
    return ["https:", "http:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
export function projectPublications(
  raw: unknown,
  symbol: string,
  source: PublicationSource,
) {
  if (!obj(raw)) return null;
  const wrapped = "isPreview" in raw;
  if (wrapped && typeof raw.isPreview !== "boolean") return null;
  const data = wrapped ? raw.data : raw;
  if (
    !obj(data) ||
    data.searchTicker !== symbol ||
    data.source !== source ||
    !Array.isArray(data.documents) ||
    data.documents.length > 200 ||
    !Number.isSafeInteger(data.totalCount) ||
    Number(data.totalCount) < data.documents.length
  )
    return null;
  const rows = [];
  const ids = new Set<string>();
  for (const item of data.documents) {
    if (
      !obj(item) ||
      item.source !== source ||
      typeof item.id !== "string" ||
      !item.id ||
      item.id.length > 200 ||
      ids.has(item.id)
    )
      return null;
    ids.add(item.id);
    const published =
      typeof item.published === "number" &&
      Number.isInteger(item.published) &&
      item.published > 0 &&
      item.published <= Date.now() / 1000
        ? new Date(item.published * 1000).toISOString()
        : null;
    rows.push({
      id: item.id,
      source,
      publisher: label(item.sourceName),
      url: url(item.url),
      published,
    });
  }
  return {
    symbol,
    source,
    preview: wrapped && raw.isPreview === true,
    previewReason: wrapped ? label(raw.previewReason) : null,
    totalCount: Number(data.totalCount),
    rows,
  };
}
export type PublicationFeed = NonNullable<
  ReturnType<typeof projectPublications>
>;
