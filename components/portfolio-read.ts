/** Presentation only: no action-engine or return calculations live here. */
export function portfolioRead(input: {
  missing: number;
  older: number;
  largest?: { symbol: string; weight: number };
  limit: number | null;
  earnings: number;
  ready: boolean;
  holdings: number;
}) {
  if (!input.ready)
    return {
      title: "Building your portfolio view",
      detail: "Available prices and recorded balances will appear here.",
      tone: "neutral",
    };
  if (!input.holdings)
    return {
      title: "Start with your holdings",
      detail:
        "Add positions to see their price history, allocation and shared exposure together.",
      tone: "neutral",
    };
  if (input.missing)
    return {
      title: "Complete the picture first",
      detail: `${input.missing} holdings are missing usable USD prices. Totals and allocation exclude them; check coverage before judging position sizes.`,
      tone: "caution",
    };
  if (
    input.largest &&
    input.limit != null &&
    input.largest.weight > input.limit
  )
    return {
      title: "Review your largest position",
      detail: `${input.largest.symbol} is ${input.largest.weight.toFixed(1)}% of priced investments, above your ${input.limit}% attention threshold. Review its size alongside the business evidence.`,
      tone: "caution",
    };
  if (input.older)
    return {
      title: "Refresh before reassessing",
      detail: `${input.older} holdings use older available prices. Check timestamps before using these weights to make a decision.`,
      tone: "caution",
    };
  if (input.earnings)
    return {
      title: "Put upcoming earnings in context",
      detail: `${input.earnings} held stocks have supplied earnings dates in the next seven days. Check their weight and business evidence before changing a position.`,
      tone: "neutral",
    };
  return {
    title: "Know what drives your portfolio",
    detail: input.largest
      ? `${input.largest.symbol} is your largest priced investment at ${input.largest.weight.toFixed(1)}%. Compare the price path, then check whether shared sector exposure fits your plan.`
      : "Cash and balances are separate from the invested price comparison. Add priced investments to see what drives your allocation.",
    tone: "neutral",
  };
}

/** Multiple purchase lots represent one stock on the earnings calendar. */
export function portfolioEarningsCount(
  positions: readonly { symbol: string; assetType: string; quantity: number }[],
  earnings: ReadonlySet<string>,
): number {
  return new Set(
    positions
      .filter(
        (position) =>
          position.assetType === "stock" &&
          position.quantity > 0 &&
          earnings.has(position.symbol),
      )
      .map((position) => position.symbol),
  ).size;
}
