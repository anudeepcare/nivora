export type MarketEvent = {
  symbol: string;
  date: string;
  kind: string;
  detail: string;
};
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
};
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
  const allowed = new Set(symbols),
    unique = new Map<string, MarketEvent>();
  const collect = (raw: any, split: boolean) => {
    for (const row of Array.isArray(raw) ? raw : []) {
      const symbol = String(row.code ?? "").replace(/\.US$/, ""),
        date = split ? row.split_date : row.report_date;
      if (!allowed.has(symbol) || !day(date) || date < from || date > to)
        continue;
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
      unique.set(`${symbol}:${date}:${kind}`, { symbol, date, kind, detail });
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
