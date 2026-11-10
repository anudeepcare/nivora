import type { Candle, Position } from "./types";
import type { QuoteRows } from "./portfolio-quotes";

type History = Record<string, { candles: Candle[]; source: string }>;
export type PortfolioRangeCase = {
  name: "Bear" | "Base" | "Bull";
  percentile: 10 | 50 | 90;
  value: number;
  change: number;
  delta: number;
};
export type PortfolioRiskDriver = {
  symbol: string;
  /** Share of the basket's value at the latest shared date, percent. */
  weight: number;
  /** Share of the basket's day-to-day variance, percent. Can be negative for a diversifier. */
  riskShare: number;
};
export type PortfolioRange =
  | { available: false; reason: string; excluded: string[] }
  | {
      available: true;
      cases: PortfolioRangeCase[];
      /** Included holdings at their latest usable quotes. */
      reference: number;
      /** Included value as a percent of all priced non-cash holdings. */
      coverage: number;
      horizon: number;
      samples: number;
      independent: number;
      from: string;
      through: string;
      /** Annualised from daily log returns of the basket, percent. */
      volatility: number;
      /** Largest peak-to-trough fall of the basket inside the window, percent (positive number). */
      drawdown: number;
      drivers: PortfolioRiskDriver[];
      included: string[];
      excluded: string[];
      caveat: string;
    };

const MIN_WINDOWS = 40;
const usable = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x) && x > 0;

/** Correlation-aware range for today's holdings, from how the same basket actually moved together.
 * Today's quantities are repriced on shared observed dates, then the 10th / 50th / 90th percentile
 * of the basket's own overlapping returns is applied to its current value. Summing each holding's
 * separate bear case would assume everything falls at once; this does not. Not account performance,
 * not a forecast, and no probabilities are assigned. Missing prices are never filled. */
