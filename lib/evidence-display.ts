import { amount } from "./format.ts";
import type { Research } from "./types";
import { financialPeriods } from "./engine.ts";
import { quarterFacts } from "./research-depth.ts";

export function upcomingEstimates(r: Research, annual: boolean) {
  const last = financialPeriods(
    annual ? r.facts : quarterFacts(r.facts, r.retrievedAt),
    annual ? "annual" : "quarterly",
    r.retrievedAt,
  ).at(-1)?.end;
  // A completed fiscal quarter can still be awaiting its earnings release.
  const cutoff = last ?? r.retrievedAt.slice(0, 10);
  return (r.evidence?.estimates ?? [])
    .filter(
      (x) =>
        x.date > cutoff &&
        x.frequency.toLowerCase().includes(annual ? "annual" : "quarter"),
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);
}

export function estimateValue(
  value: number | null | undefined,
  currency: string | null,
  compact = false,
) {
  if (value == null || !Number.isFinite(value)) return "—";
  if (currency) return amount(value, currency, compact);
  return new Intl.NumberFormat("en-US", {
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value);
}

export function earningsMultiple(value: number | null | undefined) {
  return value == null || !Number.isFinite(value)
    ? "—"
    : value <= 0
      ? "N/M"
      : `${value.toFixed(1)}×`;
}
