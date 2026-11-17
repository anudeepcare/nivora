import test from "node:test";
import assert from "node:assert/strict";
import {
  cleanPaperPlan,
  paperChecks,
  terminalPaperStatus,
} from "../lib/paper-policy.ts";
const p = {
  symbol: "MSFT",
  side: "buy",
  quantity: 2,
  limitPrice: 100,
  maxPositionPct: 20,
  minimumCash: 100,
  enabled: true,
};
const s = {
  marketOpen: true,
  tradable: true,
  accountActive: true,
  cash: 1000,
  equity: 10000,
  heldQuantity: 3,
  heldValue: 300,
  price: 100,
  quoteAt: "2026-10-16T15:30:00Z",
  now: "2026-10-16T15:35:00Z",
  openOrders: 0,
};
test("paper plans reject fractional, foreign and invalid exposure inputs", () => {
  assert.deepEqual(cleanPaperPlan(p), p);
  for (const b of [
    { ...p, quantity: 0.5 },
    { ...p, symbol: "BTC/USD" },
    { ...p, maxPositionPct: 90 },
    { ...p, side: "short" },
  ])
    assert.throws(() => cleanPaperPlan(b));
});
test("paper checks fail closed on stale quotes, funds, open orders and market state", () => {
  assert.equal(paperChecks(p, s).allowed, true);
  for (const override of [
    { cash: 250 },
    { marketOpen: false },
    { quoteAt: "2026-10-15T15:30:00Z" },
    { openOrders: 1 },
    { price: 150 },
    { equity: NaN },
    { heldValue: 1999 },
    { accountActive: false },
  ])
    assert.equal(
      paperChecks(p, { ...s, ...override }).allowed,
      false,
      JSON.stringify(override),
    );
  assert.equal(
    paperChecks({ ...p, side: "sell", quantity: 4 }, s).allowed,
    false,
  );
});
test("partial fills remain reserved until terminal broker reconciliation", () => {
  assert.equal(terminalPaperStatus("partially_filled"), false);
  assert.equal(terminalPaperStatus("pending_cancel"), false);
  assert.equal(terminalPaperStatus("filled"), true);
});
test("a reservation revalidates changed account state before any order can submit", async () => {
  const { afterPaperClaim } = await import("../lib/paper-policy.ts");
  let cash = 1000,
    submitted = false,
    blocked = false;
  await afterPaperClaim(
    async () => {
      cash = 100;
      return { id: "run" };
    },
    async () => paperChecks(p, { ...s, cash }),
    async () => {
      submitted = true;
    },
    async () => {
      blocked = true;
    },
  );
  assert.equal(submitted, false);
  assert.equal(blocked, true);
});
