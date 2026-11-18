import { providerIdentity, providerSymbol } from "./provider-symbol.ts";
import type { Candle } from "./types";
export type RawBar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
export type Split = { date: string; split: string };
export type BulkRadarSnapshot = {
  symbol: string;
  policy: "raw-splits-v1";
  raw: RawBar[];
  splits: Split[];
  historyAcquiredAt: string;
  actionsAcquiredAt: string;
  observedThrough: string;
  checkedThrough: string;
};
export type CompactBar = [
  string,
  string,
  number,
  number,
  number,
  number,
  number,
];
export type BulkPriceDay = {
  status: "ready" | "unavailable";
  date: string;
  rows: CompactBar[];
  issue: string | null;
};
const day = (s: unknown): s is string =>
  typeof s === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  Number.isFinite(Date.parse(s)) &&
  new Date(s).toISOString().slice(0, 10) === s;
const record = (x: unknown): Record<string, unknown> =>
  x !== null && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : {};
export function radarSymbol(value: unknown) {
  if (typeof value !== "string") throw Error("Invalid symbol");
  const symbol = providerIdentity(providerSymbol(value));
  if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol))
    throw Error("Unsupported US identity");
  return symbol;
}
function bar(x: unknown): RawBar {
  const r = record(x);
  if (
    !day(r.date) ||
    ![r.open, r.high, r.low, r.close].every(
      (v) => typeof v === "number" && Number.isFinite(v) && v > 0,
    ) ||
    typeof r.volume !== "number" ||
    !Number.isFinite(r.volume) ||
    r.volume < 0
  )
    throw Error("Invalid raw bar");
  const b = r as RawBar;
  if (
    b.high < Math.max(b.open, b.close, b.low) ||
    b.low > Math.min(b.open, b.close)
  )
    throw Error("Invalid OHLC ordering");
  return {
    date: b.date,
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
    volume: b.volume,
  };
}
export function splitRows(rows: unknown, through: string): Split[] {
  if (!Array.isArray(rows) || rows.length > 256)
    throw Error("Invalid split history");
  const seen = new Set<string>();
  return rows
    .map((x) => {
      const r = record(x);
      const match =
        typeof r.split === "string"
          ? /^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(r.split)
          : null;
      if (
        !day(r.date) ||
        r.date > through ||
        seen.has(r.date) ||
        !match ||
        !Number.isFinite(Number(match[1]) / Number(match[2])) ||
        Number(match[1]) <= 0 ||
        Number(match[2]) <= 0
      )
        throw Error("Invalid or conflicting split history");
      seen.add(r.date);
      return { date: r.date, split: r.split as string };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
export function bootstrapRadar(
  symbol: string,
  raw: unknown,
  splits: unknown,
  historyAcquiredAt: string,
  actionsAcquiredAt = historyAcquiredAt,
): BulkRadarSnapshot {
  if (
    !Array.isArray(raw) ||
    !raw.length ||
    raw.length > 300 ||
    !Number.isFinite(Date.parse(historyAcquiredAt)) ||
    !Number.isFinite(Date.parse(actionsAcquiredAt))
  )
    throw Error("Invalid seed history");
  const cutoff = historyAcquiredAt.slice(0, 10),
    seen = new Set<string>();
  const bars = raw.map(bar).sort((a, b) => a.date.localeCompare(b.date));
  for (const b of bars) {
    if (b.date >= cutoff || seen.has(b.date))
      throw Error("Future/current or duplicate raw observation");
    seen.add(b.date);
  }
  const actions = splitRows(splits, cutoff);
  const result: BulkRadarSnapshot = {
    symbol: radarSymbol(symbol),
    policy: "raw-splits-v1",
    raw: bars.slice(-160),
    splits: actions,
    historyAcquiredAt,
    actionsAcquiredAt,
    observedThrough: bars.at(-1)!.date,
    checkedThrough: bars.at(-1)!.date,
  };
  radarCandles(result);
  return result;
}
export function radarCandles(snapshot: BulkRadarSnapshot): Candle[] {
  return snapshot.raw.map((b) => {
    let factor = 1;
    for (const action of snapshot.splits) {
      if (action.date > b.date) {
        const [n, d] = action.split.split("/").map(Number);
        factor *= d / n;
      }
    }
    const values = [b.open, b.high, b.low, b.close].map((v) => v * factor);
    if (!values.every((v) => Number.isFinite(v) && v > 0))
      throw Error("Invalid split-adjusted history");
    return {
      time: b.date,
      open: values[0],
      high: values[1],
      low: values[2],
      close: values[3],
      volume: b.volume,
    };
  });
}
export function bulkPriceDay(raw: unknown, date: string): BulkPriceDay {
  if (!day(date) || !Array.isArray(raw) || raw.length > 100000)
    throw Error("Invalid daily feed");
  const seen = new Set<string>();
  const rows: CompactBar[] = [];
  for (const x of raw) {
    const r = record(x);
    if (r.exchange_short_name !== "US") throw Error("Wrong exchange");
    let symbol: string;
    try {
      symbol = radarSymbol(r.code);
    } catch {
      continue;
    }
    if (seen.has(symbol)) throw Error("Duplicate daily identity");
    seen.add(symbol);
    if (r.date !== date) continue; // Never relabel stale/delisted rows as the requested session.
    let b: RawBar;
    try {
      b = bar(r);
    } catch {
      continue;
    } // Missing selected names trigger bounded seed fallback, not invented bars.
    rows.push([symbol, b.date, b.open, b.high, b.low, b.close, b.volume]);
  }
  if (!rows.length)
    return {
      status: "unavailable",
      date,
      rows: [],
      issue: "No dated daily observations returned.",
    };
  // Keep shared publisher comfortably below its five-MiB hard limit.
  if (
    new TextEncoder().encode(JSON.stringify(rows)).byteLength >
    4 * 1024 * 1024
  )
    throw Error("Bulk snapshot exceeds supported cache size");
  return { status: "ready", date, rows, issue: null };
}
export function bulkSplits(
  raw: unknown,
  date: string,
): { symbol: string; action: Split }[] {
  if (!Array.isArray(raw) || raw.length > 10000)
    throw Error("Invalid daily actions");
  const seen = new Set<string>();
  return raw.map((x) => {
    const r = record(x);
    if (r.exchange !== "US" || r.date !== date)
      throw Error("Action date/exchange mismatch");
    const symbol = radarSymbol(r.code);
    if (seen.has(symbol)) throw Error("Conflicting daily action");
    seen.add(symbol);
    return { symbol, action: splitRows([r], date)[0] };
  });
}
export function completedWeekday(now = Date.now()) {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6)
    d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
export function canAppend(snapshot: BulkRadarSnapshot, date: string) {
  if (snapshot.observedThrough >= date) return false;
  let count = 0;
  for (
    let t = Date.parse(snapshot.observedThrough) + 86400000;
    t <= Date.parse(date);
    t += 86400000
  ) {
    const d = new Date(t).getUTCDay();
    if (d !== 0 && d !== 6) count++;
    if (count > 1) return false;
  }
  return count === 1;
}
export const bulkRadarLimitations =
  "Price-only radar. Historical bars retain their recorded acquisition vintage and may later be restated; daily updates do not prove the entire history is reconciled today. Empty split feeds are source responses for a requested date, not independent confirmation of action completeness.";

export function validateRadarSnapshot(
  input: unknown,
  expectedSymbol?: string,
  now = Date.now(),
): BulkRadarSnapshot {
  const s = record(input) as unknown as BulkRadarSnapshot;
  if (
    s.policy !== "raw-splits-v1" ||
    radarSymbol(s.symbol) !== s.symbol ||
    (expectedSymbol && s.symbol !== expectedSymbol) ||
    !Array.isArray(s.raw) ||
    !s.raw.length ||
    s.raw.length > 160 ||
    !day(s.observedThrough) ||
    !day(s.checkedThrough) ||
    s.observedThrough !== s.checkedThrough ||
    s.checkedThrough >= new Date(now).toISOString().slice(0, 10) ||
    ![s.historyAcquiredAt, s.actionsAcquiredAt].every(
      (x) =>
        typeof x === "string" &&
        Number.isFinite(Date.parse(x)) &&
        Date.parse(x) <= now,
    )
  )
    throw Error("Invalid stored raw history");
  const rows = s.raw.map(bar),
    seen = new Set<string>();
  for (const r of rows) {
    if (seen.has(r.date) || r.date > s.checkedThrough)
      throw Error("Invalid raw history dates");
    seen.add(r.date);
  }
  if (
    rows.some((r, i) => i > 0 && r.date <= rows[i - 1].date) ||
    rows.at(-1)!.date !== s.observedThrough
  )
    throw Error("Unordered raw history");
  const result = {
    ...s,
    raw: rows,
    splits: splitRows(s.splits, s.checkedThrough),
  };
  radarCandles(result);
  return result;
}

export function completedRadarDate(value: unknown, now = Date.now()): string {
  if (!day(value) || value >= new Date(now).toISOString().slice(0, 10))
    throw Error("A completed historical date is required");
  return value;
}
