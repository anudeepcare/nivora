import type { Position, Quote } from "./types";
import { providerIdentity } from "./provider-symbol.ts";

export function usdCents(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const cents = Math.round(Number(value) * 100);
  return Number.isSafeInteger(cents) && cents > 0 && cents <= 10_000_000_000
    ? cents
    : null;
}

/** Dollar targets only: fractional execution, fees and price moves are not modeled.
 * Cap denominator includes the whole new contribution, including retained cash.
 * Existing cash is excluded so it cannot be counted again as deployable money. */
export function monthlyAllocation(input: {
  positions: Position[];
  quotes: Record<string, Quote>;
  candidates: string[];
  budgetCents: number;
  capPercent: number;
  now: number;
}) {
  const { positions, quotes, budgetCents, capPercent, now } = input;
  const issues: string[] = [];
  const values = new Map<string, number>();
  const quoteFor = (symbol: string) =>
    Object.entries(quotes).find(
      ([key]) => providerIdentity(key) === symbol,
    )?.[1];
  const usable = (q: Quote | undefined) => {
    const at = Date.parse(q?.asOf ?? "");
    return (
      !!q &&
      q.currency === "USD" &&
      !q.stale &&
      Number.isFinite(q.price) &&
      q.price! > 0 &&
      Number.isFinite(at) &&
      Number.isFinite(now) &&
      at <= now + 60_000 &&
      now - at <= 4 * 86_400_000
    );
  };
  if (
    !Number.isSafeInteger(budgetCents) ||
    budgetCents <= 0 ||
    budgetCents > 10_000_000_000
  )
    issues.push(
      "Enter a positive USD contribution with at most two decimal places (maximum $100,000,000).",
    );
  if (!Number.isInteger(capPercent) || capPercent < 1 || capPercent > 100)
    issues.push("Choose a whole-number position cap between 1% and 100%.");
  for (const p of positions) {
    if (p.assetType === "cash") continue;
    const symbol = providerIdentity(p.symbol);
    const q = quoteFor(symbol);
    const value = Math.round(p.quantity * (q?.price ?? NaN) * 100);
    if (
      !Number.isFinite(p.quantity) ||
      p.quantity <= 0 ||
      !usable(q) ||
      !Number.isSafeInteger(value) ||
      value <= 0
    ) {
      issues.push(
        `${p.symbol}: holding needs a positive quantity and a recent, non-stale USD valuation.`,
      );
      continue;
    }
    values.set(symbol, (values.get(symbol) ?? 0) + value);
  }
  const total = [...values.values()].reduce((sum, value) => sum + value, 0);
  if (!Number.isSafeInteger(total + budgetCents))
    issues.push("Portfolio value exceeds the supported calculation range.");
  const candidates = [
    ...new Set(input.candidates.map(providerIdentity)),
  ].sort();
  if (candidates.length > 30) issues.push("Select at most 30 candidates.");
  if (issues.length)
    return {
      complete: false as const,
      issues,
      rows: [],
      totalCents: null,
      retainedCents: null,
      retainedReason:
        "Allocations and totals are withheld until inputs and all investment valuations are complete.",
    };
  const denominator = total + budgetCents;
  // BigInt avoids an unsafe intermediate when multiplying large cent totals.
  const ceiling = Number((BigInt(denominator) * BigInt(capPercent)) / 100n);
  const rows = [...new Set([...values.keys(), ...candidates])]
    .sort()
    .map((symbol) => {
      const currentCents = values.get(symbol) ?? 0;
      const selected = candidates.includes(symbol);
      const eligible = selected && usable(quoteFor(symbol));
      return {
        symbol,
        currentCents,
        contributionCents: 0,
        currentWeight: total ? (currentCents / total) * 100 : null,
        afterWeight: (currentCents / denominator) * 100,
        selected,
        capacity: eligible ? Math.max(0, ceiling - currentCents) : 0,
        reason: !selected
          ? "Not selected; no contribution."
          : !eligible
            ? "No recent, non-stale USD quote; no contribution."
            : currentCents >= ceiling
              ? "At or above the chosen cap; no contribution."
              : "Equal-target allocation toward the smaller selected positions.",
      };
    });
  const eligible = rows.filter((row) => row.capacity > 0);
  // Water-fill final holding values. Binary search yields cent-exact levels in
  // O(n log portfolio-value), even for large budgets and unequal holdings.
  let low = 0,
    high = ceiling;
  const needed = (level: number) =>
    eligible.reduce(
      (sum, row) =>
        sum + Math.min(row.capacity, Math.max(0, level - row.currentCents)),
      0,
    );
  while (low < high) {
    const mid = low + Math.ceil((high - low) / 2);
    if (needed(mid) <= budgetCents) low = mid;
    else high = mid - 1;
  }
  for (const row of eligible)
    row.contributionCents = Math.min(
      row.capacity,
      Math.max(0, low - row.currentCents),
    );
  let retainedCents =
    budgetCents - rows.reduce((sum, row) => sum + row.contributionCents, 0);
  for (const row of eligible) {
    if (
      retainedCents &&
      row.currentCents + row.contributionCents <= low &&
      row.contributionCents < row.capacity
    ) {
      row.contributionCents++;
      retainedCents--;
    }
  }
  for (const row of rows) {
    row.afterWeight =
      ((row.currentCents + row.contributionCents) / denominator) * 100;
    if (row.capacity > 0 && row.contributionCents === 0)
      row.reason =
        "Smaller selected holdings receive this contribution first; no addition at this budget.";
  }
  return {
    complete: true as const,
    issues,
    rows,
    totalCents: total,
    retainedCents,
    retainedReason: retainedCents
      ? "Retained as new cash: selected positions reached their caps, lack usable USD quotes, or no candidates are selected."
      : "The full contribution is allocated. Cent ties are resolved alphabetically.",
  };
}
