
import test from "node:test";import assert from "node:assert/strict";
import {bootstrapMeanCI,permutationMeanDifferencePValue} from "../.engine-test/nivora-statistics.js";

test("bootstrap mean CI is deterministic and contains the sample mean for stable data",()=>{
 const x=bootstrapMeanCI([1,2,3,4,5,6,7,8,9,10],2000,.95,42);
 assert.ok(x.low<x.mean&&x.mean<x.high);
 assert.equal(x.mean,5.5);
 const y=bootstrapMeanCI([1,2,3,4,5,6,7,8,9,10],2000,.95,42);
 assert.deepEqual(x,y);
});
test("permutation test detects a large mean edge",()=>{
 const a=Array.from({length:40},(_,i)=>5+(i%5));
 const b=Array.from({length:40},(_,i)=>-1+(i%5));
 const x=permutationMeanDifferencePValue(a,b,3000,7);
 assert.ok(x.pValue<.01);
 assert.ok(x.meanDifference>5);
});
