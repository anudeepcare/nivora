import { settledStudyBars, type StudyMarket } from "./settled-study-bars.ts";
import { evidenceMemo } from "./evidence-memo.ts";
import type { Candle } from "./types";
/** Daily studies use completed dated observations only; no additional provider calls. */
function computePriceStudies(
  bars: Candle[],
  asOf: string,
  market: StudyMarket,
) {
  const closes = settledStudyBars(bars, asOf, market).map((b) => b.close);
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

const studiesMemo = evidenceMemo<ReturnType<typeof computePriceStudies>>();
export function priceStudies(
  bars: Candle[],
  asOf: string,
  market: StudyMarket = "crypto",
) {
  return studiesMemo(bars, `${bars.length}:${asOf}:${market}`, () =>
    computePriceStudies(bars, asOf, market),
  );
}
