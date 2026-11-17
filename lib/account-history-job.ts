import { createHash } from "node:crypto";
import {
  accountHistory,
  historyScope,
  AccountHistoryError,
} from "./account-history.ts";
export const HISTORY_JOB_VERSION = "raw-ledger-v1";
export type HistoryTask = {
  path: string;
  params: Record<string, string>;
  ttl: number;
  optional: boolean;
  done: boolean;
  value?: unknown;
  failed?: boolean;
};
export type HistoryJobState = {
  now: number;
  ledgerDigest: string;
  tasks: HistoryTask[];
};
export const historyLedgerDigest = (rows: unknown) =>
  createHash("sha256").update(JSON.stringify(rows)).digest("hex");
type Reader = (
  path: string,
  params: Record<string, string>,
  ttl: number,
) => Promise<unknown>;
const key = (path: string, params: Record<string, string>) =>
  JSON.stringify([path, Object.entries(params).sort()]);
/** Frozen one-year evidence windows; never stitch adjusted benchmark price snapshots. */
export function createHistoryJob(
  rows: unknown,
  now = Date.now(),
): HistoryJobState {
  const { from, through, symbols } = historyScope(rows, true, now, 50);
  const tasks: HistoryTask[] = [];
  function add(
    path: string,
    params: Record<string, string>,
    ttl: number,
    optional = false,
  ) {
    const existing = tasks.find(
      (t) => key(t.path, t.params) === key(path, params),
    );
    if (existing) {
      existing.optional &&= optional;
      return;
    }
    tasks.push({ path, params, ttl, optional, done: false });
  }
  for (const symbol of symbols) {
    add(`fundamentals/${symbol}.US`, { filter: "General" }, 86400000);
    add(
      `eod/${symbol}.US`,
      { from, to: through, period: "d", order: "a" },
      900000,
    );
    add(`splits/${symbol}.US`, { from, to: through }, 86400000);
  }
  for (const symbol of ["SPY", "QQQ"]) {
    add(`fundamentals/${symbol}.US`, { filter: "General" }, 86400000, true);
    add(
      `eod/${symbol}.US`,
      { from, to: through, period: "d", order: "a" },
      900000,
      true,
    );
  }
  return { now, ledgerDigest: historyLedgerDigest(rows), tasks };
}
/** Exactly two endpoint tasks per request. Persist state before resuming; no background promises. */
export async function advanceHistoryJob(
  rows: unknown,
  state: HistoryJobState,
  read: Reader,
) {
  // State is service-written only. Revision + digest prevent replay against another ledger.
  // Avoid reconciling 5,000 rows on every progress step; preflight and finalization do it once each.
  if (
    historyLedgerDigest(rows) !== state.ledgerDigest ||
    state.tasks.length > 154
  )
    throw Error("History job does not match the saved ledger.");
  let retry = false;
  await Promise.all(
    state.tasks
      .filter((t) => !t.done)
      .slice(0, 2)
      .map(async (task) => {
        try {
          const value = await read(task.path, task.params, task.ttl);
          if (JSON.stringify(value)?.length > 500000)
            throw Error("Evidence exceeds bounded storage.");
          task.value = value;
          task.done = true;
        } catch {
          if (task.optional) {
            task.done = true;
            task.failed = true;
          } else retry = true;
        }
      }),
  );
  if (state.tasks.some((t) => !t.done)) return { state, result: null, retry };
  let result;
  try {
    result = await accountHistory(
      rows,
      true,
      async (path, params) => {
        const task = state.tasks.find(
          (t) => key(t.path, t.params) === key(path, params),
        );
        if (!task?.done || task.failed)
          throw Error("History evidence unavailable.");
        return task.value;
      },
      state.now,
      50,
    );
  } catch (error) {
    if (!(error instanceof AccountHistoryError)) throw error;
    result = {
      status: "unavailable" as const,
      reason: error.message,
      points: [],
      benchmarks: [],
      requestedThrough: new Date(state.now - 86400000)
        .toISOString()
        .slice(0, 10),
      lastValuationDate: null,
      ledgerCompleteness: "user-confirmed" as const,
    };
  }
  return { state, result, retry };
}
