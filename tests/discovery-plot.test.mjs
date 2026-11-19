import test from "node:test";
import assert from "node:assert/strict";
import { discoveryPlot } from "../lib/discovery-plot.ts";
test("discovery coordinates preserve real percentages, missing observations are omitted", () => {
  const p = discoveryPlot([
    { symbol: "A", growth: 20, cash: 30, revenue: 100, pace: "P3" },
    { symbol: "B", growth: null, cash: 0, revenue: 100, pace: "unavailable" },
    { symbol: "C", growth: -10, cash: -10, revenue: 100, pace: "P0" },
  ]);
  assert.equal(p.omitted, 1);
  assert.equal(p.points[0].margin, 30);
  assert.equal(p.points[1].margin, -10);
  assert.ok(
    p.points.every((r) => r.x >= 10 && r.x <= 90 && r.y >= 15 && r.y <= 85),
  );
});
test("flat or invalid data does not fabricate points or divide by zero", () => {
  assert.equal(
    discoveryPlot([{ symbol: "A", growth: 0, cash: 0, revenue: 0, pace: "P1" }])
      .points.length,
    0,
  );
  const p = discoveryPlot([
    { symbol: "A", growth: 0, cash: 0, revenue: 10, pace: "P1" },
  ]);
  assert.equal(p.points[0].x, 50);
  assert.equal(p.points[0].y, 50);
});
