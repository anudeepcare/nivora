/** Observations only: absent targets are never synthesized from other fields. */
export type AnalystSnapshot = {
  symbol: string;
  currency?: string | null;
  closeDate?: string | null;
  close?: number | null;
  low?: number | null;
  consensus?: number | null;
  high?: number | null;
  analysts?: number | null;
  analystCountKind?: "target-contributors" | "recommendations";
  /** Day the source was actually inspected, not the target's revision date. */
  observedOn?: string | null;
  /** Explicit target revision/as-of date, if supplied by the source. */
  targetAsOf?: string | null;
  /** Dataset freshness is retained as metadata, never used as targetAsOf. */
  datasetAsOf?: string | null;
  closeDateBasis?: "observed" | "inferred";
  source?: string;
};

type EvidenceState = "missing" | "partial" | "complete" | "invalid";
type RowStatus =
  | EvidenceState
  | "compared"
  | "date-incomparable"
  | "basis-incomparable";
const fields = [
  "currency",
  "closeDate",
  "close",
  "low",
  "consensus",
  "high",
  "analysts",
] as const;
const targetFields = ["low", "consensus", "high"] as const;
const isPresent = (value: unknown) => value !== null && value !== undefined;
const positive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;
const validDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return (
    Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value
  );
};
const validSymbol = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Z0-9][A-Z0-9./^-]*$/.test(value);
const targetAnalysts = (row: AnalystSnapshot) =>
  row.analystCountKind !== "recommendations" &&
  positive(row.analysts) &&
  Number.isInteger(row.analysts);

function assess(row: AnalystSnapshot | undefined) {
  if (!row)
    return {
      state: "missing" as EvidenceState,
      missingFields: [...fields] as string[],
      invalidFields: [] as string[],
    };
  const missingFields: string[] = fields.filter(
    (key) =>
      !isPresent(row[key]) ||
      (key === "analysts" && row.analystCountKind === "recommendations"),
  );
  const invalidFields: string[] = [];
  if (
    isPresent(row.currency) &&
    (typeof row.currency !== "string" || !/^[A-Z]{3}$/.test(row.currency))
  )
    invalidFields.push("currency");
  for (const key of [
    "closeDate",
    "observedOn",
    "targetAsOf",
    "datasetAsOf",
  ] as const) {
    if (isPresent(row[key]) && !validDate(row[key])) invalidFields.push(key);
  }
  for (const key of ["close", ...targetFields, "analysts"] as const) {
    if (
      isPresent(row[key]) &&
      (!positive(row[key]) ||
        (key === "analysts" && !Number.isInteger(row[key])))
    )
      invalidFields.push(key);
  }
  if (
    (positive(row.low) && positive(row.consensus) && row.low > row.consensus) ||
    (positive(row.consensus) &&
      positive(row.high) &&
      row.consensus > row.high) ||
    (positive(row.low) && positive(row.high) && row.low > row.high)
  )
    invalidFields.push("targetOrder");
  if (
    isPresent(row.closeDateBasis) &&
    !["observed", "inferred"].includes(row.closeDateBasis!)
  )
    invalidFields.push("closeDateBasis");
  if (
    isPresent(row.analystCountKind) &&
    !["target-contributors", "recommendations"].includes(row.analystCountKind!)
  )
    invalidFields.push("analystCountKind");
  return {
    state: (invalidFields.length
      ? "invalid"
      : missingFields.length
        ? "partial"
        : "complete") as EvidenceState,
    missingFields,
    invalidFields,
  };
}

function dateBasis(reference: AnalystSnapshot, actual: AnalystSnapshot) {
  const dateIssues: string[] = [];
  if (reference.closeDate !== actual.closeDate) dateIssues.push("closeDate");
  if (
    reference.closeDateBasis === "inferred" ||
    actual.closeDateBasis === "inferred"
  )
    dateIssues.push("inferredCloseDate");
  let targetDateBasis = "unknown";
  if (reference.targetAsOf && actual.targetAsOf) {
    if (reference.targetAsOf === actual.targetAsOf)
      targetDateBasis = "same-target-revision";
    else dateIssues.push("targetAsOf");
  } else if (reference.targetAsOf || actual.targetAsOf) {
    dateIssues.push("missingTargetAsOf");
  } else if (
    reference.observedOn &&
    actual.observedOn &&
    reference.observedOn === actual.observedOn
  ) {
    targetDateBasis = "same-observation-only";
  } else {
    dateIssues.push(
      reference.observedOn && actual.observedOn
        ? "observedOn"
        : "missingTargetDates",
    );
  }
  return { dateIssues, targetDateBasis };
}

/**
 * Distinguishes numeric agreement, coverage, and verified target-revision parity.
 * `agreement` retains its legacy meaning: exact matches / entire requested cohort.
 * `pairAgreement` is exact matches / complete comparable pairs, or null for none.
 * Consensus and fullTriples have separate denominators and cannot imply one another.
 * Same-day captures with unknown target dates allow observation-only comparisons,
 * but never pass completeExactMatch. Different close dates are never compared.
 */
