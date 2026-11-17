export type MarketSource = "twelve" | "eodhd";
export function preferredMarketSources(
  dataset: "quote" | "intraday" | "daily",
  configured: { twelve: boolean; eodhd: boolean },
): MarketSource[] {
  const order: MarketSource[] = ["eodhd", "twelve"];
  return order.filter((p) => configured[p]);
}
/** Missing coverage is definitive only if every attempted source said 404.
 * Keep an outage/entitlement/budget failure when another source simply has no
 * listing, so downstream research cannot mistake uncertainty for invalid input. */
function providerFailure(failures: unknown[]) {
  return (
    failures.find(
      (error) => (error as { status?: number } | null)?.status !== 404,
    ) ??
    failures.at(-1) ??
    new Error("No market-data provider is configured.")
  );
}

/** Select one complete result. Never splice providers' bars or financial periods. */
export async function readPreferred<T>(
  sources: MarketSource[],
  read: (source: MarketSource) => Promise<T>,
): Promise<{ value: T; provider: MarketSource; fallback: boolean }> {
  const failures: unknown[] = [];
  for (let i = 0; i < sources.length; i++) {
    try {
      return {
        value: await read(sources[i]),
        provider: sources[i],
        fallback: i > 0,
      };
    } catch (e) {
      failures.push(e);
    }
  }
  throw providerFailure(failures);
}

/** Server data cache durations, separate from rendered-page/account caching. */
export function providerCacheSeconds(
  endpoint: string,
  params: Record<string, string>,
) {
  if (endpoint === "quote") return 30;
  if (endpoint === "profile" || endpoint === "logo") return 86400;
  if (endpoint === "symbol_search") return 3600;
  if (endpoint === "time_series") return params.interval === "1day" ? 3600 : 60;
  return 60;
}

/** A dated stale price must not suppress a usable backup quote. */
export async function readFreshQuote<
  T extends {
    quote: { price: number | null; asOf: string | null; stale: boolean };
  },
>(
  sources: MarketSource[],
  read: (source: MarketSource) => Promise<T>,
  freshness?: { now: number; maxAgeMs: number },
) {
  let retained: { value: T; provider: MarketSource; fallback: boolean } | null =
    null;
  const failures: unknown[] = [];
  for (let i = 0; i < sources.length; i++) {
    try {
      const value = await read(sources[i]);
      if (
        value.quote.price == null ||
        !Number.isFinite(value.quote.price) ||
        value.quote.price <= 0
      )
        throw new Error("The quote source returned no usable price.");
      const result = { value, provider: sources[i], fallback: i > 0 };
      const stamp = Date.parse(value.quote.asOf || "");
      const timely =
        !freshness ||
        (Number.isFinite(stamp) &&
          stamp <= freshness.now + 60000 &&
          freshness.now - stamp <= freshness.maxAgeMs);
      // A delayed flag is a feed classification, not proof that a quote is new.
      // Retain the newest observation if the backup is older or unavailable.
      if (
        !value.quote.stale &&
        timely &&
        (!retained || stamp >= Date.parse(retained.value.quote.asOf || ""))
      )
        return result;
      if (
        !retained ||
        (Date.parse(value.quote.asOf || "") || 0) >
          (Date.parse(retained.value.quote.asOf || "") || 0)
      )
        retained = result;
    } catch (e) {
      failures.push(e);
    }
  }
  if (retained) return retained;
  throw providerFailure(failures);
}

/** Try a newer backup during scheduled pre/regular/post hours and for crypto.
 * Closed-market observations do not trigger a second vendor request merely
 * because the market is closed. This is a freshness window, not a holiday calendar. */
export function quoteRefreshMaxAge(symbol: string, now = Date.now()) {
  if (symbol.includes("/")) return 180000;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (key: string) => parts.find((p) => p.type === key)?.value || "";
  const minutes = Number(part("hour")) * 60 + Number(part("minute"));
  return !["Sat", "Sun"].includes(part("weekday")) &&
    minutes >= 240 &&
    minutes < 1200
    ? 180000
    : 4 * 86400000;
}
