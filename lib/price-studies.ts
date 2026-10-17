import type { Candle } from "./types";
/** Daily studies use completed dated observations only; no additional provider calls. */
export function priceStudies(bars: Candle[], asOf: string) {
  const closes = [
    ...new Map(
      bars
        .filter(
          (b) =>
            /^\d{4}-\d{2}-\d{2}$/.test(b.time) &&
            b.time < asOf.slice(0, 10) &&
            Number.isFinite(b.close) &&
            b.close > 0,
        )
        .map((b) => [b.time, b]),
    ).values(),
  ]
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((b) => b.close);
  const ema = (values: number[], length: number): (number | null)[] => {
    let previous: number | null = null;
    return values.map((value, i) => {
      if (i < length - 1) return null;
      previous =
        previous == null
          ? values.slice(0, length).reduce((s, v) => s + v, 0) / length
          : previous + ((value - previous) * 2) / (length + 1);
      return previous;
    });
  };
  const fast = ema(closes, 12),
    slow = ema(closes, 26);
  const line = fast.flatMap((v, i) =>
    v != null && slow[i] != null ? [v - slow[i]!] : [],
  );
  const macd = line.at(-1) ?? null,
    signal = ema(line, 9).at(-1) ?? null;
  const window = closes.slice(-20);
  const mid =
    window.length === 20 ? window.reduce((s, v) => s + v, 0) / 20 : null;
  const sigma =
    mid == null
      ? null
      : Math.sqrt(window.reduce((s, v) => s + (v - mid) ** 2, 0) / 20);
  return {
    ema20: ema(closes, 20).at(-1) ?? null,
    macd,
    signal,
    histogram: macd != null && signal != null ? macd - signal : null,
    bands:
      mid != null && sigma != null
        ? { low: mid - 2 * sigma, mid, high: mid + 2 * sigma }
        : null,
  };
}
