/** Evidence policy, not a forecast or personalized order instruction. */
export type EdgeInput = {
  business: "strong" | "mixed" | "weak" | "missing";
  value: "supported" | "demanding" | "unestablished";
  timing: "favorable" | "mixed" | "extended";
  severeRisk: boolean;
  conflicting: boolean;
  freshQuote: boolean;
  confirmedPace: number | null;
  formingPace: number | null;
  assetType: string;
  ownsPosition?: boolean;
  specialistModel?: boolean;
};
export function edgeReading(input: EdgeInput) {
  const pace =
    input.confirmedPace == null ||
    !Number.isInteger(input.confirmedPace) ||
    input.confirmedPace < 0 ||
    input.confirmedPace > 4
      ? null
      : input.confirmedPace;
  const formingPace =
    input.formingPace != null &&
    Number.isInteger(input.formingPace) &&
    input.formingPace >= 0 &&
    input.formingPace <= 4
      ? input.formingPace
      : null;
  const result = (
    verdict: string,
    reason: string,
    tone: "positive" | "caution" | "risk" | "neutral",
    turningPoint: string,
  ) => ({
    version: "edge-v2",
    assessment:
      verdict === "Build"
        ? input.ownsPosition
          ? "Consider adding gradually"
          : "Consider starting"
        : verdict === "Begin small"
          ? "Start small"
          : verdict === "Hold & monitor"
            ? "Hold and monitor"
            : verdict === "Review exposure"
              ? "Review exposure before adding"
              : verdict === "Evidence needed"
                ? "Review the business and price separately"
                : verdict === "Sector review"
                  ? "Use the business-specific evidence"
                  : verdict === "Price review"
                    ? "Review the price and instrument risks"
                    : input.value === "unestablished" && input.freshQuote
                      ? "Check the price assumptions"
                      : !input.freshQuote
                        ? "Review the latest dated price"
                        : "Wait for stronger entry conditions",
    riskReview: input.severeRisk || input.conflicting,
    verdict,
    reason,
    tone,
    turningPoint,
    pace,
    pricePace: pace,
    formingPace,
  });
  if (input.conflicting)
    return result(
      "Evidence needed",
      "Some financial inputs disagree. Price evidence remains visible; affected valuation calculations need a consistency check.",
      "caution",
      "Reconcile share units, currency and reporting dates.",
    );
  if (input.assetType !== "stock")
    return result(
      "Price review",
      "Company earnings and moat assessments do not apply to this instrument. Review its own risks and price evidence.",
      "neutral",
      "Review the instrument-specific exposure and risk framework.",
    );
  if (input.severeRisk)
    return result(
      "Review exposure",
      "Material business or financing risk takes priority over a lower price.",
      "risk",
      "Revisit the flagged financing or operating evidence.",
    );
  if (input.specialistModel)
    return result(
      "Sector review",
      "This business needs sector-specific operating and balance-sheet evidence before a combined entry reading.",
      "neutral",
      "Review the sector-specific model and its assumptions.",
    );
  if (!input.freshQuote)
    return result(
      "Wait",
      "Entry reading paused until a recent, dated quote is available.",
      "caution",
      "Confirm a dated, usable price observation.",
    );
  if (input.business === "missing")
    return result(
      "Evidence needed",
      "Comparable financial evidence is not sufficient for a business verdict.",
      "neutral",
      "Review the next available comparable financial report.",
    );
  if (input.business === "weak")
    return result(
      "Review exposure",
      "Cash generation or operating evidence needs attention before increasing exposure.",
      "risk",
      "Look for improving cash generation and a funded operating plan.",
    );
  if (
    input.ownsPosition &&
    input.business === "strong" &&
    input.value === "unestablished"
  )
    return result(
      "Hold & monitor",
      "Positive operating evidence remains relevant to an existing holding. Review price assumptions before deciding whether to add.",
      "neutral",
      "Check whether cash generation and the ownership case remain intact.",
    );
  if (input.value === "unestablished")
    return result(
      "Wait",
      "The business can be reviewed, but a supported valuation case has not established an entry cushion.",
      "caution",
      "Review the valuation assumptions and their sensitivity.",
    );
  if (
    input.ownsPosition &&
    input.business === "strong" &&
    (input.value === "demanding" || pace === 0 || input.timing === "extended")
  )
    return result(
      "Hold & monitor",
      "The operating case remains supported, while current conditions limit adding. Review the valuation and position concentration.",
      "neutral",
      "Revisit operating results, valuation assumptions and your exposure.",
    );
  if (input.value === "demanding" || pace === 0 || input.timing === "extended")
    return result(
      "Wait",
      "Price or entry conditions limit the case for adding. A pause is not an instruction to sell.",
      "caution",
      "Revisit the price cushion or evidence behind future earnings.",
    );
  if (
    input.business === "strong" &&
    input.timing === "favorable" &&
    pace != null &&
    pace >= 2
  )
    return result(
      "Build",
      "Cash generation, supported scenario assumptions and entry conditions align. Review the downside before adding.",
      "positive",
      "Track whether cash generation and the scenario assumptions remain intact.",
    );
  return result(
    "Begin small",
    "Some evidence supports an entry, while mixed conditions limit conviction.",
    "caution",
    "Look for broader agreement between business results, valuation and timing.",
  );
}