export function compareAnalystSnapshots(
  symbols: string[],
  reference: AnalystSnapshot[],
  actual: AnalystSnapshot[],
) {
  if (!Array.isArray(symbols) || symbols.some((symbol) => !validSymbol(symbol)))
    throw Error("Invalid cohort symbol");
  if (new Set(symbols).size !== symbols.length)
    throw Error("Duplicate cohort symbol");
  const index = (observations: AnalystSnapshot[]) => {
    if (!Array.isArray(observations))
      throw Error("Observations must be an array");
    const map = new Map<string, AnalystSnapshot>();
    for (const row of observations) {
      if (!row || !validSymbol(row.symbol))
        throw Error("Invalid observation symbol");
      if (map.has(row.symbol))
        throw Error(`Duplicate observation: ${row.symbol}`);
      map.set(row.symbol, row);
    }
    return map;
  };
  const refs = index(reference),
    observed = index(actual),
    cohort = new Set(symbols);
  const rows = symbols.map((symbol) => {
    const a = observed.get(symbol),
      b = refs.get(symbol);
    const referenceEvidence = assess(b),
      actualEvidence = assess(a);
    const { dateIssues, targetDateBasis } =
      a && b
        ? dateBasis(b, a)
        : { dateIssues: [] as string[], targetDateBasis: "unknown" };
    const invalid =
      referenceEvidence.state === "invalid" ||
      actualEvidence.state === "invalid";
    const basePresent = Boolean(
      a &&
        b &&
        a.currency &&
        b.currency &&
        a.closeDate &&
        b.closeDate &&
        positive(a.close) &&
        positive(b.close),
    );
    const currencyMismatch = basePresent && a!.currency !== b!.currency;
    const canCompare = Boolean(
      basePresent && !invalid && !currencyMismatch && !dateIssues.length,
    );
    const consensusCompared =
      canCompare && positive(a!.consensus) && positive(b!.consensus);
    const tripleCompared =
      canCompare &&
      targetFields.every((key) => positive(a![key]) && positive(b![key]));
    const analystCountCompared =
      canCompare && targetAnalysts(a!) && targetAnalysts(b!);
    const consensusMismatches = consensusCompared
      ? ["close", "consensus"].filter(
          (key) =>
            a![key as "close" | "consensus"] !==
            b![key as "close" | "consensus"],
        )
      : [];
    const tripleMismatches = tripleCompared
      ? ["close", ...targetFields].filter(
          (key) =>
            a![key as "close" | (typeof targetFields)[number]] !==
            b![key as "close" | (typeof targetFields)[number]],
        )
      : [];
    const analystCountComparison = {
      compared: analystCountCompared,
      match: analystCountCompared ? a!.analysts === b!.analysts : null,
    };
    const completeCompared = tripleCompared && analystCountCompared;
    const mismatches = completeCompared
      ? [
          ...tripleMismatches,
          ...(analystCountComparison.match ? [] : ["analysts"]),
        ]
      : [];
    let status: RowStatus;
    if (!a || !b) status = "missing";
    else if (invalid) status = "invalid";
    else if (!basePresent) status = "partial";
    else if (dateIssues.length) status = "date-incomparable";
    else if (currencyMismatch) status = "basis-incomparable";
    else status = completeCompared ? "compared" : "partial";
    const percentages = (r: AnalystSnapshot) =>
      targetFields.map((key) => Math.round((r[key]! / r.close! - 1) * 100));
    return {
      symbol,
      status,
      missingReference: !b,
      missingActual: !a,
      referenceEvidence,
      actualEvidence,
      reference: b ?? null,
      actual: a ?? null,
      targetDateBasis,
      dateIssues,
      match: completeCompared && !mismatches.length,
      mismatches,
      consensusComparison: {
        compared: consensusCompared,
        match: consensusCompared ? !consensusMismatches.length : null,
        mismatches: consensusMismatches,
        targetDifference: consensusCompared
          ? Number((a!.consensus! - b!.consensus!).toFixed(10))
          : null,
      },
      fullTripleComparison: {
        compared: tripleCompared,
        match: tripleCompared ? !tripleMismatches.length : null,
        mismatches: tripleMismatches,
      },
      analystCountComparison,
      referencePercentages: tripleCompared ? percentages(b!) : null,
      actualPercentages: tripleCompared ? percentages(a!) : null,
    };
  });
  const stats = (field: "consensusComparison" | "fullTripleComparison") => {
    const pairs = rows.filter((r) => r[field].compared),
      matches = pairs.filter((r) => r[field].match).length;
    return {
      compared: pairs.length,
      matches,
      agreement: pairs.length ? matches / pairs.length : null,
      coverage: symbols.length ? pairs.length / symbols.length : null,
      revisionVerified: pairs.filter(
        (r) => r.targetDateBasis === "same-target-revision",
      ).length,
    };
  };
  const compared = rows.filter((r) => r.status === "compared").length,
    matches = rows.filter((r) => r.match).length;
  const statusCounts = Object.fromEntries(
    [
      "missing",
      "partial",
      "invalid",
      "date-incomparable",
      "basis-incomparable",
      "compared",
    ].map((status) => [status, rows.filter((r) => r.status === status).length]),
  );
  return {
    requested: symbols.length,
    compared,
    matches,
    agreement: symbols.length ? matches / symbols.length : null,
    pairAgreement: compared ? matches / compared : null,
    coverage: symbols.length ? compared / symbols.length : null,
    fullTriples: stats("fullTripleComparison"),
    consensus: stats("consensusComparison"),
    statusCounts,
    outOfCohort: {
      reference: reference
        .filter((r) => !cohort.has(r.symbol))
        .map((r) => r.symbol),
      actual: actual.filter((r) => !cohort.has(r.symbol)).map((r) => r.symbol),
    },
    completeExactMatch:
      symbols.length > 0 &&
      matches === symbols.length &&
      rows.every((r) => r.targetDateBasis === "same-target-revision"),
    rows,
  };
}
