
import test from "node:test";import assert from "node:assert/strict";
import {evaluateValidationEvidence} from "../.engine-test/nivora-validation-gate.js";

const base={historicalN:0,oosN:0,forwardN:0,avgAlphaPct:0,hitRatePct:0,brierScore:1,ecePct:100,maxDrawdownPct:-99,regimesPassed:0,archetypesPassed:0};
test("validation gate is UNVALIDATED without evidence",()=>assert.equal(evaluateValidationEvidence(base).status,"UNVALIDATED"));
test("historical evidence can become BACKTESTED but not OOS verified",()=>{const x=evaluateValidationEvidence({...base,historicalN:2000,avgAlphaPct:4,hitRatePct:57,brierScore:.23,ecePct:9,maxDrawdownPct:-24,regimesPassed:3,archetypesPassed:4});assert.equal(x.status,"BACKTESTED")});
test("OOS evidence requires enough untouched observations and positive alpha",()=>{const x=evaluateValidationEvidence({...base,historicalN:3000,oosN:700,avgAlphaPct:4.2,hitRatePct:58,brierScore:.21,ecePct:8,maxDrawdownPct:-22,regimesPassed:3,archetypesPassed:5});assert.equal(x.status,"OUT_OF_SAMPLE_VERIFIED")});
test("VALIDATED requires forward evidence too",()=>{const x=evaluateValidationEvidence({...base,historicalN:5000,oosN:1200,forwardN:150,avgAlphaPct:5.1,hitRatePct:60,brierScore:.19,ecePct:6,maxDrawdownPct:-18,regimesPassed:3,archetypesPassed:6});assert.equal(x.status,"VALIDATED")});
test("negative alpha can never validate",()=>{const x=evaluateValidationEvidence({...base,historicalN:5000,oosN:1200,forwardN:150,avgAlphaPct:-1,hitRatePct:60,brierScore:.19,ecePct:6,maxDrawdownPct:-18,regimesPassed:3,archetypesPassed:6});assert.notEqual(x.status,"VALIDATED");assert.ok(x.failed.some(s=>/alpha/i.test(s)))});

test("validation cannot become VALIDATED when historical universe quality is limited",()=>{
 const x=evaluateValidationEvidence({...base,historicalN:5000,oosN:1200,forwardN:150,avgAlphaPct:5.1,hitRatePct:60,brierScore:.19,ecePct:6,maxDrawdownPct:-18,regimesPassed:3,archetypesPassed:6,dataQualityPassed:false});
 assert.notEqual(x.status,"VALIDATED");
 assert.ok(x.failed.some(s=>/data quality/i.test(s)));
});
