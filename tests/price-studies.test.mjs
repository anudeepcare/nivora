import test from "node:test";
import assert from "node:assert/strict";
import { priceStudies } from "../lib/price-studies.ts";
const bars = (values) =>
  values.map((close, i) => ({
    time: new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10),
    open: close,
    high: close,
    low: close,
    close,
    volume: 10,
  }));
test("flat closes give flat EMA/bands and zero MACD without NaN", () => {
  const s = priceStudies(bars(Array(40).fill(100)), "2026-01-01");
  assert.equal(s.ema20, 100);
  assert.equal(s.macd, 0);
  assert.equal(s.signal, 0);
  assert.equal(s.histogram, 0);
  assert.deepEqual(s.bands, { low: 100, mid: 100, high: 100 });
});
test("MACD uses mean-seeded 12/26 EMAs and a nine-observation signal", () => {
  const s = priceStudies(
    bars(Array.from({ length: 40 }, (_, i) => i + 1)),
    "2026-01-01",
  );
  assert.ok(Math.abs(s.macd - 7) < 1e-10);
  assert.ok(Math.abs(s.signal - 7) < 1e-10);
  assert.ok(Math.abs(s.histogram) < 1e-10);
  assert.equal(s.bands.mid, 30.5);
  assert.ok(Math.abs(s.bands.high - (30.5 + 2 * Math.sqrt(33.25))) < 1e-10);
});
test("short history and forming daily bars do not manufacture indicators", () => {
  const history = bars(Array(25).fill(100));
  const s = priceStudies(
    [...history, { ...history.at(-1), time: "2026-01-01", close: 10000 }],
    "2026-01-01",
  );
  assert.equal(s.macd, null);
  assert.equal(s.signal, null);
  assert.equal(s.ema20, 100);
  assert.deepEqual(
    priceStudies(history.slice(0, 10), "2026-01-01").bands,
    null,
  );
});
