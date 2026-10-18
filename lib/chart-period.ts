import type { Candle } from "./types";
export function groupHistory(
  bars: Candle[],
  period: "Weekly" | "Monthly",
): Candle[] {
  const grouped = new Map<string, Candle>();
  for (const bar of [...bars].sort((a, b) => a.time.localeCompare(b.time))) {
    const date = new Date(bar.time.slice(0, 10) + "T12:00:00Z");
    if (!Number.isFinite(date.getTime())) continue;
    if (period === "Monthly") date.setUTCDate(1);
    else date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    const time = date.toISOString().slice(0, 10),
      old = grouped.get(time);
    grouped.set(
      time,
      old
        ? {
            time,
            open: old.open,
            high: Math.max(old.high, bar.high),
            low: Math.min(old.low, bar.low),
            close: bar.close,
            volume: old.volume + bar.volume,
          }
        : { ...bar, time },
    );
  }
  return [...grouped.values()];
}
