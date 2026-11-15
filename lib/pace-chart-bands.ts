import { currentPace } from "./current-pace.ts";
import type { PacePriceZones } from "./pace-price-zones";
export type PaceChartBand = { level: number; low: number; high: number };
/** Current conditional price ranges only. Never historical buy/sell signals. */
export function paceChartBands(
  zones: PacePriceZones | null,
  asOf: string,
): PaceChartBand[] {
  if (!zones) return [];
  const age = Date.parse(asOf) - Date.parse(zones.date);
  if (!Number.isFinite(age) || age < 0 || age > 4 * 86400000) return [];
  return zones.ranges
    .filter(
      (range) =>
        Number.isInteger(range.level) &&
        range.level >= 0 &&
        range.level <= 4 &&
        Number.isFinite(range.low) &&
        Number.isFinite(range.high) &&
        range.low > 0 &&
        range.high > range.low,
    )
    .map(({ level, low, high }) => ({ level, low, high }));
}

export function currentPaceChartPeriod(
  accumulation: Parameters<typeof currentPace>[0],
  now: number,
) {
  const pace = currentPace(accumulation, now);
  return pace.level === null
    ? null
    : pace.provisional
      ? ("forming" as const)
      : ("confirmed" as const);
}
