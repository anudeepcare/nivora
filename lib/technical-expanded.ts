import type { Candle } from "./types";
import { priceStudies } from "./price-studies.ts";
export function expandedStudies(
  bars: Candle[],
  asOf: string,
  benchmark: Candle[] = [],
) {
  const rows = [
    ...new Map(
      bars
        .filter(
          (b) =>
            b.time.length === 10 &&
            b.time < asOf.slice(0, 10) &&
            [b.open, b.high, b.low, b.close].every(
              (x) => Number.isFinite(x) && x > 0,
            ),
        )
        .map((b) => [b.time, b]),
    ).values(),
  ].sort((a, b) => a.time.localeCompare(b.time));
  const last = rows.at(-1),
    studies = priceStudies(rows, asOf),
    n = 14;
  let tr = 0,
    plus = 0,
    minus = 0,
    atr: number | null = null,
    adx: number | null = null,
    obv = 0;
  const dx: number[] = [];
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1],
      b = rows[i],
      range = Math.max(
        b.high - b.low,
        Math.abs(b.high - a.close),
        Math.abs(b.low - a.close),
      ),
      up = b.high - a.high,
      down = a.low - b.low,
      p = up > down && up > 0 ? up : 0,
      m = down > up && down > 0 ? down : 0;
    obv += b.close > a.close ? b.volume : b.close < a.close ? -b.volume : 0;
    if (i <= n) {
      tr += range;
      plus += p;
      minus += m;
    } else {
      tr = tr - tr / n + range;
      plus = plus - plus / n + p;
      minus = minus - minus / n + m;
    }
    if (i >= n) {
      atr = tr / n;
      const total = plus + minus;
      dx.push(total > 0 ? (100 * Math.abs(plus - minus)) / total : 0);
      if (dx.length === n) adx = dx.reduce((s, v) => s + v, 0) / n;
      else if (dx.length > n) adx = (adx! * (n - 1) + dx.at(-1)!) / n;
    }
  }
  const avgVolume =
    rows.length >= 21
      ? rows.slice(-21, -1).reduce((s, b) => s + b.volume, 0) / 20
      : 0;
  const bb = studies.bands,
    width = bb ? bb.high - bb.low : 0,
    peak = rows.length ? Math.max(...rows.slice(-252).map((b) => b.close)) : 0;
  const benchmarkByDay = new Map(
    benchmark
      .filter((b) => b.time < asOf.slice(0, 10))
      .map((b) => [b.time, b.close]),
  );
  const shared = rows
    .filter((b) => (benchmarkByDay.get(b.time) ?? 0) > 0)
    .slice(-64);
  const relativeReturn =
    shared.length === 64
      ? 100 *
        (shared.at(-1)!.close / shared[0].close -
          1 -
          (benchmarkByDay.get(shared.at(-1)!.time)! /
            benchmarkByDay.get(shared[0].time)! -
            1))
      : null;
  return {
    adx,
    atr,
    atrPct: atr != null && last ? (atr / last.close) * 100 : null,
    obv: rows.some((b) => b.volume > 0) ? obv : null,
    relativeVolume: avgVolume > 0 && last ? last.volume / avgVolume : null,
    bandwidth: bb && bb.mid > 0 ? (width / bb.mid) * 100 : null,
    percentB:
      bb && width > 0 && last ? ((last.close - bb.low) / width) * 100 : null,
    drawdown: peak > 0 && last ? (last.close / peak - 1) * 100 : null,
    relativeReturn,
  };
}
