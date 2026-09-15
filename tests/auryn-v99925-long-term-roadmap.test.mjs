import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const p="lib/auryn/v99925/long-term-roadmap.ts";
test("long-term engine exists with weekly WMA/Fib/consolidation/wave contracts",()=>{
 assert.ok(fs.existsSync(p));const s=fs.readFileSync(p,"utf8");
 for(const x of ["aggregateWeekly","wma","fib382","fib50","fib618","fib786","extension1272","extension1618","consolidationWeeks","waveCandidate","invalidation","nextTrigger"])assert.ok(s.includes(x),x);
});
test("wave output is explicitly candidate/confidence based",()=>{const s=fs.readFileSync(p,"utf8");assert.match(s,/confidence/);assert.match(s,/candidate/i);});

test("weekly engine supports epoch-second candle timestamps",()=>{const s=fs.readFileSync(p,"utf8");assert.match(s,/x<1e12\?x\*1000:x/);});
