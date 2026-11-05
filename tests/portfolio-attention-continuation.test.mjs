import test from "node:test";
import assert from "node:assert/strict";
import { sourceModule } from "./helpers/provider-fixture.mjs";
function api() {
  let m;
  try {
    m = sourceModule("lib/portfolio-attention.ts");
  } catch {}
  assert.ok(m, "attention model exists");
  return m;
}
test("concentration uses valid USD investments and only a user chosen threshold", () => {
  const { portfolioAttention } = api();
  const positions = [
    { symbol: "A", assetType: "stock", quantity: 1 },
    { symbol: "B", assetType: "stock", quantity: 3 },
  ];
  const q = {
    A: { quote: { price: 100, currency: "USD" } },
    B: { quote: { price: 100, currency: "USD" } },
  };
  assert.equal(portfolioAttention(positions, q, null).concentrated.length, 0);
  assert.deepEqual(
    portfolioAttention(positions, q, 30).concentrated.map((x) => x.symbol),
    ["B"],
  );
});
test("missing or foreign prices do not become a zero price or complete coverage", () => {
  const { portfolioAttention } = api();
  const x = portfolioAttention(
    [
      { symbol: "A", assetType: "stock", quantity: 1 },
      { symbol: "B", assetType: "stock", quantity: 1 },
    ],
    { A: { quote: { price: 100, currency: "EUR" } } },
    20,
  );
  assert.equal(x.missing.length, 2);
  assert.equal(x.complete, false);
  assert.equal(x.concentrated.length, 0);
});
