import { loadOptionChain } from "./options-source";
import { reserveProvider } from "./provider-budget";
import { HttpError } from "./server";
import {
  normalizeFlowTrades,
  selectFlowContracts,
  type FlowReply,
} from "./options-flow";
const cache = new Map<string, { until: number; value: FlowReply }>();
const pending = new Map<string, Promise<FlowReply>>();
const source =
  "Alpaca historical options trades; account subscription controls permitted delay.";
export async function loadOptionsFlow(
  symbol: string,
  expiry: string | null = null,
): Promise<FlowReply> {
  // Enabling this flag is the operator's confirmation of source and redistribution/display rights.
  if (
    process.env.AURYN_OPTIONS_ENABLED !== "true" ||
    process.env.AURYN_OPTIONS_FLOW_ENABLED !== "true"
  )
    return {
      status: "unavailable",
      message:
        "Options trade tape is not enabled. The operator must confirm dataset access and display rights before enabling this connection.",
      trades: [],
      contracts: [],
      partial: true,
      source,
    };
  if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol))
    throw new HttpError("Choose an eligible US-listed symbol.");
  if (
    expiry &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(expiry) ||
      !Number.isFinite(Date.parse(expiry)) ||
      new Date(expiry).toISOString().slice(0, 10) !== expiry)
  )
    throw new HttpError("Choose a valid expiry.");
  const key = process.env.ALPACA_PAPER_API_KEY,
    secret = process.env.ALPACA_PAPER_API_SECRET;
  if (!key || !secret)
    throw new HttpError(
      "Options trade connection is not configured. The operator must connect a permitted Alpaca market-data account.",
      503,
    );
  const cacheKey = `${key}:${symbol}:${expiry ?? ""}`,
    hit = cache.get(cacheKey);
  if (hit && hit.until > Date.now()) return hit.value;
  const existing = pending.get(cacheKey);
  if (existing) return existing;
  const task = (async (): Promise<FlowReply> => {
    const chain = await loadOptionChain(symbol, expiry);
    if (chain.status !== "available")
      throw new HttpError(
        "The options chain is unavailable; trade contract scope cannot be selected.",
        503,
      );
    const contracts = selectFlowContracts(chain.contracts, symbol, expiry);
    if (!contracts.length)
      throw new HttpError(
        "No eligible standard contracts are available in this chain selection. Choose another expiry.",
        503,
      );
    const start = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const query = new URLSearchParams({
      symbols: contracts.map((c) => c.id).join(","),
      start,
      limit: "500",
      sort: "desc",
    });
    await reserveProvider(1);
    let response: Response;
    try {
      response = await fetch(
        `https://data.alpaca.markets/v1beta1/options/trades?${query}`,
        {
          headers: { "APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret },
          signal: AbortSignal.timeout(12000),
          cache: "no-store",
        },
      );
    } catch {
      throw new HttpError(
        "The options trade source could not be reached. Try again shortly.",
        503,
      );
    }
    if (!response.ok)
      throw new HttpError(
        response.status === 401 || response.status === 403
          ? "Options trade access was denied. The operator must verify credentials, subscription and display permissions."
          : response.status === 429
            ? "The options trade source is temporarily rate limited. Try again shortly."
            : "Options trades are temporarily unavailable. Try again shortly.",
        response.status === 429 ? 429 : 503,
      );
    const data = await response.json();
    let trades;
    try {
      trades = normalizeFlowTrades(data?.trades, contracts);
    } catch {
      throw new HttpError(
        "The options trade source returned an unsupported response.",
        503,
      );
    }
    const value: FlowReply = {
      status: "available",
      trades: trades.filter((t) => Date.parse(t.time) >= Date.parse(start)),
      contracts: contracts.map((c) => c.id),
      fetchedAt: new Date().toISOString(),
      start,
      partial: !!data.next_page_token,
      chainComplete: chain.complete,
      source,
    };
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(cacheKey, { until: Date.now() + 15000, value });
    return value;
  })();
  pending.set(cacheKey, task);
  try {
    return await task;
  } finally {
    pending.delete(cacheKey);
  }
}
