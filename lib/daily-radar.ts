import { providerSymbol, providerIdentity } from "./provider-symbol.ts";
import type { Candle } from "./types";
export type DailyRadarRow = {
  symbol: string;
  status: "ready" | "unavailable" | "pending";
  history: Candle[];
  observedThrough: string | null;
  checkedAt: string | null;
  retryAt: string | null;
  issue: string | null;
};
export type DailyRadarSnapshot = {
  incremental?: boolean;
  nextCursor?: number | null;
  day: string;
  requested: number;
  eligible: number;
  excluded: number;
  completed: number;
  ready: number;
  pending: number;
  rows: DailyRadarRow[];
  retryAfterSeconds: number;
};
export function radarUniverse(
  positions: { symbol: string; asset_type?: string }[],
  watchlist: { symbol: string }[],
) {
  const canonical = (s: string) => providerIdentity(providerSymbol(s));
  const crypto = new Set(
    positions
      .filter((p) => p.asset_type === "crypto")
      .map((p) => {
        try {
          return canonical(p.symbol);
        } catch {
          return p.symbol.trim().toUpperCase();
        }
      }),
  );
  const entries = new Map<string, boolean>();
  for (const raw of [
    ...positions.filter((p) => p.asset_type !== "cash").map((p) => p.symbol),
    ...watchlist.map((p) => p.symbol),
  ]) {
    try {
      const symbol = canonical(raw);
      entries.set(
        symbol,
        !crypto.has(symbol) && /^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol),
      );
    } catch {
      entries.set(raw.trim().toUpperCase(), false);
    }
  }
  const symbols = [...entries]
    .filter(([, eligible]) => eligible)
    .map(([symbol]) => symbol)
    .sort();
  return {
    symbols,
    requested: entries.size,
    excluded: entries.size - symbols.length,
  };
}
export function dailyRadarSnapshot(
  day: string,
  universe: ReturnType<typeof radarUniverse>,
  rows: DailyRadarRow[],
  now = Date.now(),
): DailyRadarSnapshot {
  const bySymbol = new Map(rows.map((row) => [row.symbol, row]));
  const selected = universe.symbols.map(
    (symbol) =>
      bySymbol.get(symbol) ?? {
        symbol,
        status: "pending" as const,
        history: [],
        observedThrough: null,
        checkedAt: null,
        retryAt: null,
        issue: null,
      },
  );
  const pending = selected.filter((r) => r.status === "pending");
  const cooling = pending.filter(
    (r) => r.issue && r.retryAt && Date.parse(r.retryAt) > now,
  );
  const next = (cooling.length ? cooling : pending)
    .map((r) => (r.retryAt ? Date.parse(r.retryAt) : now))
    .filter(Number.isFinite);
  return {
    day,
    requested: universe.requested,
    eligible: universe.symbols.length,
    excluded: universe.excluded,
    completed: selected.length - pending.length,
    ready: selected.filter((r) => r.status === "ready").length,
    pending: pending.length,
    rows: selected,
    retryAfterSeconds: pending.length
      ? Math.max(3, Math.ceil((Math.min(...next) - now) / 1000))
      : 0,
  };
}
