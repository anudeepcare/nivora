/** Inactive, descriptive evidence policy. No model imports, scoring or trade decisions. */
export const BUSINESS_EVIDENCE_VERSION = "independent-business-evidence-v1";
export type BusinessMetric =
  | "revenue"
  | "operatingIncome"
  | "netIncome"
  | "operatingCashFlow"
  | "cashCapex"
  | "unrestrictedCash"
  | "totalDebt"
  | "dilutedWeightedShares"
  | "stockCompensation";
export type BusinessSource = {
  url: string;
  accession: string;
  publishedAt: string;
  retrievedAt: string;
  publicationDateBasis: "reported" | "retrieval-fallback" | "unknown";
};
export type BusinessFact = {
  issuerId: string;
  securityId: string;
  metric: BusinessMetric;
  value: number | null;
  missingReason?: string;
  unit: string;
  currency: string | null;
  scope: "annual" | "instant" | "quarter" | "ytd";
  start: string | null;
  end: string;
  accountingBasis: string;
  representation:
    | "reported"
    | "derived"
    | "management-adjusted"
    | "analyst-estimated";
  comparabilityGroup: string;
  restatementVersion: string;
  reconciliation: "comparable" | "unresolved";
  shareBasis: string;
  definition: string;
  source: BusinessSource;
};
export type BusinessRisk = {
  issuerId: string;
  securityId: string;
  topic: string;
  status: "disclosed" | "not-identified-in-reviewed-scope" | "unknown";
  reviewedAt: string;
  summary: string;
  source: BusinessSource;
};
export type BusinessEvidenceInput = {
  asOf: string;
  issuerId: string;
  securityId: string;
  businessModel: string;
  classificationSource: BusinessSource;
  requirements: {
    policyId: string;
    currentPeriodEnd: string;
    priorPeriodEnd: string;
    criticalFacts: { metric: BusinessMetric; period: "current" | "prior" }[];
    criticalRiskTopics: string[];
  };
  facts: BusinessFact[];
  risks: BusinessRisk[];
};
export type BusinessMetricEvidence = {
  id: string;
  state: "observed" | "unavailable" | "non-comparable";
  value: number | null;
  unit: string;
  formula: string;
  reason: string;
  inputs: BusinessFact[];
};
export type BusinessRiskEvidence = {
  topic: string;
  state: "observed" | "unavailable";
  status: BusinessRisk["status"];
  summary: string;
  reviewedAt: string | null;
  source: BusinessSource | null;
};
export type BusinessEvidenceAssessment = {
  version: typeof BUSINESS_EVIDENCE_VERSION;
  policyId: string | null;
  asOf: string | null;
  status: "no-assessment" | "evidence-summary";
  reason: string;
  classification: {
    businessModel: string | null;
    source: BusinessSource | null;
  };
  authenticity: "not-verified";
  eligibility: "not-determined";
  instruction: null;
  reviewRequired: boolean;
  coverage: { availableRequiredFacts: number; requiredFacts: number };
  missing: string[];
  components: {
    growth: BusinessMetricEvidence[];
    cashLiquidity: BusinessMetricEvidence[];
    dilution: BusinessMetricEvidence[];
  };
  materialRisks: BusinessRiskEvidence[];
};
const metrics: BusinessMetric[] = [
  "revenue",
  "operatingIncome",
  "netIncome",
  "operatingCashFlow",
  "cashCapex",
  "unrestrictedCash",
  "totalDebt",
  "dilutedWeightedShares",
  "stockCompensation",
];
const text = (x: unknown): x is string =>
  typeof x === "string" && x.trim().length > 0;
const day = (x: unknown): x is string =>
  typeof x === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(x) &&
  Number.isFinite(Date.parse(x)) &&
  new Date(x).toISOString().slice(0, 10) === x;
