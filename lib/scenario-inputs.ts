import type { FinancialPeriod } from "./types";

/** Only reported annual/TTM monetary facts in the quote currency are reusable.
 * Outstanding shares still require the user's listing/ADR reconciliation.
 * Weighted-average shares are intentionally never a current share count proxy.
 */
export function scenarioStartingValues(
  period: FinancialPeriod | undefined,
  quoteCurrency: string,
  outstanding: number | null | undefined,
): Partial<Record<"startRevenue" | "cash" | "debt" | "shares", string>> {
  const values: Partial<
    Record<"startRevenue" | "cash" | "debt" | "shares", string>
  > = {};
  const days = period
    ? (Date.parse(period.end) - Date.parse(period.start)) / 86400000
    : NaN;
  if (
    period &&
    days >= 330 &&
    days <= 400 &&
    quoteCurrency &&
    period.currency === quoteCurrency
  ) {
    if (Number.isFinite(period.revenue) && period.revenue! > 0)
      values.startRevenue = String(period.revenue);
    if (Number.isFinite(period.cash) && period.cash! >= 0)
      values.cash = String(period.cash);
    if (Number.isFinite(period.debt) && period.debt! >= 0)
      values.debt = String(period.debt);
  }
  if (Number.isFinite(outstanding) && outstanding! > 0)
    values.shares = String(outstanding);
  return values;
}

/** Both enterprise cash-flow and EV/EBITDA funding modes share this suitability gate. */
export function operatingScenarioSupported(
  assetType: string,
  family: string,
): boolean {
  return (
    assetType === "stock" &&
    ["operating-company", "infrastructure", "frontier"].includes(family)
  );
}
