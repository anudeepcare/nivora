import test from "node:test";
import assert from "node:assert/strict";
import * as publication from "../lib/pace-publication.ts";
const hash = "a".repeat(64);
const row = {
  month: "2026-11",
  signalDate: "2026-10-30T20:00:00Z",
  signalKnownAt: "2026-11-01T00:00:00Z",
  executionAt: "2026-11-09T14:30:00Z",
  periodEnd: "2026-11-30T21:00:00Z",
  policyHash: hash,
  multiplier: 2,
};
const record = {
  id: 1,
  symbol: "APP",
  signal_period: "2026-10",
  policy: "monthly-v5",
  policy_hash: hash,
  pace: 3,
  published_at: "2026-11-07T14:00:00Z",
  quote_at: "2026-11-06T21:00:00Z",
  reference_price: 100,
  evidence_hash: "b".repeat(64),
};
const check = (r = row, records = [record]) =>
  publication.verifyProspectivePublication("APP", r, records);
test("prospective result binds actual same-stock publication to execution", () => {
  assert.equal(typeof publication.verifyProspectivePublication, "function");
  assert.equal(check().publicationId, 1);
  for (const patch of [
    { symbol: "NOW" },
    { signal_period: "2026-09" },
    { policy_hash: "c".repeat(64) },
    { policy: "old" },
    { pace: 4 },
  ])
    assert.throws(() => check(row, [{ ...record, ...patch }]));
});
test("late publication and future quote cannot establish a prospective result", () => {
  for (const patch of [
    { published_at: row.executionAt },
    { published_at: "2026-11-10T14:00:00Z" },
    { quote_at: "2026-11-08T21:00:00Z" },
    { published_at: "2026-10-31T21:00:00Z" },
    { evidence_hash: "" },
    { reference_price: 0 },
  ])
    assert.throws(() => check(row, [{ ...record, ...patch }]));
  assert.throws(() => check(row, []));
  assert.throws(() => check(row, [record, { ...record, id: 2 }]));
});
test("Pace levels map to contribution multiples, not their numeric level", () => {
  for (const [pace, multiplier] of [
    [0, 0],
    [1, 0],
    [2, 1],
    [3, 2],
    [4, 4],
  ]) {
    assert.equal(
      check({ ...row, multiplier }, [{ ...record, pace }]).publicationId,
      1,
    );
    assert.throws(() =>
      check({ ...row, multiplier: 3 }, [{ ...record, pace }]),
    );
  }
});

test("Postgres UTC offsets are accepted without changing publication time", () => {
  assert.equal(
    check(row, [
      {
        ...record,
        published_at: "2026-11-07T14:00:00+00:00",
        quote_at: "2026-11-06T21:00:00+00:00",
      },
    ]).publicationId,
    1,
  );
});

test("a prior-session quote can support a weekend publication after month completion", () => {
  assert.equal(
    check(row, [
      {
        ...record,
        published_at: "2026-11-01T14:00:00Z",
        quote_at: "2026-10-30T20:00:00Z",
      },
    ]).publicationId,
    1,
  );
});

test("prospective receipts bind the requested policy version, not just a hash", () => {
  assert.throws(() => check({ ...row, policyVersion: "monthly-v6" }));
  assert.throws(() => check(row, [{ ...record, policy: "monthly-v6" }]));
  const v6row = {
    ...row,
    policyVersion: "monthly-v6",
    signalDate: "2026-11-30T21:00:00Z",
    signalKnownAt: "2026-12-01T00:00:00Z",
    executionAt: "2026-12-02T14:30:00Z",
  };
  const v6record = {
    ...record,
    policy: "monthly-v6",
    signal_period: "2026-11",
    published_at: "2026-12-01T12:00:00Z",
    quote_at: "2026-11-30T21:00:00Z",
  };
  assert.equal(check(v6row, [v6record]).policyVersion, "monthly-v6");
  assert.throws(() =>
    check({ ...row, policyVersion: "monthly-v6" }, [
      { ...record, policy: "monthly-v6" },
    ]),
  );
});
