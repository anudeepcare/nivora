
import test from "node:test";import assert from "node:assert/strict";
import {buildBacktestReport} from "../.engine-test/nivora-backtest-report.js";

test("backtest reports BUY performance separately from overall model scores",()=>{
 const rows=[
  {score:80,alphaPct:8,archetype:"compounder",regime:"Bull",action:"BUY",buyPath:"QUALITY_COMPOUNDER",buyTier:"STARTER"},
  {score:78,alphaPct:5,archetype:"compounder",regime:"Bull",action:"BUY",buyPath:"QUALITY_COMPOUNDER",buyTier:"CONFIRMED"},
  {score:75,alphaPct:-2,archetype:"cyclical",regime:"Sideways",action:"BUY",buyPath:"CYCLICAL_VALUE",buyTier:"STARTER"},
  {score:70,alphaPct:1,archetype:"general",regime:"Bull",action:"WAIT",buyPath:null,buyTier:null}
 ];
 const r=buildBacktestReport(rows,2);
 assert.equal(r.buySignals.n,3);
 assert.equal(r.buySignals.hitRatePct,66.7);
 assert.ok(r.buySignals.avgAlphaPct>0);
 assert.ok(r.buySignals.alphaConfidence95);
 assert.ok(r.byBuyPath.some(x=>x.path==="QUALITY_COMPOUNDER"&&x.n===2));
});
test("backtest never calls a BUY cohort proven when its alpha interval includes zero",()=>{
 const rows=Array.from({length:40},(_,i)=>({score:75,alphaPct:i%2?2:-2,archetype:"general",regime:"Mixed",action:"BUY",buyPath:"BALANCED_STANDARD",buyTier:"STARTER"}));
 const r=buildBacktestReport(rows,30);
 assert.equal(r.buySignals.evidenceStatus,"UNPROVEN");
});
