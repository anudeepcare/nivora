/** Review constraints only. Recorded balances are not broker buying power or trade execution. */
export function portfolioGuardrails(input: {
  portfolioValue: number;
  cash: number;
  complete: boolean;
  cashReservePercent?: number | null;
  maxLossPercent?: number | null;
  cashSpend?: number | null;
  maximumLoss?: number | null;
}) {
  const validPercent = (x: unknown): x is number =>
    typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 100;
  if (
    !input.complete ||
    !Number.isFinite(input.portfolioValue) ||
    input.portfolioValue <= 0 ||
    !Number.isFinite(input.cash) ||
    input.cash < 0 ||
    input.cash > input.portfolioValue
  )
    return { available: false as const };
  const reserve = validPercent(input.cashReservePercent)
    ? (input.portfolioValue * input.cashReservePercent) / 100
    : null;
  const spendable = reserve === null ? null : Math.max(0, input.cash - reserve);
  const budget = validPercent(input.maxLossPercent)
    ? (input.portfolioValue * input.maxLossPercent) / 100
    : null;
  const spend =
    input.cashSpend != null &&
    Number.isFinite(input.cashSpend) &&
    input.cashSpend >= 0
      ? input.cashSpend
      : null;
  const loss = input.maximumLoss;
  return {
    available: true as const,
    reserve,
    spendable,
    budget,
    reserveBreach:
      spend === null || spendable === null ? null : spend > spendable,
    lossBreach:
      budget === null || loss == null || Number.isNaN(loss) || loss < 0
        ? null
        : loss > budget,
  };
}
