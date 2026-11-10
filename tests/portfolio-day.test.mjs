import test from "node:test";
import assert from "node:assert/strict";
import { portfolioDay } from "../lib/portfolio-day.ts";

const NOW = Date.parse("2026-11-09T22:00:00Z");
const q = (price, changePct, extra = {}) => ({ quote: { price, changePct, currency: "USD", asOf: "2026-11-09T21:00:00Z", session: "closed", source: "t", stale: false, ...extra } });
const pos = (symbol, quantity, assetType = "stock") => ({ id: symbol + quantity, symbol, quantity, cost: 1, assetType });

test("session move is the value-weighted sum of each holding's own quote change", () => {
  const d = portfolioDay([pos("A", 10), pos("B", 5)], { A: q(110, 10), B: q(90, -10) }, NOW);
  assert.equal(d.value, 1550);
  assert.ok(Math.abs(d.move - (100 - 50)) < 1e-9);
  assert.ok(Math.abs(d.movePct - (50 / 1500) * 100) < 1e-9);
  assert.deepEqual(d.gainers.map((m) => m.symbol), ["A"]);
  assert.deepEqual(d.decliners.map((m) => m.symbol), ["B"]);
  assert.equal(d.covered, 2);
});

test("old, undated, future, non-USD and change-less quotes are counted but never assumed flat", () => {
  const d = portfolioDay(
    [pos("A", 1), pos("LATE", 2), pos("OLD", 1), pos("NOCHG", 1), pos("EUR", 1), pos("FUT", 1), pos("NONE", 1), pos("CASH", 500, "cash"), pos("WEEK", 1)],
    {
      A: q(102, 2),
      OLD: q(50, 5, { asOf: null }),
      LATE: q(40, 5, { stale: true }),
      NOCHG: q(20, null),
      EUR: q(30, 3, { currency: "EUR" }),
      FUT: q(10, 1, { asOf: "2026-11-10T22:00:00Z" }),
      WEEK: q(10, 1, { asOf: "2026-11-01T21:00:00Z" }),
    },
    NOW,
  );
  assert.equal(d.holdings, 8);
  assert.equal(d.priced, 6);
  assert.equal(d.value, 102 + 80 + 50 + 20 + 10 + 10);
  // A minutes-stale display flag does not erase that session's dated change.
  assert.equal(d.covered, 2);
  const late = 80 - 80 / 1.05;
  assert.ok(Math.abs(d.move - (2 + late)) < 1e-9);
  assert.ok(Math.abs(d.movePct - ((2 + late) / (100 + 80 / 1.05)) * 100) < 1e-9);
  assert.equal(d.asOf, "2026-11-09T21:00:00.000Z");
});

test("no qualifying change yields null rather than zero, and lots of one symbol combine", () => {
  const none = portfolioDay([pos("A", 1)], { A: q(10, null) }, NOW);
  assert.equal(none.move, null);
  assert.equal(none.movePct, null);
  assert.equal(none.priced, 1);
  const lots = portfolioDay([pos("A", 1), pos("A", 3)], { A: q(10, 25) }, NOW);
  assert.equal(lots.holdings, 1);
  assert.ok(Math.abs(lots.move - 8) < 1e-9);
  assert.equal(portfolioDay([], {}, NOW).priced, 0);
  const many = portfolioDay(["A", "B", "C", "D", "E"].map((s) => pos(s, 1)), Object.fromEntries(["A", "B", "C", "D", "E"].map((s, i) => [s, q(100, i + 1)])), NOW);
  assert.deepEqual(many.gainers.map((m) => m.symbol), ["E", "D", "C"]);
});
