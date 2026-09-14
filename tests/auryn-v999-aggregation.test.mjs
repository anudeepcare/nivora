
import test from "node:test";import assert from "node:assert/strict";
const {aggregatePortfolioLots}=await import("../.engine-test/auryn/portfolio-lots.js");
test("same symbol across brokers aggregates quantity and weighted average without losing lots",()=>{
 const x=aggregatePortfolioLots([
  {id:"r",symbol:"IREN",account_name:"Robinhood",shares:2400,avg_cost:44.74,asset_type:"EQUITY"},
  {id:"m",symbol:"IREN",account_name:"Moomoo",shares:300,avg_cost:49.39,asset_type:"EQUITY"}
 ]);
 assert.equal(x.length,1);assert.equal(x[0].shares,2700);assert.equal(x[0].accountLots.length,2);
 assert.equal(x[0].avg_cost,45.25666666666667);
});
