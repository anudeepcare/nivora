/** Inactive, unvalidated research prototype. No fitted parameters or legacy imports. */
export type IndependentPaceInput = {
  instrument: { symbol: string; exchange: string; assetType: "stock" };
  verification: {
    providerInstrumentId: string;
    sourceReference: string;
    retrievedAt: string;
    completedMonthsVerified: boolean;
    calendarReference: string;
    latestSettledSession: string;
    eligibility: {
      status: "eligible" | "ineligible" | "unknown";
      policyId: string;
      assessedOn: string;
      evidenceReferences: string[];
    };
  };
  asOf: string;
  source: "EODHD";
  currency: string;
  adjustmentBasis: "split-and-dividend-adjusted";
  basisVerified: boolean;
  observation: { date: string; close: number; settled: boolean };
  history: { month: string; close: number }[];
  policy: {
    lookbackMonths: number;
    quantiles: [number, number, number, number];
  };
};
export type IndependentPaceResult = {
  status: "unavailable" | "proposed";
  validated: false;
  instruction: null;
  stage: 0 | 1 | 2 | 3 | 4 | null;
  reason: string;
  thresholds?: number[];
  historyThrough?: string;
  observationDate?: string;
  currency?: string;
  policy?: IndependentPaceInput["policy"];
  instrumentId?: string;
  eligibilityPolicyId?: string;
};
function validDate(value: string): boolean {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const time = Date.parse(value + "T00:00:00Z");
  return (
    Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value
  );
}
function monthIndex(value: string): number {
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value))
    return NaN;
  return Number(value.slice(0, 4)) * 12 + Number(value.slice(5, 7)) - 1;
}
const positive = (value: number) => Number.isFinite(value) && value > 0;
/** Caller must verify provider provenance, monthly completeness and common adjustment basis.
 * Dates alone cannot establish market settlement or corporate-action correctness.
 * Price position is NOT business value, expected return, suitability or a buy/sell decision.
 */
export function proposeIndependentPace(
  input: IndependentPaceInput,
): IndependentPaceResult {
  const unavailable = (reason: string): IndependentPaceResult => ({
    status: "unavailable",
    validated: false,
    instruction: null,
    stage: null,
    reason,
  });
  const policy = input?.policy;
  if (
    !policy ||
    !Number.isInteger(policy.lookbackMonths) ||
    policy.lookbackMonths < 2 ||
    !Array.isArray(policy.quantiles) ||
    policy.quantiles.length !== 4 ||
    Array.from(policy.quantiles).some(
      (q, i, a) =>
        !Number.isFinite(q) || q <= 0 || q >= 1 || (i > 0 && q <= a[i - 1]),
    )
  )
    return unavailable(
      "An explicit lookback and four strictly increasing quantiles inside (0, 1) are required. No defaults are supplied.",
    );
  if (
    input.source !== "EODHD" ||
    !/^[A-Z]{3}$/.test(input.currency) ||
    input.adjustmentBasis !== "split-and-dividend-adjusted" ||
    input.basisVerified !== true
  )
    return unavailable(
      "Verified provider, currency and common adjusted-price basis are required.",
    );
  const instrument = input.instrument;
  const verification = input.verification;
  const hasText = (v: unknown): v is string =>
    typeof v === "string" && v.trim().length > 0;
  if (
    !instrument ||
    typeof instrument.symbol !== "string" ||
    typeof instrument.exchange !== "string" ||
    !/^[A-Z0-9][A-Z0-9_-]*$/.test(instrument.symbol ?? "") ||
    !/^[A-Z0-9][A-Z0-9_-]*$/.test(instrument.exchange ?? "") ||
    instrument.assetType !== "stock"
  )
    return unavailable(
      "An explicit supported stock symbol and exchange identity are required.",
    );
  const instrumentId = `${instrument.symbol}.${instrument.exchange}`;
  if (!Intl.supportedValuesOf("currency").includes(input.currency))
    return unavailable("A recognized ISO currency is required.");
  if (
    !verification ||
    verification.providerInstrumentId !== instrumentId ||
    !hasText(verification.sourceReference) ||
    verification.completedMonthsVerified !== true ||
    !hasText(verification.calendarReference) ||
    !validDate(verification.latestSettledSession)
  )
    return unavailable(
      "Matching provider instrument identity, source evidence, completed-month verification and exchange-calendar evidence are required.",
    );
  const retrievedAt = verification.retrievedAt;
  if (
    typeof retrievedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{3})?Z$/.test(
      retrievedAt,
    ) ||
    !Number.isFinite(Date.parse(retrievedAt)) ||
    !validDate(retrievedAt.slice(0, 10)) ||
    retrievedAt.slice(0, 10) > input.asOf ||
    retrievedAt.slice(0, 10) < verification.latestSettledSession
  )
    return unavailable(
      "A valid UTC retrieval time between the last settled session and as-of date is required.",
    );
  const eligibility = verification.eligibility;
  if (
    !eligibility ||
    eligibility.status !== "eligible" ||
    !hasText(eligibility.policyId) ||
    eligibility.assessedOn !== input.asOf ||
    !Array.isArray(eligibility.evidenceReferences) ||
    eligibility.evidenceReferences.length === 0 ||
    Array.from(eligibility.evidenceReferences).some((ref) => !hasText(ref))
  )
    return unavailable(
      "A same-as-of explicit eligible assessment under a named independent policy with supporting evidence is required. Unknown and ineligible instruments are withheld.",
    );
  const observation = input.observation;
  if (
    !validDate(input.asOf) ||
    !observation ||
    !validDate(observation.date) ||
    observation.date > input.asOf ||
    observation.date.slice(0, 7) !== input.asOf.slice(0, 7) ||
    observation.settled !== true ||
    observation.date !== verification.latestSettledSession ||
    !positive(observation.close)
  )
    return unavailable(
      "A settled positive observation in the as-of month, not after as-of, is required.",
    );
  const currentMonth = monthIndex(input.asOf.slice(0, 7));
  const history = input.history;
  if (
    !Array.isArray(history) ||
    history.length !== policy.lookbackMonths ||
    Array.from(history).some(
      (p, i) =>
        !p ||
        !positive(p.close) ||
        monthIndex(p.month) !== currentMonth - policy.lookbackMonths + i,
    )
  )
    return unavailable(
      "Exactly the requested consecutive completed months immediately before the observation month are required, in ascending order.",
    );
  const sorted = history.map((p) => p.close).sort((a, b) => a - b);
  const thresholds = policy.quantiles.map((q) => {
    const index = q * (sorted.length - 1);
    const lower = Math.floor(index);
    const fraction = index - lower;
    return (
      sorted[lower] + (sorted[Math.ceil(index)] - sorted[lower]) * fraction
    );
  });
  if (
    thresholds.some((v, i) => !positive(v) || (i > 0 && v <= thresholds[i - 1]))
  )
    return unavailable(
      "The distribution does not support four distinct finite boundaries.",
    );
  const band = thresholds.findIndex((t) => observation.close <= t);
  const stage = (band === -1 ? 0 : 4 - band) as 0 | 1 | 2 | 3 | 4;
  return {
    status: "proposed",
    validated: false,
    instruction: null,
    stage,
    reason:
      "Descriptive adjusted-price position only. Proposed P0–P4 mapping is unvalidated; no trade action or future return is inferred.",
    thresholds,
    historyThrough: history[history.length - 1].month,
    observationDate: observation.date,
    currency: input.currency,
    instrumentId,
    eligibilityPolicyId: eligibility.policyId,
    policy: {
      lookbackMonths: policy.lookbackMonths,
      quantiles: [...policy.quantiles],
    },
  };
}
