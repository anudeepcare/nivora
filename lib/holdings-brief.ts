import type { Position, Quote } from "./types";
export function holdingsContext(
  positions: Position[],
  quotes: Record<string, Quote>,
  sectorBySymbol: Record<string, string>,
) {
  const groups = new Map<string, number>();
  const holdings = new Map<string, number>();
  let pricedValue = 0,
    missing = 0,
    stale = 0,
    observedChange = 0,
    changeCovered = 0;
  let largest: { symbol: string; value: number } | null = null;
  for (const p of positions) {
    if (!Number.isFinite(p.quantity) || p.quantity <= 0 || !Number.isFinite(p.cost) || p.cost < 0) {missing++;continue;}
    const cash = p.assetType === "cash";
    const q = quotes[p.symbol];
    if (cash && (p.symbol !== "USD" || p.currency !== "USD")) {
      missing++;
      continue;
    }
    if (!cash && q?.stale) stale++;
    if (
      !cash &&
      (!q ||
        q.price == null ||
        !Number.isFinite(q.price) ||
        q.price <= 0 ||
        q.currency !== "USD" || q.stale)
    ) {
      missing++;
      continue;
    }
    const value = cash ? p.quantity : p.quantity * q.price!;
    pricedValue += value;
    const sector = cash
      ? "Cash"
      : p.assetType === "crypto"
        ? "Crypto"
        : sectorBySymbol[p.symbol] || "Unclassified stocks";
    groups.set(sector, (groups.get(sector) || 0) + value);
    if (!cash) holdings.set(p.symbol, (holdings.get(p.symbol) ?? 0) + value);
    if (
      !cash &&
      !q.stale &&
      q.changePct != null &&
      Number.isFinite(q.changePct) &&
      q.changePct > -100
    ) {
      observedChange += value - value / (1 + q.changePct / 100);
      changeCovered += value;
    }
  }
  for (const [symbol, value] of holdings)
    if (!largest || value > largest.value) largest = { symbol, value };
  return {
    pricedValue,
    missing,
    stale,
    observedChange,
    changeCovered,
    largest,
    sectors: [...groups]
      .map(([name, value]) => ({
        name,
        value,
        percent: pricedValue > 0 ? (value / pricedValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value),
  };
}
export type ResearchObservation = {
  estimate?: {
    date: string;
    currency: string | null;
    frequency: string;
    eps: number | null;
    revenue: number | null;
  };
  price: number | null;
  period: string | null;
  revenue: number | null;
  monthly: number | null;
  observedAt: string;
};
export function observedChanges(
  prior: ResearchObservation | null,
  current: ResearchObservation,
) {
  if (!prior) return [];
  const changes: string[] = [];
  if (prior.period && current.period && prior.period !== current.period)
    changes.push(`New financial period: ${current.period}`);
  if (
    prior.period === current.period &&
    prior.revenue != null &&
    current.revenue != null &&
    prior.revenue !== current.revenue
  )
    changes.push(
      "Revenue changed for the same reporting period; review a possible revision.",
    );
  if (
    prior.monthly != null &&
    current.monthly != null &&
    prior.monthly !== current.monthly
  )
    changes.push(
      `Confirmed monthly zone: ${prior.monthly}× → ${current.monthly}×`,
    );
  const a = prior.estimate,
    b = current.estimate;
  if (
    a &&
    b &&
    a.date === b.date &&
    a.currency &&
    a.currency === b.currency &&
    a.frequency === b.frequency
  ) {
    if (a.eps != null && b.eps != null && a.eps !== b.eps)
      changes.push(
        `EPS estimate revised: ${a.eps.toFixed(2)} → ${b.eps.toFixed(2)} (${b.date})`,
      );
    if (a.revenue != null && b.revenue != null && a.revenue !== b.revenue)
      changes.push(`Revenue estimate revised for ${b.date}.`);
  }
  return changes;
}
