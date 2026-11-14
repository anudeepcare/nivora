import test from "node:test";
import assert from "node:assert/strict";
import {
  researchChanges,
  parseVisitSnapshot,
} from "../lib/research-changes.ts";
const old = {
  version: 1,
  symbol: "APP",
  currency: "USD",
  seenAt: "2026-11-06T22:00:00Z",
  price: { value: 100, date: "2026-11-06T21:00:00Z" },
  pace: {
    level: 2,
    policy: "monthly-v6",
    date: "2026-11-06",
    source: "Daily provider",
  },
  estimate: { end: "2027-12-31", eps: 10 },
  target: 130,
  dataset: { source: "EODHD", date: "2026-11-06" },
};
test("prioritizes actual zone and estimate changes ahead of price, with at most three items", () => {
  const next = {
    ...old,
    seenAt: "2026-11-07T22:00:00Z",
    pace: { ...old.pace, level: 3 },
    estimate: { ...old.estimate, eps: 9 },
    price: { value: 90, date: "2026-11-07T21:00:00Z" },
    target: 120,
  };
  const rows = researchChanges(old, next);
  assert.equal(rows.length, 3);
  assert.match(rows[0].detail, /P2 → P3/);
  assert.match(rows[1].detail, /-10.0%/);
  assert.match(rows[2].detail, /-7.7%/);
});
test("missing values, currency changes, policy changes and different fiscal estimates are not comparable", () => {
  assert.deepEqual(researchChanges(old, { ...old, currency: "EUR" }), []);
  assert.deepEqual(
    researchChanges(old, {
      ...old,
      pace: { level: 4, policy: "monthly-v7" },
      estimate: { end: "2028-12-31", eps: 20 },
      target: null,
      price: null,
    }),
    [],
  );
  assert.deepEqual(researchChanges(old, { ...old, symbol: "MSFT" }), []);
});
test("does not describe an earlier quote or tiny changes as new evidence", () => {
  assert.deepEqual(
    researchChanges(old, {
      ...old,
      price: { value: 80, date: "2026-11-05" },
      estimate: { ...old.estimate, eps: 10.01 },
      target: 130.1,
    }),
    [],
  );
});
test("validates stored data, rejects future visits and malformed data", () => {
  const now = Date.parse("2026-11-07T22:00:00Z");
  assert.equal(parseVisitSnapshot(JSON.stringify(old), now).symbol, "APP");
  for (const raw of [
    "bad",
    JSON.stringify({ ...old, seenAt: "2027-01-01" }),
    JSON.stringify({ ...old, price: { value: -1, date: "2026-11-06" } }),
    JSON.stringify({ ...old, pace: { level: 9, policy: "monthly-v6" } }),
  ])
    assert.equal(parseVisitSnapshot(raw, now), null);
});

test("older or different-provider estimates do not become revision alerts", () => {
  for (const dataset of [
    { source: "Other", date: "2026-11-07" },
    { source: "EODHD", date: "2026-11-05" },
    null,
  ])
    assert.deepEqual(
      researchChanges(old, {
        ...old,
        dataset,
        target: 200,
        estimate: { ...old.estimate, eps: 20 },
      }),
      [],
    );
});

test("Pace changes require matching providers and a nonregressing observation date", () => {
  for (const pace of [
    { ...old.pace, level: 4, date: "2026-11-05" },
    { ...old.pace, level: 4, source: "Other provider" },
    { ...old.pace, level: 4, source: null },
  ])
    assert.deepEqual(researchChanges(old, { ...old, pace }), []);
});

test("switching a target source never creates an analyst revision alert under the financial dataset identity", () => {
  const next = {
    ...old,
    target: 200,
    targetDataset: { source: "SentiSense", date: "2026-11-07T12:00:00Z" },
  };
  assert.deepEqual(researchChanges(old, next), []);
  assert.deepEqual(
    researchChanges(next, { ...old, seenAt: "2026-11-08T12:00:00Z" }),
    [],
  );
  const from = {
    ...old,
    targetDataset: { source: "SentiSense", date: "2026-11-06T12:00:00Z" },
  };
  assert.match(researchChanges(from, next)[0].detail, /53.8%/);
  assert.deepEqual(researchChanges(next, { ...from, target: 100 }), []);
});

test("malformed target source metadata is rejected from saved visits", () => {
  const now = Date.parse("2026-11-07T22:00:00Z");
  for (const targetDataset of [
    { source: 33, date: "2026-11-06" },
    { source: "SentiSense", date: "2099-01-01" },
    { source: "SentiSense", date: "bad" },
  ])
    assert.equal(
      parseVisitSnapshot(JSON.stringify({ ...old, targetDataset }), now),
      null,
    );
});

test("visit retention keeps target and provenance atomic, independent from financial freshness", async () => {
  const m = await import("../lib/research-changes.ts");
  assert.equal(typeof m.retainVisitSnapshot, "function");
  const stored = { ...old, target: 40 };
  for (const dataset of [null, { source: "EODHD", date: "2026-11-05" }]) {
    const next = {
      ...old,
      dataset,
      target: 57,
      targetDataset: { source: "SentiSense", date: "2026-11-07T12:00:00Z" },
    };
    const saved = m.retainVisitSnapshot(stored, next);
    assert.equal(saved.target, 57);
    assert.deepEqual(saved.targetDataset, next.targetDataset);
    assert.deepEqual(saved.dataset, stored.dataset);
    assert.deepEqual(researchChanges(saved, next), []);
    const back = {
      ...next,
      target: 40,
      targetDataset: { source: "EODHD", date: "2026-11-05" },
    };
    const returned = m.retainVisitSnapshot(saved, back);
    assert.equal(returned.target, 40);
    assert.deepEqual(returned.targetDataset, back.targetDataset);
    assert.deepEqual(researchChanges(returned, back), []);
  }
  const source = { source: "SentiSense", date: "2026-11-07T12:00:00Z" };
  const recent = { ...old, target: 57, targetDataset: source };
  const stale = {
    ...old,
    target: 40,
    targetDataset: { ...source, date: "2026-11-05" },
  };
  const saved = m.retainVisitSnapshot(recent, stale);
  assert.equal(saved.target, 57);
  assert.deepEqual(saved.targetDataset, source);
  const missing = m.retainVisitSnapshot(recent, {
    ...old,
    target: null,
    targetDataset: null,
    dataset: null,
  });
  assert.equal(missing.target, 57);
  assert.deepEqual(missing.targetDataset, source);
  assert.deepEqual(missing.price, old.price);
  assert.deepEqual(missing.pace, old.pace);
});
