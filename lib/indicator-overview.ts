import type { Candle } from "./types";
import { advancedStudies } from "./advanced-research.ts";

const indicators = [
  {
    key: "roc20",
    label: "20-session momentum",
    unit: "%",
    note: "Completed close versus 20 observations earlier.",
  },
  {
    key: "roc60",
    label: "60-session momentum",
    unit: "%",
    note: "Completed close versus 60 observations earlier.",
  },
  {
    key: "atrPct",
    label: "Typical daily range",
    unit: "%",
    note: "14-session simple average true range as a percentage of the completed close.",
  },
  {
    key: "relativeVolume",
    label: "Relative volume",
    unit: "×",
    note: "Completed volume relative to the prior 20-session mean. Missing or zero volume is not estimated.",
  },
  {
    key: "bandwidth",
    label: "Price-band width",
    unit: "%",
    note: "Four population standard deviations of 20 closes, divided by their mean.",
  },
  {
    key: "downsideDaily",
    label: "Downside deviation",
    unit: "%",
    note: "Root mean square of negative daily returns in supplied history. Requires 60 returns; not annualized.",
  },
] as const;

/** Historical snapshots of the same studies used in the advanced tools. No forecast points. */
export function indicatorOverview(input: Candle[], asOf: string) {
  const bars = [
    ...new Map(
      input
        .filter(
          (b) =>
            /^\d{4}-\d{2}-\d{2}$/.test(b.time) &&
            b.time < asOf.slice(0, 10) &&
            [b.open, b.high, b.low, b.close].every(Number.isFinite) &&
            b.low > 0 &&
            b.high >= Math.max(b.open, b.close, b.low) &&
            b.low <= Math.min(b.open, b.close),
        )
        .map((b) => [b.time, b]),
    ).values(),
  ].sort((a, b) => a.time.localeCompare(b.time));
  const offset = Math.max(0, bars.length - 60);
  const snapshots = bars
    .slice(offset)
    .map((bar, index) => ({
      date: bar.time,
      studies: advancedStudies(bars.slice(0, offset + index + 1), asOf),
    }));
  return indicators.map((indicator) => ({
    ...indicator,
    points: snapshots.map((snapshot) => ({
      date: snapshot.date,
      value: snapshot.studies[indicator.key],
    })),
  }));
}
