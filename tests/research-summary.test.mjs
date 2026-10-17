import test from "node:test";
import assert from "node:assert/strict";
import * as m from "../lib/research-summary.ts";
const period = {
  start: "2025-01-01",
  end: "2025-12-31",
  filed: "2026-02-01",
  basis: "GAAP",
  currency: "USD",
  sourceUrl: "https://www.sec.gov/Archives/a",
  revenue: 100,
  netIncome: 20,
  operatingIncome: 30,
  operatingCashFlow: 25,
  capex: 5,
  fcf: 20,
  margin: 30,
  eps: 2,
};
const research = {
  company: { symbol: "APP", assetType: "stock" },
  quote: { price: 10, currency: "USD", stale: false },
  retrievedAt: "2026-03-01",
  facts: [
    {
      metric: "shares",
      scope: "instant",
      unit: "shares",
      value: 10,
      end: "2026-02-01",
      filed: "2026-02-15",
      form: "10-Q",
    },
  ],
};
test("market ratios use dated same-currency evidence and withhold ADR, negative earnings and stale quote", () => {
  assert.deepEqual(m.marketMultiples(research, period), {
    marketCap: 100,
    pe: 5,
    ps: 1,
    pfcf: 5,
    fcfYield: 20,
  });
  assert.equal(
    m.marketMultiples(
      { ...research, quote: { ...research.quote, stale: true } },
      period,
    ).pe,
    null,
  );
  assert.equal(
    m.marketMultiples(research, { ...period, currency: "EUR" }).pe,
    null,
  );
  assert.equal(
    m.marketMultiples(research, { ...period, netIncome: -20 }).pe,
    null,
  );
  assert.equal(
    m.marketMultiples(
      { ...research, facts: [{ ...research.facts[0], form: "20-F" }] },
      period,
    ).marketCap,
    null,
  );
  assert.equal(
    m.marketMultiples(
      { ...research, quote: { ...research.quote, price: -10 } },
      period,
    ).marketCap,
    null,
  );
  assert.equal(
    m.marketMultiples(
      { ...research, quote: { ...research.quote, price: Infinity } },
      period,
    ).marketCap,
    null,
  );
  assert.equal(
    m.marketMultiples(
      { ...research, facts: [{ ...research.facts[0], value: Infinity }] },
      period,
    ).marketCap,
    null,
  );
});
test("earnings scenario discounts an explicit exit multiple and refuses invalid assumptions", () => {
  const p = m.earningsScenario(2, 0, 10, 10, 0, 5);
  assert.equal(p.exitPrice, 20);
  assert.ok(Math.abs(p.presentValue - 20 / 1.1 ** 5) < 1e-9);
  assert.equal(m.earningsScenario(-2, 10, 20, 10, 0, 5), null);
  assert.ok(m.earningsScenario(2, 0, 10, 10, 5, 5).exitPrice < 20);
});
test("financial case treats absence as missing evidence and never manufactures a moat", () => {
  const c = m.financialCase({ ...period, fcf: null }, null);
  assert.ok(c.gaps.some((s) => s.includes("cash flow")));
  assert.ok(!c.positive.some((s) => /moat|cash generation/.test(s.text)));
  assert.ok(
    m
      .financialCase({ ...period, fcf: -10 }, null)
      .risks.some((s) => s.key === "fcf"),
  );
});
