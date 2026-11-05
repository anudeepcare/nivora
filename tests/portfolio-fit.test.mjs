import test from "node:test";
import assert from "node:assert/strict";
import { positionFit } from "../lib/position-fit.ts";
const p = [
  { symbol: "APP", quantity: 10, assetType: "stock" },
  { symbol: "MSFT", quantity: 10, assetType: "stock" },
];
const q = {
  APP: { price: 100, currency: "USD", asOf: "2026-11-04" },
  MSFT: { price: 400, currency: "USD", asOf: "2026-11-04" },
};
test("position cap uses complete investment value and external cash addition", () => {
  const x = positionFit(p, q, "APP", 20, 500, Date.parse("2026-11-05"));
  assert.equal(x.currentWeight, 20);
  assert.equal(x.atLimit, true);
  assert.equal(x.afterWeight, (1500 / 5500) * 100);
});
test("partial or old portfolio quotes never clear a position for adding", () => {
  assert.equal(
    positionFit(p, { APP: q.APP }, "APP", 30, 0, Date.parse("2026-11-05"))
      .complete,
    false,
  );
  assert.equal(
    positionFit(p, q, "APP", 30, 0, Date.parse("2026-12-05")).complete,
    false,
  );
});
test('class-share aliases preserve owned value and threshold',()=>{const x=positionFit([{symbol:'BRK.B',quantity:2,assetType:'stock'}],{'BRK-B':{price:400,currency:'USD',asOf:'2026-11-04'}},'BRK-B',20,0,Date.parse('2026-11-05'));assert.equal(x.currentWeight,100);assert.equal(x.atLimit,true)});
