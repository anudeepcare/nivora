import {
  bulkRadarLimitations,
  validateRadarSnapshot,
  canAppend,
  completedWeekday,
  radarCandles,
  type BulkRadarSnapshot,
  type BulkPriceDay,
  type Split,
} from "./bulk-radar";
import type { DailyRadarSnapshot, DailyRadarRow } from "./daily-radar";
type MetaSnapshot = Omit<BulkRadarSnapshot, "raw" | "splits">;
type Stored<T> = {
  snapshot: T | null;
  revision: number;
  issue: string | null;
  retryAt: string | null;
};
type Store = {
  readSourceCooldown: (scope: string, date: string) => Promise<string | null>;
  pauseSource: (scope: string, date: string, retryAt: string) => Promise<void>;
  readMeta: (
    scope: string,
    symbols: string[],
  ) => Promise<Map<string, Stored<MetaSnapshot>>>;
  read: (
    scope: string,
    symbols: string[],
  ) => Promise<Map<string, Stored<BulkRadarSnapshot>>>;
  claim: (
    scope: string,
    symbol: string,
  ) => Promise<{ token: string; revision: number } | null>;
  publish: (
    scope: string,
    symbol: string,
    token: string,
    revision: number,
    snapshot: BulkRadarSnapshot,
  ) => Promise<boolean>;
  fail: (
    scope: string,
    symbol: string,
    token: string,
    issue: "provider_unavailable" | "history_unavailable",
    retryAt: string,
  ) => Promise<boolean>;
};
type Provider = {
  scope: string;
  seed: (symbol: string, date: string) => Promise<BulkRadarSnapshot>;
  daily: (date: string) => Promise<{
    prices: BulkPriceDay;
    actions: { symbol: string; action: Split }[];
    pricesAcquiredAt: string;
    actionsAcquiredAt: string | null;
  }>;
};
export async function runBulkRadar(
  universe: { symbols: string[]; requested: number; excluded: number },
  advance: boolean,
  cursor: number,
  deps: {
    store: Store;
    provider: Provider;
    allow: () => Promise<boolean>;
    now?: () => number;
    signal?: AbortSignal;
  },
): Promise<DailyRadarSnapshot> {
  deps.signal?.throwIfAborted();
  const now = deps.now ?? Date.now,
    day = new Date(now()).toISOString().slice(0, 10),
    target = completedWeekday(now()),
    scope = deps.provider.scope;
  if (
    universe.symbols.length > 1000 ||
    !Number.isSafeInteger(cursor) ||
    cursor < 0 ||
    cursor > 1000
  )
    throw Error("Invalid bulk radar page");
  const age = (s: MetaSnapshot) => now() - Date.parse(s.historyAcquiredAt);
  const fresh = (s: MetaSnapshot | null) =>
    !!s &&
    s.policy === "raw-splits-v1" &&
    s.observedThrough === target &&
    s.checkedThrough === target &&
    age(s) <= 30 * 86400000;
  let meta = await deps.store.readMeta(scope, universe.symbols);
  const due = universe.symbols.filter(
    (s) =>
      !fresh(meta.get(s)?.snapshot ?? null) &&
      (!meta.get(s)?.retryAt || Date.parse(meta.get(s)!.retryAt!) <= now()),
  );
  const changed: string[] = [];
  const storedPause = await deps.store.readSourceCooldown(scope, target);
  let sourceRetryAt =
    storedPause && Date.parse(storedPause) > now() ? storedPause : null;
  if (advance && due.length && !sourceRetryAt) {
    if (!(await deps.allow()))
      throw Error(
        "Daily market allowance reached; existing radar observations are retained.",
      );
    let seedCount = 0,
      daily: Awaited<ReturnType<Provider["daily"]>> | undefined,
      dailyFailed = false;
    // Verify both bulk datasets first; a denied plan never fans out to seed calls.
    try {
      daily = await deps.provider.daily(target);
      if (daily.prices.status !== "ready" || !daily.actionsAcquiredAt)
        dailyFailed = true;
    } catch {
      dailyFailed = true;
    }
    if (dailyFailed) {
      sourceRetryAt = new Date(now() + 3600000).toISOString();
      await deps.store.pauseSource(scope, target, sourceRetryAt);
    }
    const selected = due.slice(0, 50),
      histories = await deps.store.read(scope, selected);
    for (const symbol of selected) {
      deps.signal?.throwIfAborted();
      const old = histories.get(symbol)?.snapshot ?? null;
      if (fresh(old)) continue;
      const needsSeed =
        !old || age(old) > 30 * 86400000 || !canAppend(old, target);
      if (needsSeed && seedCount >= 2) continue;
      const lease = await deps.store.claim(scope, symbol);
      if (!lease) continue;
      if (lease.revision !== (histories.get(symbol)?.revision ?? 0)) {
        await deps.store.fail(
          scope,
          symbol,
          lease.token,
          "history_unavailable",
          new Date(now() + 3000).toISOString(),
        );
        continue; // Never publish a pre-claim snapshot over a newer generation.
      }
      changed.push(symbol);
      try {
        if (dailyFailed) throw Error("Daily source unavailable");
        if (old) validateRadarSnapshot(old, symbol, now());
        let snapshot: BulkRadarSnapshot;
        if (needsSeed) {
          seedCount++;
          snapshot = await deps.provider.seed(symbol, target);
        } else {
          if (dailyFailed) throw Error("Daily source already failed");
          if (!daily) {
            try {
              daily = await deps.provider.daily(target);
            } catch (error) {
              dailyFailed = true;
              throw error;
            }
          }
          if (daily.prices.status !== "ready" || !daily.actionsAcquiredAt)
            throw Error("Daily source date or actions unavailable");
          const row = daily.prices.rows.find((r) => r[0] === symbol),
            action = daily.actions.some((r) => r.symbol === symbol);
          if (!row || action) {
            if (seedCount >= 2) {
              await deps.store.fail(
                scope,
                symbol,
                lease.token,
                "history_unavailable",
                new Date(now() + 60000).toISOString(),
              );
              continue;
            }
            seedCount++;
            snapshot = await deps.provider.seed(symbol, target);
          } else {
            snapshot = {
              ...old!,
              raw: [
                ...old!.raw,
                {
                  date: row[1],
                  open: row[2],
                  high: row[3],
                  low: row[4],
                  close: row[5],
                  volume: row[6],
                },
              ].slice(-160),
              observedThrough: target,
              checkedThrough: target,
            };
            radarCandles(snapshot);
          }
        }
        validateRadarSnapshot(snapshot, symbol, now());
        // A full rebuild must agree with every known daily action for this
        // instrument. Never silently choose between contradictory source feeds.
        for (const { action } of daily?.actions.filter(
          (r) => r.symbol === symbol,
        ) ?? []) {
          const seeded = snapshot.splits.find((s) => s.date === action.date);
          const ratio = (value: string) => {
            const [numerator, denominator] = value.split("/").map(Number);
            return numerator / denominator;
          };
          if (!seeded || ratio(seeded.split) !== ratio(action.split))
            throw Error("Daily and historical split evidence disagree");
        }
        if (
          snapshot.symbol !== symbol ||
          snapshot.policy !== "raw-splits-v1" ||
          snapshot.observedThrough > target
        )
          throw Error("Invalid seed identity or date");
        deps.signal?.throwIfAborted();
        if (
          !(await deps.store.publish(
            scope,
            symbol,
            lease.token,
            lease.revision,
            snapshot,
          ))
        )
          continue;
        // A holiday/fallback/missing bar is not relabeled as today's completed session.
        if (snapshot.observedThrough !== target) {
          const next = await deps.store.claim(scope, symbol);
          if (next)
            await deps.store.fail(
              scope,
              symbol,
              next.token,
              "history_unavailable",
              new Date(now() + 3600000).toISOString(),
            );
        }
      } catch {
        await deps.store.fail(
          scope,
          symbol,
          lease.token,
          "provider_unavailable",
          new Date(now() + 3600000).toISOString(),
        );
        // Fail metadata only; no per-symbol provider fallback after global failure.
      }
    }
    meta = await deps.store.readMeta(scope, universe.symbols);
  }
  deps.signal?.throwIfAborted();
  const all: DailyRadarRow[] = universe.symbols.map((symbol) => {
    const m = meta.get(symbol),
      s = m?.snapshot ?? null;
    return {
      symbol,
      status: fresh(s) ? "ready" : "pending",
      history: [],
      observedThrough: s?.observedThrough ?? null,
      checkedAt: null,
      retryAt: m?.retryAt ?? null,
      issue: m?.issue
        ? "Source refresh is incomplete; retained history is not current."
        : null,
      ...(s
        ? {
            stale: !fresh(s),
            historyAcquiredAt: s.historyAcquiredAt,
            actionsAcquiredAt: s.actionsAcquiredAt,
          }
        : {}),
    };
  });
  const populated = all.filter((r) => !!r.observedThrough).map((r) => r.symbol);
  const page = advance ? changed : populated.slice(cursor, cursor + 50);
  const histories = await deps.store.read(scope, page);
  const rows = page.flatMap((symbol) => {
    const state = histories.get(symbol);
    const status = all.find((r) => r.symbol === symbol);
    return state?.snapshot && status
      ? [{ ...status, history: radarCandles(state.snapshot) }]
      : [];
  });
  const ready = all.filter((r) => r.status === "ready").length;
  const cooling = all
    .filter((r) => r.status !== "ready")
    .map((r) => (r.retryAt ? Date.parse(r.retryAt) : now()));
  return {
    mode: "bulk-opt-in",
    ...(sourceRetryAt
      ? { sourceStatus: "unavailable" as const, sourceRetryAt }
      : {}),
    limitations: [
      bulkRadarLimitations,
      "Cold history is bootstrapped at most two instruments per continuation. Coverage may remain partial; no automatic exchange-wide backfill or provider-denial fallback storm.",
    ],
    day,
    requested: universe.requested,
    eligible: all.length,
    excluded: universe.excluded,
    completed: ready,
    ready,
    pending: all.length - ready,
    rows,
    incremental: advance || cursor > 0,
    nextCursor: !advance && cursor + 50 < populated.length ? cursor + 50 : null,
    retryAfterSeconds: sourceRetryAt
      ? Math.max(3, Math.ceil((Date.parse(sourceRetryAt) - now()) / 1000))
      : ready === all.length
        ? 0
        : Math.max(3, Math.ceil((Math.min(...cooling) - now()) / 1000)),
  };
}
