import type { Position, Quote } from "./types";
import type { MarketEvent } from "./home-feed";
export function pricedInvestmentReturns(
  positions: Position[],
  quotes: Record<string, Quote>,
) {
  let cost = 0,
    value = 0,
    covered = 0;
  const investments = positions.filter((p) => p.assetType !== "cash");
  for (const p of investments) {
    const q = quotes[p.symbol];
    if (
      p.currency !== "USD" ||
      !Number.isFinite(p.cost) ||
      p.cost < 0 ||
      !Number.isFinite(p.quantity) ||
      p.quantity <= 0 ||
      !q ||
      q.currency !== "USD" ||
      !Number.isFinite(q.price) ||
      q.price! <= 0
    )
      continue;
    cost += p.cost * p.quantity;
    value += q.price! * p.quantity;
    covered++;
  }
  return {
    cost: covered ? cost : null,
    value: covered ? value : null,
    pnl: covered ? value - cost : null,
    returnPct: covered && cost > 0 ? (value / cost - 1) * 100 : null,
    covered,
    total: investments.length,
    complete: covered === investments.length,
  };
}
export function holdingAttention(
  positions: Position[],
  quotes: Record<string, Quote>,
  events: MarketEvent[],
  today: string,
) {
  const values = new Map<string, number>();
  let total = 0;
  for (const p of positions) {
    const q = quotes[p.symbol],
      cash = p.assetType === "cash";
    if (
      !Number.isFinite(p.quantity) ||
      p.quantity <= 0 ||
      !Number.isFinite(p.cost) ||
      p.cost < 0 ||
      (cash
        ? p.symbol !== "USD" || p.currency !== "USD"
        : !q ||
              q.currency !== "USD" ||
          !Number.isFinite(q.price) ||
          q.price! <= 0)
    )
      continue;
    const value = p.quantity * (cash ? 1 : q.price!);
    total += value;
    if (!cash) values.set(p.symbol, (values.get(p.symbol) ?? 0) + value);
  }
  const seen = new Set<string>(),
    end = Date.parse(today) + 30 * 86400000;
  return events
    .filter((e) => {
      const key = [e.symbol, e.kind, e.date].join(":");
      if (seen.has(key) || e.date < today || Date.parse(e.date) > end)
        return false;
      seen.add(key);
      return true;
    })
    .map((e) => {
      const value = values.get(e.symbol) ?? null;
      return {
        ...e,
        value,
        weight: value != null && total > 0 ? (value / total) * 100 : null,
      };
    })
    .sort(
      (a, b) =>
        (b.value ?? -1) - (a.value ?? -1) ||
        a.date.localeCompare(b.date) ||
        a.symbol.localeCompare(b.symbol),
    );
}
export function portfolioRiskSummary(
  positions: Position[],
  quotes: Record<string, Quote>,
  events: MarketEvent[],
  today: string,
) {
  const values = new Map<string, number>();
  let total = 0,
    crypto = 0;
  for (const p of positions) {
    const q = quotes[p.symbol],
      cash = p.assetType === "cash";
    if (
      !Number.isFinite(p.quantity) ||
      p.quantity <= 0 ||
      !Number.isFinite(p.cost) ||
      p.cost < 0 ||
      (cash
        ? p.symbol !== "USD" || p.currency !== "USD"
        : !q ||
              q.currency !== "USD" ||
          !Number.isFinite(q.price) ||
          q.price! <= 0)
    )
      continue;
    const value = p.quantity * (cash ? 1 : q.price!);
    total += value;
    if (!cash) values.set(p.symbol, (values.get(p.symbol) ?? 0) + value);
    if (p.assetType === "crypto") crypto += value;
  }
  const deadline = Date.parse(today) + 7 * 86400000,
    earnings = new Set(
      events
        .filter(
          (e) =>
            /earnings/i.test(e.kind) &&
            e.date >= today &&
            Date.parse(e.date) <= deadline,
        )
        .map((e) => e.symbol),
    );
  const amount = [...values]
    .filter(([s]) => earnings.has(s))
    .reduce((sum, [, v]) => sum + v, 0);
  return {
    total,
    topThree:
      total > 0
        ? ([...values.values()]
            .sort((a, b) => b - a)
            .slice(0, 3)
            .reduce((a, b) => a + b, 0) /
            total) *
          100
        : null,
    crypto: total > 0 ? (crypto / total) * 100 : null,
    earningsValue: amount,
    earningsWeight: total > 0 ? (amount / total) * 100 : null,
    earnings,
    values,
  };
}
