
import test from "node:test";import assert from "node:assert/strict";
import {calculatePortfolioIntelligence} from "../.engine-test/v65/portfolio.js";

test("mixed equity crypto cash portfolio is valued correctly and cash is not thesis-scored",()=>{
 const x=calculatePortfolioIntelligence([
  {assetType:"EQUITY",symbol:"APP",quantity:10,price:300,companyScore:85,action:"HOLD",sector:"Technology"},
  {assetType:"CRYPTO",symbol:"BTC/USD",quantity:.1,price:100000,action:"HOLD"},
  {assetType:"CASH",currency:"USD",amount:5000},
 ]);
 assert.equal(x.totalValue,18000);
 assert.equal(x.cashValue,5000);
 assert.equal(x.investedValue,13000);
 assert.equal(x.scorableHoldings,1);
 assert.ok(x.cashPct>27&&x.cashPct<28);
 assert.equal(x.assetAllocation.CASH,5000);
});
test("portfolio health has no arbitrary minimum floor",()=>{
 const x=calculatePortfolioIntelligence([{assetType:"EQUITY",symbol:"X",quantity:1,price:100,companyScore:15,action:"AVOID",sector:"One"}]);
 assert.ok(x.health.score<35);
 assert.ok(x.health.components.length>=4);
});
