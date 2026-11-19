import { readRadarPages } from "@/lib/radar-pagination";
import { requestAccess, requireFeature } from "@/lib/access-server";
import { allowMarketUser } from "@/lib/shared-market";
import { createClient } from "@supabase/supabase-js";
import { account, failure, HttpError, limit, privateJson } from "@/lib/server";
import { eodHistory } from "@/lib/eodhd";
import {
  dailyRadarSnapshot,
  radarUniverse,
  type DailyRadarRow,
} from "@/lib/daily-radar";
export const maxDuration = 60;
type StoredRow = {
  symbol: string;
  status: DailyRadarRow["status"];
  history: DailyRadarRow["history"];
  observed_through: string | null;
  checked_at: string | null;
  issue: string | null;
  lease_until: string | null;
  retry_at: string | null;
};
const columns =
  "symbol,status,history,observed_through,checked_at,issue,retry_at,lease_until";
function storage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new HttpError("Daily radar storage is not configured.", 503);
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
async function run(request: Request, advance: boolean) {
  try {
    const { user, db } = await account(request, { market: false });
    const access = await requestAccess(request, user.id);
    if (access.sampleOnly)
      throw new HttpError(
        "Market data is not enabled for this deployment.",
        403,
      );
    requireFeature(access, "overview");
    await limit(`daily-radar:${user.id}`, 30);
    const saved = async (table: "portfolio_positions" | "watchlist_items") =>
      readRadarPages(async (from, to) => {
        const result = await db
          .from(table)
          .select(
            "symbol, id" +
              (table === "portfolio_positions" ? ",asset_type" : ""),
          )
          .eq("user_id", user.id)
          .order("id")
          .range(from, to);
        if (result.error)
          throw new HttpError(
            "Saved holdings and watchlist could not be read.",
            503,
          );
        return (result.data ?? []) as unknown as {
          symbol: string;
          asset_type?: string;
        }[];
      });
    const [positions, watchlist] = await Promise.all([
      saved("portfolio_positions"),
      saved("watchlist_items"),
    ]);
    const universe = radarUniverse(positions, watchlist);
    if (
      positions.length > 1000 ||
      watchlist.length > 1000 ||
      universe.symbols.length > 1000
    )
      throw new HttpError(
        "Daily radar supports up to 1,000 held and watched instruments; no partial account is presented as complete.",
        422,
      );
    const day = new Date().toISOString().slice(0, 10),
      admin = storage();
    const read = async (symbols = universe.symbols, history = false) => {
      const data = await readRadarPages(async (from, to) => {
        const result = await admin
          .from("auryn_daily_radar")
          .select(history ? columns : columns.replace("history,", ""))
          .eq("user_id", user.id)
          .eq("day", day)
          .in("symbol", symbols.length ? symbols : [""])
          .order("symbol")
          .range(from, to);
        if (result.error) {
          // Recognized relation/cache errors require a schema check, not a migration diagnosis.
          // Never echo database messages, details, credentials or host names.
          const code = result.error.code;
          const message =
            code === "42P01" || code === "PGRST205"
              ? "Daily radar database schema is unavailable. An administrator must check its migration and schema cache."
              : code === "42501"
                ? "Daily radar storage access is unavailable. An administrator must check its permissions."
                : "Daily radar storage is temporarily unavailable. Please retry; if this continues, contact the administrator.";
          throw new HttpError(message, 503);
        }
        return (result.data ?? []) as unknown as StoredRow[];
      });
      return data.map(
        (r): DailyRadarRow => ({
          symbol: r.symbol,
          status: r.status,
          history: r.history ?? [],
          observedThrough: r.observed_through,
          checkedAt: r.checked_at,
          issue: r.issue,
          retryAt:
            r.lease_until && Date.parse(r.lease_until) > Date.now()
              ? r.lease_until
              : r.retry_at,
        }),
      );
    };
    if (process.env.AURYN_BULK_RADAR_ENABLED === "true") {
      const cursor = Number(
        new URL(request.url).searchParams.get("cursor") ?? 0,
      );
      const [
        { bulkRadarProvider },
        { createBulkRadarStore },
        { runBulkRadar },
      ] = await Promise.all([
        import("@/lib/bulk-radar-provider.server"),
        import("@/lib/bulk-radar-store.server"),
        import("@/lib/bulk-radar-worker"),
      ]);
      const signal = AbortSignal.any([
        request.signal,
        AbortSignal.timeout(45000),
      ]);
      let abort: (() => void) | undefined;
      const stopped = new Promise<never>((_, reject) => {
        abort = () =>
          reject(
            new HttpError(
              "Bulk radar refresh timed out; retained observations remain available.",
              503,
            ),
          );
        signal.addEventListener("abort", abort, { once: true });
      });
      try {
        signal.throwIfAborted();
        return privateJson(
          await Promise.race([
            runBulkRadar(universe, advance, cursor, {
              store: createBulkRadarStore(admin),
              provider: bulkRadarProvider(signal),
              allow: () => allowMarketUser(user.id),
              signal,
            }),
            stopped,
          ]),
        );
      } finally {
        if (abort) signal.removeEventListener("abort", abort);
      }
    }
    let rows = await read();
    let changed: string[] = [];
    if (advance) {
      const snapshot = dailyRadarSnapshot(day, universe, rows);
      const cooling = snapshot.rows.some(
        (r) =>
          r.status === "pending" &&
          r.issue &&
          r.retryAt &&
          Date.parse(r.retryAt) > Date.now(),
      );
      const due = (cooling ? [] : snapshot.rows)
        .filter(
          (r) =>
            r.status === "pending" &&
            (!r.retryAt || Date.parse(r.retryAt) <= Date.now()),
        )
        .slice(0, 2);
      // At most two instruments per continuation, sequential to protect the shared quota.
      if (due.length && !(await allowMarketUser(user.id)))
        throw new HttpError(
          "Daily market allowance reached; saved radar observations remain available.",
          429,
        );
      changed = due.map((row) => row.symbol);
      for (const row of due) {
        const claimed = await admin.rpc("auryn_claim_daily_radar", {
          p_user: user.id,
          p_day: day,
          p_symbol: row.symbol,
        });
        if (claimed.error)
          throw new HttpError(
            "Daily radar worker could not claim its cache entry.",
            503,
          );
        const lease = claimed.data?.[0];
        if (!lease) continue;
        let value: Record<string, unknown>;
        try {
          // Existing provider normalizer requires actual split evidence; no raw/adjusted mix.
          const history = (await eodHistory(row.symbol, "6M"))
            .filter((b) => b.time < day)
            .slice(-160);
          value = {
            status: history.length ? "ready" : "unavailable",
            history,
            observed_through: history.at(-1)?.time ?? null,
            issue: history.length
              ? null
              : "No completed price history returned.",
            retry_at: null,
          };
        } catch (error) {
          const e = error as { status?: number; seconds?: number };
          const retry = e.status === 429 || e.status === 503;
          const seconds = Math.max(60, Math.min(3600, e.seconds ?? 120));
          value = {
            status: retry && lease.attempts < 3 ? "pending" : "unavailable",
            history: [],
            observed_through: null,
            issue: retry
              ? "Price source is temporarily unavailable; refresh is rate limited."
              : "Price history unavailable for this instrument.",
            retry_at: retry
              ? new Date(Date.now() + seconds * 1000).toISOString()
              : null,
          };
        }
        const saved = await admin
          .from("auryn_daily_radar")
          .update({
            ...value,
            checked_at: new Date().toISOString(),
            lease_token: null,
            lease_until: null,
          })
          .eq("user_id", user.id)
          .eq("day", day)
          .eq("symbol", row.symbol)
          .eq("lease_token", lease.lease_token)
          .gt("lease_until", new Date().toISOString());
        if (saved.error)
          throw new HttpError("Daily radar progress could not be saved.", 503);
        if (value.status === "pending") break;
      }
      rows = await read();
      // Retain at most today's and yesterday's private cache; no account data mutation.
      await admin
        .from("auryn_daily_radar")
        .delete()
        .eq("user_id", user.id)
        .lt("day", new Date(Date.now() - 86400000).toISOString().slice(0, 10));
    }
    const snapshot = dailyRadarSnapshot(day, universe, rows);
    // Never send a multi-megabyte universe repeatedly during continuation.
    // GET pages up to 50 cached histories; POST returns only its changed rows.
    const cursor = Number(new URL(request.url).searchParams.get("cursor") ?? 0);
    if (!Number.isSafeInteger(cursor) || cursor < 0 || cursor > 1000)
      throw new HttpError("Invalid radar page.", 400);
    const ready = snapshot.rows
      .filter((row) => row.status === "ready")
      .map((row) => row.symbol);
    const selected = advance ? changed : ready.slice(cursor, cursor + 50);
    const histories = selected.length ? await read(selected, true) : [];
    return privateJson({
      ...snapshot,
      rows: advance
        ? histories
        : [
            ...histories,
            ...(cursor === 0
              ? snapshot.rows.filter((row) => row.status === "unavailable")
              : []),
          ],
      incremental: advance || cursor > 0,
      nextCursor: !advance && cursor + 50 < ready.length ? cursor + 50 : null,
    });
  } catch (e) {
    return failure(e);
  }
}
export const GET = (request: Request) => run(request, false);
export const POST = (request: Request) => run(request, true);
