import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { evaluateAccumulation } from "../lib/accumulation-evaluation.ts";
import { researchAccumulation } from "../lib/accumulation-policy-v5.ts";
import { monthEndSession } from "../lib/calendar.ts";

// Deterministic synthetic mechanics checks, not new historical market evidence.
const asOf = "2026-02-02T22:00:00Z";
const profiles = {
  flat: (i) => 100,
  steady_growth: (i) => 100 * 1.025 ** i,
  persistent_decline: (i) => 100 * 0.92 ** i,
  crash_recovery: (i) =>
    i < 36
      ? 100 * 1.015 ** i
      : i < 48
        ? 170 * 0.9 ** (i - 35)
        : 48 * 1.045 ** (i - 48),
  extension_reversal: (i) =>
    i < 30
      ? 100
      : i < 36
        ? 100 * 1.5 ** (i - 29)
        : i < 48
          ? 1139 * 0.8 ** (i - 35)
          : 78 * 1.01 ** (i - 48),
};
function fixture(profile) {
  return Array.from({ length: 84 }, (_, i) => {
    const date = new Date(Date.UTC(2019, i, 1));
    const month = date.toISOString().slice(0, 7);
    while ([0, 6].includes(date.getUTCDay()))
      date.setUTCDate(date.getUTCDate() + 1);
    const close = profile(i),
      bar = { open: close, high: close, low: close, close, volume: 100 };
    return [
      { time: date.toISOString().slice(0, 10), ...bar },
      { time: monthEndSession(month), ...bar },
    ];
  }).flat();
}
const checksum = (file) =>
  crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const policySha256 = checksum("lib/accumulation-policy-v5.ts");
const evaluatorSha256 = checksum("lib/accumulation-evaluation.ts");
const synthetic = Object.entries(profiles).map(([name, profile]) => {
  const bars = fixture(profile),
    policy = researchAccumulation(bars, asOf);
  const runs = [10, 50].map((costBps) => {
    const r = evaluateAccumulation(bars, asOf, costBps);
    assert.equal(r.available, true);
    assert.equal(r.fixed.contributed, r.adaptive.contributed);
    assert.ok(
      r.history.every(
        (row) => row.signalDate < row.executionDate && row.cash >= 0,
      ),
    );
    assert.deepEqual(
      evaluateAccumulation(
        [
          ...bars,
          { time: "2030-01-31", open: 1, high: 1, low: 1, close: 1, volume: 1 },
        ],
        asOf,
        costBps,
      ),
      r,
    );
    if (["flat", "persistent_decline"].includes(name))
      assert.equal(r.fixed.value, r.adaptive.value);
    return {
      costBps,
      months: r.months,
      contributions: r.fixed.contributed,
      fixedValue: r.fixed.value,
      adaptiveValue: r.adaptive.value,
      differencePct: (r.adaptive.value / r.fixed.value - 1) * 100,
      adaptiveCash: r.adaptive.cash,
      fixedDrawdownPct: r.fixed.drawdown,
      adaptiveDrawdownPct: r.adaptive.drawdown,
    };
  });
  return {
    name,
    signalCounts: Object.fromEntries(
      [0, 1, 2, 3, 4].map((n) => [
        n,
        policy.history.filter((s) => s.multiplier === n).length,
      ]),
    ),
    runs,
  };
});
const stored = [
  "verification/dca-backtest-30.json",
  "verification/dca-frozen-validation.json",
].map((file) => {
  const report = JSON.parse(fs.readFileSync(file, "utf8"));
  const runs = [10, 50].map((costBps) => {
    const eligible = report.rows.flatMap((row) =>
      row.runs.filter((run) => run.available && run.costBps === costBps),
    );
    const meanDifferencePct =
      eligible.reduce((sum, run) => sum + run.differencePct, 0) /
      eligible.length;
    if (costBps === 10)
      assert.equal(
        meanDifferencePct,
        report.summary.meanEndingAssetDifferencePct,
      );
    return {
      costBps,
      eligible: eligible.length,
      wins: eligible.filter((r) => r.differencePct > 0).length,
      losses: eligible.filter((r) => r.differencePct < 0).length,
      ties: eligible.filter((r) => r.differencePct === 0).length,
      meanDifferencePct,
      lowerMonthlyDrawdown: eligible.filter(
        (r) => r.adaptiveDrawdownPct > r.fixedDrawdownPct,
      ).length,
    };
  });
  return {
    file,
    fileSha256: checksum(file),
    policySha256: report.frozen.policy,
    evaluatorSha256: report.frozen.evaluation,
    matchesCurrentPolicy: report.frozen.policy === policySha256,
    matchesCurrentEvaluator: report.frozen.evaluation === evaluatorSha256,
    rawDataRerun: false,
    runs,
  };
});
assert.equal(checksum("lib/accumulation-policy-v5.ts"), policySha256);
assert.equal(checksum("lib/accumulation-evaluation.ts"), evaluatorSha256);
const report = {
  asOf,
  policySha256,
  evaluatorSha256,
  synthetic,
  stored,
  limitations: [
    "Synthetic inputs verify accounting and timing only; they are not historical returns or evidence of superior performance.",
    "Stored empirical summaries are recomputed from existing report rows. Raw historical OHLC is not committed, so the repaired policy was not rerun on those universes.",
    "Policy thresholds are unchanged. The contiguous-history repair changes eligibility and its source hash; old reports must not be presented as performance of the repaired implementation.",
    "Equal monthly deposits of 100; multipliers spend only existing cash. No leverage, selling, dividends, cash interest or taxes.",
    "Selected surviving securities, calibration overlap, unverified split adjustment provenance and monthly drawdown limit the stored studies.",
    "Later chronological slices restart accounts and are not independent out-of-sample validation.",
  ],
};
const target = "verification/pace-integrity-20261027.json";
fs.writeFileSync(target, JSON.stringify(report, null, 2) + "\n");
console.log(
  JSON.stringify(
    {
      report: target,
      synthetic: synthetic.map((r) => ({ name: r.name, ...r.runs[0] })),
      stored,
    },
    null,
    2,
  ),
);
