import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { validateRadarSnapshot, type BulkRadarSnapshot } from "./bulk-radar";

export type StoredBulkRadar = {
  snapshot: BulkRadarSnapshot | null;
  revision: number;
  issue: string | null;
  retryAt: string | null;
};
export type StoredBulkRadarMeta = Omit<StoredBulkRadar, "snapshot"> & {
  snapshot: Omit<BulkRadarSnapshot, "raw" | "splits"> | null;
};
export type BulkRadarLease = { token: string; revision: number };
export type BulkRadarIssue =
  | "provider_unavailable"
  | "invalid_data"
  | "budget_exhausted"
  | "history_unavailable";
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function scopeSymbol(scope: string, symbol?: string) {
  if (!/^[a-f0-9]{64}$/.test(scope)) throw Error("Invalid bulk radar scope.");
  if (symbol !== undefined && !/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol))
    throw Error("Invalid bulk radar symbol.");
}
function validMeta(row: Record<string, unknown>) {
  const date = (v: unknown): v is string =>
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(Date.parse(v)) &&
    new Date(v).toISOString().slice(0, 10) === v;
  const instant = (v: unknown) =>
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}T/.test(v) &&
    /(?:Z|[+-]\d{2}:\d{2})$/.test(v) &&
    Number.isFinite(Date.parse(v)) &&
    Date.parse(v) <= Date.now();
  return (
    row.policy === "raw-splits-v1" &&
    date(row.observedThrough) &&
    date(row.checkedThrough) &&
    row.observedThrough === row.checkedThrough &&
    row.checkedThrough < new Date().toISOString().slice(0, 10) &&
    instant(row.historyAcquiredAt) &&
    instant(row.actionsAcquiredAt)
  );
}
function sourceDate(scope: string, date: string) {
  scopeSymbol(scope);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date ||
    date > new Date().toISOString().slice(0, 10)
  )
    throw Error("Invalid bulk source date.");
}
export function createBulkRadarStore(db: Pick<SupabaseClient, "rpc" | "from">) {
  async function rpc(
    name: string,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const { data, error } = await db.rpc(name, params);
    if (error)
      throw Error(
        "Bulk radar storage unavailable. Apply the bulk radar state migration before enabling this mode.",
      );
    return data;
  }
  const bool = (v: unknown) => {
    if (typeof v !== "boolean")
      throw Error("Bulk radar storage returned an invalid result.");
    return v;
  };
  return {
    async read(
      scope: string,
      symbols: string[],
    ): Promise<Map<string, StoredBulkRadar>> {
      scopeSymbol(scope);
      if (symbols.length > 1000) throw Error("Invalid bulk radar selection.");
      for (const symbol of symbols) scopeSymbol(scope, symbol);
      if (!symbols.length) return new Map();
      const result = new Map<string, StoredBulkRadar>();
      const unique = [...new Set(symbols)];
      let offset = 0;
      let requests = 0;
      while (offset <= unique.length) {
        if (++requests > 32)
          throw Error(
            "Bulk radar storage paging limit reached; no complete result available.",
          );
        const { data, error } = await db
          .from("auryn_bulk_radar_state")
          .select("symbol,snapshot,revision,issue,retry_at")
          .eq("scope", scope)
          .in("symbol", unique)
          .order("symbol")
          .range(offset, offset + 99);
        if (error || !Array.isArray(data))
          throw Error(
            "Bulk radar storage unavailable. Apply the bulk radar state migration before enabling this mode.",
          );
        if (!data.length) break;
        for (const row of data) {
          if (
            !unique.includes(row.symbol) ||
            result.has(row.symbol) ||
            !Number.isSafeInteger(row.revision) ||
            row.revision < 0 ||
            (row.snapshot !== null &&
              (row.snapshot?.symbol !== row.symbol ||
                row.snapshot?.policy !== "raw-splits-v1"))
          )
            throw Error("Bulk radar storage returned an invalid snapshot.");
          result.set(row.symbol, {
            snapshot:
              row.snapshot === null
                ? null
                : validateRadarSnapshot(row.snapshot, row.symbol),
            revision: row.revision,
            issue: row.issue,
            retryAt: row.retry_at,
          });
        }
        offset += data.length;
      }
      return result;
    },
    async readMeta(
      scope: string,
      symbols: string[],
    ): Promise<Map<string, StoredBulkRadarMeta>> {
      scopeSymbol(scope);
      if (symbols.length > 1000) throw Error("Invalid bulk radar selection.");
      for (const symbol of symbols) scopeSymbol(scope, symbol);
      if (!symbols.length) return new Map();
      const result = new Map<string, StoredBulkRadarMeta>();
      const unique = [...new Set(symbols)];
      let offset = 0;
      let requests = 0;
      while (offset <= unique.length) {
        if (++requests > 32)
          throw Error(
            "Bulk radar storage paging limit reached; no complete result available.",
          );
        const { data, error } = await db
          .from("auryn_bulk_radar_state")
          .select(
            "symbol,revision,issue,retry_at,policy:snapshot->>policy,historyAcquiredAt:snapshot->>historyAcquiredAt,actionsAcquiredAt:snapshot->>actionsAcquiredAt,observedThrough:snapshot->>observedThrough,checkedThrough:snapshot->>checkedThrough",
          )
          .eq("scope", scope)
          .in("symbol", unique)
          .order("symbol")
          .range(offset, offset + 99);
        if (error || !Array.isArray(data))
          throw Error(
            "Bulk radar storage unavailable. Apply the bulk radar state migration before enabling this mode.",
          );
        if (!data.length) break;
        for (const row of data) {
          if (
            !unique.includes(row.symbol) ||
            result.has(row.symbol) ||
            !Number.isSafeInteger(row.revision) ||
            row.revision < 0 ||
            (row.policy !== null && !validMeta(row))
          )
            throw Error("Bulk radar storage returned an invalid snapshot.");
          result.set(row.symbol, {
            snapshot:
              row.policy === null
                ? null
                : {
                    symbol: row.symbol,
                    policy: "raw-splits-v1",
                    historyAcquiredAt: row.historyAcquiredAt,
                    actionsAcquiredAt: row.actionsAcquiredAt,
                    observedThrough: row.observedThrough,
                    checkedThrough: row.checkedThrough,
                  },
            revision: row.revision,
            issue: row.issue,
            retryAt: row.retry_at,
          });
        }
        offset += data.length;
      }
      return result;
    },
    async claim(scope: string, symbol: string): Promise<BulkRadarLease | null> {
      scopeSymbol(scope, symbol);
      const result = await rpc("auryn_bulk_radar_claim", {
        p_scope: scope,
        p_symbol: symbol,
      });
      if (result === null) return null;
      const r = result as BulkRadarLease;
      if (
        !r ||
        !uuid.test(r.token) ||
        !Number.isSafeInteger(r.revision) ||
        r.revision < 0
      )
        throw Error("Bulk radar storage returned an invalid lease.");
      return r;
    },
    async publish(
      scope: string,
      symbol: string,
      token: string,
      expectedRevision: number,
      snapshot: BulkRadarSnapshot,
    ) {
      scopeSymbol(scope, symbol);
      if (
        !uuid.test(token) ||
        !Number.isSafeInteger(expectedRevision) ||
        expectedRevision < 0
      )
        throw Error("Invalid bulk radar lease.");
      return bool(
        await rpc("auryn_bulk_radar_publish", {
          p_scope: scope,
          p_symbol: symbol,
          p_token: token,
          p_revision: expectedRevision,
          p_snapshot: validateRadarSnapshot(snapshot, symbol),
        }),
      );
    },
    async fail(
      scope: string,
      symbol: string,
      token: string,
      issue: BulkRadarIssue,
      retryAt: string,
    ) {
      scopeSymbol(scope, symbol);
      if (!uuid.test(token) || !Number.isFinite(Date.parse(retryAt)))
        throw Error("Invalid bulk radar retry.");
      return bool(
        await rpc("auryn_bulk_radar_fail", {
          p_scope: scope,
          p_symbol: symbol,
          p_token: token,
          p_issue: issue,
          p_retry_at: retryAt,
        }),
      );
    },
    async readSourceCooldown(
      scope: string,
      date: string,
    ): Promise<string | null> {
      sourceDate(scope, date);
      const result = await rpc("auryn_bulk_radar_source_cooldown", {
        p_scope: scope,
        p_date: date,
      });
      if (result === null) return null;
      if (
        typeof result !== "string" ||
        !Number.isFinite(Date.parse(result)) ||
        !/(?:Z|[+-]\d{2}:\d{2})$/.test(result)
      )
        throw Error("Bulk source cooldown returned an invalid expiry.");
      return Date.parse(result) > Date.now() ? result : null;
    },
    async pauseSource(
      scope: string,
      date: string,
      retryAt: string,
    ): Promise<void> {
      sourceDate(scope, date);
      const expiry = Date.parse(retryAt);
      if (
        !Number.isFinite(expiry) ||
        expiry <= Date.now() ||
        expiry > Date.now() + 86400000
      )
        throw Error("Invalid bulk source retry.");
      if (
        !bool(
          await rpc("auryn_bulk_radar_source_pause", {
            p_scope: scope,
            p_date: date,
            p_retry_at: retryAt,
          }),
        )
      )
        throw Error("Bulk source cooldown was not saved.");
    },
    async prune() {
      const result = await rpc("auryn_bulk_radar_prune", {});
      if (
        typeof result !== "number" ||
        !Number.isInteger(result) ||
        result < 0 ||
        result > 1000
      )
        throw Error("Bulk radar storage returned an invalid retention result.");
      return result;
    },
  };
}
