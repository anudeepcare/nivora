export const thesisMetrics = {
  margin: { label: "Operating margin", unit: "%", direction: "below" },
  interestCoverage: {
    label: "Interest coverage",
    unit: "×",
    direction: "below",
  },
  currentRatio: { label: "Current ratio", unit: "×", direction: "below" },
  sbcRevenue: {
    label: "Stock compensation / revenue",
    unit: "%",
    direction: "above",
  },
} as const;
export type ThesisMetric = keyof typeof thesisMetrics;
export function cleanThesisRule(v: Record<string, unknown>) {
  const monitorEnabled = v.monitorEnabled === "true";
  const monitorMetric = String(v.monitorMetric ?? "margin");
  const raw = String(v.monitorThreshold ?? "").trim();
  if (!(monitorMetric in thesisMetrics))
    throw Error("Choose a supported thesis metric.");
  if (
    monitorEnabled &&
    (!raw || !Number.isFinite(Number(raw)) || Math.abs(Number(raw)) > 100000)
  )
    throw Error("Enter a finite thesis threshold.");
  return {
    monitorEnabled: String(monitorEnabled),
    monitorMetric,
    monitorThreshold: raw,
  };
}
export function evaluateThesisRule(
  rule: Record<string, unknown>,
  evidence:
    | {
        end: string;
        basis: string;
        currency: string;
        margin?: number | null;
        interestCoverage?: number | null;
        currentRatio?: number | null;
        sbcRevenue?: number | null;
      }
    | null
    | undefined,
  asOf: string,
) {
  const clean = cleanThesisRule(rule);
  if (clean.monitorEnabled !== "true")
    return { status: "disabled" as const, reason: "Monitoring is off." };
  const metric = clean.monitorMetric as ThesisMetric,
    def = thesisMetrics[metric];
  const value = evidence?.[metric],
    age = (Date.parse(asOf) - Date.parse(evidence?.end ?? "")) / 86400000;
  if (
    !evidence ||
    !evidence.currency ||
    !Number.isFinite(age) ||
    age < 0 ||
    age > 550 ||
    value == null ||
    !Number.isFinite(value)
  )
    return {
      status: "unknown" as const,
      reason: "A current, dated financial input is unavailable.",
    };
  const threshold = Number(clean.monitorThreshold),
    breached =
      def.direction === "below" ? value < threshold : value > threshold;
  return {
    status: breached ? ("review" as const) : ("within-rule" as const),
    metric,
    label: def.label,
    unit: def.unit,
    direction: def.direction,
    value,
    threshold,
    period: evidence.end,
    basis: evidence.basis,
    currency: evidence.currency,
    reason: breached
      ? "Your saved review condition is met."
      : "This measured input is within your saved threshold.",
  };
}

export function thesisConditionIdentity(rule: Record<string, unknown>) {
  const r = cleanThesisRule(rule);
  return JSON.stringify([r.monitorMetric, Number(r.monitorThreshold)]);
}
