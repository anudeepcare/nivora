import test from "node:test";
import assert from "node:assert/strict";
import { portfolioRange } from "../lib/portfolio-range.ts";

const days = (n) => {
  const out = [];
  for (let i = 0; out.length < n; i++) {
    const d = new Date(Date.UTC(2026, 0, 5 + i));
    if (![0, 6].includes(d.getUTCDay())) out.push(d.toISOString().slice(0, 10));
  }
  return out;
};
const series = (dates, f) => ({ source: "test", candles: dates.map((time, i) => ({ time, open: f(i), high: f(i), low: f(i), close: f(i), volume: 1 })) });
const quote = (price, currency = "USD") => ({ quote: { price, currency, changePct: 0, asOf: "2026-07-01T20:00:00Z", session: "closed", source: "t", stale: false } });
const pos = (symbol, quantity, assetType = "stock") => ({ id: symbol, symbol, quantity, cost: 1, assetType });
const AS_OF = "2027-01-01";

test("a steadily compounding basket gives the hand-calculated horizon return with no invented spread", () => {
  const d = days(120);
  const r = portfolioRange([pos("A", 10)], { A: quote(100 * 1.001 ** 119) }, { A: series(d, (i) => 100 * 1.001 ** i) }, AS_OF);
  assert.equal(r.available, true);
  assert.equal(r.horizon, 21);
  assert.equal(r.samples, 99);
  for (const c of r.cases) assert.ok(Math.abs(c.change - (1.001 ** 21 - 1) * 100) < 1e-6);
  assert.ok(r.volatility < 1e-6 && r.drawdown < 1e-9);
  assert.ok(Math.abs(r.reference - 10 * 100 * 1.001 ** 119) < 1e-6);
});

test("offsetting holdings produce a narrower range than either alone and risk shares sum to 100%", () => {
  const d = days(126);
  const up = (i) => 100 * (1 + 0.08 * Math.sin(i / 3)), down = (i) => 100 * (1 - 0.08 * Math.sin(i / 3));
  const quotes = { A: quote(up(125)), B: quote(down(125)) };
  const history = { A: series(d, up), B: series(d, down) };
  const both = portfolioRange([pos("A", 1), pos("B", 1)], quotes, history, AS_OF);
  const alone = portfolioRange([pos("A", 1)], quotes, history, AS_OF);
  const width = (r) => r.cases[2].change - r.cases[0].change;
  assert.ok(width(both) < width(alone) / 100);
  assert.ok(both.volatility < alone.volatility / 100);
  const mixed = portfolioRange([pos("A", 3), pos("B", 1)], quotes, history, AS_OF);
  assert.ok(Math.abs(mixed.drivers.reduce((a, x) => a + x.riskShare, 0) - 100) < 1e-6);
  assert.ok(Math.abs(mixed.drivers.reduce((a, x) => a + x.weight, 0) - 100) < 1e-6);
  assert.equal(mixed.drivers[0].symbol, "A");
  assert.ok(mixed.drivers[0].riskShare > 100 && mixed.drivers[1].riskShare < 0);
  assert.ok(mixed.cases[0].value < mixed.cases[1].value && mixed.cases[1].value < mixed.cases[2].value);
});

test("a recently listed holding is excluded instead of erasing everyone else's history", () => {
  const d = days(126);
  const r = portfolioRange(
    [pos("A", 5), pos("NEW", 5), pos("CASH", 1000, "cash"), pos("EUR", 5), pos("NOPRICE", 5)],
    { A: quote(110), NEW: quote(20), EUR: quote(30, "EUR"), NOPRICE: {} },
    { A: series(d, (i) => 100 + 10 * Math.sin(i / 5)), NEW: series(d.slice(-12), (i) => 20 + i), EUR: series(d, () => 30) },
    AS_OF,
  );
  assert.equal(r.available, true);
  assert.deepEqual(r.included, ["A"]);
  assert.deepEqual([...r.excluded].sort(), ["EUR", "NEW", "NOPRICE"]);
  assert.ok(Math.abs(r.coverage - (550 / 650) * 100) < 1e-9);
  assert.equal(r.reference, 550);
});

test("short, future-dated or invalid history cannot manufacture a range, and duplicate lots combine", () => {
  const d = days(126);
  const f = (i) => 50 + 5 * Math.sin(i / 4);
  assert.equal(portfolioRange([pos("A", 1)], { A: quote(50) }, { A: series(d.slice(0, 30), f) }, AS_OF).available, false);
  assert.equal(portfolioRange([pos("A", 1)], { A: quote(50) }, { A: series(d, f) }, "2025-01-01").available, false);
  assert.equal(portfolioRange([pos("A", 1)], { A: quote(50) }, {}, AS_OF).available, false);
  assert.equal(portfolioRange([], {}, {}, AS_OF).available, false);
  const mid = portfolioRange([pos("A", 1)], { A: quote(50) }, { A: series(d.slice(0, 52), f) }, AS_OF);
  assert.equal(mid.available && mid.horizon, 10);
  const lots = portfolioRange([pos("A", 1), { ...pos("A", 2), id: "A2" }], { A: quote(50) }, { A: series(d, f) }, AS_OF);
  assert.equal(lots.reference, 150);
  const bad = series(d, f);
  bad.candles[60].close = NaN;
  const cleaned = portfolioRange([pos("A", 1)], { A: quote(50) }, { A: bad }, AS_OF);
  assert.equal(cleaned.available, true);
  assert.ok(cleaned.cases.every((c) => Number.isFinite(c.value)));
});