export function portfolioRange(
  positions: Position[],
  quotes: QuoteRows,
  history: History,
  asOf = new Date().toISOString().slice(0, 10),
): PortfolioRange {
  const quantities = new Map<string, number>();
  for (const p of positions) {
    if (p.assetType === "cash" || !usable(p.quantity)) continue;
    quantities.set(p.symbol, (quantities.get(p.symbol) ?? 0) + p.quantity);
  }
  const priced = [...quantities].filter(([symbol]) => {
    const q = quotes[symbol]?.quote;
    return q?.currency === "USD" && usable(q.price);
  });
  const excluded = [...quantities.keys()].filter(
    (symbol) => !priced.some(([s]) => s === symbol),
  );
  const unavailable = (reason: string): PortfolioRange => ({
    available: false,
    reason,
    excluded,
  });
  const series = new Map<string, Map<string, number>>();
  for (const [symbol] of priced) {
    const clean = new Map(
      (history[symbol]?.candles ?? [])
        .filter(
          (b) =>
            /^\d{4}-\d{2}-\d{2}$/.test(b.time) &&
            b.time <= asOf &&
            usable(b.close),
        )
        .map((b) => [b.time, b.close] as const),
    );
    if (clean.size) series.set(symbol, clean);
    else excluded.push(symbol);
  }
  let included = [...series.keys()];
  const shared = (symbols: string[]) =>
    symbols.length
      ? [...series.get(symbols[0])!.keys()]
          .filter((time) => symbols.every((s) => series.get(s)!.has(time)))
          .sort()
          .slice(-260)
      : [];
  let dates = shared(included);
  // A recently listed holding must not erase the history of everything else.
  // Drop the shortest series, one at a time, until enough shared dates exist.
  while (included.length > 1 && dates.length < MIN_WINDOWS + 5) {
    const shortest = [...included].sort(
      (a, b) => series.get(a)!.size - series.get(b)!.size,
    )[0];
    included = included.filter((s) => s !== shortest);
    excluded.push(shortest);
    dates = shared(included);
  }
  const horizon = [21, 10, 5].find((h) => dates.length - h >= MIN_WINDOWS);
  if (!included.length || !horizon)
    return unavailable(
      `At least ${MIN_WINDOWS + 5} shared dates of supplied USD prices are needed for a portfolio range.`,
    );
  const value = (symbol: string, time: string) =>
    quantities.get(symbol)! * series.get(symbol)!.get(time)!;
  const totals = dates.map((time) =>
    included.reduce((sum, symbol) => sum + value(symbol, time), 0),
  );
  const windows: number[] = [];
  for (let i = horizon; i < totals.length; i++)
    windows.push(Math.log(totals[i] / totals[i - horizon]));
  windows.sort((a, b) => a - b);
  const quantile = (p: number) => {
    const rank = p * (windows.length - 1),
      lo = Math.floor(rank);
    return windows[lo] + (windows[Math.ceil(rank)] - windows[lo]) * (rank - lo);
  };
  const price = (symbol: string) => quotes[symbol]!.quote!.price!;
  const reference = included.reduce(
    (sum, symbol) => sum + quantities.get(symbol)! * price(symbol),
    0,
  );
  const allPriced = priced.reduce(
    (sum, [symbol, quantity]) => sum + quantity * price(symbol),
    0,
  );
  const cases = (
    [
      ["Bear", 10],
      ["Base", 50],
      ["Bull", 90],
    ] as const
  ).map(([name, percentile]) => {
    const target = reference * Math.exp(quantile(percentile / 100));
    return {
      name,
      percentile,
      value: target,
      change: (target / reference - 1) * 100,
      delta: target - reference,
    };
  });
  if (!usable(reference) || !cases.every((c) => usable(c.value)))
    return unavailable(
      "Supplied prices do not produce a finite positive portfolio range.",
    );
  // Daily basket return decomposed exactly into each holding's contribution.
  const basket: number[] = [],
    parts = new Map<string, number[]>(included.map((s) => [s, []]));
  for (let i = 1; i < dates.length; i++) {
    basket.push(totals[i] / totals[i - 1] - 1);
    for (const symbol of included)
      parts
        .get(symbol)!
        .push(
          (value(symbol, dates[i]) - value(symbol, dates[i - 1])) /
            totals[i - 1],
        );
  }
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const basketMean = mean(basket);
  const variance = mean(basket.map((x) => (x - basketMean) ** 2));
  const logs = totals.slice(1).map((v, i) => Math.log(v / totals[i]));
  const logMean = mean(logs);
  const volatility =
    Math.sqrt(
      logs.reduce((a, x) => a + (x - logMean) ** 2, 0) /
        Math.max(1, logs.length - 1),
    ) *
    Math.sqrt(252) *
    100;
  let peak = totals[0],
    drawdown = 0;
  for (const v of totals) {
    peak = Math.max(peak, v);
    drawdown = Math.max(drawdown, (1 - v / peak) * 100);
  }
  const last = totals.at(-1)!;
  const drivers = included
    .map((symbol) => {
      const xs = parts.get(symbol)!,
        m = mean(xs);
      return {
        symbol,
        weight: (value(symbol, dates.at(-1)!) / last) * 100,
        riskShare:
          variance > 0
            ? (mean(xs.map((x, i) => (x - m) * (basket[i] - basketMean))) /
                variance) *
              100
            : 0,
      };
    })
    .sort((a, b) => b.riskShare - a.riskShare);
  return {
    available: true,
    cases,
    reference,
    coverage: allPriced > 0 ? (reference / allPriced) * 100 : 100,
    horizon,
    samples: windows.length,
    independent: Math.max(1, Math.floor((dates.length - 1) / horizon)),
    from: dates[0],
    through: dates.at(-1)!,
    volatility,
    drawdown,
    drivers,
    included,
    excluded: [...new Set(excluded)],
    caveat:
      "Today's quantities repriced on shared past dates: the 10th, 50th and 90th percentile of the basket's own overlapping returns, applied to its current value. This reflects how these holdings moved together in the window, which can change. It is not account performance, a forecast or a probability; cash, margin, deposits, trades and unpriced holdings are excluded and outcomes can fall outside the range.",
  };
}
