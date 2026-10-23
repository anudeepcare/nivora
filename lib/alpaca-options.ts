import { normalizeOptions } from "./options-analysis";

type Row = Record<string, any>;
export function joinAlpacaOptions(
  snapshots: Record<string, Row>,
  metadata: Row[],
  now = Date.now(),
) {
  const bySymbol = new Map(metadata.map((c) => [c.symbol, c]));
  return normalizeOptions(
    Object.entries(snapshots).flatMap(([symbol, s]) => {
      const match = symbol.match(/^(.*)(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/);
      if (!match) return [];
      const c = bySymbol.get(symbol),
        q = s.latestQuote;
      // Quote timestamps describe quote inputs; a later trade must not refresh an old quote.
      const observed = q?.t ?? s.latestTrade?.t;
      if (!observed) return [];
      const age = c?.open_interest_date
        ? (now - Date.parse(c.open_interest_date)) / 86400000
        : Infinity;
      return [
        {
          contract: symbol,
          type: match[5] === "C" ? "call" : "put",
          strike: Number(match[6]) / 1000,
          exp_date: `20${match[2]}-${match[3]}-${match[4]}`,
          tradetime: observed,
          bid: q?.bp,
          ask: q?.ap,
          open_interest: age >= 0 && age <= 7 ? c?.open_interest : null,
          contract_size: c?.size ?? 100,
          volatility: s.impliedVolatility,
          ...s.greeks,
          // Latest trade size is NOT daily volume.
          volume: null,
        },
      ];
    }),
    now,
  );
}
const cache = new Map<string, { until: number; value: any }>();
const pending = new Map<string, Promise<any>>();
export async function alpacaOptions(symbol: string, expiry: string | null) {
  const key = process.env.ALPACA_PAPER_API_KEY,
    secret = process.env.ALPACA_PAPER_API_SECRET;
  if (!key || !secret)
    throw new Error(
      "Options connection is not configured. Ask the owner to connect the market-data account.",
    );
  const feed =
    process.env.AURYN_ALPACA_OPTIONS_FEED === "opra" ? "opra" : "indicative";
  const cacheKey = `${key}:${feed}:${symbol}:${expiry ?? ""}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.until > Date.now()) return hit.value;
  const existing = pending.get(cacheKey);
  if (existing) return existing;
  const run = (async () => {
    const get = async (base: string, path: string, params: URLSearchParams) => {
      const r = await fetch(`${base}${path}?${params}`, {
        headers: { "APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret },
        signal: AbortSignal.timeout(12000),
        cache: "no-store",
      });
      if (!r.ok)
        throw new Error(
          r.status === 401 || r.status === 403
            ? "The options connection was not authorized. The owner must check account credentials and data access."
            : r.status === 429
              ? "Options requests are temporarily limited. Please try again shortly."
              : "Options data is temporarily unavailable. Please try again.",
        );
      return r.json();
    };
    const today = new Date().toISOString().slice(0, 10);
    const end = new Date();
    end.setUTCFullYear(end.getUTCFullYear() + 3);
    const snapshots: Record<string, Row> = {};
    let token = "",
      complete = false;
    for (let page = 0; page < 4; page++) {
      const p = new URLSearchParams({
        feed,
        limit: "1000",
        expiration_date_gte: today,
      });
      if (expiry) p.set("expiration_date", expiry);
      if (token) p.set("page_token", token);
      const data = await get(
        "https://data.alpaca.markets",
        `/v1beta1/options/snapshots/${encodeURIComponent(symbol)}`,
        p,
      );
      if (!data.snapshots || typeof data.snapshots !== "object")
        throw new Error(
          "The options connection returned an unsupported response.",
        );
      Object.assign(snapshots, data.snapshots);
      token = data.next_page_token || "";
      if (!token) {
        complete = true;
        break;
      }
    }
    const metadata: Row[] = [];
    token = "";
    let metadataComplete = false;
    // Contract metadata supplies dated open interest. Do not replace it with trade size.
    try {
      for (let page = 0; page < 4; page++) {
        const p = new URLSearchParams({
          underlying_symbols: symbol,
          limit: "1000",
          expiration_date_gte: today,
          expiration_date_lte: expiry || end.toISOString().slice(0, 10),
        });
        if (expiry) p.set("expiration_date", expiry);
        if (token) p.set("page_token", token);
        const data = await get(
          "https://paper-api.alpaca.markets",
          "/v2/options/contracts",
          p,
        );
        if (!Array.isArray(data.option_contracts)) break;
        metadata.push(...data.option_contracts);
        token = data.next_page_token || "";
        if (!token) {
          metadataComplete = true;
          break;
        }
      }
    } catch {
      /* Chain remains useful; GEX is withheld without open interest. */
    }
    const value = {
      status: "available",
      contracts: joinAlpacaOptions(snapshots, metadata),
      complete: complete && metadataComplete,
      fetchedAt: new Date().toISOString(),
      frequency:
        feed === "indicative"
          ? "Indicative feed: modified quotes and delayed trades. Not executable prices; modeled positioning only."
          : "OPRA snapshot. Open interest updates separately; modeled positioning is not actual dealer inventory.",
    };
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(cacheKey, { until: Date.now() + 300000, value });
    return value;
  })();
  pending.set(cacheKey, run);
  try {
    return await run;
  } finally {
    pending.delete(cacheKey);
  }
}
