import test from "node:test";import assert from "node:assert/strict";
import {measureOutcome,scoreBucket} from "../.engine-test/v65/outcomes.js";
import {evaluatePromotion} from "../.engine-test/v65/challenger.js";

test("outcome measurement computes benchmark alpha and max drawdown",()=>{
 const x=measureOutcome({entryPrice:100,endPrice:120,benchmarkStart:100,benchmarkEnd:110,pathPrices:[100,95,90,105,120]});
 assert.equal(x.rawReturnPct,20);assert.equal(x.benchmarkReturnPct,10);assert.equal(x.alphaPct,10);assert.equal(x.maxDrawdownPct,-10);assert.equal(x.hit,true);
});
test("score bucket is stable and explicit",()=>{assert.equal(scoreBucket(79),"70-79");assert.equal(scoreBucket(100),"90-100");});
test("challenger cannot auto-promote on backtest alone",()=>{
 const x=evaluatePromotion({champion:{oosN:500,forwardN:50,avgAlphaPct:3,maxDrawdownPct:-18,ecePct:7},challenger:{oosN:600,forwardN:0,avgAlphaPct:6,maxDrawdownPct:-16,ecePct:6}});
 assert.equal(x.promote,false);assert.ok(x.failed.some(s=>/forward/i.test(s)));
});
test("challenger promotion requires stronger out-of-sample and forward evidence",()=>{
 const x=evaluatePromotion({champion:{oosN:500,forwardN:50,avgAlphaPct:3,maxDrawdownPct:-18,ecePct:7},challenger:{oosN:700,forwardN:80,avgAlphaPct:5,maxDrawdownPct:-17,ecePct:6}});
 assert.equal(x.promote,true);
});
