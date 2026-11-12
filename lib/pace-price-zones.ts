import type { Candle } from "./types";
import {
  adaptiveSettledBars,
  researchAccumulation,
} from "./accumulation-policy-v7.ts";
import { makePacePriceEvaluator } from "./pace-price-evaluator.ts";
export type PacePriceRange = { level: number; low: number; high: number };
export type PacePriceZones = {
  ranges: PacePriceRange[];
  reference: number;
  from: number;
  to: number;
  date: string;
  policy: string;
};
const cache = new WeakMap<Candle[], Map<string, PacePriceZones>>();
/** Sampled conditional ranges, including disconnected zones; never impose monotonic thresholds. */
export async function pacePriceZones(
  bars: Candle[],
  asOf: string,
  period: "forming" | "confirmed",
  market: "us-equity" | "crypto" = "us-equity",
  signal?: AbortSignal,
): Promise<PacePriceZones | null> {
  const reading = researchAccumulation(bars, asOf, market)[period];
  if (!reading) return null;
  const key = [
    period,
    market,
    reading.date,
    reading.close,
    reading.multiplier,
    reading.policyVersion,
  ].join(":");
  const hit = cache.get(bars)?.get(key);
  if (hit) return hit;
  const rows = adaptiveSettledBars(bars, asOf, market).filter(
    (b) => b.time <= reading.date,
  );
  if (!rows.length) return null;
  const prices = rows.slice(-756).map((b) => b.close);
  const low = Math.max(
    0.000001,
    Math.min(reading.close * 0.1, Math.min(...prices) * 0.25),
  );
  const high = Math.max(
    reading.close * 5,
    Math.max(...prices) * 4,
    reading.pauseAbove * 1.25,
  );
  if (!Number.isFinite(high) || high <= low) return null;
  const at = makePacePriceEvaluator(
    rows,
    reading.policyVersion === "monthly-v7"
      ? "monthly-v7"
      : reading.policyVersion === "monthly-v6",
  );
  const grid = [
    ...Array.from(
      { length: 513 },
      (_, i) => low * Math.exp((Math.log(high / low) * i) / 512),
    ),
    reading.close,
  ].sort((a, b) => a - b);
  const ranges: PacePriceRange[] = [];
  let previous = grid[0],
    level = at(previous),
    start = previous;
  const boundary = (
    a: number,
    la: number,
    b: number,
    lb: number,
    depth = 0,
  ): { price: number; next: number }[] => {
    if (depth >= 18) return [{ price: (a + b) / 2, next: lb }];
    const mid = (a + b) / 2,
      lm = at(mid);
    if (lm === null) return [{ price: mid, next: lb }];
    if (lm === la) return boundary(mid, la, b, lb, depth + 1);
    if (lm === lb) return boundary(a, la, mid, lm, depth + 1);
    return [
      ...boundary(a, la, mid, lm, depth + 1),
      ...boundary(mid, lm, b, lb, depth + 1),
    ];
  };
  for (let i = 1; i < grid.length; i++) {
    if (signal?.aborted) throw new DOMException("Scan cancelled", "AbortError");
    if (i % 12 === 0)
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const price = grid[i],
      next = at(price);
    if (next !== level) {
      if (level !== null && next !== null) {
        for (const change of boundary(previous, level, price, next)) {
          ranges.push({ level, low: start, high: change.price });
          start = change.price;
          level = change.next;
        }
      } else {
        if (level !== null) ranges.push({ level, low: start, high: previous });
        start = price;
        level = next;
      }
    }
    previous = price;
  }
  if (level !== null) ranges.push({ level, low: start, high });
  const result = {
    ranges,
    reference: reading.close,
    from: low,
    to: high,
    date: reading.date,
    policy: reading.policyVersion,
  };
  if (!signal?.aborted) {
    const bucket = cache.get(bars) ?? new Map();
    bucket.set(key, result);
    if (bucket.size > 6) bucket.delete(bucket.keys().next().value!);
    cache.set(bars, bucket);
  }
  return result;
}