function sourceValid(source: BusinessSource, asOf: string): boolean {
  if (
    !source ||
    !text(source.url) ||
    !text(source.accession) ||
    !day(source.publishedAt) ||
    !day(source.retrievedAt) ||
    source.publicationDateBasis !== "reported" ||
    source.publishedAt > source.retrievedAt ||
    source.retrievedAt > asOf
  )
    return false;
  try {
    const url = new URL(source.url);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      ![...url.searchParams.keys()].some((k) =>
        /token|secret|api.?key/i.test(k),
      )
    );
  } catch {
    return false;
  }
}
const sourceCopy = (s: BusinessSource): BusinessSource =>
  Object.freeze({
    url: s.url,
    accession: s.accession,
    publishedAt: s.publishedAt,
    retrievedAt: s.retrievedAt,
    publicationDateBasis: s.publicationDateBasis,
  });
function factCopy(f: BusinessFact): BusinessFact {
  return Object.freeze({
    issuerId: f.issuerId,
    securityId: f.securityId,
    metric: f.metric,
    value: f.value,
    unit: f.unit,
    currency: f.currency,
    scope: f.scope,
    start: f.start,
    end: f.end,
    accountingBasis: f.accountingBasis,
    representation: f.representation,
    comparabilityGroup: f.comparabilityGroup,
    restatementVersion: f.restatementVersion,
    reconciliation: f.reconciliation,
    shareBasis: f.shareBasis,
    definition: f.definition,
    source: sourceCopy(f.source),
  });
}
/** Source/date checks validate supplied contracts only. No authenticity or current
 * completeness claim is inferred from a URL, accession or caller declaration. */
