/** Research accounting only. Supplied signals are not verified production policy output. */
export type StudyRow = {
  month: string;
  signalDate: string;
  signalKnownAt: string;
  executionAt: string;
  periodEnd: string;
  policyHash: string;
  multiplier: 0 | 1 | 2 | 3 | 4;
  splitAdjustedSignalClose: number;
  totalReturnOpen: number;
  totalReturnClose: number;
  cashReturn: number;
  cashGapReturn: number;
};
export type StudyAsset = {
  id: string;
  sector: string;
  country: string;
  assetClass: string;
  membership: {
    from: string;
    to: string | null;
    knownAt: string;
    sourceRecord: string;
  };
  status: "active" | "delisted";
  delistedAt?: string;
  delistingSource?: string;
  missingReason?: string;
  rows: StudyRow[];
};
export type PaceStudyInput = {
  schemaVersion: "pace-study-1";
  policyVersion: "monthly-v5";
  policyHash: string;
  startMonth: string;
  endMonth: string;
  monthlyBudget: number;
  costBps: number;
  provenance: {
    datasetId: string;
    provider: string;
    retrievedAt: string;
    sourceUri: string;
    universeDefinition: string;
    membershipSource: string;
    signalPriceSource: string;
    totalReturnSource: string;
    dividendMethod: string;
    delistingMethod: string;
    cashYieldSource: string;
    signalGenerationMethod: string;
    auditReference: string;
    expectedConstituentIds: string[];
  };
  assets: StudyAsset[];
};
const finite = (n: number) => typeof n === "number" && Number.isFinite(n);
const monthNumber = (m: string) =>
  Number(m.slice(0, 4)) * 12 + Number(m.slice(5)) - 1;
const validMonth = (m: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(m);
const time = (s: string) =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}T.*Z$/.test(s)
    ? Date.parse(s)
    : NaN;
