import test from "node:test";
import assert from "node:assert/strict";
import { compareAnalystSnapshots } from "../lib/analyst-parity.ts";

const row = {
  symbol: "NBIS",
  currency: "USD",
  closeDate: "2026-11-11",
  close: 154.69,
  low: 84,
  consensus: 278.05,
  high: 410,
  analysts: 20,
  observedOn: "2026-11-12",
  targetAsOf: "2026-11-11",
};

test("a matching sample separates comparable agreement from whole-cohort coverage", () => {
  const r = compareAnalystSnapshots(["NBIS", "APP"], [row], [row]);
  assert.equal(r.agreement, 0.5); // Legacy whole-cohort exact agreement.
  assert.equal(r.compared, 1);
  assert.equal(r.pairAgreement, 1);
  assert.equal(r.coverage, 0.5);
  assert.equal(r.completeExactMatch, false);
});

test("no available pairs means unknown pair agreement, never zero percent agreement", () => {
  const r = compareAnalystSnapshots(["NBIS", "APP"], [row], []);
  assert.equal(r.pairAgreement, null);
  assert.equal(r.fullTriples.agreement, null);
  assert.equal(r.consensus.agreement, null);
  assert.equal(r.coverage, 0);
  assert.equal(r.statusCounts.missing, 2);
  assert.equal(r.rows[0].referenceEvidence.state, "complete");
  assert.equal(r.rows[0].actualEvidence.state, "missing");
});

test("partial target feeds allow consensus comparisons without inventing low, high or analyst counts", () => {
  const reference = [
    row,
    {
      ...row,
      symbol: "IREN",
      low: 23,
      consensus: 56.69,
      high: 139,
      analysts: 19,
    },
  ];
  const actual = [
    { ...row, low: null, high: null, analysts: null, consensus: 271.2 },
    { ...reference[1], low: null, high: null, analysts: null },
  ];
  const r = compareAnalystSnapshots(["NBIS", "IREN", "APP"], reference, actual);
  assert.equal(r.compared, 0);
  assert.equal(r.pairAgreement, null);
  assert.equal(r.statusCounts.partial, 2);
  assert.deepEqual(r.consensus, {
    compared: 2,
    matches: 1,
    agreement: 0.5,
    coverage: 2 / 3,
    revisionVerified: 2,
  });
  assert.equal(r.rows[0].consensusComparison.match, false);
  assert.equal(r.rows[0].consensusComparison.targetDifference, -6.85);
  assert.deepEqual(r.rows[0].actualEvidence.missingFields, [
    "low",
    "high",
    "analysts",
  ]);
});

test("different settled-close dates are incomparable rather than target mismatches", () => {
  const r = compareAnalystSnapshots(
    ["NBIS"],
    [row],
    [{ ...row, closeDate: "2026-11-10" }],
  );
  assert.equal(r.rows[0].status, "date-incomparable");
  assert.ok(r.rows[0].dateIssues.includes("closeDate"));
  assert.equal(r.consensus.compared, 0);
  assert.equal(r.fullTriples.compared, 0);
  assert.equal(r.pairAgreement, null);
});

test("target revision dates and capture dates are kept distinct", () => {
  for (const actual of [
    { ...row, targetAsOf: "2026-11-10" },
    { ...row, targetAsOf: null },
  ]) {
    const r = compareAnalystSnapshots(["NBIS"], [row], [actual]);
    assert.equal(r.rows[0].status, "date-incomparable");
    assert.equal(r.consensus.compared, 0);
  }
  const observedOnly = { ...row, targetAsOf: null };
  const r = compareAnalystSnapshots(["NBIS"], [observedOnly], [observedOnly]);
  assert.equal(r.rows[0].targetDateBasis, "same-observation-only");
  assert.equal(r.fullTriples.compared, 1);
  assert.equal(r.fullTriples.agreement, 1);
  assert.equal(r.fullTriples.revisionVerified, 0);
  assert.equal(r.completeExactMatch, false);
});

test("undated or differently observed targets cannot become dated proof through dataset freshness", () => {
  const undated = {
    ...row,
    targetAsOf: null,
    observedOn: null,
    datasetAsOf: "2026-11-11",
  };
  assert.equal(
    compareAnalystSnapshots(["NBIS"], [undated], [undated]).rows[0].status,
    "date-incomparable",
  );
  assert.equal(
    compareAnalystSnapshots(
      ["NBIS"],
      [{ ...undated, observedOn: "2026-11-12" }],
      [{ ...undated, observedOn: "2026-11-13" }],
    ).consensus.compared,
    0,
  );
  assert.equal(
    compareAnalystSnapshots(
      ["NBIS"],
      [row],
      [{ ...row, closeDateBasis: "inferred" }],
    ).rows[0].status,
    "date-incomparable",
  );
});

test("the same verified target revision can be compared across capture days", () => {
  const r = compareAnalystSnapshots(
    ["NBIS"],
    [row],
    [{ ...row, observedOn: "2026-11-13" }],
  );
  assert.equal(r.rows[0].targetDateBasis, "same-target-revision");
  assert.equal(r.completeExactMatch, true);
});

