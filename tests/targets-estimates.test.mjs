import test from "node:test";
import assert from "node:assert/strict";
import {
  estimateGrowth,
  orderedEstimateRange,
  targetsEstimates,
} from "../lib/targets-estimates.ts";
const input = () => ({
  company: { symbol: "APP", assetType: "stock", currency: "USD" },
  quote: { price: 100, currency: "USD", asOf: "2026-11-04", stale: false },
  retrievedAt: "2026-11-05",
  history: [],
  facts: [],
  issues: [],
  evidence: {
    updatedAt: "2026-11-04",
    reportingCurrency: "USD",
    consensus: { target: 150, strongBuy: 20, buy: 10 },
    estimates: [
      {
        date: "2026-12-31",
        period: "FY2026",
        frequency: "Annual",
        currency: "USD",
        eps: 5,
        epsLow: null,
        epsHigh: null,
        revenue: 1e9,
        revenueLow: null,
        revenueHigh: null,
        analysts: 12,
      },
    ],
  },
});
test("loss transitions never display misleading percentage growth", () => {
  assert.equal(estimateGrowth(2, -1), "Loss to profit");
  assert.equal(estimateGrowth(-1, -2), "Loss narrows");
  assert.equal(estimateGrowth(-2, 1), "Profit to loss");
  assert.equal(estimateGrowth(3, 2), "+50.0%");
  assert.equal(estimateGrowth(3, 0), "Zero prior base; percentage unavailable");
  assert.equal(estimateGrowth(0, -2), "Loss to breakeven");
});
test("missing or unordered estimate ranges are not manufactured", () => {
  assert.equal(orderedEstimateRange(null, 4, null), null);
  assert.equal(orderedEstimateRange(6, 4, 8), null);
  assert.deepEqual(orderedEstimateRange(-2, -1, 1), { low: -2, high: 1 });
});
test("annual estimates expose dated EPS coverage without inventing target coverage", () => {
  const model = targetsEstimates(input());
  assert.equal(model.estimates[0].analysts, 12);
  assert.equal(model.targetAnalysts, null);
  assert.equal(model.estimates[0].epsRange, null);
  assert.equal(model.consensus.low, undefined);
  assert.equal(model.asOf, "2026-11-04");
});
test("stale data, fiscal conflicts and currency conflicts are excluded", () => {
  for (const mutate of [
    (r) => (r.evidence.updatedAt = "2024-01-01"),
    (r) => (r.evidence.estimates[0].period = "FY2032"),
    (r) => (r.evidence.estimates[0].currency = "EUR"),
    (r) => (r.evidence.estimates[0].date = "invalid"),
  ]) {
    const r = input();
    mutate(r);
    assert.equal(targetsEstimates(r).estimates.length, 0);
  }
});
test("published annual periods are not presented as upcoming estimates", () => {
  const r = input();
  r.evidence.estimates[0].date = "2026-09-30";
  r.facts = [
    {
      metric: "revenue",
      scope: "annual",
      end: "2026-09-30",
      filed: "2026-11-01",
    },
  ];
  assert.equal(targetsEstimates(r).estimates.length, 0);
});

test("provider relative-year labels become fiscal labels without hiding the source period", () => {
  const r = input();
  r.evidence.estimates[0].period = "0y";
  const row = targetsEstimates(r).estimates[0];
  assert.equal(row.period, "FY2026");
  assert.equal(row.providerPeriod, "0y");
});
