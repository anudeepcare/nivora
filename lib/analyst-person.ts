const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max = 500): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= max;
const count = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const price = (v: unknown) =>
  v === null || (typeof v === "number" && Number.isFinite(v) && v >= 0);
const ticker = (v: unknown): v is string =>
  typeof v === "string" && /^[A-Z][A-Z0-9.-]{0,14}$/.test(v);
const date = (v: unknown, now: number): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v &&
  v <= new Date(now + 86400000).toISOString().slice(0, 10);
const url = (v: unknown) => {
  try {
    if (typeof v !== "string" || v.length > 2000) return null;
    const u = new URL(v);
    return u.protocol === "https:" && !u.username && !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
};
export const analystSlug = (v: unknown): string | null =>
  typeof v === "string" &&
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v) &&
  v.length <= 100
    ? v
    : null;
export function namedAnalysts(raw: unknown) {
  const found = new Map<string, string>();
  if (obj(raw) && Array.isArray(raw.coverage))
    for (const firm of raw.coverage.slice(0, 1000)) {
      if (obj(firm) && Array.isArray(firm.analysts))
        for (const row of firm.analysts.slice(0, 100)) {
          if (obj(row) && analystSlug(row.slug) && text(row.name))
            found.set(row.slug as string, row.name);
        }
    }
  return [...found].slice(0, 200).map(([slug, name]) => ({ slug, name }));
}
export type PersonProfile = {
  slug: string;
  name: string;
  preview: boolean;
  total: number | null;
  first: string;
  last: string;
  firm: string;
  noteCount: number;
  tickerCount: number;
  firms: { firm: string; first: string; last: string; recent: boolean }[];
  coverage: {
    ticker: string;
    notes: number;
    first: string;
    last: string;
    target: number | null;
    firm: string;
  }[];
};
export type PersonCalls = {
  withheldPage: boolean;
  slug: string;
  preview: boolean;
  total: number;
  offset: number;
  rows: {
    date: string;
    ticker: string;
    firm: string;
    target: number | null;
    adjusted: number | null;
    price: number | null;
    title: string;
    publisher: string;
    url: string | null;
  }[];
};
export function personProfile(
  raw: unknown,
  slug: string,
  now = Date.now(),
): PersonProfile | null {
  if (
    !Number.isFinite(now) ||
    !analystSlug(slug) ||
    !obj(raw) ||
    typeof raw.isPreview !== "boolean" ||
    !obj(raw.data)
  )
    return null;
  const d = raw.data;
  if (
    d.slug !== slug ||
    !text(d.name) ||
    d.role !== "sell_side_equity" ||
    !text(d.mostRecentFirm) ||
    !date(d.firstSeen, now) ||
    !date(d.lastSeen, now) ||
    d.firstSeen > d.lastSeen ||
    !count(d.noteCount) ||
    !count(d.tickerCount) ||
    !Array.isArray(d.firms) ||
    d.firms.length > 100 ||
    !Array.isArray(d.coverage) ||
    d.coverage.length > 1000 ||
    !(raw.totalCount == null || count(raw.totalCount))
  )
    return null;
  if (typeof raw.totalCount === "number" && raw.totalCount < d.coverage.length)
    return null;
  const firms: PersonProfile["firms"] = [],
    coverage: PersonProfile["coverage"] = [];
  for (const f of d.firms) {
    if (
      !obj(f) ||
      !text(f.firm) ||
      !date(f.firstSeen, now) ||
      !date(f.lastSeen, now) ||
      f.firstSeen > f.lastSeen ||
      typeof f.mostRecent !== "boolean"
    )
      return null;
    firms.push({
      firm: f.firm,
      first: f.firstSeen,
      last: f.lastSeen,
      recent: f.mostRecent,
    });
  }
  for (const c of d.coverage) {
    if (
      !obj(c) ||
      !ticker(c.ticker) ||
      !count(c.noteCount) ||
      !date(c.firstNote, now) ||
      !date(c.lastNote, now) ||
      c.firstNote > c.lastNote ||
      !price(c.latestPriceTarget) ||
      !text(c.latestFirm)
    )
      return null;
    coverage.push({
      ticker: c.ticker,
      notes: c.noteCount,
      first: c.firstNote,
      last: c.lastNote,
      target: c.latestPriceTarget as number | null,
      firm: c.latestFirm,
    });
  }
  return {
    slug,
    name: d.name,
    preview: raw.isPreview,
    total: typeof raw.totalCount === "number" ? raw.totalCount : null,
    first: d.firstSeen,
    last: d.lastSeen,
    firm: d.mostRecentFirm,
    noteCount: d.noteCount,
    tickerCount: d.tickerCount,
    firms,
    coverage,
  };
}
export function personCalls(
  raw: unknown,
  slug: string,
  offset: number,
  now = Date.now(),
): PersonCalls | null {
  if (
    !Number.isFinite(now) ||
    !analystSlug(slug) ||
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    offset > 10000 ||
    offset % 25 !== 0 ||
    !obj(raw) ||
    typeof raw.isPreview !== "boolean" ||
    !count(raw.totalCount) ||
    !Array.isArray(raw.data) ||
    raw.data.length > 25
  )
    return null;
  if (
    raw.data.length > raw.totalCount ||
    (!raw.isPreview &&
      raw.data.length > 0 &&
      offset + raw.data.length > raw.totalCount)
  )
    return null;
  const rows: PersonCalls["rows"] = [];
  for (const c of raw.data) {
    if (
      !obj(c) ||
      !date(c.publishedDate, now) ||
      !ticker(c.ticker) ||
      !text(c.firm) ||
      ![c.priceTarget, c.adjPriceTarget, c.priceWhenPosted].every(price) ||
      !text(c.newsTitle, 2000) ||
      !text(c.newsPublisher) ||
      (rows.length && c.publishedDate > rows.at(-1)!.date)
    )
      return null;
    rows.push({
      date: c.publishedDate,
      ticker: c.ticker,
      firm: c.firm,
      target: c.priceTarget as number | null,
      adjusted: c.adjPriceTarget as number | null,
      price: c.priceWhenPosted as number | null,
      title: c.newsTitle,
      publisher: c.newsPublisher,
      url: url(c.newsUrl),
    });
  }
  return {
    slug,
    preview: raw.isPreview,
    total: raw.totalCount,
    offset,
    rows: raw.isPreview && offset > 0 ? [] : rows,
    withheldPage: raw.isPreview && offset > 0,
  };
}
