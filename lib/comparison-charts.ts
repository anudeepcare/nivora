import type { Research } from "./types";
export type ComparisonRange = "1m" | "3m" | "1y" | "5y" | "all";
const rangeDays: Record<Exclude<ComparisonRange, "all">, number> = {
  "1m": 31,
  "3m": 92,
  "1y": 366,
  "5y": 1827,
};
/** Intersect actual daily observations. Never forward-fill, align by array index, or infer adjusted prices. */
export function comparisonChart(
  research: Research[],
  range: ComparisonRange = "1y",
) {
  const records = [
    ...new Map(research.map((r) => [r.company.symbol, r])).values(),
  ].slice(0, 4);
  const maps = records.map((r) => {
    const map = new Map<string, number>();
    for (const bar of r.history) {
      if (
        /^\d{4}-\d{2}-\d{2}$/.test(bar.time) &&
        Number.isFinite(Date.parse(bar.time)) &&
        bar.time <= r.retrievedAt.slice(0, 10) &&
        Number.isFinite(bar.close) &&
        bar.close > 0
      )
        map.set(bar.time, bar.close);
    }
    return map;
  });
  const shared =
    maps.length >= 2
      ? [...maps[0].keys()]
          .filter((date) => maps.every((map) => map.has(date)))
          .sort()
      : [];
  const end = shared.at(-1);
  const cutoff =
    end && range !== "all"
      ? Date.parse(end) - rangeDays[range] * 86400000
      : -Infinity;
  const dates = shared.filter((d) => Date.parse(d) >= cutoff);
  const available = dates.length >= 2;
  return {
    dates: available ? dates : [],
    start: available ? dates[0] : null,
    end: available ? dates.at(-1)! : null,
    available,
    reason:
      records.length < 2
        ? "Choose at least two companies to align their price history."
        : "At least two shared daily observations are needed for every selected company. Try a longer range or another company.",
    series: available
      ? records.map((r, i) => {
          const base = maps[i].get(dates[0])!;
          return {
            symbol: r.company.symbol,
            currency: r.quote.currency || r.company.currency,
            source: r.historySource || "Source not specified",
            retrievedAt: r.retrievedAt,
            base,
            points: dates.map((date) => ({
              date,
              close: maps[i].get(date)!,
              change: (maps[i].get(date)! / base - 1) * 100,
            })),
          };
        })
      : [],
  };
}
