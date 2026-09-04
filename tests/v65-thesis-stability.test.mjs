
import test from "node:test";import assert from "node:assert/strict";
import {stabilizeSlowMetric} from "../.engine-test/v65/thesis-stability.js";
test("price-only movement cannot rewrite slow thesis metric",()=>{
 const prior={value:82,evidenceFingerprint:"filing-1",lastMeaningfulChangeAt:"2026-09-01T00:00:00Z"};
 const next=stabilizeSlowMetric(prior,{candidateValue:75,evidenceFingerprint:"filing-1",now:"2026-09-04T12:00:00Z",changedBecause:["price fell"]});
 assert.equal(next.value,82);assert.equal(next.changed,false);assert.match(next.reason,/unchanged slow evidence/i);
});
test("new fundamental evidence can update slow thesis metric",()=>{
 const prior={value:82,evidenceFingerprint:"filing-1",lastMeaningfulChangeAt:"2026-09-01T00:00:00Z"};
 const next=stabilizeSlowMetric(prior,{candidateValue:75,evidenceFingerprint:"earnings-2",now:"2026-09-04T12:00:00Z",changedBecause:["new earnings"]});
 assert.equal(next.value,75);assert.equal(next.changed,true);
});
