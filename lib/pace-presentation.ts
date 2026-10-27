import type { DecisionAction } from "./auryn-decision";

export const PACE_LEVELS = [
  "Paused",
  "Steady",
  "Increased",
  "Elevated",
  "Accelerated",
] as const;
export const PACE_EXPLANATION =
  "P means Pace — AURYN’s contribution pace scale, from P0 (Paused) to P4 (Accelerated). Business first: growth, profitability and funding determine whether accumulation is supported. Confirmed Pace then guides scheduled purchases within your budget. P4 describes price conditions relative to history, not business quality, fair value, expected returns or leverage.";
export function paceLevel(value: number | null | undefined): number | null {
  return value != null && Number.isInteger(value) && value >= 0 && value <= 4
    ? value
    : null;
}
export function paceCode(value: number | null | undefined): string {
  const level = paceLevel(value);
  return level == null ? "Pending" : `P${level}`;
}
type Reading = {
  multiplier?: number | null;
  date?: string | null;
  month?: string | null;
  reason?: string | null;
};
/** Keep period identity: a forming P4 and a completed P2 are different observations. */
export function pacePeriods(
  input: Reading & { forming?: Reading | null },
  weekly = false,
) {
  return (
    [
      {
        key: "forming",
        label: `Current ${weekly ? "week" : "month"} · forming`,
        value: input.forming,
      },
      {
        key: "confirmed",
        label: `Completed ${weekly ? "week" : "month"} · confirmed`,
        value: input,
      },
    ] as const
  ).map(({ key, label, value }) => ({
    key,
    label,
    code: paceCode(value?.multiplier),
    level: paceLevel(value?.multiplier),
    name:
      paceLevel(value?.multiplier) == null
        ? null
        : PACE_LEVELS[value!.multiplier!],
    date: value?.date ?? null,
    month: value?.month ?? null,
    reason: value?.reason ?? null,
  }));
}
export function pacePresentation(
  action: DecisionAction,
  multiplier: number | null | undefined,
) {
  const rawLevel = paceLevel(multiplier);
  const blocked = ["Reduce", "Sell", "Avoid"].includes(action);
  const permitted = action === "Buy" || action === "Add";
  const status = blocked
    ? "paused"
    : action === "Hold"
      ? "maintain"
      : permitted
        ? "active"
        : "context";
  const label = blocked
    ? "Additions paused"
    : action === "Hold"
      ? "Maintain position"
      : !permitted
        ? "Price context"
        : rawLevel == null
          ? "Building history"
          : PACE_LEVELS[rawLevel];
  const detail = blocked
    ? `The AURYN View is ${action}. Review the business risk before adding; the price-only reading does not override it.`
    : action === "Hold"
      ? "The business case is supported. Confirmed P0 pauses new contributions until a completed reading changes. P0 is not a sell signal."
      : action === "Review"
        ? "Review the stated business or data checks before adding. A price reading alone cannot complete the assessment or establish business quality."
        : !permitted
          ? "Entry conditions are not yet met. This reading explains the price setup; it is not an instruction to add."
          : rawLevel == null
            ? "The business and price case align; a contribution level needs enough completed price history."
            : rawLevel === 0
              ? "The price policy pauses scheduled contributions. P0 is not a sell signal."
              : `P${rawLevel} means ${rawLevel}× your baseline scheduled contribution, capped by your available cash budget and position limit. It supports gradual accumulation after the business checks, not an all-at-once purchase or a return forecast.`;
  const effectiveCode =
    permitted && rawLevel != null && rawLevel > 0 ? paceCode(rawLevel) : null;
  const actionLabel = permitted
    ? rawLevel === 0
      ? "Pause new contributions"
      : `${action} gradually`
    : action === "Hold"
      ? "Hold · pause additions"
      : action === "Wait"
        ? "Wait before buying"
        : action;
  return {
    actionLabel,
    effectiveCode,
    rawLevel,
    code: paceCode(rawLevel),
    label,
    status,
    permitted,
    detail,
    explanation: PACE_EXPLANATION,
  };
}
