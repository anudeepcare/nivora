
import test from "node:test";import assert from "node:assert/strict";
import {buildPortableTradeTicket} from "../.engine-test/nivora-trade-ticket.js";
test("BUY creates a portable broker-neutral plan without pretending it was executed",()=>{
 const x=buildPortableTradeTicket({symbol:"IREN",action:"BUY",entryLow:34,entryHigh:35,invalidation:31.5,target1:40,target2:48,horizon:"1Y",shares:100,engineVersion:"v64",evidenceFingerprint:"abc"});
 assert.equal(x.status,"PLAN");assert.equal(x.side,"BUY");assert.equal(x.quantity,100);assert.equal(x.limitPrice,35);assert.match(x.disclaimer,/not an executed order/i);
});
test("WAIT creates no order ticket",()=>{
 const x=buildPortableTradeTicket({symbol:"IREN",action:"WAIT",entryLow:34,entryHigh:35,invalidation:31.5,target1:40,target2:48,horizon:"1Y",shares:null,engineVersion:"v64",evidenceFingerprint:"abc"});
 assert.equal(x.status,"NO_ORDER");assert.equal(x.side,null);
});
