import { normalizeOptions } from "./options-analysis";
import { readBoundedMarketJson } from "./market-response";

type Row = Record<string, any>;
const finiteLeaf = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const nonnegativeLeaf = (v: unknown): number | null => {
  const n = finiteLeaf(v);
  return n != null && n >= 0 ? n : null;
};
const metadataNumber = (v: unknown): number | null => {
  const n =
    typeof v === "string" && /^\d+(?:\.\d+)?$/.test(v)
      ? Number(v)
      : finiteLeaf(v);
  return n != null && Number.isFinite(n) && n >= 0 ? n : null;
};
const validDay = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;

/** Conservative supported deliverable profile from Alpaca's documented contract schema. */
function ordinaryDeliverable(c: Row | undefined, symbol: string) {
  const d =
    Array.isArray(c?.deliverables) && c.deliverables.length === 1
      ? c.deliverables[0]
      : null;
  const root = /^([A-Z.]+)\d{6}[CP]\d{8}$/.exec(symbol)?.[1];
  return (
    !!c &&
    !!d &&
    c.symbol === symbol &&
    c.underlying_symbol === root &&
    typeof c.underlying_asset_id === "string" &&
    c.underlying_asset_id.length > 0 &&
    d.asset_id === c.underlying_asset_id &&
    d.symbol === root &&
    d.type === "equity" &&
    ["100", 100].includes(c.multiplier) &&
    ["100", 100].includes(c.size) &&
    ["100", 100].includes(d.amount) &&
    ["100", 100].includes(d.allocation_percentage) &&
    d.delayed_settlement === false &&
    d.settlement_method === "CCC" &&
    d.settlement_type === "T+1"
  );
}
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
      if (
        typeof observed !== "string" ||
        !Number.isFinite(Date.parse(observed)) ||
        Date.parse(observed) > now
      )
        return [];
      const age = validDay(c?.open_interest_date)
        ? (now - Date.parse(c.open_interest_date)) / 86400000
        : Infinity;
      const delta = finiteLeaf(s.greeks?.delta);
      const oi = metadataNumber(c?.open_interest);
      return [
        {
          contract: symbol,
          type: match[5] === "C" ? "call" : "put",
          strike: Number(match[6]) / 1000,
          exp_date: `20${match[2]}-${match[3]}-${match[4]}`,
          tradetime: observed,
          bid: nonnegativeLeaf(q?.bp),
          ask: nonnegativeLeaf(q?.ap),
          open_interest:
            age >= 0 && age <= 7 && Number.isSafeInteger(oi) ? oi : null,
          contract_size: metadataNumber(c?.multiplier) ?? 0,
          volatility: nonnegativeLeaf(s.impliedVolatility),
          delta:
            delta != null &&
            Math.abs(delta) <= 1 &&
            (match[5] === "C" ? delta >= 0 : delta <= 0)
              ? delta
              : null,
          gamma: nonnegativeLeaf(s.greeks?.gamma),
          theta: finiteLeaf(s.greeks?.theta),
          vega: nonnegativeLeaf(s.greeks?.vega),
          // Latest trade size is NOT daily volume.
          volume: null,
        },
      ];
    }),
    now,
  ).map((c) => ({
    ...c,
    standard: ordinaryDeliverable(bySymbol.get(c.id), c.id),
    quoteObservedAt:
      typeof snapshots[c.id]?.latestQuote?.t === "string"
        ? snapshots[c.id].latestQuote.t
        : null,
    greeksObservedAt: null,
    oiObservedAt:
      c.oi != null ? (bySymbol.get(c.id)?.open_interest_date ?? null) : null,
  })); // Missing proof withholds sizing, while reported Greeks remain displayable.
}
const cache = new Map<string, { until: number; value: any }>();
const OPTIONS_BUDGET_MS = 45000;
type PendingChain = {
  controller: AbortController;
  promise: Promise<any>;
  waiters: number;
  settled: boolean;
};
const pending = new Map<string, PendingChain>();
async function abortable<T>(task: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) throw Error("Options request cancelled or timed out.");
  let abort: (() => void) | undefined;
  const stopped = new Promise<never>((_, reject) => {
    abort = () => reject(Error("Options request cancelled or timed out."));
    signal.addEventListener("abort", abort, { once: true });
  });
  try {
    return await Promise.race([task, stopped]);
  } finally {
    if (abort) signal.removeEventListener("abort", abort);
  }
}
async function waitForChain(entry: PendingChain, signal?: AbortSignal) {
  if (signal?.aborted) throw Error("Options request cancelled.");
  entry.waiters++;
  try {
    return signal
      ? await abortable(entry.promise, signal)
      : await entry.promise;
  } finally {
    entry.waiters--;
    // A cancelled viewer must not terminate another viewer's shared request.
    if (!entry.waiters && !entry.settled) entry.controller.abort();
  }
}
export async function alpacaOptions(
  symbol: string,
  expiry: string | null,
  signal?: AbortSignal,
) {
  if (signal?.aborted) throw Error("Options request cancelled.");
  if (
    process.env.AURYN_OPTIONS_ENABLED !== "true" ||
    ![undefined, "", "alpaca"].includes(process.env.AURYN_OPTIONS_PROVIDER)
  )
    throw new Error("The existing options connection is not enabled.");
  if (
    !/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol) ||
    (expiry &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(expiry) ||
        !Number.isFinite(Date.parse(expiry)) ||
        new Date(expiry).toISOString().slice(0, 10) !== expiry))
  )
    throw new Error("Invalid options selection.");
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
  if (existing) return waitForChain(existing, signal);
  const controller = new AbortController();
  const entry: PendingChain = {
    controller,
    promise: Promise.resolve(null),
    waiters: 0,
    settled: false,
  };
  const deadline = setTimeout(() => controller.abort(), OPTIONS_BUDGET_MS);
  const run = (async () => {
    const get = async (base: string, path: string, params: URLSearchParams) => {
      if (controller.signal.aborted)
        throw Error("Options request cancelled or timed out.");
      const pageSignal = AbortSignal.any([
        controller.signal,
        AbortSignal.timeout(12000),
      ]);
      const r = await abortable(
        fetch(`${base}${path}?${params}`, {
          headers: { "APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret },
          signal: pageSignal,
          cache: "no-store",
          redirect: "error",
        }),
        pageSignal,
      );
      if (!r.ok)
        throw new Error(
          r.status === 401 || r.status === 403
            ? "The options connection was not authorized. The owner must check account credentials and data access."
            : r.status === 429
              ? "Options requests are temporarily limited. Please try again shortly."
              : "Options data is temporarily unavailable. Please try again.",
        );
      const data = await abortable(
        readBoundedMarketJson(r, 2000000),
        pageSignal,
      );
      return data;
    };
    const today = new Date().toISOString().slice(0, 10);
    const end = new Date();
    end.setUTCFullYear(end.getUTCFullYear() + 3);
    const snapshots: Record<string, Row> = Object.create(null);
    let token = "",
      complete = false;
    for (let page = 0; page < 4; page++) {
      const p = new URLSearchParams({
        feed,
        root_symbol: symbol,
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
      if (
        !data.snapshots ||
        typeof data.snapshots !== "object" ||
        Array.isArray(data.snapshots) ||
        Object.keys(data.snapshots).length > 1000
      )
        throw new Error(
          "The options connection returned an unsupported response.",
        );
      for (const [id, snapshot] of Object.entries(data.snapshots)) {
        const match = /^([A-Z.]+)(\d{6})[CP]\d{8}$/.exec(id);
        const date = match
          ? `20${match[2].slice(0, 2)}-${match[2].slice(2, 4)}-${match[2].slice(4, 6)}`
          : "";
        if (
          !match ||
          match[1] !== symbol ||
          !Number.isFinite(Date.parse(date)) ||
          new Date(date).toISOString().slice(0, 10) !== date ||
          (expiry && date !== expiry) ||
          !snapshot ||
          typeof snapshot !== "object" ||
          Array.isArray(snapshot)
        )
          throw new Error(
            "Options contract identities could not be validated.",
          );
        if (Object.hasOwn(snapshots, id))
          throw new Error("Duplicate options contract snapshot.");
        snapshots[id] = snapshot as Row;
      }
      if (
        data.next_page_token != null &&
        typeof data.next_page_token !== "string"
      )
        throw new Error("Invalid options pagination.");
      token = data.next_page_token || "";
      if (!token) {
        complete = true;
        break;
      }
    }
    const metadata: Row[] = [];
    token = "";
    let metadataComplete = false;
    let metadataFailed = false;
    // Contract metadata supplies dated open interest. Do not replace it with trade size.
    try {
      for (let page = 0; page < 4; page++) {
        const p = new URLSearchParams({
          underlying_symbols: symbol,
          root_symbol: symbol,
          show_deliverables: "true",
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
        if (
          !Array.isArray(data.option_contracts) ||
          data.option_contracts.length > 1000
        ) {
          metadataFailed = true;
          break;
        }
        metadata.push(...data.option_contracts);
        if (
          data.next_page_token != null &&
          typeof data.next_page_token !== "string"
        )
          throw new Error("Invalid options pagination.");
        token = data.next_page_token || "";
        if (!token) {
          metadataComplete = true;
          break;
        }
      }
    } catch {
      metadataFailed = true;
      /* Chain remains useful; GEX is withheld without open interest. */
    }
    const value = {
      status: Object.keys(snapshots).length ? "available" : "unavailable",
      message:
        "Reported snapshots and Greeks. Complete-chain coverage is not verified. Sizing-dependent analysis is available only for explicitly verified ordinary deliverables.",
      contracts: joinAlpacaOptions(snapshots, metadata),
      availableExpiries: [
        ...new Set(
          metadata
            .map((c) => String(c.expiration_date ?? ""))
            .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)),
        ),
      ].sort(),
      complete: false,
      paginationComplete: complete && metadataComplete,
      fetchedAt: new Date().toISOString(),
      frequency:
        feed === "indicative"
          ? "Indicative feed: modified quotes and delayed trades. Not executable prices; modeled positioning only."
          : "OPRA snapshot. Open interest updates separately; modeled positioning is not actual dealer inventory.",
    };
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    // A timeout may leave useful quotes but must not cache a cancelled/partial run.
    if (!controller.signal.aborted && !metadataFailed)
      cache.set(cacheKey, { until: Date.now() + 300000, value });
    return value;
  })();
  entry.promise = run
    .catch((error) => {
      const message =
        error instanceof Error &&
        /^The options connection was not authorized|^Options requests are temporarily limited|^Options contract identities|^Duplicate options contract|^Invalid options pagination/.test(
          error.message,
        )
          ? error.message
          : "Options data is temporarily unavailable. Please try again.";
      throw new Error(message);
    })
    .finally(() => {
      entry.settled = true;
      clearTimeout(deadline);
      if (pending.get(cacheKey) === entry) pending.delete(cacheKey);
    });
  pending.set(cacheKey, entry);
  return waitForChain(entry, signal);
}
