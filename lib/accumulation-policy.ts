import type { Candle } from "./types";
import { monthEndSession } from "./calendar.ts";
import { evidenceMemo } from "./evidence-memo.ts";
export const CANDIDATE_VERSION = "monthly-v2-candidate";
export type CandidateSignal = {
  month: string;
  date: string;
  close: number;
  multiplier: 0 | 1 | 2 | 3 | 4;
  z: number;
  drawdown: number;
  trend: number;
  buy2: number;
  buy3: number;
  buy4: number;
  pauseAbove: number;
  trimReview: boolean;
  reason: string;
};
const median = (x: number[]) => {
  const s = [...x].sort((a, b) => a - b),
    i = Math.floor(s.length / 2);
  return s.length % 2 ? s[i] : (s[i - 1] + s[i]) / 2;
};
const monthIndex = (s: string) =>
  Number(s.slice(0, 4)) * 12 + Number(s.slice(5, 7)) - 1;
export function settledPolicyBars(bars: Candle[], asOf: string) {
  const day = asOf.slice(0, 10);
  if (!Number.isFinite(Date.parse(asOf))) return [];
  return [
    ...new Map(
      bars
        .filter(
          (b) =>
            /^\d{4}-\d{2}-\d{2}$/.test(b.time) &&
            Number.isFinite(Date.parse(b.time)) &&
            new Date(b.time).toISOString().slice(0, 10) === b.time &&
            b.time < day &&
            [b.open, b.high, b.low, b.close].every(
              (x) => Number.isFinite(x) && x > 0,
            ) &&
            b.high >= Math.max(b.open, b.low, b.close) &&
            b.low <= Math.min(b.open, b.high, b.close),
        )
        .map((b) => [b.time, b]),
    ).values(),
  ].sort((a, b) => a.time.localeCompare(b.time));
}
function reading(window: Candle[]): CandidateSignal {
  const logs = window.map((b) => Math.log(b.close)),
    slopes: number[] = [];
  for (let i = 0; i < 36; i++)
    for (let j = i + 1; j < 36; j++) slopes.push((logs[j] - logs[i]) / (j - i));
  const slope = median(slopes),
    intercept = median(logs.map((v, i) => v - slope * i)),
    residuals = logs.map((v, i) => v - intercept - slope * i),
    centre = median(residuals),
    scale = Math.max(
      0.03,
      1.4826 * median(residuals.map((v) => Math.abs(v - centre))),
    );
  const last = window[35],
    trend = Math.exp(intercept + slope * 35 + centre),
    peak = Math.max(...window.map((b) => b.close)),
    z = Math.log(last.close / trend) / scale,
    drawdown = (last.close / peak - 1) * 100;
  const multiplier: CandidateSignal["multiplier"] =
    z >= 1.5 && last.close / trend >= 1.2
      ? 0
      : drawdown <= -45 && z <= -2
        ? 4
        : drawdown <= -30 && z <= -1.5
          ? 3
          : drawdown <= -15 && z <= -0.75
            ? 2
            : 1;
  const trimReview = z >= 2.5 && last.close / window[23].close >= 1.5;
  return {
    month: last.time.slice(0, 7),
    date: last.time,
    close: last.close,
    multiplier,
    z,
    drawdown,
    trend,
    buy2: Math.min(peak * 0.85, trend * Math.exp(-0.75 * scale)),
    buy3: Math.min(peak * 0.7, trend * Math.exp(-1.5 * scale)),
    buy4: Math.min(peak * 0.55, trend * Math.exp(-2 * scale)),
    pauseAbove: Math.max(trend * 1.2, trend * Math.exp(1.5 * scale)),
    trimReview,
    reason:
      multiplier === 0
        ? "Price is stretched above its fitted monthly trend; review new contributions."
        : multiplier > 1
          ? `${Math.abs(drawdown).toFixed(1)}% below the rolling monthly high and ${Math.abs(z).toFixed(1)} robust deviations below trend.`
          : "A stronger pullback condition is not established.",
  };
}
function compute(bars: Candle[], asOf: string, market: "us-equity" | "crypto") {
  const current = asOf.slice(0, 7),
    groups = new Map<string, Candle>();
  for (const b of settledPolicyBars(bars, asOf))
    groups.set(b.time.slice(0, 7), b);
  const rows = [...groups],
    history: CandidateSignal[] = [];
  let forming: CandidateSignal | null = null;
  for (let i = 35; i < rows.length; i++) {
    const w = rows.slice(i - 35, i + 1);
    if (
      w.some(
        ([m, b], j) =>
          (j > 0 && monthIndex(m) - monthIndex(w[j - 1][0]) !== 1) ||
          (m < current && b.time !== monthEndSession(m, market)),
      )
    )
      continue;
    const signal = reading(w.map(([, b]) => b));
    if (signal.month < current) history.push(signal);
    else if (signal.month === current) forming = signal;
  }
  const last = history.at(-1),
    confirmed =
      last && monthIndex(current) - monthIndex(last.month) === 1 ? last : null;
  return {
    version: CANDIDATE_VERSION,
    history,
    confirmed,
    forming,
    reason:
      "Experimental fixed rules. 36 consecutive completed months required; no demonstrated return advantage.",
  };
}
const memo = evidenceMemo<ReturnType<typeof compute>>();
export function candidatePolicy(
  bars: Candle[],
  asOf: string,
  market: "us-equity" | "crypto" = "us-equity",
) {
  return memo(bars, `${bars.length}:${asOf}:${market}`, () =>
    compute(bars, asOf, market),
  );
}
