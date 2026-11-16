import type { Candle, Company, Quote } from "./types";
import { providerSymbol, sameProviderSymbol } from "./provider-symbol.ts";

/** Verified against https://sentisense.ai/docs/api/stocks/ on 2026-11-16.
 * Normalizers are intentionally independent of secrets/transport for contract tests. */
export type SentiSenseMarketRequest = (
  path: string,
  params?: Record<string, string>,
) => Promise<unknown>;
export type SentiSenseChartRange =
  | "1D"
  | "1W"
  | "1M"
  | "3M"
  | "6M"
  | "1Y"
  | "5Y"
  | "10Y"
  | "MAX";
export type SentiSenseHistory = {
  candles: Candle[];
  source: string;
  granularity:
    | "5-minute"
    | "30-minute"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly";
  adjustment: "split-adjusted" | "split-and-dividend-adjusted";
  range: SentiSenseChartRange;
};
function fail(message: string, status = 502): never {
  throw Object.assign(new Error(message), { status });
}
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const number = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";
export function sentiSenseMarketSymbol(input: string): string {
  const symbol = providerSymbol(input);
  if (symbol.includes("/"))
    fail("This data source does not cover crypto pairs.", 422);
  return symbol;
}
const timestamp = (value: unknown, now: number, earliest = 946684800000) => {
  const n = number(value);
  return n !== null &&
    Number.isSafeInteger(n) &&
    n >= earliest &&
    n <= now + 60000
    ? n
    : null;
};
const venues: Record<string, string> = {
  XNAS: "NASDAQ",
  XNYS: "NYSE",
  ARCX: "NYSE ARCA",
  XASE: "NYSE AMERICAN",
  BATS: "BATS",
};
export function normalizeSentiSenseCompany(
  raw: unknown,
  symbol: string,
): Company {
  const p = record(raw);
  if (!sameProviderSymbol(p.ticker, symbol))
    fail("The company response belongs to another security.");
  if (text(p.currency).toUpperCase() !== "USD" || p.country !== "United States")
    fail("The source did not confirm a supported US/USD listing.", 422);
  const exchange = text(p.primaryExchange);
  // Official profile docs: ETFs may expose a named etfExchange instead of MIC.
  // Never infer a venue from issuer/name, and never accept an arbitrary fallback.
  const etfVenues: Record<string, string> = {
    NASDAQ: "NASDAQ",
    NYSE: "NYSE",
    "NYSE ARCA": "NYSE ARCA",
    "CBOE BZX": "CBOE",
    "NYSE AMERICAN": "NYSE AMERICAN",
  };
  const venue = exchange
    ? venues[exchange]
    : p.kind === "ETF"
      ? etfVenues[text(p.etfExchange).toUpperCase()]
      : undefined;
  if (!venue)
    fail("The source did not confirm a supported US listing venue.", 422);
  return {
    symbol,
    name: text(p.name) || symbol,
    exchange: venue,
    currency: "USD",
    assetType: "stock",
    ...(text(p.description) ? { description: text(p.description) } : {}),
    ...(text(p.sector) ? { sector: text(p.sector) } : {}),
    ...(/^https:\/\//.test(text(p.homepageUrl))
      ? { website: text(p.homepageUrl) }
      : {}),
  };
}
export function normalizeSentiSenseMarketQuote(
  raw: unknown,
  profile: unknown,
  symbol: string,
  now = Date.now(),
): { company: Company; quote: Quote } {
  const q = record(raw),
    company = normalizeSentiSenseCompany(profile, symbol);
  if (!sameProviderSymbol(q.ticker, symbol))
    fail("The quote response belongs to another security.");
  const price = number(q.currentPrice);
  if (price === null || price <= 0)
    fail("The quote source returned no usable price.");
  // timestamp is response serve time, never market time. Extended hours carries
  // no observation timestamp, so cannot silently replace the dated regular quote.
  const at = timestamp(q.priceAsOf, now);
  const frozen = q.listingStatus === "DELISTED";
  return {
    company,
    quote: {
      price,
      previousClose: number(q.previousClose),
      changePct: number(q.changePercent),
      currency: "USD",
      asOf: at === null ? null : new Date(at).toISOString(),
      session: frozen
        ? "Delisted · final session"
        : at === null
          ? "Regular-session price · observation time unknown"
          : "Regular session · 15-minute delayed",
      source: "SentiSense · 15-minute delayed",
      stale: frozen || at === null || now - at > 30 * 60000,
    },
  };
}
export function normalizeSentiSenseChart(
  raw: unknown,
  range: SentiSenseChartRange,
  now = Date.now(),
): SentiSenseHistory {
  if (!Array.isArray(raw)) fail("The chart source returned an invalid series.");
  const granularity: SentiSenseHistory["granularity"] =
    range === "1D"
      ? "5-minute"
      : range === "1W"
        ? "30-minute"
        : range === "1M"
          ? "hourly"
          : range === "5Y" || range === "10Y"
            ? "weekly"
            : range === "MAX"
              ? "monthly"
              : "daily";
  const intraday = ["5-minute", "30-minute", "hourly"].includes(granularity);
  const adjustment =
    range === "10Y" || range === "MAX"
      ? "split-and-dividend-adjusted"
      : "split-adjusted";
  const rows = new Map<string, Candle>();
  for (const item of raw) {
    const b = record(item),
      at = timestamp(b.timestamp, now, 0);
    const open = number(b.open),
      high = number(b.high),
      low = number(b.low),
      close = number(b.close),
      volume = number(b.volume);
    if (
      at === null ||
      b.adjusted !== true ||
      open === null ||
      high === null ||
      low === null ||
      close === null ||
      volume === null ||
      Math.min(open, high, low, close) <= 0 ||
      volume < 0 ||
      high < Math.max(open, low, close) ||
      low > Math.min(open, close)
    )
      fail("The chart source returned an invalid or unverified adjusted bar.");
    const time = intraday
      ? new Date(at).toISOString()
      : new Date(at).toISOString().slice(0, 10);
    const candle = { time, open, high, low, close, volume };
    if (
      rows.has(time) &&
      JSON.stringify(rows.get(time)) !== JSON.stringify(candle)
    )
      fail("The chart source returned conflicting bars.");
    rows.set(time, candle);
  }
  return {
    candles: [...rows.values()].sort((a, b) => a.time.localeCompare(b.time)),
    range,
    granularity,
    adjustment,
    source: `SentiSense · ${granularity} · ${adjustment}`,
  };
}
/** The documented directory is the tracked US stock universe, not every listing,
 * all funds, or cryptocurrencies. Company validation still happens on selection. */
