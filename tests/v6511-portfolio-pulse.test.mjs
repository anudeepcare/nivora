import test from "node:test";
import assert from "node:assert/strict";
import {calculatePortfolioPulse} from "../.engine-test/v65/portfolio.js";

test("Pulse produces immediate health, allocation, contribution and truthful history state",()=>{
 const pulse=calculatePortfolioPulse([
  {assetType:"EQUITY",symbol:"IREN",quantity:100,price:50,avgCost:40,thesisScore:72,companyScore:70,opportunityScore:64,action:"HOLD",sector:"Technology",archetype:"ai_infrastructure"},
  {assetType:"EQUITY",symbol:"APP",quantity:10,price:500,avgCost:400,thesisScore:82,companyScore:88,opportunityScore:74,action:"BUY",sector:"Technology",archetype:"growth"},
  {assetType:"CRYPTO",symbol:"BTC/USD",quantity:.1,price:100000,avgCost:80000,action:"HOLD"},
  {assetType:"CASH",currency:"USD",amount:5000}
 ],[]);
 assert.equal(pulse.totalValue,25000);
 assert.equal(pulse.history.mode,"TRACKING_STARTS_NOW");
 assert.equal(pulse.history.hasActualPerformance,false);
 assert.ok(pulse.health.score>=0&&pulse.health.score<=100);
 assert.equal(pulse.drivers[0].symbol,"BTC/USD");
 assert.ok(pulse.allocations.cryptoPct>0);
 assert.ok(pulse.actions.some(x=>x.portfolioAction==="ADD"&&x.symbol==="APP"));
});

test("Pulse does not call cost-basis return period performance",()=>{
 const pulse=calculatePortfolioPulse([{assetType:"EQUITY",symbol:"A",quantity:10,price:20,avgCost:10,action:"HOLD"}],[]);
 assert.equal(pulse.performance.actualReturnPct,null);
 assert.equal(pulse.performance.spyReturnPct,null);
 assert.equal(pulse.performance.qqqReturnPct,null);
});

test("Pulse marks snapshot history actual only when at least two dated snapshots exist",()=>{
 const pulse=calculatePortfolioPulse([{assetType:"CASH",currency:"USD",amount:100}],[
  {asOf:"2026-09-01",totalValue:100,spy:100,qqq:100},
  {asOf:"2026-09-04",totalValue:110,spy:102,qqq:103}
 ]);
 assert.equal(pulse.history.hasActualPerformance,true);
 assert.equal(pulse.performance.actualReturnPct,10);
 assert.equal(pulse.performance.spyReturnPct,2);
 assert.equal(pulse.performance.qqqReturnPct,3);
});
