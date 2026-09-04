import test from "node:test";import assert from "node:assert/strict";
import {buildValuationFallback} from "../.engine-test/v65/valuation-fallback.js";
test("AI infrastructure uses capacity/forward economics fallback instead of empty fair value",()=>{
 const x=buildValuationFallback({archetype:"ai_infrastructure",valuationBasis:"unsupported",reason:"Absolute valuation not established"});
 assert.equal(x.available,true);assert.match(x.framework,/capacity|revenue/i);assert.ok(x.drivers.length>=3);
});
test("biotech fallback does not invent absolute price target",()=>{
 const x=buildValuationFallback({archetype:"biotech",valuationBasis:"unsupported",reason:"Binary outcomes"});
 assert.equal(x.absoluteTarget,null);assert.match(x.framework,/scenario|pipeline/i);
});
