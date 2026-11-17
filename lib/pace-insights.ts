import {
  researchAccumulation,
  type CycleSignal,
} from "./accumulation-policy-v7.ts";
import type { Candle } from "./types";

type BoundaryReading = Pick<
  CycleSignal,
  "close" | "multiplier" | "buy2" | "buy3" | "buy4" | "pauseAbove"
>;
/** Interpret the published v5 boundaries; never change the policy or forecast price. */
export function paceBoundary(reading: BoundaryReading | null) {
  if (
    reading &&
    "policyVersion" in reading &&
    (reading.policyVersion === "monthly-v6" ||
      reading.policyVersion === "monthly-v7")
  ) {
    return (
      (
        reading as BoundaryReading & {
          conditionalBoundary?: {
            price: number;
            level: number;
            operator: string;
            distancePercent: number;
          } | null;
        }
      ).conditionalBoundary ?? null
    );
  }
  if (
    !reading ||
    ![
      reading.close,
      reading.multiplier,
      reading.buy2,
      reading.buy3,
      reading.buy4,
      reading.pauseAbove,
    ].every(Number.isFinite) ||
    reading.close <= 0
  )
    return null;
  const levelAt = (price: number) =>
    price >= reading.pauseAbove
      ? 0
      : price <= reading.buy4
        ? 4
        : price <= reading.buy3
          ? 3
          : price <= reading.buy2
            ? 2
            : 1;
  const thresholds = [
    ...new Set([reading.buy2, reading.buy3, reading.buy4, reading.pauseAbove]),
  ]
    .filter((x) => x > 0)
    .sort((a, b) => a - b);
  const boundaries = thresholds.flatMap((price, index) => {
    // Sample the open intervals on either side, preserving coincident thresholds.
    const below = levelAt(((thresholds[index - 1] ?? 0) + price) / 2);
    const above = levelAt((price + (thresholds[index + 1] ?? price * 2)) / 2);
    if (below === above) return [];
    const at = levelAt(price);
    const lower = reading.multiplier === above && price <= reading.close;
    const higher = reading.multiplier === below && price >= reading.close;
    if (!lower && !higher) return [];
    const level = lower ? below : above;
    const operator = lower
      ? at === below
        ? "at or below"
        : "below"
      : at === above
        ? "at or above"
        : "above";
    return [
      {
        price,
        level,
        operator,
        distancePercent: ((price - reading.close) / reading.close) * 100,
      },
    ];
  });
  return (
    boundaries.sort(
      (a, b) => Math.abs(a.distancePercent) - Math.abs(b.distancePercent),
    )[0] ?? null
  );
}
/** Each selected period retains the exact prior-month window used by the policy. */
export function paceEvidence(
  bars: Candle[],
  asOf: string,
  period: "confirmed" | "forming",
  market: "us-equity" | "crypto" = "us-equity",
) {
  const policy = researchAccumulation(bars, asOf, market);
  const reading = policy[period];
  return {
    reading,
    boundary: paceBoundary(reading),
    confirmed: policy.confirmed,
    forming: policy.forming,
    reason: policy.reason,
  };
}
