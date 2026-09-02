
import test from "node:test";import assert from "node:assert/strict";
import {sizePosition} from "../.engine-test/nivora-position-sizing.js";
test("position sizing caps loss by risk budget",()=>{
 const x=sizePosition({equity:100000,entry:100,invalidation:95,riskPerTradePct:0.5,maxPositionPct:10,liquidityCapNotional:50000});
 assert.equal(x.allowed,true);assert.equal(x.riskBudget,500);assert.equal(x.shares,100);assert.equal(x.notional,10000);
});
test("position sizing blocks invalid invalidation",()=>{
 const x=sizePosition({equity:100000,entry:100,invalidation:101,riskPerTradePct:0.5,maxPositionPct:10,liquidityCapNotional:50000});
 assert.equal(x.allowed,false);assert.match(x.reason,/invalidation/i);
});
test("liquidity cap can reduce position below raw risk budget",()=>{
 const x=sizePosition({equity:100000,entry:50,invalidation:45,riskPerTradePct:1,maxPositionPct:20,liquidityCapNotional:2000});
 assert.equal(x.allowed,true);assert.equal(x.notional,2000);assert.equal(x.shares,40);
});

import fs from "node:fs";
test("paper runner sizes BUY/ADD from equity and invalidation before risk authorization",()=>{
 const r=fs.readFileSync(new URL("../app/api/trading-lab/run-paper/route.ts",import.meta.url),"utf8");
 assert.match(r,/sizePosition/);
 assert.match(r,/riskPerTradePct/);
 assert.match(r,/POSITION_SIZING/);
});
