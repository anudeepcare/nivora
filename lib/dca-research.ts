import type { Candle } from "./types";
import { accumulation, accumulationBand } from "./engine.ts";
export function monthlyReadings(
  bars: Candle[],
  asOf: string,
  market: "us-equity" | "crypto" = "us-equity",
) {
  const valid = bars
    .filter(
      (b) =>
        b.time < asOf.slice(0, 10) &&
        /^\d{4}-\d{2}-\d{2}$/.test(b.time) &&
        Number.isFinite(Date.parse(b.time)) &&
        new Date(b.time).toISOString().slice(0, 10) === b.time &&
        [b.open, b.high, b.low, b.close].every(
          (n) => Number.isFinite(n) && n > 0,
        ) &&
        b.high >= Math.max(b.open, b.low, b.close) &&
        b.low <= Math.min(b.open, b.high, b.close),
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  const unique = [...new Map(valid.map((b) => [b.time, b])).values()];
  const monthly = new Map<string, number>();
  for (const b of unique) monthly.set(b.time.slice(0, 7), b.close);
  return accumulation(unique, asOf, false, market)
    .history.slice(-12)
    .map((s) => {
      const previous = [...monthly]
        .filter(([m]) => m < s.month)
        .slice(-23)
        .map(([, c]) => c);
      let strongest = s.multiplier;
      let date = s.month;
      if (previous.length === 23)
        for (const b of unique.filter((b) => b.time.startsWith(s.month))) {
          const average = (previous.reduce((a, c) => a + c, 0) + b.close) / 24,
            peak = Math.max(...previous, b.close);
          const zone = accumulationBand(
            (b.close / peak - 1) * 100,
            (b.close / average - 1) * 100,
          );
          if (zone > strongest) {
            strongest = zone;
            date = b.time;
          }
        }
      return { month: s.month, confirmed: s.multiplier, strongest, date };
    });
}
