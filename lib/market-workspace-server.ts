import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { HttpError } from "./server";
import { quote } from "./providers";
import { loadOptionChain } from "./options-source";
import {
  exposureBoard,
  parseBoardState,
  type BoardSnapshot,
} from "./exposure-board";
import {
  compactCheckpoint,
  sealCheckpoint,
  verifyCheckpoint,
} from "./market-checkpoints";
import { volatilityContext } from "./options-context";
import type { OptionContract } from "./options-analysis";
export type MarketCapture = BoardSnapshot & {
  sourceAsOf: string;
  quoteAsOf: string;
  frequency: string;
  window: string;
  ivTerm: ReturnType<typeof volatilityContext>["term"];
};
export function marketSigningKey() {
  const key = process.env.AURYN_MARKET_SNAPSHOT_SIGNING_KEY || "";
  if (key.length < 32)
    throw new HttpError(
      "Account snapshot storage needs a server-only signing key. Existing device snapshots remain available.",
      503,
    );
  return key;
}
export async function marketHistory(
  db: SupabaseClient,
  userId: string,
  symbol: string,
) {
  const key = marketSigningKey();
  const r = await db
    .from("auryn_observations")
    .select("payload")
    .eq("user_id", userId)
    .eq("symbol", "options:" + symbol)
    .order("observed_at", { ascending: false })
    .limit(60);
  if (r.error)
    throw new HttpError(
      "Account options history is unavailable. Check the research workspace migration.",
      503,
    );
  return (r.data ?? [])
    .flatMap((row) => {
      if (!verifyCheckpoint(row.payload, userId, key)) return [];
      const snapshot = row.payload.snapshot as MarketCapture;
      const valid =
        parseBoardState(JSON.stringify({ snapshots: [snapshot] })).snapshots
          .length === 1;
      return valid && snapshot.symbol === symbol ? [snapshot] : [];
    })
    .sort((a, b) => a.savedAt.localeCompare(b.savedAt));
}
export async function captureMarket(
  db: SupabaseClient,
  userId: string,
  symbol: string,
  expiry: string | null = null,
): Promise<MarketCapture> {
  const key = marketSigningKey();
  if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol))
    throw new HttpError("Choose an eligible US stock or ETF.");
  if (
    expiry &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(expiry) ||
      !Number.isFinite(Date.parse(expiry)) ||
      new Date(expiry).toISOString().slice(0, 10) !== expiry)
  )
    throw new HttpError("Choose a valid expiration.");
  const chain = (await loadOptionChain(symbol, expiry)) as {
    status: string;
    message?: string;
    contracts: OptionContract[];
    frequency?: string;
  };
  if (chain.status !== "available" || !chain.contracts.length)
    throw new HttpError(
      chain.message || "No option contracts are available to capture.",
      422,
    );
  const q = (await quote(symbol)).quote,
    now = Date.now(),
    at = Date.parse(q.asOf ?? "");
  if (
    q.price === null ||
    !Number.isFinite(q.price) ||
    q.price <= 0 ||
    q.currency !== "USD" ||
    q.stale ||
    !Number.isFinite(at) ||
    at > now + 60000 ||
    now - at > 4 * 86400000
  )
    throw new HttpError(
      "A recent dated USD underlying quote is required for a server checkpoint.",
      422,
    );
  // Filter the returned chain as well as the provider request. Never sign a
  // different expiry or stale option inputs just because the quote is fresh.
  const contracts = chain.contracts.filter(
    (c) => !expiry || c.expiry === expiry,
  );
  const board = compactCheckpoint(exposureBoard(contracts, q.price));
  if (!board.cells.length)
    throw new HttpError(
      "There are no valid standard-contract cells to capture.",
      422,
    );
  if (
    board.cells.some((c) => {
      const date = Date.parse(c.observed ?? "");
      return (
        !Number.isFinite(date) ||
        date > now + 60000 ||
        now - date > 4 * 86400000 ||
        Date.parse(c.expiry + "T21:00:00Z") <= now
      );
    })
  )
    throw new HttpError(
      "Recent coherent option observations and unexpired contracts are required for a server checkpoint.",
      422,
    );
  const sourceAsOf = board.cells
    .map((c) => c.observed!)
    .sort((a, b) => Date.parse(a) - Date.parse(b))
    .at(-1)!;
  const id =
    "options:" +
    createHash("sha256")
      .update(
        JSON.stringify({
          symbol,
          expiry,
          board,
          sourceAsOf,
          quoteAsOf: q.asOf,
        }),
      )
      .digest("hex")
      .slice(0, 48);
  const snapshot: MarketCapture = {
    id,
    symbol,
    savedAt: new Date().toISOString(),
    board,
    sourceAsOf,
    quoteAsOf: q.asOf!,
    frequency: chain.frequency ?? "Options snapshot",
    window:
      "Nearest 40 strikes × first 6 loaded expirations; returned contracts only",
    ivTerm: volatilityContext(contracts, [], q.price).term.slice(0, 12),
  };
  const payload = sealCheckpoint(snapshot, userId, key);
  if (Buffer.byteLength(JSON.stringify(payload)) > 120000)
    throw new HttpError(
      "This source checkpoint exceeds the account storage window. Choose one expiration and retry.",
      422,
    );
  const stored = await db
    .from("auryn_observations")
    .upsert(
      {
        user_id: userId,
        symbol: "options:" + symbol,
        snapshot_id: id,
        payload,
      },
      { onConflict: "user_id,symbol,snapshot_id", ignoreDuplicates: true },
    )
    .select("payload");
  if (stored.error)
    throw new HttpError("Could not save the account checkpoint.", 503);
  if (
    stored.data?.[0]?.payload &&
    verifyCheckpoint(stored.data[0].payload, userId, key) &&
    stored.data[0].payload.snapshot.symbol === symbol &&
    stored.data[0].payload.snapshot.id === id
  )
    return stored.data[0].payload.snapshot;
  const existing = await db
    .from("auryn_observations")
    .select("payload")
    .eq("user_id", userId)
    .eq("symbol", "options:" + symbol)
    .eq("snapshot_id", id)
    .maybeSingle();
  if (
    existing.error ||
    !verifyCheckpoint(existing.data?.payload, userId, key) ||
    existing.data?.payload.snapshot.symbol !== symbol ||
    existing.data?.payload.snapshot.id !== id
  )
    throw new HttpError("The saved checkpoint could not be verified.", 503);
  return existing.data!.payload.snapshot;
}
