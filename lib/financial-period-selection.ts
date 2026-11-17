import type { Fact, FinancialPeriod } from "./types";

const coreFields = [
  "revenue",
  "operatingIncome",
  "netIncome",
  "operatingCashFlow",
  "capex",
  "fcf",
] as const;
const completeness = (row: FinancialPeriod) =>
  coreFields.filter((key) => row[key] != null).length;
const basisPriority = (basis: string) => (basis === "Provider" ? 0 : 1);

/** Ascending order, with the preferred complete observation last for tied ends.
 * Never depend on provider input order when period starts/bases differ. */
export function compareFinancialPeriods(
  a: FinancialPeriod,
  b: FinancialPeriod,
): number {
  return (
    a.end.localeCompare(b.end) ||
    completeness(a) - completeness(b) ||
    basisPriority(a.basis) - basisPriority(b.basis) ||
    a.filed.localeCompare(b.filed) ||
    a.currency.localeCompare(b.currency) ||
    a.basis.localeCompare(b.basis) ||
    b.start.localeCompare(a.start) ||
    a.sourceUrl.localeCompare(b.sourceUrl)
  );
}

export function selectFinancialPeriod(
  rows: FinancialPeriod[],
  currency?: string | null,
): FinancialPeriod | undefined {
  if (!rows.length) return undefined;
  const end = rows.reduce(
    (latest, row) => (row.end > latest ? row.end : latest),
    "",
  );
  const latest = rows.filter((row) => row.end === end);
  const preferred = currency
    ? latest.filter((row) => row.currency === currency)
    : [];
  return [...(preferred.length ? preferred : latest)]
    .sort(compareFinancialPeriods)
    .at(-1);
}

/** Newest filing first; stable tie breaks retain a reproducible source choice.
 * Same-filing disagreements remain in facts for the evidence conflict check. */
export function compareFinancialFacts(a: Fact, b: Fact): number {
  return (
    b.filed.localeCompare(a.filed) ||
    a.accession.localeCompare(b.accession) ||
    a.id.localeCompare(b.id) ||
    a.sourceUrl.localeCompare(b.sourceUrl) ||
    a.value - b.value
  );
}
