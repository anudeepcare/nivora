import test from "node:test";
import assert from "node:assert/strict";
import { financialPeriods } from "../lib/engine.ts";
import { quarterFacts, ttmPeriods } from "../lib/research-depth.ts";
import { researchPeriods } from "../lib/financial-catalog.ts";
const fact = (metric, value, extra = {}) => ({
  id: metric,
  metric,
  value,
  unit: "USD",
  currency: "USD",
  start: "2025-01-01",
  end: "2025-12-31",
  filed: "2026-02-01",
  accession: "one",
  form: "10-K",
  sourceUrl: "https://www.sec.gov/Archives/one/",
  basis: "GAAP",
  scope: "annual",
  ...extra,
});
const data = [
  fact("revenue", 200),
  fact("grossProfit", 150),
  fact("operatingIncome", 60),
  fact("netIncome", 40),
  fact("operatingCashFlow", 55),
  fact("capex", 5),
  fact("stockCompensation", 10),
  fact("interestExpense", 5),
  fact("researchExpense", 20),
  fact("eps", 4, { unit: "USD/shares" }),
  fact("weightedShares", 10, { unit: "shares", currency: null }),
  fact("cash", 80, { scope: "instant", start: null }),
  fact("debt", 100, { scope: "instant", start: null }),
  fact("equity", 120, { scope: "instant", start: null }),
  fact("currentAssets", 90, { scope: "instant", start: null }),
  fact("currentLiabilities", 30, { scope: "instant", start: null }),
];
test("periods expose sourced margins, per-share cash and matching balance sheet", () => {
  const p = financialPeriods(data, "annual", "2026-03-01")[0];
  assert.equal(p.grossMargin, 75);
  assert.equal(p.fcfMargin, 25);
  assert.equal(p.netMargin, 20);
  assert.equal(p.fcfPerShare, 5);
  assert.equal(p.sbcAdjustedFcfPerShare, 4);
  assert.equal(p.currentRatio, 3);
  assert.equal(p.netDebt, 20);
  assert.equal(p.interestCoverage, 12);
  assert.equal(p.eps, 4);
  assert.ok(p.sourceUrls.includes("https://www.sec.gov/Archives/one/"));
});
test("balance sheets do not join a different currency, date or basis; zero is retained", () => {
  const p = financialPeriods(
    [
      ...data.filter((f) => !["cash", "debt"].includes(f.metric)),
      fact("cash", 999, {
        scope: "instant",
        start: null,
        currency: "EUR",
        unit: "EUR",
      }),
      fact("debt", 999, { scope: "instant", start: null, end: "2024-12-31" }),
      fact("buybacks", 0),
    ],
    "annual",
    "2026-03-01",
  )[0];
  assert.equal(p.cash, null);
  assert.equal(p.debt, null);
  assert.equal(p.netDebt, null);
  assert.equal(p.buybacks, 0);
});
test("weighted shares are not derived by subtracting cumulative averages", () => {
  const q = quarterFacts(
    [
      fact("weightedShares", 10, {
        scope: "quarterly",
        end: "2025-03-31",
        unit: "shares",
        currency: null,
      }),
      fact("weightedShares", 12, {
        scope: "ytd",
        end: "2025-06-30",
        unit: "shares",
        currency: null,
      }),
    ],
    "2026-03-01",
  );
  assert.equal(q.filter((f) => f.metric === "weightedShares").length, 1);
});
test("TTM sums flows, recalculates ratios and retains the final balance only", () => {
  const dates = [
    ["01-01", "03-31"],
    ["04-01", "06-30"],
    ["07-01", "09-30"],
    ["10-01", "12-31"],
  ];
  const facts = dates.flatMap(([s, e], i) =>
    data.map((f) => ({
      ...f,
      start: f.scope === "instant" ? null : "2025-" + s,
      end: "2025-" + e,
      scope: f.scope === "instant" ? "instant" : "quarterly",
      value: f.metric === "cash" ? i * 10 : f.value,
    })),
  );
  const p = ttmPeriods(facts, "2026-03-01")[0];
  assert.equal(p.grossProfit, 600);
  assert.equal(p.grossMargin, 75);
  assert.equal(p.cash, 30);
  assert.equal(p.fcfPerShare, 20);
  assert.equal(p.eps, null);
});

test("current reporting currency takes precedence over old quote-currency disclosures", () => {
  const r = {
    quote: { currency: "USD" },
    retrievedAt: "2026-03-01",
    facts: [
      fact("revenue", 10, {
        start: "2017-01-01",
        end: "2017-12-31",
        filed: "2018-02-01",
      }),
      fact("revenue", 200, { currency: "EUR", unit: "EUR", basis: "IFRS" }),
    ],
  };
  const rows = researchPeriods(r, "annual");
  assert.equal(rows.at(-1).currency, "EUR");
  assert.equal(rows.at(-1).end, "2025-12-31");
});
