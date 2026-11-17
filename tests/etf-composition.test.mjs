import test from "node:test";
import assert from "node:assert/strict";
import { etfComposition } from "../lib/etf-composition.ts";
test("ETF composition preserves dates, partial file, actual percentages and zero", () => {
  const m = etfComposition({
    asOfDate: "2026-11-01",
    partial: true,
    totalKnownHoldings: 100,
    holdings: [
      { ticker: "AAPL", name: "Apple", weightPct: 5.2, linkedTicker: "AAPL" },
      { ticker: "ZERO", name: "Zero", weightPct: 0 },
    ],
  });
  assert.equal(m.rows[0].cells[0].value, "5.20%");
  assert.equal(m.rows[1].cells[0].value, "0.00%");
  assert.equal(m.date, "2026-11-01");
  assert.equal(m.partial, true);
  assert.equal(m.totalKnown, 100);
});
test("foreign symbol collision never becomes an unrelated US stock link", () => {
  const m = etfComposition({
    holdings: [
      {
        ticker: "ROP",
        name: "Roche",
        exchange: "SIX",
        linkedTicker: null,
        weightPct: 2,
      },
      { ticker: "LOCAL", name: "Mapped", linkedTicker: "AAPL", weightPct: -1 },
    ],
  });
  assert.equal(m.rows[0].href, null);
  assert.equal(m.rows[1].href, "/research/AAPL");
  assert.equal(m.rows[1].cells[0].value, "Not supplied");
  assert.equal(m.rows[0].date, null);
});
