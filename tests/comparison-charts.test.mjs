import test from "node:test";
import assert from "node:assert/strict";
import { comparisonChart } from "../lib/comparison-charts.ts";
const company = (symbol, points, currency = "USD") => ({
  company: { symbol, currency },
  quote: { currency },
  retrievedAt: "2026-11-05T12:00:00Z",
  history: points.map(([time, close]) => ({ time, close })),
});
test("aligns strictly by shared dates and positive baselines, never array position", () => {
  const a = company("A", [
    ["2026-10-01", 10],
    ["2026-10-02", 20],
    ["2026-10-03", 30],
  ]);
  const b = company("B", [
    ["2026-10-02", 40],
    ["2026-10-03", 20],
    ["2026-10-04", 5],
  ]);
  const c = comparisonChart([a, b], "all");
  assert.deepEqual(c.dates, ["2026-10-02", "2026-10-03"]);
  assert.equal(c.series[0].base, 20);
  assert.equal(c.series[0].points[1].change, 50);
  assert.equal(c.series[1].points[1].change, -50);
});
test("nonpositive, nonfinite, future and non-daily closes cannot establish a baseline", () => {
  const points = [
    ["2026-10-01", 0],
    ["2026-10-02", -1],
    ["2026-10-03", NaN],
    ["2026-10-04T12:00:00", 10],
    ["2026-12-01", 20],
    ["2026-10-05", 5],
  ];
  const c = comparisonChart([company("A", points), company("B", points)]);
  assert.equal(c.available, false);
  assert.deepEqual(c.series, []);
});
test("one range uses latest common date and does not create missing observations", () => {
  const points = [
    ["2025-01-01", 10],
    ["2026-09-01", 20],
    ["2026-10-01", 40],
    ["2026-10-15", 50],
  ];
  const a = company("A", points),
    b = company("B", points);
  assert.deepEqual(comparisonChart([a, b], "1m").dates, [
    "2026-10-01",
    "2026-10-15",
  ]);
  assert.equal(comparisonChart([a, b], "all").series[0].base, 10);
  assert.equal(comparisonChart([a, b], "1m").series[0].base, 40);
});
test("missing peer history prevents a misleading comparison, while currency and source remain explicit", () => {
  const a = company(
    "A",
    [
      ["2026-10-01", 10],
      ["2026-10-02", 20],
    ],
    "EUR",
  );
  assert.equal(comparisonChart([a, company("B", [])]).available, false);
  const c = comparisonChart([
    a,
    company("B", [
      ["2026-10-01", 10],
      ["2026-10-02", 20],
    ]),
  ]);
  assert.equal(c.series[0].currency, "EUR");
  assert.equal(c.series[0].source, "Source not specified");
  assert.equal(comparisonChart([a, a]).available, false);
});
