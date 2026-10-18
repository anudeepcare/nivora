import test from "node:test";
import assert from "node:assert/strict";
const m = await import("../lib/technical-expanded.ts").catch(() => null);
const bars = Array.from({ length: 80 }, (_, i) => ({
  time: new Date(Date.UTC(2026, 0, i + 1)).toISOString().slice(0, 10),
  open: 100 + i,
  high: 102 + i,
  low: 99 + i,
  close: 101 + i,
  volume: 1000,
}));
test("expanded technicals use completed bars, Wilder ADX and bounded momentum", () => {
  assert.ok(m, "Expanded technicals must exist");
  const r = m.expandedStudies(bars, "2026-04-01");
  assert.ok(Math.abs(r.adx - 100) < 1e-8);
  assert.equal(r.obv, 79000);
  assert.equal(r.relativeVolume, 1);
  assert.equal(r.atr, 3);
  const current = {
    ...bars.at(-1),
    time: "2026-04-01",
    close: 10000,
    high: 10001,
  };
  assert.deepEqual(m.expandedStudies([...bars, current], "2026-04-01"), r);
});
test("short and flat histories do not fabricate strength or relative performance", () => {
  assert.ok(m);
  assert.equal(m.expandedStudies(bars.slice(0, 10), "2026-04-01").adx, null);
  const flat = bars.map((x) => ({
    ...x,
    open: 100,
    high: 100,
    low: 100,
    close: 100,
  }));
  const r = m.expandedStudies(flat, "2026-04-01");
  assert.equal(r.adx, 0);
  assert.equal(r.atr, 0);
  assert.equal(r.percentB, null);
  assert.equal(r.relativeReturn, null);
});

test("stochastic, directional movement and 20-session momentum use completed observations", () => {
  const r = m.expandedStudies(bars, "2026-04-01");
  assert.ok(Math.abs(r.stochasticK - 93.75) < 1e-8);
  assert.ok(Math.abs(r.stochasticD - 93.75) < 1e-8);
  assert.ok(Math.abs(r.roc20 - 12.5) < 1e-8);
  assert.ok(Math.abs(r.plusDI - 100 / 3) < 1e-8);
  assert.equal(r.minusDI, 0);
  const short = m.expandedStudies(bars.slice(0, 10), "2026-04-01");
  assert.equal(short.stochasticK, null);
  assert.equal(short.roc20, null);
});
