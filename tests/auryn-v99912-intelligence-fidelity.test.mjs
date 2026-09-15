import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const eng=fs.readFileSync("lib/auryn/v99910/fundamental-analyst.ts","utf8");
const stock=fs.readFileSync("components/StockClient.tsx","utf8");
const v2=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8");
test("valuation routes by business model and generic DCF is shadow unless appropriate",()=>{assert.match(eng,/businessModel/);assert.match(eng,/GROWTH_EV_SALES_FCF/);assert.match(eng,/valuationState/);assert.match(eng,/decisionGrade/);});
test("dimension scoring uses nonlinear saturation instead of trivial clipping",()=>{assert.match(eng,/nonlinearScore/);assert.doesNotMatch(eng,/metricScore\(v:number\|null\|undefined,lo:number,hi:number\)/);});
test("StockClient passes business model and canonical technical evidence",()=>{assert.match(stock,/businessModel:proofArchetype/);assert.match(stock,/technicalEvidence=/);});
test("V2 has richer valuation/timing/scenario and collision lanes",()=>{for(const x of ["vs History","vs Peers","Growth adjusted","FCF yield","Momentum","Participation","Relative strength","Current","decisionLane","Bear case","Base case","Bull case"])assert.match(v2,new RegExp(x,"i"));});

test("partial analyst valuation cannot fall back to canonical numeric score",()=>{assert.match(v2,/valuation=analystFundamentals\?num\(analystFundamentals\.valuationScore\):num\(decision\.pillars\.valuation\.score\)/);});
