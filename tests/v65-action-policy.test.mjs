import test from "node:test";import assert from "node:assert/strict";
import {deriveV65Actions} from "../.engine-test/v65/action-policy.js";
test("bullish but weak timing separates long-term buy from wait today",()=>{
 const x=deriveV65Actions({thesisLabel:"BULLISH",thesisScore:82,thesisState:"Intact",todayAction:"WAIT",timingLabel:"WEAK",ownerAction:"HOLD"});
 assert.equal(x.longTerm,"BUY");assert.equal(x.newMoney,"WAIT_FOR_CONFIRMATION");assert.equal(x.owner,"HOLD");
});
test("overextended bullish name says do not chase rather than generic wait",()=>{
 const x=deriveV65Actions({thesisLabel:"BULLISH",thesisScore:78,thesisState:"Intact",todayAction:"WAIT",timingLabel:"OVEREXTENDED",ownerAction:"HOLD"});
 assert.equal(x.newMoney,"DO_NOT_CHASE");
});