const nonempty = (s: unknown) => typeof s === "string" && s.trim().length > 0;
function requireThat(ok: unknown, message: string): asserts ok {
  if (!ok) throw Error(message);
}
export function runPaceStudy(input: PaceStudyInput, currentPolicyHash: string) {
  requireThat(
    input.schemaVersion === "pace-study-1" &&
      input.policyVersion === "monthly-v5",
    "Unsupported study or policy version",
  );
  requireThat(
    /^[a-f0-9]{64}$/.test(currentPolicyHash) &&
      input.policyHash === currentPolicyHash,
    "Frozen policy hash differs from current source",
  );
  requireThat(
    validMonth(input.startMonth) &&
      validMonth(input.endMonth) &&
      input.startMonth <= input.endMonth,
    "Invalid study horizon",
  );
  requireThat(
    finite(input.monthlyBudget) &&
      input.monthlyBudget > 0 &&
      finite(input.costBps) &&
      input.costBps >= 0 &&
      input.costBps <= 200,
    "Invalid budget or costs",
  );
  const p = input.provenance;
  requireThat(
    p &&
      [
        "datasetId",
        "provider",
        "retrievedAt",
        "sourceUri",
        "universeDefinition",
        "membershipSource",
        "signalPriceSource",
        "totalReturnSource",
        "dividendMethod",
        "delistingMethod",
        "cashYieldSource",
        "signalGenerationMethod",
        "auditReference",
      ].every((k) => nonempty(p[k as keyof typeof p])),
    "Complete provenance required",
  );
  requireThat(
    Number.isFinite(time(p.retrievedAt)),
    "Invalid retrieval timestamp",
  );
  requireThat(
    Array.isArray(p.expectedConstituentIds) &&
      p.expectedConstituentIds.length > 0 &&
      p.expectedConstituentIds.every(nonempty) &&
      new Set(p.expectedConstituentIds).size ===
        p.expectedConstituentIds.length,
    "Expected constituent manifest required",
  );
  requireThat(
    Array.isArray(input.assets) &&
      new Set(input.assets.map((a) => a.id)).size === input.assets.length &&
      input.assets.every((a) => p.expectedConstituentIds.includes(a.id)),
    "Duplicate or unmanifested assets",
  );
  const months =
    monthNumber(input.endMonth) - monthNumber(input.startMonth) + 1;
  const results: {
    id: string;
    status: string;
    reason?: string;
    fixed?: ReturnType<typeof account>;
    pace?: ReturnType<typeof account>;
    excessPct?: number;
    months?: number;
  }[] = [];
  const account = () => ({
    cash: 0,
    units: 0,
    contributed: 0,
    fees: 0,
    value: 0,
    nav: 1,
    peak: 1,
    maxDrawdownPct: 0,
  });
  for (const id of p.expectedConstituentIds) {
    const asset = input.assets.find((a) => a.id === id);
    if (!asset) {
      results.push({
        id,
        status: "excluded",
        reason: "Missing constituent record",
      });
      continue;
    }
    try {
      requireThat(!asset.missingReason, asset.missingReason || "Missing data");
      requireThat(
        [
          asset.sector,
          asset.country,
          asset.assetClass,
          asset.membership?.sourceRecord,
        ].every(nonempty),
        "Classification and membership evidence required",
      );
      const membership = asset.membership;
      requireThat(
        Number.isFinite(time(membership.from)) &&
          Number.isFinite(time(membership.knownAt)) &&
          time(membership.knownAt) <= time(membership.from),
        "Membership not demonstrably point-in-time",
      );
      requireThat(
        membership.to === null ||
          (Number.isFinite(time(membership.to)) &&
            time(membership.to) >= time(membership.from)),
        "Invalid membership exit",
      );
      requireThat(
        asset.status === "active" || asset.status === "delisted",
        "Invalid lifecycle status",
      );
      if (asset.status === "delisted")
        requireThat(
          Number.isFinite(time(asset.delistedAt!)) &&
            nonempty(asset.delistingSource),
          "Delisting evidence required",
        );
      const first = Math.max(
        monthNumber(input.startMonth),
        monthNumber(membership.from.slice(0, 7)),
      );
      const last =
        asset.status === "delisted"
          ? Math.min(
              monthNumber(input.endMonth),
              monthNumber(asset.delistedAt!.slice(0, 7)),
            )
          : monthNumber(input.endMonth);
      requireThat(first <= last, "No eligible study months");
      requireThat(
        Array.isArray(asset.rows) && asset.rows.length === last - first + 1,
        "Missing or extra monthly observations (including terminal delisting month)",
      );
      const fixed = account(),
        pace = account();
      let previousEnd = -Infinity;
      for (let i = 0; i < asset.rows.length; i++) {
        const row = asset.rows[i];
        requireThat(
          validMonth(row.month) && monthNumber(row.month) === first + i,
          "Months must be consecutive, ordered, and unique",
        );
        requireThat(
          [
            row.signalDate,
            row.signalKnownAt,
            row.executionAt,
            row.periodEnd,
          ].every((s) => Number.isFinite(time(s))),
          "Explicit UTC timestamps required",
        );
        requireThat(
          time(row.signalDate) <= time(row.signalKnownAt) &&
            time(row.signalKnownAt) < time(row.executionAt) &&
            time(row.executionAt) <= time(row.periodEnd) &&
            time(row.executionAt) > previousEnd,
          "Future signal or overlapping execution period",
        );
        requireThat(
          row.executionAt.slice(0, 7) === row.month &&
            row.periodEnd.slice(0, 7) === row.month &&
            monthNumber(row.month) - monthNumber(row.signalDate.slice(0, 7)) ===
              1,
          "Use prior-month signals and same-month execution/mark",
        );
        requireThat(
          time(membership.from) <= time(row.executionAt),
          "Execution before universe entry",
        );
        requireThat(
          row.policyHash === currentPolicyHash &&
            [0, 1, 2, 3, 4].includes(row.multiplier),
          "Unfrozen or invalid signal",
        );
        requireThat(
          finite(row.splitAdjustedSignalClose) &&
            row.splitAdjustedSignalClose > 0 &&
            finite(row.totalReturnOpen) &&
            row.totalReturnOpen > 0 &&
            finite(row.totalReturnClose) &&
            row.totalReturnClose >= 0 &&
            finite(row.cashReturn) &&
            row.cashReturn > -1 &&
            finite(row.cashGapReturn) &&
            row.cashGapReturn > -1,
          "Invalid separate price/total-return/cash inputs",
        );
        requireThat(
          row.totalReturnClose > 0 ||
            (asset.status === "delisted" &&
              row.month === asset.delistedAt!.slice(0, 7) &&
              i === asset.rows.length - 1),
          "Zero total return allowed only at terminal delisting",
        );
        requireThat(
          i !== 0 || row.cashGapReturn === 0,
          "First month cash gap return must be zero",
        );
        previousEnd = time(row.periodEnd);
        for (const [s, multiple] of [
          [fixed, 1],
          [pace, row.multiplier],
        ] as const) {
          s.cash *= 1 + row.cashGapReturn;
          const opening = s.cash + s.units * row.totalReturnOpen;
          if (s.value > 0) s.nav *= opening / s.value;
          s.cash += input.monthlyBudget;
          s.contributed += input.monthlyBudget;
          const spend = Math.min(s.cash, input.monthlyBudget * multiple),
            fee = (spend * input.costBps) / 10000;
          s.units += (spend - fee) / row.totalReturnOpen;
          s.cash -= spend;
          s.fees += fee;
          s.cash *= 1 + row.cashReturn;
          s.value = s.cash + s.units * row.totalReturnClose;
          s.nav *= s.value / (opening + input.monthlyBudget);
          s.peak = Math.max(s.peak, s.nav);
          s.maxDrawdownPct = Math.min(
            s.maxDrawdownPct,
            100 * (s.nav / s.peak - 1),
          );
        }
      }
      // Follow each name from eligible entry through terminal event; no disappearance of losers.
      results.push({
        id,
        status: "included",
        fixed,
        pace,
        excessPct: (100 * (pace.value - fixed.value)) / fixed.contributed,
        months: asset.rows.length,
      });
    } catch (e) {
      results.push({
        id,
        status: "excluded",
        reason: e instanceof Error ? e.message : String(e),
      });
    }
  }
  const included = results.filter((r) => r.status === "included");
  const values = included.map((r) => r.excessPct!).sort((a, b) => a - b);
  const quantile = (q: number) =>
    values.length ? values[Math.floor((values.length - 1) * q)] : null;
  const blockers = [
    "Independent dataset/provenance audit and raw-input replay linking supplied signals to production monthly-v5 remain required.",
    "Per-name entry-to-delisting horizons differ; this is not a rebalanced investable universe portfolio.",
  ];
  if (included.length !== results.length)
    blockers.push(
      "Incomplete universe: missing or invalid constituents must be resolved; conditional distribution is not representative.",
    );
  if (included.length < 100 || months < 120)
    blockers.push(
      "Insufficient practical breadth or duration (minimum screening gate: 100 names, 120 calendar months; not proof of representativeness).",
    );
  return {
    schemaVersion: "pace-study-result-1",
    policyHash: currentPolicyHash,
    publishable: false,
    blockers,
    provenance: p,
    coverage: {
      expected: results.length,
      included: included.length,
      excluded: results.length - included.length,
      calendarMonths: months,
    },
    distribution: {
      metric:
        "Pace minus fixed terminal wealth / equal contributed capital (%)",
      conditionalOnCompleteRecords: true,
      p10: quantile(0.1),
      median: quantile(0.5),
      p90: quantile(0.9),
      winRate: values.length
        ? values.filter((v) => v > 0).length / values.length
        : null,
    },
    results,
    assumptions: [
      "Monthly deposits are equal within every pair; spend multiplier is capped by cash, no borrowing/selling.",
      "Fees are deducted from gross invested budget. Supplied total-return indexes include distributions and terminal proceeds; signal close is separate split-adjusted price.",
      "cashReturn is the realized execution-to-period-end return on residual cash including that month deposit; cashGapReturn accrues prior residual cash from the preceding mark to this execution (zero in the first month).",
      "Delisted assets remain in results at terminal value including zero; paired contributions stop at terminal month.",
      "Monthly time-weighted drawdown uses observed opens and end marks, not intramonth extrema.",
      "No taxes, market impact, or production business gates; precomputed signals are structurally checked, not authenticated.",
    ],
  };
}
