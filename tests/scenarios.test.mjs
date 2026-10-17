import test from "node:test";
import assert from "node:assert/strict";
import { operatingScenario, bankScenario } from "../lib/scenarios.ts";
test("operating scenarios use unit economics, funding claims and dilution before market price", () => {
  const x = {
    capacity: 100,
    revenuePerUnit: 10,
    utilization: 50,
    fcfMargin: 20,
    years: 5,
    multiple: 15,
    netDebt: 100,
    shares: 100,
    dilution: 2,
    discount: 10,
  };
  const a = operatingScenario(x);
  assert.equal(a.revenue, 500);
  assert.equal(a.fcf, 100);
  assert.ok(a.perShare > 0);
  assert.ok(operatingScenario({ ...x, netDebt: 200 }).perShare < a.perShare);
  assert.equal(operatingScenario({ ...x, shares: 0 }), null);
});
test("bank model rejects invalid terminal assumptions and shows zero residual value when economics do not cover growth", () => {
  assert.equal(bankScenario(20, 12, 10, 3).value, (20 * (12 - 3)) / (10 - 3));
  assert.equal(bankScenario(20, 12, 3, 3), null);
  assert.equal(bankScenario(20, 2, 10, 3), null);
});
