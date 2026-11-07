import test from "node:test";
import assert from "node:assert/strict";
import { runPaceStudy } from "../lib/pace-study.ts";
const hash = "a".repeat(64);
function fixture() {
  return {
    schemaVersion: "pace-study-1",
    policyVersion: "monthly-v5",
    policyHash: hash,
    startMonth: "2020-01",
    endMonth: "2020-01",
    monthlyBudget: 100,
    costBps: 10,
    provenance: {
      datasetId: "synthetic-test-only",
      provider: "fixture",
      retrievedAt: "2021-01-01T00:00:00Z",
      sourceUri: "fixture://test",
      universeDefinition: "one fictional name",
      membershipSource: "fixture",
      signalPriceSource: "fixture split adjusted",
      totalReturnSource: "fixture total return",
      dividendMethod: "included",
      delistingMethod: "terminal total return",
      cashYieldSource: "fixture",
      signalGenerationMethod: "test only",
      auditReference: "none-test",
      expectedConstituentIds: ["X"],
    },
    assets: [
      {
        id: "X",
        sector: "test",
        country: "US",
        assetClass: "equity",
        membership: {
          from: "2019-01-01T00:00:00Z",
          to: null,
          knownAt: "2018-12-01T00:00:00Z",
          sourceRecord: "test",
        },
        status: "active",
        rows: [
          {
            month: "2020-01",
            signalDate: "2019-12-31T21:00:00Z",
            signalKnownAt: "2020-01-01T00:00:00Z",
            executionAt: "2020-01-02T14:30:00Z",
            periodEnd: "2020-01-31T21:00:00Z",
            policyHash: hash,
            multiplier: 0,
            splitAdjustedSignalClose: 30,
            totalReturnOpen: 100,
            totalReturnClose: 110,
            cashReturn: 0.01,
            cashGapReturn: 0,
          },
        ],
      },
    ],
  };
}
test("equal budgets, fees and explicit idle cash return", () => {
  const r = runPaceStudy(fixture(), hash);
  const x = r.results[0];
  assert.equal(x.fixed.contributed, x.pace.contributed);
  assert.equal(x.fixed.fees, 0.1);
  assert.ok(Math.abs(x.fixed.value - 109.89) < 1e-8);
  assert.equal(x.pace.value, 101);
  assert.equal(r.publishable, false);
});
test("terminal zero losses retained", () => {
  const d = fixture();
  Object.assign(d.assets[0], {
    status: "delisted",
    delistedAt: "2020-01-31T21:00:00Z",
    delistingSource: "fixture bankruptcy",
  });
  d.assets[0].rows[0].totalReturnClose = 0;
  const r = runPaceStudy(d, hash);
  assert.equal(r.coverage.included, 1);
  assert.equal(r.results[0].fixed.value, 0);
  assert.equal(r.results[0].fixed.maxDrawdownPct, -100);
});
test("future signal excluded and accounted for", () => {
  const d = fixture();
  d.assets[0].rows[0].signalKnownAt = "2020-01-03T00:00:00Z";
  const r = runPaceStudy(d, hash);
  assert.equal(r.coverage.excluded, 1);
  assert.match(r.results[0].reason, /Future/);
  assert.equal(r.distribution.median, null);
});
test("manifest omissions do not disappear", () => {
  const d = fixture();
  d.provenance.expectedConstituentIds.push("BANKRUPT");
  const r = runPaceStudy(d, hash);
  assert.equal(r.coverage.expected, 2);
  assert.equal(r.results[1].status, "excluded");
});
test("changed policy rejected", () => {
  assert.throws(() => runPaceStudy(fixture(), "b".repeat(64)), /hash/);
});
test("unproven point-in-time membership excluded", () => {
  const d = fixture();
  d.assets[0].membership.knownAt = "2020-02-01T00:00:00Z";
  assert.equal(runPaceStudy(d, hash).coverage.excluded, 1);
});
test("missing months never bridged", () => {
  const d = fixture();
  d.endMonth = "2020-02";
  assert.match(runPaceStudy(d, hash).results[0].reason, /Missing/);
});
test("carried cash earns explicit gap yield and upsize cannot borrow", () => {
  const d = fixture();
  d.endMonth = "2020-02";
  const first = d.assets[0].rows[0];
  first.cashReturn = 0;
  d.assets[0].rows.push({
    ...first,
    month: "2020-02",
    signalDate: "2020-01-31T21:00:00Z",
    signalKnownAt: "2020-02-01T00:00:00Z",
    executionAt: "2020-02-03T14:30:00Z",
    periodEnd: "2020-02-28T21:00:00Z",
    multiplier: 4,
    totalReturnOpen: 110,
    totalReturnClose: 110,
    cashGapReturn: 0.1,
  });
  const r = runPaceStudy(d, hash);
  assert.equal(r.results[0].pace.cash, 0);
  assert.ok(Math.abs(r.results[0].pace.value - 209.79) < 1e-8);
  assert.equal(r.results[0].pace.contributed, 200);
});
test("stale signal rejected even if known before execution", () => {
  const d = fixture();
  d.assets[0].rows[0].signalDate = "2019-11-30T21:00:00Z";
  assert.equal(runPaceStudy(d, hash).coverage.excluded, 1);
});

