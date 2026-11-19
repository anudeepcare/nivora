import type { Position, Quote } from "./types";
import { portfolioTotals } from "./engine.ts";
function valueOf(p: Position, quotes: Record<string, Quote>) {
  if (
    !Number.isFinite(p.quantity) ||
    p.quantity <= 0 ||
    !Number.isFinite(p.cost) ||
    p.cost < 0
  )
    return null;
  if (p.assetType === "cash")
    return p.symbol === "USD" && p.currency === "USD" ? p.quantity : null;
  const q = quotes[p.symbol];
  return q && q.currency === "USD" && Number.isFinite(q.price) && q.price! > 0
    ? p.quantity * q.price!
    : null;
}
export function ledgerRows(
  positions: Position[],
  quotes: Record<string, Quote>,
  total: number,
  earnings = new Set<string>(),
) {
  const grouped = new Map<string, number>();
  for (const p of positions) {
    const value = valueOf(p, quotes);
    if (value != null)
      grouped.set(p.symbol, (grouped.get(p.symbol) ?? 0) + value);
  }
  return positions.map((p) => {
    const value = valueOf(p, quotes),
      cash = p.assetType === "cash",
      q = quotes[p.symbol],
      costKnown = p.currency === "USD" && value != null && !cash,
      pnl = costKnown ? value - p.quantity * p.cost : null,
      weight =
        value != null && total > 0
          ? ((grouped.get(p.symbol) ?? 0) / total) * 100
          : null;
    return {
      position: p,
      value,
      pnl,
      returnPct:
        pnl != null && p.cost > 0 ? (pnl / (p.quantity * p.cost)) * 100 : null,
      weight,
      price: value != null ? (cash ? 1 : q.price) : null,
      note: cash
        ? ""
        : value == null
          ? q?.currency && q.currency !== "USD"
            ? "USD price needed"
            : "Price unavailable"
          : q?.stale
            ? "Older price"
            : earnings.has(p.symbol)
              ? "Earnings ≤7 days"
              : weight != null && weight >= 10
                ? "Concentration ≥10%"
                : "",
      caution: !!q?.stale || value == null || (!!weight && weight >= 10),
    };
  });
}
export function portfolioChartData(
  positions: Position[],
  quotes: Record<string, Quote>,
) {
  const total = portfolioTotals(positions, quotes).knownValue,
    allocations = new Map<string, number>(),
    returns = new Map<
      string,
      { pnl: number; cost: number; complete: boolean }
    >(),
    excluded = new Set<string>();
  for (const p of positions) {
    const value = valueOf(p, quotes);
    if (value == null) {
      excluded.add(p.symbol);
      continue;
    }
    allocations.set(p.symbol, (allocations.get(p.symbol) ?? 0) + value);
    if (p.assetType === "cash") continue;
    const old = returns.get(p.symbol) ?? { pnl: 0, cost: 0, complete: true };
    if (p.currency !== "USD") old.complete = false;
    else {
      old.cost += p.cost * p.quantity;
      old.pnl += value - p.cost * p.quantity;
    }
    returns.set(p.symbol, old);
  }
  return {
    total,
    allocations: [...allocations]
      .map(([symbol, value]) => ({
        symbol,
        value,
        weight: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value),
    returns: [...returns]
      .filter(([symbol, r]) => r.complete && !excluded.has(symbol))
      .map(([symbol, r]) => ({
        symbol,
        pnl: r.pnl,
        returnPct: r.cost > 0 ? (r.pnl / r.cost) * 100 : null,
      }))
      .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl)),
    excluded: [...excluded],
  };
}

/** Display projection only: stored lots remain individually editable by ID. */
export function groupedLedgerRows(
  positions: Position[],
  quotes: Record<string, Quote>,
  total: number,
  earnings = new Set<string>(),
) {
  const groups = new Map<string, Position[]>();
  positions.forEach((p) => {
    const key =
      p.assetType === "cash"
        ? JSON.stringify(["cash", p.id])
        : JSON.stringify([p.assetType, p.symbol]);
    const bucket = groups.get(key);
    if (bucket) bucket.push(p);
    else groups.set(key, [p]);
  });
  const finite = (n: number) => (Number.isFinite(n) ? n : null);
  return [...groups].map(([groupKey, lots]) => {
    const position = lots[0],
      cash = position.assetType === "cash";
    const quantitiesValid = lots.every(
      (p) => Number.isFinite(p.quantity) && p.quantity > 0,
    );
    const quantity = quantitiesValid
      ? finite(lots.reduce((sum, p) => sum + p.quantity, 0))
      : null;
    const currencies = new Set(
      lots.flatMap((p) =>
        typeof p.currency === "string" && /^[A-Z]{3}$/.test(p.currency)
          ? [p.currency]
          : [],
      ),
    );
    const costsValid =
      quantity != null &&
      lots.every(
        (p) =>
          Number.isFinite(p.cost) &&
          p.cost >= 0 &&
          typeof p.currency === "string" &&
          /^[A-Z]{3}$/.test(p.currency),
      );
    const costTotal =
      costsValid && currencies.size === 1
        ? finite(lots.reduce((sum, p) => sum + p.quantity * p.cost, 0))
        : null;
    const costState: "known" | "mixed" | "unknown" =
      currencies.size > 1 ? "mixed" : costTotal == null ? "unknown" : "known";
    const costCurrency = costState === "known" ? [...currencies][0] : null;
    const avgCost =
      costTotal != null && quantity != null
        ? finite(costTotal / quantity)
        : null;
    const q = quotes[position.symbol];
    const candidatePrice = cash
      ? position.symbol === "USD" &&
        position.currency === "USD" &&
        position.cost === 1
        ? 1
        : null
      : q?.currency === "USD" &&
          typeof q.price === "number" &&
          Number.isFinite(q.price) &&
          q.price > 0
        ? q.price
        : null;
    const value =
      quantity != null && candidatePrice != null
        ? finite(quantity * candidatePrice)
        : null;
    const price = value != null ? candidatePrice : null;
    const pnl =
      !cash && value != null && costTotal != null && costCurrency === "USD"
        ? finite(value - costTotal)
        : null;
    const returnPct =
      pnl != null && costTotal != null && costTotal > 0
        ? finite((pnl / costTotal) * 100)
        : null;
    // workspaceOverview excludes malformed numeric-cost lots from its denominator.
    const denominatorAdmissible = lots.every(
      (p) => Number.isFinite(p.cost) && p.cost >= 0,
    );
    const weight =
      denominatorAdmissible &&
      value != null &&
      Number.isFinite(total) &&
      total > 0
        ? finite((value / total) * 100)
        : null;
    const note =
      quantity == null
        ? "Quantity unavailable"
        : costState === "mixed"
          ? "Mixed cost currencies"
          : costState === "unknown"
            ? "Cost basis incomplete"
            : !cash && costCurrency !== "USD"
              ? "Cost currency differs"
              : value == null
                ? q?.currency && q.currency !== "USD"
                  ? "USD price needed"
                  : "Price unavailable"
                : !cash && q?.stale
                  ? "Older price"
                  : !cash && earnings.has(position.symbol)
                    ? "Earnings ≤7 days"
                    : weight != null && weight >= 10
                      ? "Concentration ≥10%"
                      : "";
    return {
      position,
      lots,
      quantity,
      avgCost,
      costCurrency,
      costState,
      groupKey,
      value,
      pnl,
      returnPct,
      weight,
      price,
      note,
      caution:
        value == null ||
        costState !== "known" ||
        (!cash && (q?.stale === true || costCurrency !== "USD")) ||
        (weight != null && weight >= 10),
    };
  });
}
