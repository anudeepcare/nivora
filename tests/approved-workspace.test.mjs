import test from "node:test";
import assert from "node:assert/strict";
import {
  workspaceOverview,
  portfolioHistory,
  researchLink,
} from "../lib/approved-workspace.ts";

const position = (symbol, extra = {}) => ({
  id: symbol,
  symbol,
  quantity: 2,
  cost: 50,
  currency: "USD",
  assetType: "stock",
  ...extra,
});
const row = (price, extra = {}) => ({
  company: { symbol: "A", name: "Alpha", sector: "Technology" },
  quote: {
    price,
    currency: "USD",
    stale: false,
    source: "Provider",
    asOf: "2026-10-23T20:00:00Z",
    changePct: 1,
    ...extra,
  },
});
const bars = (values) =>
  values.map(([time, close]) => ({
    time,
    close,
    open: close,
    high: close,
    low: close,
    volume: 100,
  }));

test("an empty portfolio has zero recorded assets and no fabricated return or exposure", () => {
  const model = workspaceOverview([], {});
  assert.equal(model.assets, 0);
  assert.equal(model.pnl, null);
  assert.equal(model.returnPct, null);
  assert.equal(model.investmentCount, 0);
  assert.deepEqual(model.allocations, []);
  assert.deepEqual(model.groups, []);
});

test("partial prices keep valid holdings and recorded cash while disclosing excluded symbols", () => {
  const model = workspaceOverview(
    [
      position("A"),
      position("B"),
      position("USD", { assetType: "cash", quantity: 100, cost: 1 }),
    ],
    { A: row(80), B: { error: "Provider unavailable" } },
  );
  assert.equal(model.assets, 260);
  assert.equal(model.invested, 160);
  assert.equal(model.cash, 100);
  assert.equal(model.pnl, 60);
  assert.equal(model.returnPct, 60);
  assert.equal(model.returnCovered, 1);
  assert.deepEqual(model.unpriced, ["B"]);
  assert.equal(model.allocations[0].weight, 100);
});

test("complete coverage reconciles duplicate holdings, net equity and sector weights", () => {
  const positions = [
    position("A"),
    position("A", { id: "lot2", quantity: 1, cost: 70 }),
    position("B"),
    position("USD", { assetType: "cash", quantity: 100, cost: 1 }),
  ];
  const rows = {
    A: row(100),
    B: { ...row(50), company: { sector: "Industrials" } },
  };
  const model = workspaceOverview(positions, rows, {
    margin_debt: 50,
    managed_value: 200,
  });
  assert.equal(model.assets, 500);
  assert.equal(model.net, 650);
  assert.equal(model.cashAndManaged, 300);
  assert.equal(model.pnl, 130);
  assert.equal(model.returnCovered, 3);
  assert.equal(model.allocations[0].symbol, "A");
  assert.equal(model.allocations[0].value, 300);
  assert.equal(model.allocations[0].weight, 75);
  assert.equal(
    model.groups.reduce((n, g) => n + g.weight, 0),
    100,
  );
});

test("mixed currencies never combine costs or quote currencies without an FX conversion", () => {
  const model = workspaceOverview(
    [
      position("A", { currency: "EUR" }),
      position("B"),
      position("EUR", { currency: "EUR", assetType: "cash" }),
    ],
    { A: row(80), B: row(100, { currency: "GBP" }) },
  );
  assert.equal(model.assets, 160);
  assert.equal(model.pnl, null);
  assert.equal(model.returnCovered, 0);
  assert.deepEqual(model.unpriced, ["B", "EUR"]);
  assert.equal(model.unknownCost, 1);
});

test("older usable prices remain visible and unclassified exposure stays explicit", () => {
  const model = workspaceOverview(
    [position("A"), position("BTC/USD", { assetType: "crypto" })],
    { A: { quote: row(50, { stale: true }).quote }, "BTC/USD": row(100) },
  );
  assert.equal(model.older, 1);
  assert.equal(model.groups.find((g) => g.name === "Unclassified").value, 100);
  assert.equal(model.groups.find((g) => g.name === "Crypto").value, 200);
  assert.deepEqual(model.unpriced, []);
});

test("invalid and nonfinite quantities or quotes cannot poison the summary", () => {
  const model = workspaceOverview(
    [
      position("A"),
      position("B", { quantity: NaN }),
      position("C", { quantity: -1 }),
    ],
    { A: row(Infinity), B: row(30), C: row(40) },
  );
  assert.equal(model.assets, 0);
  assert.equal(model.pnl, null);
  assert.deepEqual(model.unpriced, ["A", "B", "C"]);
});

test("historical repricing uses common supplied dates and current quantities, with no interpolation", () => {
  const result = portfolioHistory(
    [position("A"), position("A", { id: "lot2", quantity: 1 }), position("B")],
    { A: row(50), B: row(60) },
    {
      A: {
        candles: bars([
          ["2026-10-20", 40],
          ["2026-10-21", 45],
          ["2026-10-22", 50],
        ]),
        source: "A source",
      },
      B: {
        candles: bars([
          ["2026-10-20", 55],
          ["2026-10-22", 60],
        ]),
        source: "B source",
      },
    },
  );
  assert.deepEqual(result.points, [
    { time: "2026-10-20", value: 230 },
    { time: "2026-10-22", value: 270 },
  ]);
  assert.deepEqual(result.included, ["A", "B"]);
  assert.deepEqual(result.sources, ["A source", "B source"]);
});

test("historical chart reports missing and foreign histories without implying full portfolio coverage", () => {
  const result = portfolioHistory(
    [
      position("A"),
      position("B"),
      position("C"),
      position("USD", { assetType: "cash", quantity: 10 }),
    ],
    { A: row(50), B: row(60), C: row(70, { currency: "EUR" }) },
    {
      A: {
        candles: bars([
          ["2026-10-20", 40],
          ["2026-10-21", 45],
        ]),
        source: "Provider",
      },
      C: { candles: bars([["2026-10-20", 60]]), source: "Provider" },
    },
  );
  assert.deepEqual(result.excluded, ["B", "C"]);
  assert.deepEqual(
    result.points.map((p) => p.value),
    [80, 90],
  );
  assert.equal(result.complete, false);
  assert.deepEqual(portfolioHistory([], {}, {}).points, []);
});

test("historical charts reject invalid dates, nonfinite closes and future observations", () => {
  const result = portfolioHistory(
    [position("A")],
    { A: row(50) },
    {
      A: {
        candles: bars([
          ["bad", 10],
          ["2026-10-20", Infinity],
          ["2026-10-21", 30],
          ["2099-01-01", 99],
        ]),
        source: "Provider",
      },
    },
    "2026-10-26",
  );
  assert.deepEqual(result.points, [{ time: "2026-10-21", value: 60 }]);
});

test("research routes preserve preview scope and canonical crypto navigation", () => {
  assert.equal(
    researchLink("BTC/USD", "/preview"),
    "/preview/research/BTC-USD",
  );
  assert.equal(researchLink("BRK.B"), "/research/BRK.B");
});
