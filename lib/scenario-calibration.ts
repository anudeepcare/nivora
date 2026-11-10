import type { Candle } from "./types";
import { adaptiveSettledBars } from "./accumulation-policy-v3.ts";

/** "empirical": percentiles of the instrument's own overlapping returns, drift included.
 * "risk-adjusted": the same returns with drift removed and each window rescaled from the
 * volatility that prevailed then to a blend of current and long-run volatility. */
export type RangeMethod = "empirical" | "risk-adjusted";
export type RangeCalibration =
  | { available: false; reason: string }
  | {
      available: true;
      horizon: number;
      /** Non-overlapping past ranges that could be scored. */
      tests: number;
      inside: number;
      below: number;
      above: number;
      /** Share of past outcomes that landed between the 10th and 90th percentile case, percent. */
      hitRate: number;
      /** A perfectly calibrated 10th-90th range would contain 80% of outcomes. */
      expected: 80;
      verdict: "too-few" | "consistent" | "too-narrow" | "too-wide";
      method: RangeMethod;
      from: string;
      through: string;
    };

const MIN_WINDOWS = 40;
const LOOKBACK = 1260;
const EWMA = 0.94;
/** Fewer scored ranges than this cannot separate a good range from luck. */
export const MIN_CALIBRATION_TESTS = 8;

/** Widening that brought volatility-adjusted ranges to their 80% design. Fitted on half of the
 * 1,305-stock study and checked on the other half, where ranges then held 80.2% (one month),
 * 79.7% (three months) and 80.4% (one year). Without it: 78.5%, 77.8% and 69.7%. */
export const RANGE_WIDENING = { 20: 1.044, 63: 1.055, 252: 1.354 } as const;

const quantile = (sorted: number[], p: number) => {
  const rank = p * (sorted.length - 1),
    lo = Math.floor(rank);
  return sorted[lo] + (sorted[Math.ceil(rank)] - sorted[lo]) * (rank - lo);
};

/** 10th / 50th / 90th percentile log-return bounds at index t, using closes up to t only. */
export function rangeBounds(
  close: number[],
  t: number,
  horizon: number,
  method: RangeMethod,
): [number, number, number] | null {
  const start = Math.max(1, t - LOOKBACK + 1);
  const daily: number[] = [];
  for (let i = start; i <= t; i++) {
    const move = Math.log(close[i] / close[i - 1]);
    if (!Number.isFinite(move)) return null;
    daily.push(move);
  }
  if (daily.length < horizon + MIN_WINDOWS) return null;
  // Exponentially weighted volatility known before each session.
  const seed = daily.slice(0, 20);
  let variance = seed.reduce((a, x) => a + x * x, 0) / seed.length;
  const sigma: number[] = [];
  for (const x of daily) {
    sigma.push(Math.sqrt(variance));
    variance = EWMA * variance + (1 - EWMA) * x * x;
  }
  const raw: number[] = [],
    standard: number[] = [];
  for (let i = horizon - 1; i < daily.length; i++) {
    let sum = 0;
    for (let k = i - horizon + 1; k <= i; k++) sum += daily[k];
    raw.push(sum);
    const then = sigma[i - horizon + 1];
    if (then > 0) standard.push(sum / (then * Math.sqrt(horizon)));
  }
  if (method === "empirical") {
    if (raw.length < MIN_WINDOWS) return null;
    raw.sort((a, b) => a - b);
    return [quantile(raw, 0.1), quantile(raw, 0.5), quantile(raw, 0.9)];
  }
  if (standard.length < MIN_WINDOWS) return null;
  standard.sort((a, b) => a - b);
  const long = Math.sqrt(daily.reduce((a, x) => a + x * x, 0) / daily.length);
  // Current volatility matters most for short horizons and fades toward the
  // long-run level as the horizon lengthens.
  const weight = Math.exp(-horizon / 63);
  const scale =
    Math.sqrt(weight * variance + (1 - weight) * long * long) *
    Math.sqrt(horizon);
  const middle = quantile(standard, 0.5);
  const widen = RANGE_WIDENING[horizon >= 252 ? 252 : horizon >= 63 ? 63 : 20];
  const lo = (quantile(standard, 0.1) - middle) * scale * widen,
    hi = (quantile(standard, 0.9) - middle) * scale * widen;
  return Number.isFinite(lo) && Number.isFinite(hi) && lo < 0 && hi > 0
    ? [lo, 0, hi]
    : null;
}

export type RiskAdjustedRange =
  | { available: false; reason: string }
  | {
      available: true;
      horizon: number;
      /** Percent moves from the reference for the 10th and 90th percentile; the middle is zero by construction. */
      bear: number;
      bull: number;
      through: string;
    };
