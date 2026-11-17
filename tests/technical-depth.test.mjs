import test from "node:test";
import assert from "node:assert/strict";
import {
  fibOverlay,
  trendMarkers,
  correlation,
} from "../lib/technical-depth.ts";
test("Fibonacci overlays expose explicit endpoints, percentages and custom levels", () => {
  const f = fibOverlay(50, 100, true);
  assert.equal(f.find((x) => x.ratio === 0.5).price, 75);
  assert.equal(f.find((x) => x.ratio === 1.618).price, 130.9);
  assert.equal(f.find((x) => x.ratio === 0.686).kind, "custom");
  assert.deepEqual(fibOverlay(100, 50), []);
});
test("trend markers are known on the completed signal bar and cannot repaint", () => {
  const bars = Array.from({ length: 230 }, (_, i) => ({
    time: new Date(Date.UTC(2025, 0, i + 1)).toISOString().slice(0, 10),
    open: 100,
    high: 101,
    low: 99,
    close: i < 210 ? 100 : 120,
    volume: 100,
  }));
  const before = trendMarkers(bars.slice(0, 215), "2026-01-01"),
    after = trendMarkers(bars, "2026-01-01");
  assert.deepEqual(
    after.filter((x) => x.time <= bars[214].time),
    before,
  );
  assert.ok(before.length);
});
test("correlation uses matched dates and sufficient return history", () => {
  const a = Array.from({ length: 80 }, (_, i) => ({
    time: new Date(Date.UTC(2025, 0, i + 1)).toISOString().slice(0, 10),
    close: 100 + i + (i % 3),
  }));
  assert.ok(correlation(a, a) > 0.999);
  assert.equal(correlation(a.slice(0, 10), a), null);
});
