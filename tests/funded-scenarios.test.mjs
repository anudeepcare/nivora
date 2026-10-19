import test from "node:test";
import assert from "node:assert/strict";
import { fundedScenario } from "../lib/funded-scenarios.ts";
const base = {
  startRevenue: 100,
  terminalRevenue: 200,
  years: 2,
  cash: 10,
  debt: 20,
  shares: 10,
  ocfMargin: 20,
  ebitdaMargin: 25,
  totalCapex: 30,
  newDebt: 0,
  equityRaised: 0,
  issuePrice: 10,
  annualDilution: 0,
  debtRate: 10,
  exitEbitdaMultiple: 10,
  discountRate: 10,
};
test("funded scenario reconciles cumulative cash, ending debt and discounted equity", () => {
  const r = fundedScenario(base);
  assert.equal(r.available, true);
  const operating = (Math.sqrt(20000) + 200) * 0.2;
  assert(Math.abs(r.endingCash - (10 + operating - 30)) < 1e-10);
  const terminal = (200 * 0.25 * 10 - 20 + r.endingCash) / 10;
  assert(Math.abs(r.terminalPrice - terminal) < 1e-10);
  assert(Math.abs(r.presentValue - terminal / 1.1 ** 2) < 1e-10);
});
test("unfunded expansion never produces a per-share valuation", () => {
  const r = fundedScenario({ ...base, totalCapex: 200 });
  assert.equal(r.available, false);
  assert.equal(r.code, "funding-gap");
  assert(r.fundingGap > 0);
});
test("equity financing closes the funding gap and increases share count", () => {
  const r = fundedScenario({ ...base, totalCapex: 200, equityRaised: 150 });
  assert.equal(r.available, true);
  assert.equal(r.endingShares, 25);
});
test("debt funding includes interest cash use and terminal debt claims", () => {
  const r = fundedScenario({ ...base, newDebt: 100 });
  assert.equal(r.available, true);
  assert.equal(r.endingDebt, 120);
  assert.equal(r.newDebtInterest, 20);
});
test("dilution and required return reduce present per-share value", () => {
  assert(
    fundedScenario({ ...base, annualDilution: 5 }).presentValue <
      fundedScenario(base).presentValue,
  );
  assert(
    fundedScenario({ ...base, discountRate: 20 }).presentValue <
      fundedScenario(base).presentValue,
  );
});
test("invalid, nonfinite and economically unsupported inputs fail closed", () => {
  for (const patch of [
    { years: 0 },
    { years: 1.5 },
    { shares: 0 },
    { issuePrice: 0 },
    { exitEbitdaMultiple: -1 },
    { ebitdaMargin: -5 },
    { cash: NaN },
    { annualDilution: -1 },
    { discountRate: 0 },
  ])
    assert.equal(fundedScenario({ ...base, ...patch }).available, false);
});

test('a later cash recovery does not conceal an unfunded first year',()=>{
 const r=fundedScenario({...base,startRevenue:10,terminalRevenue:100,cash:0,ocfMargin:100,totalCapex:100});
 assert.equal(r.available,false);assert.equal(r.code,'funding-gap');assert.match(r.reason,/year 1/);
});