export function assessIndependentBusinessEvidence(
  input: BusinessEvidenceInput,
): BusinessEvidenceAssessment {
  const result: BusinessEvidenceAssessment = {
    version: BUSINESS_EVIDENCE_VERSION,
    policyId: text(input?.requirements?.policyId)
      ? input.requirements.policyId
      : null,
    asOf: day(input?.asOf) ? input.asOf : null,
    status: "no-assessment",
    reason: "invalid-evidence-contract",
    classification: {
      businessModel: text(input?.businessModel) ? input.businessModel : null,
      source:
        day(input?.asOf) && sourceValid(input?.classificationSource, input.asOf)
          ? sourceCopy(input.classificationSource)
          : null,
    },
    authenticity: "not-verified",
    eligibility: "not-determined",
    instruction: null,
    reviewRequired: false,
    coverage: { availableRequiredFacts: 0, requiredFacts: 0 },
    missing: [],
    components: { growth: [], cashLiquidity: [], dilution: [] },
    materialRisks: [],
  };
  const finish = () => {
    Object.values(result.components).forEach((rows) => {
      rows.forEach((row) => {
        Object.freeze(row.inputs);
        Object.freeze(row);
      });
      Object.freeze(rows);
    });
    result.materialRisks.forEach(Object.freeze);
    Object.freeze(result.classification);
    Object.freeze(result.components);
    Object.freeze(result.materialRisks);
    Object.freeze(result.coverage);
    Object.freeze(result.missing);
    return Object.freeze(result);
  };
  if (input?.businessModel !== "ordinary-nonfinancial-operating") {
    result.reason = "unsupported-business-model";
    result.missing.push(
      "A reviewed specialist business module or explicit ordinary-company classification is required.",
    );
    return finish();
  }
  const req = input.requirements;
  if (
    !day(input.asOf) ||
    !text(input.issuerId) ||
    !text(input.securityId) ||
    !req ||
    !text(req.policyId) ||
    !day(req.currentPeriodEnd) ||
    !day(req.priorPeriodEnd) ||
    req.priorPeriodEnd >= req.currentPeriodEnd ||
    req.currentPeriodEnd > input.asOf ||
    !Array.isArray(req.criticalFacts) ||
    req.criticalFacts.length === 0 ||
    Array.from(req.criticalFacts).some(
      (x) =>
        !x ||
        !metrics.includes(x.metric) ||
        !["current", "prior"].includes(x.period),
    ) ||
    new Set(req.criticalFacts.map((x) => x.metric + ":" + x.period)).size !==
      req.criticalFacts.length ||
    !Array.isArray(req.criticalRiskTopics) ||
    req.criticalRiskTopics.length === 0 ||
    Array.from(req.criticalRiskTopics).some((x) => !text(x)) ||
    new Set(req.criticalRiskTopics).size !== req.criticalRiskTopics.length ||
    !Array.isArray(input.facts) ||
    !Array.isArray(input.risks) ||
    !sourceValid(input.classificationSource, input.asOf)
  ) {
    result.missing.push(
      "Explicit reporting expectations, source-backed classification and nonempty critical evidence requirements are needed.",
    );
    return finish();
  }
  result.coverage.requiredFacts = req.criticalFacts.length;
  const identityConflict =
    Array.from(input.facts).some(
      (f) =>
        !f ||
        f.issuerId !== input.issuerId ||
        f.securityId !== input.securityId,
    ) ||
    Array.from(input.risks).some(
      (r) =>
        !r ||
        !text(r.topic) ||
        r.issuerId !== input.issuerId ||
        r.securityId !== input.securityId,
    );
  if (identityConflict) {
    result.reason = "identity-conflict";
    result.missing.push("Issuer/security/share-class evidence conflicts.");
    return finish();
  }
  type Lookup = { fact: BusinessFact | null; reason: string };
  const get = (
    metric: BusinessMetric,
    period: "current" | "prior" = "current",
  ): Lookup => {
    const end =
      period === "current" ? req.currentPeriodEnd : req.priorPeriodEnd;
    const rows = input.facts.filter(
      (f) => f.metric === metric && f.end === end,
    );
    if (rows.length !== 1)
      return {
        fact: null,
        reason: rows.length
          ? "Conflicting/duplicate observations; none selected."
          : "Required observation not supplied.",
      };
    const f = rows[0],
      instant = metric === "unrestrictedCash" || metric === "totalDebt";
    if (f.value === null || !Number.isFinite(f.value))
      return {
        fact: null,
        reason: text(f.missingReason)
          ? f.missingReason
          : "Value unavailable; not treated as zero.",
      };
    if (!sourceValid(f.source, input.asOf) || f.source.publishedAt < f.end)
      return {
        fact: null,
        reason:
          "Reported publication/source chronology is unavailable or invalid.",
      };
    if (
      f.scope !== (instant ? "instant" : "annual") ||
      (instant ? f.start !== null : !day(f.start) || f.start > f.end) ||
      !day(f.end)
    )
      return {
        fact: null,
        reason: "Fiscal duration/instant scope is not comparable.",
      };
    if (
      !instant &&
      ![364, 365, 366, 371].includes(
        (Date.parse(f.end) - Date.parse(f.start!)) / 86400000 + 1,
      )
    )
      return {
        fact: null,
        reason:
          "Only calendar-year or 52/53-week annual periods are covered; transition/stub/multiyear periods need separate comparison.",
      };
    if (
      !text(f.shareBasis) ||
      !text(f.accountingBasis) ||
      !text(f.comparabilityGroup) ||
      !text(f.restatementVersion) ||
      !text(f.definition) ||
      f.representation !== "reported" ||
      f.reconciliation !== "comparable"
    )
      return {
        fact: null,
        reason: "Reported accounting/restatement comparability is unresolved.",
      };
    if (metric === "dilutedWeightedShares") {
      if (
        f.value! < 0 ||
        f.unit !== "shares" ||
        f.currency !== null ||
        f.shareBasis !== "split-comparable-diluted-weighted-average"
      )
        return {
          fact: null,
          reason:
            "Share class, split or weighted-average definition is not comparable.",
        };
    } else if (
      !text(f.currency) ||
      !Intl.supportedValuesOf("currency").includes(f.currency) ||
      f.unit !== f.currency
    )
      return {
        fact: null,
        reason:
          "Currency/unit is missing or inconsistent; no conversion is inferred.",
      };
    if (
      (metric === "cashCapex" &&
        (f.definition !==
          "cash-capex-outflow-positive-excluding-business-acquisitions" ||
          f.value! < 0)) ||
      (metric === "unrestrictedCash" &&
        (f.definition !== "unrestricted-cash-and-equivalents" ||
          f.value! < 0)) ||
      (metric === "totalDebt" &&
        (f.definition !== "gross-interest-bearing-debt" || f.value! < 0))
    )
      return {
        fact: null,
        reason: "Cash/debt definition or outflow sign is not established.",
      };
    return { fact: factCopy(f), reason: "" };
  };
  for (const ref of req.criticalFacts) {
    const x = get(ref.metric, ref.period);
    if (x.fact) result.coverage.availableRequiredFacts++;
    else result.missing.push(`${ref.metric}:${ref.period}: ${x.reason}`);
  }
  const comparable = (facts: BusinessFact[]): boolean => {
    if (
      new Set(facts.map((f) => f.accountingBasis)).size > 1 ||
      new Set(facts.map((f) => f.comparabilityGroup)).size > 1 ||
      new Set(facts.filter((f) => f.currency !== null).map((f) => f.currency))
        .size > 1
    )
      return false;
    for (const metric of new Set(facts.map((f) => f.metric)))
      if (
        new Set(
          facts.filter((f) => f.metric === metric).map((f) => f.definition),
        ).size > 1
      )
        return false;
    for (const end of new Set(facts.map((f) => f.end))) {
      const durations = facts.filter(
        (f) => f.end === end && f.scope === "annual",
      );
      if (new Set(durations.map((f) => f.start)).size > 1) return false;
    }
    const durationEnds = [
      ...new Set(facts.filter((f) => f.scope === "annual").map((f) => f.end)),
    ].sort();
    if (durationEnds.length > 1) {
      const current = facts.find(
        (f) => f.end === durationEnds.at(-1) && f.scope === "annual",
      )!;
      if (Date.parse(current.start!) !== Date.parse(durationEnds[0]) + 86400000)
        return false;
    }
    return true;
  };
  const criticalInputs = req.criticalFacts.flatMap((ref) => {
    const f = get(ref.metric, ref.period).fact;
    return f ? [f] : [];
  });
  if (criticalInputs.length && !comparable(criticalInputs))
    result.missing.push(
      "Critical reporting periods, currency, definitions or reconciliation groups are not comparable.",
    );
  const make = (
    id: string,
    unit: string,
    formula: string,
    refs: [BusinessMetric, ("current" | "prior")?][],
    calculate: (values: number[]) => number | null,
  ): BusinessMetricEvidence => {
    const found = refs.map(([m, p]) => get(m, p));
    const inputs = found.flatMap((x) => (x.fact ? [x.fact] : []));
    if (unit === "money") {
      const units = [
        ...new Set(inputs.flatMap((f) => (f.currency ? [f.currency] : []))),
      ];
      unit = units.length === 1 ? units[0] : "currency not established";
    }
    if (found.some((x) => !x.fact))
      return {
        id,
        state: "unavailable",
        value: null,
        unit,
        formula,
        inputs,
        reason: found
          .filter((x) => !x.fact)
          .map((x) => x.reason)
          .join(" "),
      };
    if (!comparable(inputs))
      return {
        id,
        state: "non-comparable",
        value: null,
        unit,
        formula,
        inputs,
        reason:
          "Currencies, fiscal periods, definitions or reconciliation groups differ.",
      };
    const raw = calculate(inputs.map((f) => f.value!));
    if (raw === null || !Number.isFinite(raw))
      return {
        id,
        state: "unavailable",
        value: null,
        unit,
        formula,
        inputs,
        reason:
          "The denominator, sign or finite arithmetic does not support this measure.",
      };
    return {
      id,
      state: "observed",
      value: Number(raw.toPrecision(12)),
      unit,
      formula,
      inputs,
      reason:
        "Descriptive calculation from supplied reported facts; not a quality threshold or forecast.",
    };
  };
  result.components.growth = [
    make(
      "revenueGrowth",
      "%",
      "(current revenue / prior revenue − 1) × 100",
      [["revenue"], ["revenue", "prior"]],
      ([c, p]) => (p > 0 ? (c / p - 1) * 100 : null),
    ),
    make(
      "revenuePerShareGrowth",
      "%",
      "((current revenue / current diluted weighted shares) / (prior revenue / prior diluted weighted shares) − 1) × 100",
      [
        ["revenue"],
        ["dilutedWeightedShares"],
        ["revenue", "prior"],
        ["dilutedWeightedShares", "prior"],
      ],
      ([c, cs, p, ps]) =>
        cs > 0 && ps > 0 && p > 0 ? (c / cs / (p / ps) - 1) * 100 : null,
    ),
    make(
      "operatingMargin",
      "%",
      "operating income / revenue × 100",
      [["operatingIncome"], ["revenue"]],
      ([income, revenue]) => (revenue > 0 ? (income / revenue) * 100 : null),
    ),
  ];
  result.components.cashLiquidity = [
    make(
      "operatingCashFlow",
      "money",
      "reported operating cash flow",
      [["operatingCashFlow"]],
      ([v]) => v,
    ),
    make(
      "freeCashFlow",
      "money",
      "operating cash flow − positive cash capex excluding business acquisitions; not company-adjusted FCF",
      [["operatingCashFlow"], ["cashCapex"]],
      ([cash, capex]) => cash - capex,
    ),
    make(
      "cashConversion",
      "ratio",
      "operating cash flow / positive net income",
      [["operatingCashFlow"], ["netIncome"]],
      ([cash, income]) => (income > 0 ? cash / income : null),
    ),
    make(
      "netDebt",
      "money",
      "gross interest-bearing debt − unrestricted cash and equivalents",
      [["totalDebt"], ["unrestrictedCash"]],
      ([debt, cash]) => debt - cash,
    ),
  ];
  result.components.dilution = [
    make(
      "dilutedShareGrowth",
      "%",
      "(current / prior split-comparable diluted weighted-average shares − 1) × 100",
      [["dilutedWeightedShares"], ["dilutedWeightedShares", "prior"]],
      ([c, p]) => (p > 0 ? (c / p - 1) * 100 : null),
    ),
    make(
      "stockCompToRevenue",
      "%",
      "reported stock compensation / revenue × 100",
      [["stockCompensation"], ["revenue"]],
      ([sbc, revenue]) => (revenue > 0 ? (sbc / revenue) * 100 : null),
    ),
  ];
  for (const topic of [
    ...new Set([...req.criticalRiskTopics, ...input.risks.map((r) => r.topic)]),
  ]) {
    const rows = input.risks.filter((r) => r.topic === topic),
      r = rows.length === 1 ? rows[0] : null;
    const valid =
      r &&
      ["disclosed", "not-identified-in-reviewed-scope"].includes(r.status) &&
      r.reviewedAt === input.asOf &&
      text(r.summary) &&
      sourceValid(r.source, input.asOf) &&
      r.source.publishedAt >= req.currentPeriodEnd;
    if (!valid) {
      result.materialRisks.push({
        topic,
        state: "unavailable",
        status: "unknown",
        summary:
          "Missing, conflicting or incomplete reviewed scope is not evidence of no risk.",
        reviewedAt: null,
        source: null,
      });
      if (req.criticalRiskTopics.includes(topic))
        result.missing.push(
          `${topic}: current, source-backed risk review unavailable.`,
        );
    } else {
      result.materialRisks.push({
        topic,
        state: "observed",
        status: r.status,
        summary: r.summary,
        reviewedAt: r.reviewedAt,
        source: sourceCopy(r.source),
      });
      if (r.status === "disclosed") result.reviewRequired = true;
    }
  }
  result.status = result.missing.length ? "no-assessment" : "evidence-summary";
  result.reason = result.missing.length
    ? "critical-evidence-unavailable"
    : "descriptive-evidence-only";
  return finish();
}
