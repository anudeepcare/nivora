import type { DecisionAction } from "./auryn-decision";
export type AttentionSignal = {
  action: DecisionAction;
  contextLabel?: string;
  reason?: string;
  risk?: string;
  changeCondition?: string;
  evidenceAsOf?: string | null;
  businessPeriod?: string | null;
  assessmentPaused?: boolean;
  view: { detail: string; actionLabel: string };
};
/** Sort existing assessments for review; never invent a trade from price or gain alone. */
export function decisionAttention(input: {
  symbols: string[];
  held: string[];
  rows: Record<string, { signal?: AttentionSignal; error?: string }>;
  allocations?: { symbol: string; weight: number }[];
  concentrationLimit?: number | null;
}) {
  const held = new Set(input.held);
  const limit = input.concentrationLimit;
  const validLimit =
    limit != null && Number.isFinite(limit) && limit > 0 && limit <= 100;
  const priority: Record<DecisionAction, number> = {
    Sell: 0,
    Reduce: 1,
    Avoid: 2,
    Review: 3,
    Add: 4,
    Buy: 4,
    Wait: 5,
    Watch: 6,
    Hold: 7,
  };
  return [...new Set(input.symbols)]
    .map((symbol) => {
      const signal = input.rows[symbol]?.signal;
      const owns = held.has(symbol);
      const mismatchedContext =
        !owns && signal?.contextLabel === "For your holding";
      const usable = signal && !signal.assessmentPaused && !mismatchedContext;
      const action: DecisionAction = usable ? signal.action : "Review";
      const weight = input.allocations?.find(
        (x) => x.symbol === symbol,
      )?.weight;
      const sizeReview =
        owns &&
        validLimit &&
        weight != null &&
        Number.isFinite(weight) &&
        weight > limit;
      return {
        symbol,
        owns,
        action,
        label: sizeReview
          ? "Review position size"
          : action === "Reduce"
            ? "Trim review"
            : action === "Sell"
              ? "Exit review"
              : usable
                ? signal.view.actionLabel
                : "Evidence review",
        reason: sizeReview
          ? `${weight.toFixed(1)}% of priced investments exceeds your ${limit}% attention threshold.`
          : mismatchedContext
            ? "Refresh the new-purchase assessment before considering an entry."
            : signal?.reason ||
              signal?.view.detail ||
              "A current assessment is not available. Open research before acting.",
        changeCondition: usable ? (signal.changeCondition ?? null) : null,
        risk: usable ? (signal.risk ?? null) : null,
        asOf: signal?.evidenceAsOf ?? null,
        businessPeriod: signal?.businessPeriod ?? null,
        sizeReview: !!sizeReview,
        assessmentAvailable: !!usable,
        priority: usable
          ? Math.min(priority[action], sizeReview ? 2 : Infinity)
          : sizeReview
            ? 2
            : 8,
      };
    })
    .sort(
      (a, b) => a.priority - b.priority || a.symbol.localeCompare(b.symbol),
    );
}