export function normalizeSentiSenseDirectory(raw: unknown): Company[] {
  if (!Array.isArray(raw))
    fail("The stock directory returned an invalid dataset.");
  const rows = new Map<string, Company>();
  for (const item of raw) {
    const p = record(item),
      primary = text(p.ticker);
    const classes = Array.isArray(p.shareClasses)
      ? p.shareClasses.map((x) => text(record(x).ticker))
      : [];
    for (const ticker of [primary, ...classes]) {
      if (!/^[A-Z][A-Z0-9]*(?:[.-][A-Z0-9]+)?$/.test(ticker)) continue;
      rows.set(ticker, {
        symbol: ticker,
        name: text(p.name) || ticker,
        exchange: "",
        currency: "USD",
        assetType: "stock",
      });
    }
  }
  return [...rows.values()];
}
export function createSentiSenseMarket(
  request: SentiSenseMarketRequest,
  now = Date.now,
) {
  async function directory() {
    const [stocks, funds] = await Promise.all([
      request("stocks/detailed"),
      request("etfs"),
    ]);
    // Both official directories describe US-listed securities. Do not drop a
    // failed source silently: otherwise an empty search looks like no coverage.
    const merged = new Map<string, Company>();
    for (const row of [
      ...normalizeSentiSenseDirectory(stocks),
      ...normalizeSentiSenseDirectory(funds),
    ]) {
      merged.set(row.symbol, row);
    }
    return [...merged.values()];
  }
  return {
    async quote(input: string) {
      const symbol = sentiSenseMarketSymbol(input);
      const [q, p] = await Promise.all([
        request(`stocks/${encodeURIComponent(symbol)}/quote`),
        request(`stocks/${encodeURIComponent(symbol)}/profile`),
      ]);
      return normalizeSentiSenseMarketQuote(q, p, symbol, now());
    },
    async history(input: string, range: SentiSenseChartRange = "1Y") {
      const symbol = sentiSenseMarketSymbol(input);
      return normalizeSentiSenseChart(
        await request("stocks/chart", { ticker: symbol, timeframe: range }),
        range,
        now(),
      );
    },
    async dailyResearchHistory(input: string) {
      const symbol = sentiSenseMarketSymbol(input);
      // No documented pagination/date range exists for older daily OHLCV.
      // Weekly/monthly history must NEVER be fed to a daily engine as daily bars.
      return normalizeSentiSenseChart(
        await request("stocks/chart", { ticker: symbol, timeframe: "1Y" }),
        "1Y",
        now(),
      );
    },
    directory,
    async search(query: string) {
      const q = query.trim().toUpperCase().replace(/^\$/, "");
      if (!q) return [];
      const rows = await directory();
      const words = q.split(/\s+/);
      return rows
        .filter((x) =>
          words.every((w) => `${x.symbol} ${x.name}`.toUpperCase().includes(w)),
        )
        .sort((a, b) =>
          a.symbol === q
            ? -1
            : b.symbol === q
              ? 1
              : a.symbol.localeCompare(b.symbol),
        )
        .slice(0, 25);
    },
  };
}
