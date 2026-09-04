
import test from "node:test";import assert from "node:assert/strict";
import {deriveTradingLabState} from "../.engine-test/v65/trading-state.js";
test("connected broker with zero evaluated signals is not called trading or learning",()=>{
 const x=deriveTradingLabState({brokerConnected:true,lastRunAt:"2026-09-04T12:00:00Z",evaluated:0,orders:0,fills:0,maturedOutcomes:0});
 assert.equal(x.executionLabel,"CONNECTED · NO TRADES YET");
 assert.equal(x.learningLabel,"NOT LEARNING YET");
 assert.match(x.nextStep,/fresh decisions/i);
});
test("learning requires matured outcomes",()=>{
 const x=deriveTradingLabState({brokerConnected:true,lastRunAt:"2026-09-04T12:00:00Z",evaluated:20,orders:5,fills:5,maturedOutcomes:3});
 assert.equal(x.learningLabel,"LEARNING · 3 MATURED OUTCOMES");
});
