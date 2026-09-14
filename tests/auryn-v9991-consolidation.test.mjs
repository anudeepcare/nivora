
import test from "node:test";import assert from "node:assert/strict";
const {mergePositionMath}=await import("../.engine-test/auryn/portfolio-consolidation.js");
test("adding shares recalculates weighted average",()=>{
 const r=mergePositionMath({shares:2400,avgCost:44.74},{shares:300,avgCost:49.39});
 assert.equal(r.shares,2700);assert.ok(Math.abs(r.avgCost-45.25666666666667)<1e-10);
});
test("first position remains itself",()=>assert.deepEqual(mergePositionMath(null,{shares:300,avgCost:49.39}),{shares:300,avgCost:49.39}));
