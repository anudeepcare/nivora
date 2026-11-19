import test from "node:test";
import assert from "node:assert/strict";
import { compareDca } from "../lib/planning.ts";
import { researchAccumulation } from "../lib/accumulation-policy-v6.ts";
const bars = Array.from({ length: 2600 }, (_, i) => {
  const price = 100 + Math.sin(i / 45) * 35;
  return {
    time: new Date(Date.UTC(2020, 0, i + 1)).toISOString().slice(0, 10),
    open: price,
    high: price,
    low: price,
    close: price,
    volume: 100,
  };
});
test("current v6 comparison never backfills the frozen model before release", () => {
  const result = compareDca(
    bars,
    "2026-11-08T12:00:00Z",
    10,
    "us-equity",
    "current-v6",
  );
  assert.equal(result.months, 0);
  assert.equal(result.mode, "current-v6");
  assert.match(result.reason, /completed.*v6/i);
  assert.equal(result.fixed.contributed, 0);
});
test("current v6 comparison uses actual v6 signals and current contribution mapping on equal dates and cash", () => {
  const asOf = "2027-02-01T12:00:00Z";
  const result = compareDca(bars, asOf, 50, "us-equity", "current-v6");
  const signals = researchAccumulation(bars, asOf, "us-equity");
  assert.ok(result.months > 0);
  assert.equal(result.policy, "monthly-v6");
  assert.equal(result.fixed.contributed, result.adaptive.contributed);
  assert.equal(result.fixed.contributed, result.months * 100);
  assert.ok(result.adaptive.cash >= 0);
  for (const row of result.history) {
    const signal = signals.history.find((s) => s.date === row.signalDate);
    assert.equal(signal.policyVersion, "monthly-v6");
    assert.equal(row.multiplier, [0, 0, 1, 2, 4][signal.multiplier]);
    assert.ok(row.signalDate < row.executionDate);
    assert.ok(row.signalDate >= "2026-11-07");
    assert.ok(row.executionDate < row.month + "-32");
  }
  assert.ok(result.limitations.some((s) => /business gates/i.test(s)));
  assert.ok(result.limitations.some((s) => /not.*prospective/i.test(s)));
});
test("current v6 mode does not relabel crypto fallback or accept an unfinished execution month", () => {
  assert.equal(
    compareDca(bars, "2027-02-01", 0, "crypto", "current-v6").months,
    0,
  );
  const result = compareDca(bars, "2026-12-15", 0, "us-equity", "current-v6");
  assert.equal(result.months, 0);
});

import { verifyStudyRow } from "../lib/pace-study-replay.ts";
test("v6 prospective replay uses v6 and rejects legacy dates and mismatched rules", () => {
  const signal = researchAccumulation(
    bars,
    "2026-12-01T12:00:00Z",
    "us-equity",
  ).confirmed;
  assert.equal(signal.policyVersion, "monthly-v6");
  const replay = {
    market: "us-equity",
    sourceRecord: "test-only synthetic prices",
    bars: bars.map((b) => ({ ...b, knownAt: b.time + "T22:00:00Z" })),
  };
  const row = {
    signalKnownAt: "2026-12-01T12:00:00Z",
    signalDate: signal.date + "T21:00:00Z",
    splitAdjustedSignalClose: signal.close,
    multiplier: [0, 0, 1, 2, 4][signal.multiplier],
  };
  assert.doesNotThrow(() => verifyStudyRow(replay, row, "monthly-v6"));
  assert.throws(() =>
    verifyStudyRow(replay, { ...row, multiplier: 3 }, "monthly-v6"),
  );
  const old = {
    ...row,
    signalKnownAt: "2026-11-01T12:00:00Z",
    signalDate: "2026-10-30T20:00:00Z",
  };
  assert.throws(
    () => verifyStudyRow(replay, old, "monthly-v6"),
    /v6|release|version/i,
  );
});
