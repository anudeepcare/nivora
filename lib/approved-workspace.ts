import type { Candle, Position } from "./types";
import type { QuoteRows } from "./portfolio-quotes";
import type { AccountBalances } from "./account-balances";

export const researchLink = (symbol: string, prefix = "") =>
  `${prefix}/research/${encodeURIComponent(symbol.replace("/", "-"))}`;

/** USD aggregation is deliberately conservative: no implicit conversion of prices or costs. */
export function workspaceOverview(
  positions: Position[],
  quotes: QuoteRows,
  balances?: AccountBalances | null,
  sectors: Record<string, string> = {},
) {
  let cash = 0,
    invested = 0,
    coveredCost = 0,
    coveredValue = 0,
    returnCovered = 0,
    unknownCost = 0;
  const unpriced = new Set<string>(),
    older = new Set<string>();
  const bySymbol = new Map<string, number>();
  const investmentCount = positions.filter(
    (p) => p.assetType !== "cash",
  ).length;
  for (const p of positions) {
    if (
      !Number.isFinite(p.quantity) ||
      p.quantity <= 0 ||
      !Number.isFinite(p.cost) ||
      p.cost < 0
    ) {
      unpriced.add(p.symbol);
      continue;
    }
    if (p.assetType === "cash") {
      if (p.symbol === "USD" && p.currency === "USD") cash += p.quantity;
      else unpriced.add(p.symbol);
      continue;
    }
    const q = quotes[p.symbol]?.quote;
    if (
      !q ||
      q.currency !== "USD" ||
      q.price == null ||
      !Number.isFinite(q.price) ||
      q.price <= 0
    ) {
      unpriced.add(p.symbol);
      continue;
    }
    const value = p.quantity * q.price;
    invested += value;
    bySymbol.set(p.symbol, (bySymbol.get(p.symbol) ?? 0) + value);
    if (q.stale) older.add(p.symbol);
    if (p.currency === "USD") {
      coveredCost += p.quantity * p.cost;
      coveredValue += value;
      returnCovered++;
    } else unknownCost++;
  }
  const allocations = [...bySymbol]
    .map(([symbol, value]) => ({
      symbol,
      value,
      weight: invested > 0 ? (value / invested) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
  const grouped = new Map<string, { value: number; symbols: string[] }>();
  for (const allocation of allocations) {
    const crypto = positions.some(
      (p) => p.symbol === allocation.symbol && p.assetType === "crypto",
    );
    const name = crypto
      ? "Crypto"
      : sectors[allocation.symbol] ||
        quotes[allocation.symbol]?.company?.sector ||
        "Unclassified";
    const group = grouped.get(name) ?? { value: 0, symbols: [] };
    group.value += allocation.value;
    group.symbols.push(allocation.symbol);
    grouped.set(name, group);
  }
  const groups = [...grouped]
    .map(([name, group]) => ({
      name,
      ...group,
      weight: invested > 0 ? (group.value / invested) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
  const assets = cash + invested;
  const pnl = returnCovered ? coveredValue - coveredCost : null;
  return {
    assets,
    cash,
    invested,
    net: assets + (balances?.managed_value ?? 0) - (balances?.margin_debt ?? 0),
    cashAndManaged: cash + (balances?.managed_value ?? 0),
    margin: balances?.margin_debt ?? null,
    pnl,
    returnPct:
      pnl != null && coveredCost > 0 ? (pnl / coveredCost) * 100 : null,
    returnCovered,
    investmentCount,
    unknownCost,
    unpriced: [...unpriced],
    older: older.size,
    allocations,
    groups,
  };
}

export type WorkspaceHistory = Record<
  string,
  { candles: Candle[]; source: string }
>;

/** Reprice today's quantities on common observed dates. This is never account performance/NAV history. */
export function portfolioHistory(
  positions: Position[],
  quotes: QuoteRows,
  history: WorkspaceHistory,
  asOf = new Date().toISOString().slice(0, 10),
) {
  const holdings = new Map<string, number>();
  for (const p of positions) {
    if (p.assetType === "cash") continue;
    if (!holdings.has(p.symbol)) holdings.set(p.symbol, 0);
    if (Number.isFinite(p.quantity) && p.quantity > 0)
      holdings.set(p.symbol, holdings.get(p.symbol)! + p.quantity);
  }
  const included: string[] = [],
    excluded: string[] = [],
    sources = new Set<string>();
  const series = new Map<string, Map<string, number>>();
  for (const [symbol, quantity] of holdings) {
    const rows = history[symbol];
    const clean = new Map(
      (rows?.candles ?? [])
        .filter(
          (b) =>
            /^\d{4}-\d{2}-\d{2}$/.test(b.time) &&
            Number.isFinite(Date.parse(b.time)) &&
            b.time <= asOf &&
            Number.isFinite(b.close) &&
            b.close > 0,
        )
        .map((b) => [b.time, b.close]),
    );
    if (
      quantity <= 0 ||
      quotes[symbol]?.quote?.currency !== "USD" ||
      !clean.size
    ) {
      excluded.push(symbol);
      continue;
    }
    included.push(symbol);
    series.set(symbol, clean);
    if (rows.source) sources.add(rows.source);
  }
  const dates = included.length
    ? [...series.get(included[0])!.keys()]
        .filter((time) =>
          included.every((symbol) => series.get(symbol)!.has(time)),
        )
        .sort()
        .slice(-60)
    : [];
  const points = dates.map((time) => ({
    time,
    value: included.reduce(
      (total, symbol) =>
        total + holdings.get(symbol)! * series.get(symbol)!.get(time)!,
      0,
    ),
  }));
  return {
    points,
    included,
    excluded,
    sources: [...sources],
    complete: included.length > 0 && excluded.length === 0,
  };
}
