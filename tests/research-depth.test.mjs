import test from "node:test";
import assert from "node:assert/strict";
import {
  quarterFacts,
  ttmPeriods,
  reverseGrowth,
  weeklyStudies,
  modelCoverage,
} from "../lib/research-depth.ts";
const f = (value, end, scope = "ytd", extra = {}) => ({
  id: end,
  metric: "revenue",
  value,
  unit: "USD",
  currency: "USD",
  start: "2025-01-01",
  end,
  filed: "2026-02-01",
  accession: "filing",
  form: "10-K",
  sourceUrl: "https://www.sec.gov/Archives/filing",
  basis: "GAAP",
  scope,
  ...extra,
});
test("quarter derivation preserves provenance, does not derive EPS, and excludes unavailable evidence", () => {
  const q = quarterFacts(
    [
      f(10, "2025-03-31", "quarterly"),
      f(30, "2025-06-30"),
      f(60, "2025-09-30"),
      f(100, "2025-12-31", "annual"),
      f(999, "2025-12-31", "annual", { filed: "2027-01-01" }),
      f(1, "2025-06-30", "ytd", { metric: "eps" }),
    ],
    "2026-03-01",
  );
  assert.deepEqual(
    q.filter((x) => x.metric === "revenue").map((x) => x.value),
    [10, 20, 30, 40],
  );
  assert.ok(q[1].derivedFrom?.length === 2);
  assert.equal(
    q.some((x) => x.metric === "eps"),
    false,
  );
});
test("TTM refuses gaps and mixed currencies", () => {
  const q = [
    ["01-01", "03-31"],
    ["04-01", "06-30"],
    ["07-01", "09-30"],
    ["10-01", "12-31"],
  ].map(([s, e]) => f(10, "2025-" + e, "quarterly", { start: "2025-" + s }));
  assert.equal(ttmPeriods(q, "2026-03-01")[0].revenue, 40);
  assert.equal(ttmPeriods(q.slice(1), "2026-03-01").length, 0);
  assert.equal(
    ttmPeriods(
      q.map((x, i) => (i === 2 ? { ...x, currency: "EUR", unit: "EUR" } : x)),
      "2026-03-01",
    ).length,
    0,
  );
});
test("reverse valuation solves a price under fixed assumptions, without calling it a forecast", () => {
  const r = reverseGrowth(100, 10, 100, 10, 0, 0);
  assert.ok(r != null && Math.abs(r) < 0.01);
  assert.equal(reverseGrowth(-1, 10, 100, 10, 0, 0), null);
});
test("weekly averages exclude forming week and require actual history", () => {
  const b = Array.from({ length: 205 }, (_, i) => ({
    time: new Date(Date.UTC(2022, 0, 7 + i * 7)).toISOString().slice(0, 10),
    open: 100,
    high: 101,
    low: 99,
    close: 100,
    volume: 10,
  }));
  const last = new Date(Date.parse(b.at(-1).time) + 3 * 86400000).toISOString();
  assert.equal(weeklyStudies(b, last).ma200, 100);
  assert.equal(weeklyStudies(b.slice(-40), last).ma50, null);
});
test("coverage distinguishes business economics instead of forcing one DCF", () => {
  assert.equal(modelCoverage("IREN", "stock").family, "infrastructure");
  assert.equal(modelCoverage("ASTS", "stock").family, "frontier");
  assert.equal(modelCoverage("BTC/USD", "crypto").family, "crypto");
});
