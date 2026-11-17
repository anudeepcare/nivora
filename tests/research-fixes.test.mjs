import test from "node:test";
import assert from "node:assert/strict";
import { normalizePositions } from "../lib/workspace.ts";
import { symbolInput } from "../lib/format.ts";
import { modelCoverage } from "../lib/research-depth.ts";
test("Bitcoin and Ethereum input aliases resolve to USD crypto pairs", () => {
  for (const s of ["BTCUSD", "BTC-USD", "Bitcoin"])
    assert.equal(symbolInput(s), "BTC/USD");
  for (const s of ["ETHUSD", "ETH-USD", "Ethereum"])
    assert.equal(symbolInput(s), "ETH/USD");
  assert.equal(symbolInput("SAP"), "SAP");
  assert.equal(symbolInput("ETHA"), "ETHA");
  assert.equal(symbolInput("BRK.B"), "BRK.B");
});
test("Nu uses bank research economics, not a generic cash-flow valuation", () => {
  assert.equal(modelCoverage("NU", "stock").family, "financial");
});

test("ambiguous stock symbols remain distinct from crypto pairs", () => {
  assert.equal(symbolInput("BTC"), "BTC");
  assert.equal(symbolInput("ETH"), "ETH");
});

test("legacy crypto symbols use their saved asset type without relabeling equity holdings", () => {
  const rows = normalizePositions([
    { id: "a", symbol: "BTC", asset_type: "CRYPTO", shares: 1, avg_cost: 2 },
    { id: "b", symbol: "BTC", asset_type: "EQUITY", shares: 1, avg_cost: 2 },
  ]);
  assert.equal(rows[0].symbol, "BTC/USD");
  assert.equal(rows[1].symbol, "BTC");
});
