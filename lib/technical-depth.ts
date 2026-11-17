import type { Candle } from "./types";
export function fibOverlay(low: number, high: number, custom = false) {
  if (
    !Number.isFinite(low) ||
    !Number.isFinite(high) ||
    low <= 0 ||
    high <= low
  )
    return [];
  return [
    0,
    0.236,
    0.382,
    0.5,
    0.618,
    ...(custom ? [0.686] : []),
    0.786,
    1,
    1.272,
    1.618,
  ].map((ratio) => ({
    ratio,
    price:
      Math.round(
        (ratio <= 1
          ? high - (high - low) * ratio
          : low + (high - low) * ratio) * 1e6,
      ) / 1e6,
    kind:
      ratio === 0.686
        ? "custom"
        : ratio > 1
          ? "extension"
          : ratio === 0.5
            ? "common convention"
            : "retracement",
  }));
}
export function trendMarkers(bars: Candle[], asOf: string) {
  const rows = bars
    .filter(
      (b) => b.time.length === 10 && b.time < asOf.slice(0, 10) && b.close > 0,
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  const result: {
    time: string;
    price: number;
    label: string;
    invalidation: number;
  }[] = [];
  let previous = false;
  for (let i = 199; i < rows.length; i++) {
    const ma50 =
        rows.slice(i - 49, i + 1).reduce((s, b) => s + b.close, 0) / 50,
      ma200 = rows.slice(i - 199, i + 1).reduce((s, b) => s + b.close, 0) / 200,
      active = rows[i].close > ma50 && ma50 > ma200;
    if (active && !previous)
      result.push({
        time: rows[i].time,
        price: rows[i].close,
        label: "Trend alignment",
        invalidation: ma50,
      });
    previous = active;
  }
  return result;
}
export function correlation(
  a: { time: string; close: number }[],
  b: { time: string; close: number }[],
): number | null {
  const map = new Map(b.map((x) => [x.time, x.close])),
    pairs = a
      .filter((x) => map.has(x.time) && x.close > 0 && map.get(x.time)! > 0)
      .sort((x, y) => x.time.localeCompare(y.time));
  if (pairs.length < 61) return null;
  const returns = pairs
    .slice(1)
    .map((x, i) => [
      x.close / pairs[i].close - 1,
      map.get(x.time)! / map.get(pairs[i].time)! - 1,
    ]);
  const mean = (j: number) =>
      returns.reduce((s, x) => s + x[j], 0) / returns.length,
    mx = mean(0),
    my = mean(1);
  let xy = 0,
    xx = 0,
    yy = 0;
  for (const [x, y] of returns) {
    xy += (x - mx) * (y - my);
    xx += (x - mx) ** 2;
    yy += (y - my) ** 2;
  }
  return xx > 0 && yy > 0 ? xy / Math.sqrt(xx * yy) : null;
}
