/** Explicit terminal-equity scenario. No current market multiple is imported.
 * All amounts use one currency and whole units; margins/rates are percentages.
 * OCF margin includes taxes, working capital and existing-debt interest.
 * Incremental financing is assumed at inception; no debt amortisation/dividends.
 */
export type FundedInputs = {
  startRevenue: number;
  terminalRevenue: number;
  years: number;
  cash: number;
  debt: number;
  shares: number;
  ocfMargin: number;
  ebitdaMargin: number;
  totalCapex: number;
  newDebt: number;
  equityRaised: number;
  issuePrice: number;
  annualDilution: number;
  debtRate: number;
  exitEbitdaMultiple: number;
  discountRate: number;
};
export function fundedScenario(
  x: FundedInputs,
):
  | {
      available: false;
      code: "invalid-input" | "funding-gap";
      reason: string;
      fundingGap?: number;
    }
  | {
      available: true;
      endingCash: number;
      endingDebt: number;
      endingShares: number;
      operatingCash: number;
      newDebtInterest: number;
      terminalPrice: number;
      presentValue: number;
      fundingGap: 0;
    } {
  if (
    !Object.values(x).every(Number.isFinite) ||
    !Number.isInteger(x.years) ||
    x.years < 1 ||
    x.years > 10 ||
    x.startRevenue <= 0 ||
    x.terminalRevenue <= 0 ||
    x.shares <= 0 ||
    x.cash < 0 ||
    x.debt < 0 ||
    x.totalCapex < 0 ||
    x.newDebt < 0 ||
    x.equityRaised < 0 ||
    x.issuePrice <= 0 ||
    x.ocfMargin < -100 ||
    x.ocfMargin > 100 ||
    x.ebitdaMargin <= 0 ||
    x.ebitdaMargin > 100 ||
    x.annualDilution < 0 ||
    x.annualDilution > 50 ||
    x.debtRate < 0 ||
    x.debtRate > 50 ||
    x.exitEbitdaMultiple <= 0 ||
    x.exitEbitdaMultiple > 100 ||
    x.discountRate <= 0 ||
    x.discountRate > 50
  )
    return {
      available: false,
      code: "invalid-input",
      reason:
        "Complete valid assumptions in one currency; positive terminal operating economics and a required return are needed.",
    };
  const growth = (x.terminalRevenue / x.startRevenue) ** (1 / x.years);
  let operatingCash = 0,
    interest = 0,
    cash = x.cash + x.newDebt + x.equityRaised;
  // Capex is evenly phased. Withhold if ANY year is unfunded, not just the end.
  for (let year = 1; year <= x.years; year++) {
    const ocf = (x.startRevenue * growth ** year * x.ocfMargin) / 100;
    const debtInterest = (x.newDebt * x.debtRate) / 100;
    operatingCash += ocf;
    interest += debtInterest;
    cash += ocf - x.totalCapex / x.years - debtInterest;
    if (cash < 0)
      return {
        available: false,
        code: "funding-gap",
        fundingGap: -cash,
        reason: `The funding plan runs short in year ${year}; no per-share value is supported.`,
      };
  }
  const endingDebt = x.debt + x.newDebt;
  const endingShares =
    (x.shares + x.equityRaised / x.issuePrice) *
    (1 + x.annualDilution / 100) ** x.years;
  const enterprise =
    ((x.terminalRevenue * x.ebitdaMargin) / 100) * x.exitEbitdaMultiple;
  const terminalPrice =
    Math.max(0, enterprise - endingDebt + cash) / endingShares;
  const presentValue = terminalPrice / (1 + x.discountRate / 100) ** x.years;
  if (
    ![
      cash,
      endingDebt,
      endingShares,
      operatingCash,
      interest,
      terminalPrice,
      presentValue,
    ].every(Number.isFinite)
  )
    return {
      available: false,
      code: "invalid-input",
      reason: "Assumptions overflow the calculation.",
    };
  return {
    available: true,
    endingCash: cash,
    endingDebt,
    endingShares,
    operatingCash,
    newDebtInterest: interest,
    terminalPrice,
    presentValue,
    fundingGap: 0,
  };
}
