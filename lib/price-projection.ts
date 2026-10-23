export type ProjectionInputs = {
  revenue: number;
  shares: number;
  growth: number;
  margin: number;
  multiple: number;
  dilution: number;
  discount: number;
};
export function projectEarnings(x: ProjectionInputs, years: number) {
  if (
    !Object.values(x).every(Number.isFinite) ||
    x.revenue <= 0 ||
    x.shares <= 0 ||
    x.growth <= -100 ||
    x.growth > 100 ||
    x.margin <= 0 ||
    x.margin > 100 ||
    x.multiple <= 0 ||
    x.multiple > 100 ||
    x.dilution < 0 ||
    x.dilution > 50 ||
    x.discount <= 0 ||
    x.discount > 50 ||
    !Number.isInteger(years) ||
    years < 1 ||
    years > 5
  )
    return null;
  return Array.from({ length: years }, (_, i) => {
    const year = i + 1,
      revenue = x.revenue * (1 + x.growth / 100) ** year,
      earnings = (revenue * x.margin) / 100,
      shares = x.shares * (1 + x.dilution / 100) ** year,
      eps = earnings / shares,
      price = eps * x.multiple;
    return {
      year,
      revenue,
      earnings,
      shares,
      eps,
      price,
      presentValue: price / (1 + x.discount / 100) ** year,
    };
  });
}
