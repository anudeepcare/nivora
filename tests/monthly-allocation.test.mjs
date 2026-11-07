import test from "node:test";
import assert from "node:assert/strict";
import { monthlyAllocation, usdCents } from "../lib/monthly-allocation.ts";
const now = Date.parse("2026-11-06T18:00:00Z");
const quote = (price = 1) => ({
  price,
  currency: "USD",
  stale: false,
  asOf: new Date(now).toISOString(),
});
const position = (symbol, quantity) => ({
  id: symbol,
  symbol,
  quantity,
  assetType: "stock",
  cost: 1,
  currency: "USD",
});
const plan = (overrides = {}) =>
  monthlyAllocation({
    positions: [],
    quotes: { A: quote(), B: quote(), C: quote() },
    candidates: ["A", "B", "C"],
    budgetCents: 10000,
    capPercent: 100,
    now,
    ...overrides,
  });
test("parses positive exact cents without silently rounding", () => {
  assert.equal(usdCents("1.01"), 101);
  for (const v of ["0", "-1", "1.001", "1e3", "Infinity", ""])
    assert.equal(usdCents(v), null);
});
test("conserves a cent-exact budget and deduplicates selection", () => {
  const p = plan({ budgetCents: 10001, candidates: ["A", "A", "B", "C"] });
  assert.deepEqual(
    p.rows.map((r) => r.contributionCents),
    [3334, 3334, 3333],
  );
  assert.equal(p.retainedCents, 0);
});
test("contributes to smaller holdings first", () => {
  const p = plan({
    positions: [position("A", 100), position("B", 20)],
    candidates: ["A", "B"],
    budgetCents: 10000,
  });
  assert.deepEqual(
    p.rows.map((r) => r.contributionCents),
    [1000, 9000],
  );
});
test("caps contributions and retains cash without selling existing over-cap holdings", () => {
  const p = plan({
    positions: [position("A", 100)],
    capPercent: 25,
    candidates: ["A", "B", "C"],
  });
  assert.deepEqual(
    p.rows.map((r) => r.contributionCents),
    [0, 5000, 5000],
  );
  assert.match(p.rows[0].reason, /above/);
  const cash = plan({ capPercent: 20 });
  assert.equal(cash.retainedCents, 4000);
});
test("withholds all totals for missing, stale, old, future, mismatched or negative holdings", () => {
  for (const q of [
    undefined,
    { ...quote(), stale: true },
    { ...quote(), currency: "EUR" },
    { ...quote(), asOf: "2020-01-01" },
    { ...quote(), asOf: new Date(now + 120000).toISOString() },
  ]) {
    const p = plan({ positions: [position("A", 1)], quotes: { A: q } });
    assert.equal(p.complete, false);
    assert.equal(p.totalCents, null);
    assert.deepEqual(p.rows, []);
  }
  assert.equal(plan({ positions: [position("A", -1)] }).complete, false);
});
test("USD current valuations do not depend on historical cost currency", () => {
  const p = plan({ positions: [{ ...position("A", 1), currency: "EUR" }] });
  assert.equal(p.complete, true);
  assert.equal(p.totalCents, 100);
});
test("sample valuations use the sample research clock", () => {
  const sampleQuote = { ...quote(), asOf: "2026-10-16T20:00:00Z" };
  const p = plan({
    positions: [position("A", 1)],
    quotes: { A: sampleQuote },
    now: Date.parse("2026-10-17T12:00:00Z"),
  });
  assert.equal(p.complete, true);
  assert.equal(p.totalCents, 100);
  assert.equal(
    plan({ positions: [position("A", 1)], quotes: { A: sampleQuote } })
      .complete,
    false,
  );
});
test("aggregates duplicate holding lots and keeps invalid candidates unallocated", () => {
  const p = plan({
    positions: [position("A", 1), position("A", 2)],
    quotes: { A: quote() },
    candidates: ["B"],
  });
  assert.equal(p.totalCents, 300);
  assert.equal(p.retainedCents, 10000);
});
test("weights include retained contribution and exclude pre-existing cash", () => {
  const p = plan({
    positions: [{ ...position("USD", 999), assetType: "cash" }],
    candidates: ["A"],
    capPercent: 20,
  });
  assert.equal(p.totalCents, 0);
  assert.equal(p.rows[0].afterWeight, 20);
  assert.equal(p.retainedCents, 8000);
});
test("budget conservation and per-position caps across unequal holdings", () => {
  for (let budget = 1; budget < 3000; budget += 43) {
    const p = plan({
      positions: [position("A", 3), position("B", 7)],
      budgetCents: budget,
      capPercent: 40,
    });
    assert.equal(
      p.rows.reduce((s, r) => s + r.contributionCents, 0) + p.retainedCents,
      budget,
    );
    for (const row of p.rows) {
      assert.ok(
        Number.isInteger(row.contributionCents) && row.contributionCents >= 0,
      );
      if (row.contributionCents) assert.ok(row.afterWeight <= 40 + 1e-10);
    }
  }
});
test("rejects unsafe budgets and invalid caps", () => {
  for (const budgetCents of [0, -1, 1.5, Infinity, 10_000_000_001])
    assert.equal(plan({ budgetCents }).complete, false);
  for (const capPercent of [0, 101, 1.5, NaN])
    assert.equal(plan({ capPercent }).complete, false);
});
test("empty selection retains all cash without inventing recommendations", () => {
  const p = plan({ candidates: [] });
  assert.equal(p.retainedCents, 10000);
  assert.deepEqual(p.rows, []);
});
test("share-class aliases coalesce and a one-cent capped budget remains cash", () => {
  const p = plan({
    positions: [position("BRK.B", 1), position("BRK-B", 2)],
    quotes: { "BRK-B": quote() },
    candidates: ["BRK.B", "BRK-B"],
    capPercent: 100,
  });
  assert.equal(p.rows.length, 1);
  assert.equal(p.totalCents, 300);
  assert.equal(plan({ budgetCents: 1, capPercent: 20 }).retainedCents, 1);
});
