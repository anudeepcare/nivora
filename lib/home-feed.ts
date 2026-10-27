import { providerIdentity } from "./provider-symbol.ts";

export type MarketEvent = {
  symbol: string;
  date: string;
  kind: string;
  detail: string;
  actual?: number | null;
  estimate?: number | null;
};
/** US corporate report dates use the exchange day, including after UTC midnight. */
export function marketDay(asOf: string | number | Date = Date.now()) {
  const date = new Date(asOf);
  if (
    typeof asOf === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(asOf) &&
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === asOf
  )
    return asOf;
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date)
    : "";
}
export function earningsEventState(
  event: Pick<MarketEvent, "date" | "actual">,
  today: string,
) {
  if (
    event.date <= today &&
    typeof event.actual === "number" &&
    Number.isFinite(event.actual)
  )
    return { status: "reported" as const, label: "Results reported" };
  if (event.date === today)
    return { status: "today" as const, label: "Scheduled today" };
  if (event.date > today)
    return { status: "upcoming" as const, label: "Upcoming" };
  return { status: "unconfirmed" as const, label: "Release unconfirmed" };
}
export type MarketHeadline = {
  symbol: string;
  date: string;
  title: string;
  url: string;
};
export type HomeFeed = {
  events: MarketEvent[];
  news: MarketHeadline[];
  issues: string[];
  retrievedAt: string;
  followed: number;
  newsFollowed: number;
  eventsReady?: boolean;
  newsReady?: boolean;
};

/** Separate source health, including cached responses from before explicit flags. */
export function homeFeedReadiness(
  feed: Pick<HomeFeed, "issues" | "eventsReady" | "newsReady">,
) {
  const unknown = feed.issues.some(
    (issue) => !/news|scheduled events|company events/i.test(issue),
  );
  return {
    eventsReady:
      feed.eventsReady ??
      (!unknown && !feed.issues.some((issue) => /events/i.test(issue))),
    newsReady:
      feed.newsReady ??
      (!unknown && !feed.issues.some((issue) => /news/i.test(issue))),
  };
}

/** One API batch at a time: a large watchlist must not launch a burst of requests. */
export async function loadHomeFeed(
  symbols: string[],
  read: (batch: string[]) => Promise<HomeFeed>,
): Promise<HomeFeed> {
  const stocks = [
    ...new Set(
      symbols.filter((symbol) => /^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol)),
    ),
  ];
  const result: HomeFeed = {
    events: [],
    news: [],
    issues: [],
    retrievedAt: "",
    followed: 0,
    newsFollowed: 0,
    eventsReady: true,
    newsReady: true,
  };
  for (let offset = 0; offset < stocks.length; offset += 30) {
    const batch = stocks.slice(offset, offset + 30);
    try {
      const data = await read(batch),
        ready = homeFeedReadiness(data);
      result.events.push(...data.events);
      result.news.push(...data.news);
      result.issues.push(...data.issues);
      result.followed += data.followed;
      result.newsFollowed += data.newsFollowed;
      result.eventsReady &&= ready.eventsReady;
      result.newsReady &&= ready.newsReady;
      if (
        data.retrievedAt &&
        (!result.retrievedAt || data.retrievedAt < result.retrievedAt)
      )
        result.retrievedAt = data.retrievedAt;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      result.eventsReady = false;
      result.newsReady = false;
      result.issues.push(
        `Updates for ${batch.length} followed compan${batch.length === 1 ? "y" : "ies"} could not be checked.`,
      );
    }
  }
  result.issues = [...new Set(result.issues)];
  result.events = [
    ...new Map(
      result.events.map((event) => [
        `${event.symbol}:${event.date}:${event.kind}`,
        event,
      ]),
    ).values(),
  ];
  result.news = [
    ...new Map(result.news.map((news) => [news.url, news])).values(),
  ];
  return result;
}

