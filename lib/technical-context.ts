import type { Candle } from "./types";
import { adaptiveSettledBars } from "./accumulation-policy-v3.ts";
import { weekKey, weekEndSession } from "./accumulation-weekly.ts";
import { evidenceMemo } from "./evidence-memo.ts";
function compute(
  input: Candle[],
  asOf: string,
  market: "us-equity" | "crypto",
) {
  const rows = adaptiveSettledBars(input, asOf, market).filter(
      (b) => b.time < asOf.slice(0, 10),
    ),
    last = rows.at(-1),
    typical = (b: Candle) => (b.high + b.low + b.close) / 3;
  const range = (n: number) => {
    if (rows.length <= n) return null;
    const b = rows.slice(-n - 1, -1);
    return {
      high: Math.max(...b.map((x) => x.high)),
      low: Math.min(...b.map((x) => x.low)),
    };
  };
  let cci: number | null = null,
    williamsR: number | null = null,
    mfi: number | null = null,
    efficiency: number | null = null;
  if (rows.length >= 20) {
    const p = rows.slice(-20).map(typical),
      mean = p.reduce((s, x) => s + x, 0) / 20,
      dev = p.reduce((s, x) => s + Math.abs(x - mean), 0) / 20;
    cci = dev > 0 ? (p.at(-1)! - mean) / (0.015 * dev) : 0;
  }
  if (rows.length >= 14) {
    const b = rows.slice(-14),
      hi = Math.max(...b.map((x) => x.high)),
      lo = Math.min(...b.map((x) => x.low));
    williamsR = hi > lo ? (-100 * (hi - last!.close)) / (hi - lo) : null;
  }
  if (
    rows.length >= 15 &&
    rows.slice(-15).every((b) => Number.isFinite(b.volume) && b.volume > 0)
  ) {
    const b = rows.slice(-15);
    let positive = 0,
      negative = 0;
    for (let i = 1; i < b.length; i++) {
      const p = typical(b[i]),
        before = typical(b[i - 1]),
        flow = p * b[i].volume;
      if (p > before) positive += flow;
      else if (p < before) negative += flow;
    }
    mfi =
      positive + negative > 0 ? (100 * positive) / (positive + negative) : null;
  }
  if (rows.length >= 11) {
    const b = rows.slice(-11),
      travel = b
        .slice(1)
        .reduce((s, x, i) => s + Math.abs(x.close - b[i].close), 0);
    efficiency =
      travel > 0 ? Math.abs(b.at(-1)!.close - b[0].close) / travel : 0;
  }
  const weeks = new Map<string, Candle>();
  for (const b of rows) {
    const key = weekKey(b.time, market);
    // Select the expected completed close itself. A spurious Friday holiday
    // observation must not overwrite a valid Thursday close and erase a week.
    if (b.time === weekEndSession(key, market)) weeks.set(key, b);
  }
  const weekly = [...weeks.entries()];
  const wma = (n: number) => {
    if (weekly.length < n) return null;
    const selected = weekly.slice(-n);
    if (
      selected.some(
        ([key], i) =>
          i > 0 &&
          Date.parse(key) - Date.parse(selected[i - 1][0]) !== 7 * 86400000,
      )
    )
      return null;
    return (
      selected.reduce((s, [, b], i) => s + b.close * (i + 1), 0) /
      ((n * (n + 1)) / 2)
    );
  };
  return {
    asOf: last?.time ?? null,
    cci,
    williamsR,
    mfi,
    efficiency,
    donchian20: range(20),
    donchian55: range(55),
    wma50Week: wma(50),
    wma200Week: wma(200),
    weeklyAsOf: weekly.at(-1)?.[1].time ?? null,
  };
}
const memo = evidenceMemo<ReturnType<typeof compute>>();
export function technicalContext(
  input: Candle[],
  asOf: string,
  market: "us-equity" | "crypto" = "us-equity",
) {
  return memo(input, `${asOf}:${market}`, () => compute(input, asOf, market));
}
