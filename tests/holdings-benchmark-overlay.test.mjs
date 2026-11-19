import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { holdingsBenchmarkOverlay } from "../lib/holdings-benchmark-overlay.ts";
const basket = [
  { time: "2026-11-02", value: 1000 },
  { time: "2026-11-03", value: 1100 },
];
test("price-only benchmark is rebased to basket start on identical dates", () => {
  assert.deepEqual(
    holdingsBenchmarkOverlay(basket, [
      { time: "2026-11-02", close: 200 },
      { time: "2026-11-03", close: 210 },
    ]),
    [
      { time: "2026-11-02", value: 1000 },
      { time: "2026-11-03", value: 1050 },
    ],
  );
});
test("missing, duplicate, invalid and mismatched dates withhold whole line, no latest extrapolation", () => {
  for (const bars of [
    [],
    [{ time: "2026-11-02", close: 200 }],
    [
      { time: "2026-11-02", close: 200 },
      { time: "2026-11-03", close: 0 },
    ],
    [
      { time: "2026-11-02", close: 200 },
      { time: "2026-11-02", close: 210 },
      { time: "2026-11-03", close: 220 },
    ],
  ])
    assert.deepEqual(holdingsBenchmarkOverlay(basket, bars), []);
});

import fs from "node:fs";
test("compact chart requests only two added histories through existing guarded cache and keeps full shared domain", () => {
  const s = fs.readFileSync("components/ApprovedPortfolioChart.tsx", "utf8");
  assert.match(s, /showBenchmarks = compact/);
  assert.match(s, /showBenchmarks && symbols.length \? \["SPY", "QQQ"\]/);
  assert.match(s, /history\[symbol\]\?\.candles \?\? \[\]/);
  assert.match(s, /overlays.flatMap/);
  assert.match(s, /rebased:/);
  assert.match(s, /matching dated closes unavailable/);
  assert.match(
    fs.readFileSync("components/AccountHistory.tsx", "utf8"),
    /Not actual account performance/,
  );
});

test("portfolio chart summarizes matching dates and percentage price movements in its legend", () => {
  const source = readFileSync(
    new URL("../components/ApprovedPortfolioChart.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, />Price changes</);
  assert.match(source, /dateLabel\(chart.points\[0\].time\)/);
  assert.match(source, /dateLabel\(chart.points.at\(-1\)!\.time\)/);
  assert.match(source, /priceMove\(chart.points\)/);
  assert.match(source, /priceMove\(b.points\)/);
});

test("comparison gap uses the exact same endpoints and signed percentage points", async () => {
  const { priceChangeGap } = await import(
    "../lib/holdings-benchmark-overlay.ts"
  );
  const spy = [
    { time: "2026-11-02", value: 1000 },
    { time: "2026-11-03", value: 1040 },
  ];
  assert.ok(Math.abs(priceChangeGap(basket, spy) - 6) < 1e-9);
  assert.ok(Math.abs(priceChangeGap(spy, basket) + 6) < 1e-9);
  assert.equal(
    priceChangeGap(basket, [{ ...spy[0] }, { ...spy[1], time: "2026-11-04" }]),
    null,
  );
  assert.equal(
    priceChangeGap(basket, [{ ...spy[0], value: 0 }, { ...spy[1] }]),
    null,
  );
});
