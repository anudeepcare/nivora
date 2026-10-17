export type OperatingAssumptions = {
  capacity: number;
  revenuePerUnit: number;
  utilization: number;
  fcfMargin: number;
  years: number;
  multiple: number;
  netDebt: number;
  shares: number;
  dilution: number;
  discount: number;
};
export function operatingScenario(x: OperatingAssumptions) {
  if (
    !Object.values(x).every(Number.isFinite) ||
    x.capacity <= 0 ||
    x.revenuePerUnit <= 0 ||
    x.utilization <= 0 ||
    x.utilization > 100 ||
    x.fcfMargin <= 0 ||
    x.fcfMargin > 100 ||
    x.years < 1 ||
    x.years > 15 ||
    x.multiple <= 0 ||
    x.multiple > 100 ||
    x.shares <= 0 ||
    x.dilution < 0 ||
    x.dilution > 50 ||
    x.discount <= 0 ||
    x.discount > 50
  )
    return null;
  const revenue = (x.capacity * x.revenuePerUnit * x.utilization) / 100,
    fcf = (revenue * x.fcfMargin) / 100,
    futureEquity = fcf * x.multiple - x.netDebt,
    perShare =
      Math.max(0, futureEquity) /
      (x.shares * (1 + x.dilution / 100) ** x.years) /
      (1 + x.discount / 100) ** x.years;
  return { revenue, fcf, futureEquity, perShare };
}
export function bankScenario(
  tangibleBookPerShare: number,
  roe: number,
  cost: number,
  growth: number,
) {
  if (
    ![tangibleBookPerShare, roe, cost, growth].every(Number.isFinite) ||
    tangibleBookPerShare <= 0 ||
    roe <= growth ||
    cost <= growth ||
    growth < 0 ||
    cost > 50 ||
    roe > 100
  )
    return null;
  return {
    value: (tangibleBookPerShare * (roe - growth)) / (cost - growth),
    justifiedMultiple: (roe - growth) / (cost - growth),
  };
}
