import type { FinancialPeriod } from "./types";
export const flowFields = [
  "grossProfit",
  "costOfRevenue",
  "researchExpense",
  "stockCompensation",
  "buybacks",
  "dividends",
  "interestExpense",
  "depreciation",
] as const;
export const balanceFields = [
  "cash",
  "debt",
  "equity",
  "assets",
  "liabilities",
  "currentAssets",
  "currentLiabilities",
  "receivables",
  "inventory",
  "payables",
  "retainedEarnings",
] as const;
export function ratio(
  a: number | null | undefined,
  b: number | null | undefined,
  scale = 1,
) {
  return a != null &&
    b != null &&
    Number.isFinite(a) &&
    Number.isFinite(b) &&
    b > 0
    ? (a / b) * scale
    : null;
}
export function withFinancialRatios(p: FinancialPeriod): FinancialPeriod {
  return {
    ...p,
    grossMargin: ratio(p.grossProfit, p.revenue, 100),
    netMargin: ratio(p.netIncome, p.revenue, 100),
    fcfMargin: ratio(p.fcf, p.revenue, 100),
    sbcRevenue: ratio(p.stockCompensation, p.revenue, 100),
    capexRevenue: ratio(
      p.capex == null ? null : Math.abs(p.capex),
      p.revenue,
      100,
    ),
    fcfPerShare: ratio(p.fcf, p.weightedShares),
    sbcAdjustedFcfPerShare: ratio(
      p.fcf != null && p.stockCompensation != null
        ? p.fcf - p.stockCompensation
        : null,
      p.weightedShares,
    ),
    currentRatio: ratio(p.currentAssets, p.currentLiabilities),
    debtEquity: ratio(p.debt, p.equity),
    netDebt: p.debt != null && p.cash != null ? p.debt - p.cash : null,
    interestCoverage: ratio(p.operatingIncome, p.interestExpense),
    cashConversion: ratio(p.operatingCashFlow, p.netIncome),
  };
}
