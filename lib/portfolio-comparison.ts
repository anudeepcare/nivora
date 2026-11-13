import type { Candle } from "./types";

export type PortfolioPeriod = "1M" | "3M" | "6M";
export type ComparisonPoint = {
  time: string;
  value: number;
  holdings: number;
  market: number | null;
};
const validDate = (time: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(time) &&
  Number.isFinite(Date.parse(time)) &&
  new Date(time).toISOString().slice(0, 10) === time;
const positive = (value: number) => Number.isFinite(value) && value > 0;

/** Price context for today's fixed quantities, not account or total-return performance.
 * Compare only observed shared dates, rebased at the same starting observation.
 * If comparison is unavailable, retain the real holdings series without a market line. */
export function portfolioComparison(
  holdings: { time: string; value: number }[],
  benchmark: Pick<Candle, "time" | "close">[],
  period: PortfolioPeriod,
) {
  const clean = [
    ...new Map(
      holdings
        .filter((p) => validDate(p.time) && positive(p.value))
        .map((p) => [p.time, p]),
    ).values(),
  ].sort((a, b) => a.time.localeCompare(b.time));
  const latest = clean.at(-1)?.time;
  const cutoff = new Date(latest ?? "2000-01-01");
  const day = cutoff.getUTCDate();
  cutoff.setUTCDate(1);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - Number.parseInt(period));
  cutoff.setUTCDate(
    Math.min(
      day,
      new Date(
        Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0),
      ).getUTCDate(),
    ),
  );
  const from = cutoff.toISOString().slice(0, 10);
  const window = clean.filter((p) => p.time >= from);
  const market = new Map(
    benchmark
      .filter((p) => validDate(p.time) && positive(p.close))
      .map((p) => [p.time, p.close]),
  );
  const shared = window.filter((p) => market.has(p.time));
  const comparable = shared.length >= 2;
  const selected = comparable ? shared : window;
  const first = selected[0];
  const firstMarket = first && comparable ? market.get(first.time)! : null;
  const points: ComparisonPoint[] = selected.map((p) => ({
    ...p,
    holdings: (p.value / first.value - 1) * 100,
    market:
      firstMarket == null
        ? null
        : (market.get(p.time)! / firstMarket - 1) * 100,
  }));
  const last = points.at(-1);
  return {
    points,
    comparable,
    excess:
      comparable && last?.market != null ? last.holdings - last.market : null,
  };
}
