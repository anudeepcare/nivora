
import test from "node:test";import assert from "node:assert/strict";
import {formatMoney,formatPercent,formatCount,formatScore} from "../.engine-test/nivora-format.js";
import {buildMetricProof} from "../.engine-test/nivora-metric-proof.js";

test("professional number formatter uses separators and avoids fake precision",()=>{
 assert.equal(formatMoney(1234567.89),"$1,234,567.89");
 assert.equal(formatMoney(305.33,{confidence:"Low"}),"$305");
 assert.equal(formatPercent(.21470308),"+0.21%");
 assert.equal(formatCount(1234567),"1,234,567");
 assert.equal(formatScore(79.42),"79");
});
test("unavailable metric proof has no zero score",()=>{
 const p=buildMetricProof({metric:"valuation",value:null,status:"UNAVAILABLE",formulaVersion:"v64",sources:["Fundamentals"],freshness:"filing-driven",sampleSize:0,validationStatus:"UNVALIDATED"});
 assert.equal(p.displayValue,"Not established");
 assert.equal(p.numericValue,null);
 assert.match(p.warning,/not a zero/i);
});
test("heuristic metric proof says it is heuristic until validated",()=>{
 const p=buildMetricProof({metric:"thesis",value:79,status:"AVAILABLE",formulaVersion:"v59-thesis-1",sources:["Business","Forward"],freshness:"mixed",sampleSize:0,validationStatus:"UNVALIDATED"});
 assert.equal(p.displayValue,"79/100");
 assert.equal(p.validationStatus,"UNVALIDATED");
 assert.match(p.warning,/heuristic/i);
});