import { monthEndSession } from "../lib/calendar.ts";
function replayFixture(close = 100, multiplier = 0) {
  const d = fixture();
  d.costBps = 0;
  d.assets[0].priceReplay = {
    market: "us-equity",
    sourceRecord: "synthetic-only",
    bars: Array.from({ length: 25 }, (_, i) => {
      const month = `${2017 + Math.floor((i + 11) / 12)}-${String(((i + 11) % 12) + 1).padStart(2, "0")}`;
      const time = monthEndSession(month, "us-equity");
      const value = i === 24 ? close : 100;
      return {
        time,
        knownAt: `${time}T22:00:00Z`,
        open: value,
        high: value,
        low: value,
        close: value,
        volume: 0,
      };
    }),
  };
  Object.assign(d.assets[0].rows[0], {
    splitAdjustedSignalClose: close,
    multiplier,
  });
  return d;
}
test("required replay rejects unverified supplied signals", () => {
  assert.equal(
    runPaceStudy(fixture(), hash, { requireReplay: true }).coverage.included,
    0,
  );
});
test("real monthly-v5 replay maps zones to spend and caps cash", () => {
  for (const [close, multiplier, cash] of [
    [400, 0, 101],
    [100, 0, 101],
    [85, 1, 0],
    [70, 2, 0],
    [50, 4, 0],
  ]) {
    const r = runPaceStudy(replayFixture(close, multiplier), hash, {
      requireReplay: true,
    });
    assert.equal(r.coverage.included, 1, JSON.stringify(r.results));
    assert.equal(r.results[0].pace.cash, cash);
    assert.equal(r.signalVerification, "raw-price-replayed");
    assert.equal(r.publishable, false);
  }
});
test("replay rejects tampered multiplier close and signal date", () => {
  for (const patch of [
    { multiplier: 4 },
    { splitAdjustedSignalClose: 99 },
    { signalDate: "2019-12-30T21:00:00Z" },
  ]) {
    const d = replayFixture();
    Object.assign(d.assets[0].rows[0], patch);
    const r = runPaceStudy(d, hash, { requireReplay: true });
    assert.equal(r.coverage.included, 0);
    assert.match(r.results[0].reason, /Replay/);
  }
});
test("future-known bars cannot support a historical signal", () => {
  const d = replayFixture();
  d.assets[0].priceReplay.bars.at(-1).knownAt = "2020-01-03T00:00:00Z";
  assert.equal(
    runPaceStudy(d, hash, { requireReplay: true }).coverage.included,
    0,
  );
});
test("future price changes cannot alter earlier replay", () => {
  const d = replayFixture();
  const baseline = runPaceStudy(d, hash, { requireReplay: true });
  d.assets[0].priceReplay.bars.push({
    time: "2020-01-31",
    knownAt: "2020-01-31T22:00:00Z",
    open: 1,
    high: 1,
    low: 1,
    close: 1,
    volume: 0,
  });
  assert.deepEqual(
    runPaceStudy(d, hash, { requireReplay: true }).results,
    baseline.results,
  );
});

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
test("CLI requires replay and records distinct input policy and runner source hashes", () => {
  const dir = mkdtempSync(join(tmpdir(), "pace-study-"));
  try {
    const policyHash = execFileSync(
      process.execPath,
      [
        "--experimental-strip-types",
        "scripts/run-pace-study.mjs",
        "--policy-hash",
      ],
      { encoding: "utf8" },
    ).trim();
    const d = fixture();
    d.policyHash = policyHash;
    d.assets[0].rows[0].policyHash = policyHash;
    const file = join(dir, "input.json");
    writeFileSync(file, JSON.stringify(d));
    const report = JSON.parse(
      execFileSync(
        process.execPath,
        ["--experimental-strip-types", "scripts/run-pace-study.mjs", file],
        { encoding: "utf8" },
      ),
    );
    assert.equal(report.coverage.included, 0);
    assert.equal(report.signalVerification, "unverified-supplied-signals");
    for (const key of ["inputSha256", "policyHash", "runnerSourceSha256"])
      assert.match(report[key], /^[a-f0-9]{64}$/);
    assert.notEqual(report.runnerSourceSha256, report.policyHash);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("late-known prior month-end cannot silently bridge a lookback gap", () => {
  const d = replayFixture();
  d.assets[0].priceReplay.bars.at(-3).knownAt = "2020-01-03T00:00:00Z";
  assert.equal(
    runPaceStudy(d, hash, { requireReplay: true }).coverage.included,
    0,
  );
});
test("replay rejects calendar-normalized impossible availability dates", () => {
  const d = replayFixture();
  d.assets[0].priceReplay.bars[0].knownAt = "2018-02-30T22:00:00Z";
  assert.equal(
    runPaceStudy(d, hash, { requireReplay: true }).coverage.included,
    0,
  );
});

test("drawdown includes observed opening peaks before contribution and closing marks", () => {
  const d = fixture();
  d.costBps = 0;
  d.endMonth = "2020-02";
  const first = d.assets[0].rows[0];
  first.totalReturnClose = 100;
  first.cashReturn = 0;
  d.assets[0].rows.push({
    ...first,
    month: "2020-02",
    signalDate: "2020-01-31T21:00:00Z",
    signalKnownAt: "2020-02-01T00:00:00Z",
    executionAt: "2020-02-03T14:30:00Z",
    periodEnd: "2020-02-28T21:00:00Z",
    totalReturnOpen: 200,
    totalReturnClose: 100,
  });
  const r = runPaceStudy(d, hash);
  assert.equal(r.coverage.included, 1);
  assert.equal(r.results[0].fixed.peak, 2);
  assert.equal(r.results[0].fixed.maxDrawdownPct, -50);
});