/** Bound provider fan-out while preserving order and independent failures. */
export async function settledFeedMap<T, R>(
  values: T[],
  read: (value: T) => Promise<R>,
  concurrency = 4,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(values.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < values.length) {
      const index = cursor++;
      try {
        results[index] = {
          status: "fulfilled",
          value: await read(values[index]),
        };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  };
  await Promise.all(
    Array.from(
      {
        length: Math.min(
          values.length,
          Math.max(1, Math.floor(concurrency) || 1),
        ),
      },
      worker,
    ),
  );
  return results;
}

/** A date owns all of its events; never collapse same-day earnings to one ticker. */
export function groupMarketEvents(events: MarketEvent[]) {
  const groups = new Map<string, MarketEvent[]>();
  for (const event of events)
    groups.set(event.date, [...(groups.get(event.date) ?? []), event]);
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rows]) => ({ date, events: rows }));
}
/** Headline identity filter, not a claim that a publisher's story is material. */
export function relevantHoldingHeadlines(
  rows: MarketHeadline[],
  names: Record<string, string>,
  exposure: Map<string, number>,
) {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const generic = new Set([
    "the",
    "inc",
    "incorporated",
    "corp",
    "corporation",
    "company",
    "co",
    "ltd",
    "limited",
    "plc",
    "se",
    "adr",
    "class",
    "common",
    "stock",
    "shares",
    "holdings",
    "holding",
  ]);
  const ambiguous = new Set([
    "advanced",
    "first",
    "american",
    "global",
    "national",
    "international",
    "united",
    "new",
    "financial",
    "energy",
    "health",
  ]);
  const sorted = rows
    .filter((row) => {
      const words = normalize(names[row.symbol] ?? "")
        .split(" ")
        .filter((w) => w && !generic.has(w));
      const title = ` ${normalize(row.title)} `;
      const symbol = row.symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const explicitTicker = new RegExp(
        `(?:\\$${symbol}\\b|\\(${symbol}\\))`,
      ).test(row.title);
      return (
        explicitTicker ||
        (words.length > 0 &&
          (title.includes(` ${words.join(" ")} `) ||
            (!ambiguous.has(words[0]) && title.includes(` ${words[0]} `))))
      );
    })
    .sort(
      (a, b) =>
        (exposure.get(b.symbol) ?? 0) - (exposure.get(a.symbol) ?? 0) ||
        b.date.localeCompare(a.date),
    );
  const seen = new Set<string>(),
    first: MarketHeadline[] = [],
    rest: MarketHeadline[] = [];
  for (const row of sorted) {
    if (seen.has(row.symbol)) rest.push(row);
    else {
      seen.add(row.symbol);
      first.push(row);
    }
  }
  return [...first, ...rest];
}
const day = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
export function calendarHighlights(
  earnings: any,
  splits: any,
  symbols: string[],
  from: string,
  to: string,
): MarketEvent[] {
  const allowed = new Map(
      symbols.map((symbol) => [providerIdentity(symbol), symbol]),
    ),
    unique = new Map<string, MarketEvent>();
  const collect = (raw: any, split: boolean) => {
    for (const row of Array.isArray(raw) ? raw : []) {
      const code = String(row.code ?? "")
          .trim()
          .toUpperCase()
          .replace(/\.US$/, ""),
        symbol = allowed.get(providerIdentity(code)),
        date = split ? row.split_date : row.report_date;
      if (!symbol || !day(date) || date < from || date > to) continue;
      if (
        split &&
        (![row.old_shares, row.new_shares].every(
          (v) => typeof v === "number" && Number.isFinite(v) && v > 0,
        ) ||
          row.old_shares === row.new_shares)
      )
        continue;
      const kind = split
        ? row.new_shares < row.old_shares
          ? "Reverse split"
          : "Stock split"
        : "Earnings";
      const detail = split
        ? `${row.new_shares} for ${row.old_shares} shares`
        : row.before_after_market === "BeforeMarket"
          ? "Before market open"
          : row.before_after_market === "AfterMarket"
            ? "After market close"
            : "Time not confirmed";
      const numeric = (v: unknown) =>
        (typeof v === "number" || (typeof v === "string" && v.trim() !== "")) &&
        Number.isFinite(Number(v))
          ? Number(v)
          : null;
      const key = `${symbol}:${date}:${kind}`;
      const event: MarketEvent = {
        symbol,
        date,
        kind,
        detail,
        ...(!split
          ? { actual: numeric(row.actual), estimate: numeric(row.estimate) }
          : {}),
      };
      // A duplicate schedule row must not erase an actual already supplied in this response.
      if (event.actual != null || unique.get(key)?.actual == null)
        unique.set(key, event);
    }
  };
  collect(earnings?.earnings, false);
  collect(splits?.splits, true);
  return [...unique.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.symbol.localeCompare(b.symbol),
  );
}
export function newsHighlights(
  groups: {
    symbol: string;
    items: { date: string; title: string; url: string }[];
  }[],
  asOf: string,
): MarketHeadline[] {
  const now = Date.parse(asOf),
    unique = new Map<string, MarketHeadline>();
  for (const group of groups)
    for (const row of group.items) {
      const at = Date.parse(row.date);
      if (
        !Number.isFinite(at) ||
        at > now ||
        now - at > 7 * 86400000 ||
        !row.title.trim()
      )
        continue;
      try {
        const url = new URL(row.url);
        if (
          url.protocol !== "https:" ||
          url.username ||
          url.password ||
          unique.has(url.href)
        )
          continue;
        unique.set(url.href, {
          symbol: group.symbol,
          date: row.date,
          title: row.title
            .replace(
              /&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt);/gi,
              (entity, key: string) => {
                const names: Record<string, string> = {
                  amp: "&",
                  quot: '"',
                  apos: "'",
                  lt: "<",
                  gt: ">",
                };
                if (!key.startsWith("#"))
                  return names[key.toLowerCase()] ?? entity;
                const n =
                  key[1].toLowerCase() === "x"
                    ? parseInt(key.slice(2), 16)
                    : parseInt(key.slice(1), 10);
                return n > 0 && n <= 0x10ffff
                  ? String.fromCodePoint(n)
                  : entity;
              },
            )
            .slice(0, 400),
          url: url.href,
        });
      } catch {
        /* Unusable publisher links are not rendered. */
      }
    }
  const sorted = [...unique.values()].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const seen = new Set<string>();
  const first: MarketHeadline[] = [],
    rest: MarketHeadline[] = [];
  for (const row of sorted) {
    if (seen.has(row.symbol)) rest.push(row);
    else {
      seen.add(row.symbol);
      first.push(row);
    }
  }
  return [...first, ...rest].slice(0, 90);
}
