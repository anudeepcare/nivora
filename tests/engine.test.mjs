import test from "node:test";
import assert from "node:assert/strict";
import {
  accumulation,
  financialPeriods,
  portfolioTotals,
  cashFlowValue,
} from "../lib/engine.ts";
const months = (last = 100) =>
  Array.from({ length: 25 }, (_, i) => {
    const ends = [
      "2023-01-31",
      "2023-02-28",
      "2023-03-31",
      "2023-04-28",
      "2023-05-31",
      "2023-06-30",
      "2023-07-31",
      "2023-08-31",
      "2023-09-29",
      "2023-10-31",
      "2023-11-30",
      "2023-12-29",
      "2024-01-31",
      "2024-02-29",
      "2024-03-28",
      "2024-04-30",
      "2024-05-31",
      "2024-06-28",
      "2024-07-31",
      "2024-08-30",
      "2024-09-30",
      "2024-10-31",
      "2024-11-29",
      "2024-12-31",
      "2025-01-31",
    ];
    const day = ends[i],
      p = i === 24 ? last : 100;
    return { time: day, open: p, high: p, low: p, close: p, volume: 1 };
  });
const asOf = "2025-02-05T22:00:00Z";
test("monthly research supports 1x, 2x, 3x, 4x and pause without an amount", () => {
  for (const [p, want] of [
    [100, 1],
    [80, 2],
    [65, 3],
    [45, 4],
    [140, 0],
  ])
    assert.equal(accumulation(months(p), asOf).confirmed?.multiplier, want);
});
test("forming and future observations cannot repaint a closed month", () => {
  const a = accumulation(months(65), asOf),
    b = accumulation(
      [
        ...months(65),
        { time: "2025-02-04", open: 1, high: 1, low: 1, close: 1, volume: 1 },
        {
          time: "2028-01-31",
          open: 999,
          high: 999,
          low: 999,
          close: 999,
          volume: 1,
        },
      ],
      asOf,
    );
  assert.deepEqual(a.confirmed, b.confirmed);
  assert.deepEqual(a.history, b.history);
  assert.equal(b.forming?.month, "2025-02");
});
test("gaps, insufficient history, stale series and invalid bars withhold multiplier", () => {
  for (const bars of [
    months().slice(-10),
    months().filter((_, i) => i !== 12),
    months().map((b, i) => (i === 24 ? { ...b, high: 1 } : b)),
  ])
    assert.equal(accumulation(bars, asOf).confirmed, null);
  assert.equal(accumulation(months(), "2025-06-01").confirmed, null);
});
test("documented thesis break pauses current signal without rewriting historical signals", () => {
  const original = accumulation(months(45), asOf),
    paused = accumulation(months(45), asOf, true);
  assert.equal(paused.confirmed?.multiplier, 0);
  assert.deepEqual(original.history, paused.history);
});
const fact = (metric, value, extra = {}) => ({
  id: metric,
  metric,
  value,
  unit: "USD",
  currency: "USD",
  start: "2024-01-01",
  end: "2024-12-31",
  filed: "2025-01-20",
  accession: "a",
  form: "10-K",
  sourceUrl: "https://www.sec.gov/example",
  basis: "GAAP",
  scope: "annual",
  ...extra,
});
test("financial periods preserve missing values and only combine matching cash-flow filings", () => {
  const facts = [
    fact("revenue", 1000),
    fact("operatingCashFlow", 200),
    fact("capex", 50, { accession: "b" }),
    fact("netIncome", 900, { filed: "2026-01-01" }),
  ];
  const [row] = financialPeriods(facts, "annual", asOf);
  assert.equal(row.revenue, 1000);
  assert.equal(row.fcf, null);
  assert.equal(row.netIncome, null);
  assert.equal(
    financialPeriods([...facts, fact("capex", 60)], "annual", asOf)[0].fcf,
    140,
  );
});
test("portfolio excludes unpriced holdings from known value and withholds total P&L", () => {
  const r = portfolioTotals(
    [
      {
        id: "1",
        symbol: "MSFT",
        quantity: 2,
        cost: 100,
        currency: "USD",
        assetType: "stock",
      },
      {
        id: "2",
        symbol: "APP",
        quantity: 1,
        cost: 20,
        currency: "USD",
        assetType: "stock",
      },
      {
        id: "3",
        symbol: "USD",
        quantity: 50,
        cost: 1,
        currency: "USD",
        assetType: "cash",
      },
    ],
    { MSFT: { price: 150, currency: "USD", stale: false } },
  );
  assert.equal(r.knownValue, 350);
  assert.equal(r.pnl, null);
  assert.deepEqual(r.missing, ["APP"]);
});
test("cash-flow valuation uses per-share dilution and rejects invalid terminal assumptions", () => {
  assert.equal(cashFlowValue(100, 10, 0, 10, 0), 100);
  assert.ok(cashFlowValue(100, 10, 0, 10, 0, 2) < 100);
  assert.equal(cashFlowValue(100, 10, 0, 5, 5), null);
  assert.equal(cashFlowValue(-100, 10, 0, 10, 0), null);
});

test("incomplete month near month-end does not become confirmed", () => {
  const bars = months(65).map((b, i) =>
    i === 24 ? { ...b, time: "2025-01-27" } : b,
  );
  assert.equal(accumulation(bars, asOf).confirmed, null);
});
test("foreign or unknown cash cannot enter USD known value", () => {
  for (const currency of ["EUR", null]) {
    const t = portfolioTotals(
      [
        {
          id: "c",
          symbol: currency ?? "CASH",
          currency,
          quantity: 100,
          cost: 1,
          assetType: "cash",
        },
      ],
      {},
    );
    assert.equal(t.knownValue, 0);
    assert.equal(t.pnl, null);
    assert.equal(t.missing.length, 1);
  }
});
