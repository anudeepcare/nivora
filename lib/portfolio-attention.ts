import type { Position } from "./types";
import type { QuoteRows } from "./portfolio-quotes";
export function portfolioAttention(
  positions: Position[],
  quotes: QuoteRows,
  threshold: number | null,
) {
  const values = new Map<string, number>(),
    missing = new Set<string>(),
    stale = new Set<string>();
  for (const p of positions) {
    if (p.assetType === "cash") continue;
    const q = quotes[p.symbol]?.quote;
    if (
      !Number.isFinite(p.quantity) ||
      p.quantity <= 0 ||
      !q ||
      q.currency !== "USD" ||
      q.price == null ||
      !Number.isFinite(q.price) ||
      q.price <= 0
    ) {
      missing.add(p.symbol);
      continue;
    }
    values.set(p.symbol, (values.get(p.symbol) ?? 0) + p.quantity * q.price);
    if (q.stale) stale.add(p.symbol);
  }
  const total = [...values.values()].reduce((a, b) => a + b, 0);
  return {
    missing: [...missing],
    stale: [...stale],
    complete: !missing.size,
    concentrated:
      threshold !== null &&
      Number.isFinite(threshold) &&
      threshold > 0 &&
      threshold <= 100 &&
      total > 0
        ? [...values]
            .map(([symbol, value]) => ({
              symbol,
              weight: (value / total) * 100,
            }))
            .filter((x) => x.weight > threshold)
            .sort((a, b) => b.weight - a.weight)
        : [],
  };
}
