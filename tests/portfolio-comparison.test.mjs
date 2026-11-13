import test from "node:test";
import assert from "node:assert/strict";
import { portfolioComparison } from "../lib/portfolio-comparison.ts";
import { portfolioHistory } from "../lib/approved-workspace.ts";
const points = [
  { time: "2026-07-01", value: 100 },
  { time: "2026-08-01", value: 110 },
  { time: "2026-09-01", value: 90 },
  { time: "2026-10-01", value: 120 },
];
const bars = (rows) => rows.map(([time, close]) => ({ time, close }));
const near = (value, expected) =>
  assert.ok(Math.abs(value - expected) < 1e-8, `${value} != ${expected}`);

test("comparison rebases both series on the same actual shared dates", () => {
  const result = portfolioComparison(
    points,
    bars([
      ["2026-07-01", 200],
      ["2026-09-01", 210],
      ["2026-10-01", 220],
    ]),
    "6M",
  );
  assert.equal(result.comparable, true);
  assert.deepEqual(
    result.points.map((p) => p.time),
    ["2026-07-01", "2026-09-01", "2026-10-01"],
  );
  assert.equal(result.points[0].holdings, 0);
  assert.equal(result.points[0].market, 0);
  near(result.points.at(-1).holdings, 20);
  near(result.points.at(-1).market, 10);
  near(result.excess, 10);
  assert.equal(result.points.at(-1).value, 120);
});

test("missing market history keeps real holdings history and never invents a second line", () => {
  const result = portfolioComparison(points, [], "6M");
  assert.equal(result.comparable, false);
  assert.equal(result.excess, null);
  assert.equal(result.points.length, 4);
  assert.ok(result.points.every((p) => p.market === null));
  near(result.points.at(-1).holdings, 20);
});

test("one shared observation cannot produce a comparison", () => {
  const result = portfolioComparison(points, bars([["2026-10-01", 220]]), "6M");
  assert.equal(result.comparable, false);
  assert.equal(result.points.length, 4);
  assert.equal(result.excess, null);
});

test("selected periods are calendar windows anchored to the latest supplied holding date", () => {
  const market = bars(points.map((p) => [p.time, p.value * 2]));
  const month = portfolioComparison(points, market, "1M");
  assert.deepEqual(
    month.points.map((p) => p.time),
    ["2026-09-01", "2026-10-01"],
  );
  near(month.points.at(-1).holdings, (120 / 90 - 1) * 100);
  assert.equal(portfolioComparison(points, market, "3M").points.length, 4);
});

test("bad dates and nonfinite or nonpositive prices never enter chart arithmetic", () => {
  const result = portfolioComparison(
    [
      ...points,
      { time: "2099-01-01", value: Infinity },
      { time: "bad", value: 10 },
    ],
    bars([
      ["2026-07-01", 0],
      ["2026-09-01", NaN],
      ["2026-10-01", 220],
      ["2026-02-30", 400],
    ]),
    "6M",
  );
  assert.equal(result.comparable, false);
  assert.equal(result.points.length, 4);
  assert.ok(result.points.every((p) => Number.isFinite(p.holdings)));
});

test("both series rebase at their shared start, not different start dates", () => {
  const result = portfolioComparison(
    points,
    bars([
      ["2026-08-01", 500],
      ["2026-10-01", 550],
    ]),
    "6M",
  );
  assert.equal(result.points[0].time, "2026-08-01");
  near(result.points.at(-1).holdings, (120 / 110 - 1) * 100);
  near(result.points.at(-1).market, 10);
});

test("no usable holdings cannot show benchmark-only performance", () => {
  const result = portfolioComparison(
    [],
    bars([
      ["2026-07-01", 500],
      ["2026-10-01", 550],
    ]),
    "6M",
  );
  assert.deepEqual(result.points, []);
  assert.equal(result.comparable, false);
  assert.equal(result.excess, null);
});

test("chart can request six months of observations while old callers retain the sixty-date limit", () => {
  const candles = Array.from({ length: 170 }, (_, i) => ({
    time: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
    close: 100 + i,
  }));
  const positions = [{ symbol: "A", quantity: 1, assetType: "stock" }];
  const quotes = { A: { quote: { currency: "USD" } } };
  const history = { A: { candles, source: "Test observations" } };
  assert.equal(
    portfolioHistory(positions, quotes, history, "2026-11-13").points.length,
    60,
  );
  assert.equal(
    portfolioHistory(positions, quotes, history, "2026-11-13", 190).points
      .length,
    170,
  );
});

test("calendar windows clamp the start to the last real date of a shorter month", () => {
  const data = [
    { time: "2026-02-28", value: 100 },
    { time: "2026-03-02", value: 110 },
    { time: "2026-03-31", value: 120 },
  ];
  const result = portfolioComparison(
    data,
    bars(data.map((p) => [p.time, p.value])),
    "1M",
  );
  assert.equal(result.points[0].time, "2026-02-28");
});

test("declining holdings retain their signed loss against a rising selected market", () => {
  const result = portfolioComparison(
    [
      { time: "2026-07-01", value: 100 },
      { time: "2026-10-01", value: 80 },
    ],
    bars([
      ["2026-07-01", 400],
      ["2026-10-01", 440],
    ]),
    "6M",
  );
  near(result.points.at(-1).holdings, -20);
  near(result.points.at(-1).market, 10);
  near(result.excess, -30);
});