test("target, settled close and analyst count differences cannot pass exact parity", () => {
  for (const change of [{ low: 83 }, { close: 148.45 }, { analysts: 19 }]) {
    assert.equal(
      compareAnalystSnapshots(["NBIS"], [row], [{ ...row, ...change }])
        .completeExactMatch,
      false,
    );
  }
  assert.equal(
    compareAnalystSnapshots(["NBIS"], [row], [row]).completeExactMatch,
    true,
  );
});

test("recommendation counts are not evidence of unique target analysts", () => {
  const r = compareAnalystSnapshots(
    ["NBIS"],
    [row],
    [{ ...row, analystCountKind: "recommendations" }],
  );
  assert.equal(r.rows[0].status, "partial");
  assert.equal(r.rows[0].analystCountComparison.compared, false);
  assert.equal(r.fullTriples.matches, 1);
  assert.equal(r.matches, 0);
  assert.equal(r.completeExactMatch, false);
});

test("malformed supplied values are invalid, whereas missing values are partial", () => {
  for (const change of [
    { low: NaN },
    { low: 0 },
    { low: "84" },
    { currency: null },
    { closeDate: "2026-02-31" },
    { high: 100 },
    { analysts: -1 },
  ]) {
    const r = compareAnalystSnapshots(["NBIS"], [row], [{ ...row, ...change }]);
    assert.equal(r.compared, 0);
    assert.equal(
      r.rows[0].status,
      change.currency === null ? "partial" : "invalid",
    );
  }
  assert.equal(
    compareAnalystSnapshots(["NBIS"], [row], [{ ...row, low: null }]).rows[0]
      .status,
    "partial",
  );
});

test("duplicate, malformed and out-of-cohort observations cannot inflate coverage", () => {
  assert.throws(
    () => compareAnalystSnapshots(["NBIS"], [row, row], [row]),
    /Duplicate observation/,
  );
  assert.throws(
    () => compareAnalystSnapshots(["NBIS", "NBIS"], [row], [row]),
    /Duplicate cohort/,
  );
  assert.throws(
    () => compareAnalystSnapshots([" NBIS"], [row], [row]),
    /Invalid cohort/,
  );
  const r = compareAnalystSnapshots(["APP"], [row], [row]);
  assert.equal(r.compared, 0);
  assert.deepEqual(r.outOfCohort, { reference: ["NBIS"], actual: ["NBIS"] });
});

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function runComparison(t, symbols, reference, actual, options = []) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "analyst-parity-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  for (const [name, value] of Object.entries({
    cohort: symbols,
    reference,
    actual,
  })) {
    fs.writeFileSync(
      path.join(directory, `${name}.json`),
      JSON.stringify(value),
    );
  }
  const output = path.join(directory, "report.json");
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "scripts/compare-analyst.mjs",
      ...["cohort", "reference", "actual"].map((name) =>
        path.join(directory, `${name}.json`),
      ),
      output,
      ...options,
    ],
    { encoding: "utf8" },
  );
  return {
    ...result,
    output,
    read: (suffix = "") => JSON.parse(fs.readFileSync(output + suffix, "utf8")),
  };
}

test("1000-row CLI audit writes a hashed strict manifest and fails verification when no pairs exist", (t) => {
  const result = runComparison(
    t,
    Array.from({ length: 1000 }, (_, i) => `S${i}`),
    [],
    [],
  );
  assert.equal(result.status, 1);
  assert.equal(fs.existsSync(result.output), true);
  const report = result.read(),
    manifest = result.read(".manifest.json");
  assert.equal(report.rows.length, 1000);
  assert.equal(report.pairAgreement, null);
  assert.equal(manifest.expectedCount, 1000);
  assert.equal(manifest.strictPass, false);
  assert.equal(manifest.outcome, "incomplete");
  assert.equal(manifest.inputs.cohort.records, 1000);
  assert.match(manifest.inputs.cohort.sha256, /^[a-f0-9]{64}$/);
  assert.equal(manifest.evidence.consensusPairs, 0);
});

test("CLI refuses wrong cohort size without writing a misleading 1000-stock report", (t) => {
  const result = runComparison(t, ["NBIS"], [row], [row]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Expected exactly 1000/);
  assert.equal(fs.existsSync(result.output), false);
});

test("strict manifest passes only complete matching verified target revisions", (t) => {
  const pass = runComparison(
    t,
    ["NBIS"],
    [row],
    [row],
    ["--expected-count", "1"],
  );
  assert.equal(pass.status, 0);
  assert.equal(pass.read(".manifest.json").strictPass, true);
  assert.equal(pass.read(".manifest.json").outcome, "passed");
  const observed = { ...row, targetAsOf: null };
  const unverified = runComparison(
    t,
    ["NBIS"],
    [observed],
    [observed],
    ["--expected-count", "1"],
  );
  assert.equal(unverified.status, 1);
  assert.equal(unverified.read().fullTriples.agreement, 1);
  assert.equal(unverified.read(".manifest.json").strictPass, false);
  assert.equal(unverified.read(".manifest.json").outcome, "incomplete");
  const mismatch = runComparison(
    t,
    ["NBIS"],
    [row],
    [{ ...row, consensus: 271.2 }],
    ["--expected-count", "1"],
  );
  assert.equal(mismatch.status, 1);
  assert.equal(mismatch.read(".manifest.json").outcome, "mismatch");
});
