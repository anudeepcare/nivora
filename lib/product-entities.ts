const obj = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
const text = (v: unknown, max = 300): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= max;
const num = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
export function productQuery(v: unknown) {
  if (typeof v !== "string" || /[\r\n\t@:/\\]/.test(v)) return null;
  const q = v.trim();
  return q.length >= 2 && q.length <= 80 && /^[\p{L}\p{N} .&+'()_-]+$/u.test(q)
    ? q
    : null;
}
export function productHandle(v: unknown) {
  return typeof v === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(v) &&
    !/^kb[-_]/i.test(v) &&
    !["search", "popular"].includes(v.toLowerCase())
    ? v
    : null;
}
export type ProductMatch = { name: string; handle: string };
export function productMatches(raw: unknown): ProductMatch[] | null {
  if (!Array.isArray(raw) || raw.length > 10) return null;
  const rows: ProductMatch[] = [];
  const seen = new Set<string>();
  for (const value of raw) {
    const x = obj(value),
      handle = productHandle(x?.urlSlug);
    if (
      !x ||
      !handle ||
      seen.has(handle) ||
      x.type !== "product" ||
      x.ticker != null ||
      !text(x.name)
    )
      return null;
    seen.add(handle);
    rows.push({ name: x.name, handle });
  }
  return rows;
}
export type ProductRef = {
  name: string;
  handle: string | null;
  type: string;
  ticker: string | null;
  listingCoverage: string | null;
  listing: string | null;
};
export type ProductDetail = {
  handle: string;
  name: string;
  category: string | null;
  description: string | null;
  about: string | null;
  maker: ProductRef | null;
  family: ProductRef | null;
  metrics: {
    score: number | null;
    sentiment: number | null;
    mentions: number | null;
  };
};
function reference(value: unknown): ProductRef | null {
  const x = obj(value);
  if (!x || !text(x.name) || !["COMPANY", "PRODUCT"].includes(String(x.type)))
    return null;
  const coverage = ["public_tracked", "public_untracked", "private"].includes(
    String(x.listingCoverage),
  )
    ? (x.listingCoverage as string)
    : null;
  const ticker =
    x.type === "COMPANY" &&
    coverage === "public_tracked" &&
    typeof x.ticker === "string" &&
    /^[A-Z][A-Z0-9.-]{0,14}$/.test(x.ticker)
      ? x.ticker
      : null;
  return {
    name: x.name,
    handle: productHandle(x.urlSlug),
    type: x.type as string,
    ticker,
    listingCoverage: coverage,
    listing:
      coverage === "public_untracked" && text(x.listing) ? x.listing : null,
  };
}
export function productDetail(
  raw: unknown,
  handle: string,
): ProductDetail | null {
  const r = obj(raw),
    e = obj(r?.entity),
    p = obj(r?.profile),
    m = obj(r?.latestMetrics);
  if (
    !r ||
    r.isPreview === true ||
    !e ||
    !productHandle(handle) ||
    e.urlSlug !== handle ||
    e.type !== "PRODUCT" ||
    !text(e.displayName) ||
    !m
  )
    return null;
  for (const key of ["sentiment", "mentions", "sentisense_score"])
    if (m[key] != null && !num(m[key])) return null;
  if (
    (num(m.sentiment) && (m.sentiment < -1 || m.sentiment > 1)) ||
    (num(m.mentions) && m.mentions < 0)
  )
    return null;
  return {
    handle,
    name: e.displayName,
    category: text(e.category) ? e.category : null,
    description: text(r.description, 5000) ? r.description : null,
    about: text(p?.about, 5000) ? p.about : null,
    maker: reference(p?.maker),
    family: reference(p?.family),
    metrics: {
      score: num(m.sentisense_score) ? m.sentisense_score : null,
      sentiment: num(m.sentiment) ? m.sentiment : null,
      mentions: num(m.mentions) ? m.mentions : null,
    },
  };
}