/** Drift-neutral, volatility-adjusted range for today. A risk range, not a direction view. */
export function riskAdjustedRange(
  history: Candle[],
  asOf: string,
  horizon: number,
  market: "us-equity" | "crypto" = "us-equity",
): RiskAdjustedRange {
  const bars = adaptiveSettledBars(history, asOf, market);
  const bounds = bars.length
    ? rangeBounds(
        bars.map((b) => b.close),
        bars.length - 1,
        horizon,
        "risk-adjusted",
      )
    : null;
  if (!bounds)
    return {
      available: false,
      reason:
        "Not enough continuous settled history for a volatility-adjusted range.",
    };
  return {
    available: true,
    horizon,
    bear: (Math.exp(bounds[0]) - 1) * 100,
    bull: (Math.exp(bounds[2]) - 1) * 100,
    through: bars.at(-1)!.time,
  };
}

/** Walk-forward check of a range method on the instrument's own past.
 * At each earlier date the range is rebuilt using only prices known on that date, then
 * compared with what the price actually did over the next horizon. Evaluation dates are a
 * full horizon apart so scored outcomes do not overlap. This measures how the range would
 * have behaved, not whether it will hold in future. */
export function rangeCalibration(
  history: Candle[],
  asOf: string,
  horizon: number,
  market: "us-equity" | "crypto" = "us-equity",
  method: RangeMethod = "empirical",
): RangeCalibration {
  const unavailable = (reason: string): RangeCalibration => ({
    available: false,
    reason,
  });
  const none =
    "Not enough settled history to score any past range against what followed.";
  if (!Number.isInteger(horizon) || horizon < 5)
    return unavailable("A horizon of at least five sessions is required.");
  const bars = adaptiveSettledBars(history, asOf, market).slice(-2520);
  const close = bars.map((b) => b.close);
  let inside = 0,
    below = 0,
    above = 0,
    earliest = -1,
    latest = -1;
  // Step back from the most recent scoreable date so the latest evidence is always used.
  for (let t = close.length - 1 - horizon; t >= horizon; t -= horizon) {
    const bounds = rangeBounds(close, t, horizon, method);
    const realized = Math.log(close[t + horizon] / close[t]);
    if (!bounds || !Number.isFinite(realized)) continue;
    if (realized < bounds[0]) below++;
    else if (realized > bounds[2]) above++;
    else inside++;
    earliest = t;
    if (latest < 0) latest = t + horizon;
  }
  const tests = inside + below + above;
  if (!tests) return unavailable(none);
  const hitRate = (inside / tests) * 100;
  // With n scored ranges and a true 80% rate, the count inside has standard
  // deviation sqrt(n * 0.8 * 0.2). Outside two of those is called out.
  const tolerance = (2 * Math.sqrt(tests * 0.16) * 100) / tests;
  return {
    available: true,
    horizon,
    tests,
    inside,
    below,
    above,
    hitRate,
    expected: 80,
    verdict:
      tests < MIN_CALIBRATION_TESTS
        ? "too-few"
        : hitRate < 80 - tolerance
          ? "too-narrow"
          : hitRate > 80 + tolerance
            ? "too-wide"
            : "consistent",
    method,
    from: bars[earliest].time,
    through: bars[latest].time,
  };
}

/** One-in-five bounds for a volatility-scaled range: z times the past year's daily volatility times
 * the square root of the horizon, symmetric in log terms, no direction assumed. z was fitted on half
 * of the 1,305-stock study and checked on the other half: the range held 60.2% (three months) and
 * 60.6% (one year); 18-19% of outcomes finished below it and about 21% above. Calibration was similar
 * across low-, mid- and high-volatility stocks (56-63%). */
export const EXPECTED_RANGE = {
  z: { 63: 0.763, 252: 0.859 },
  held: { 63: 60.2, 252: 60.6 },
} as const;
export type ExpectedRange =
  | { available: false; reason: string }
  | {
      available: true;
      horizon: 63 | 252;
      bear: number;
      bull: number;
      /** Annualised daily volatility over the sessions used, percent. */
      volatility: number;
      sessions: number;
      through: string;
    };
/** A poor and a strong outcome for a stock this volatile: roughly one period in five finished
 * below the lower bound and one in five above the upper. A risk range, not a valuation. */
export function expectedRange(
  history: Candle[],
  asOf: string,
  horizon: 63 | 252,
  market: "us-equity" | "crypto" = "us-equity",
): ExpectedRange {
  const bars = adaptiveSettledBars(history, asOf, market).slice(-253);
  const moves: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const move = Math.log(bars[i].close / bars[i - 1].close);
    if (Number.isFinite(move)) moves.push(move);
  }
  if (moves.length < 120)
    return {
      available: false,
      reason:
        "At least six months of settled daily prices are needed for an expected range.",
    };
  const sigma = Math.sqrt(moves.reduce((a, x) => a + x * x, 0) / moves.length);
  const span = EXPECTED_RANGE.z[horizon] * sigma * Math.sqrt(horizon);
  if (!(span > 0) || !Number.isFinite(span))
    return {
      available: false,
      reason: "Price history does not show measurable movement.",
    };
  return {
    available: true,
    horizon,
    bear: (Math.exp(-span) - 1) * 100,
    bull: (Math.exp(span) - 1) * 100,
    volatility: sigma * Math.sqrt(252) * 100,
    sessions: moves.length,
    through: bars.at(-1)!.time,
  };
}
