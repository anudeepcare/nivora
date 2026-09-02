
import test from "node:test";
import assert from "node:assert/strict";
import {evaluateBuyCalibration,auditDecisionDistribution} from "../.engine-test/nivora-buy-calibration.js";
import {deriveTodayAction} from "../.engine-test/nivora-today.js";

const base={
 thesisScore:76,opportunityScore:67,companyScore:82,thesisLabel:"BULLISH",thesisState:"Intact",
 timing:{label:"WAIT",score:53},valuationLabel:"Fair",vetoes:[],consistency:{ok:true,notes:[]},
 archetype:"compounder",factors:{financial:78,growth:74,forward:72,risk:42},
 valuationAvailable:true,valuationRobustness:"ROBUST",stabilizationState:"CONFIRMED",marketModelDisagreement:"LOW"
};

test("quality compounder can earn a starter BUY without requiring perfect short-term timing",()=>{
 const cal=evaluateBuyCalibration(base);
 assert.equal(cal.eligible,true);
 assert.equal(cal.path,"QUALITY_COMPOUNDER");
 assert.equal(cal.tier,"STARTER");
 const today=deriveTodayAction(base,false);
 assert.equal(today.action,"BUY");
 assert.equal(today.buyPath,"QUALITY_COMPOUNDER");
});

test("cyclical value path requires financial strength and at least selective timing",()=>{
 const x={...base,archetype:"cyclical",thesisScore:72,opportunityScore:65,companyScore:71,
  timing:{label:"SELECTIVE",score:58},factors:{financial:82,growth:58,forward:66,risk:43},
  valuationAvailable:true,valuationRobustness:"SENSITIVE",stabilizationState:"CONFIRMED",marketModelDisagreement:"MEDIUM"};
 const cal=evaluateBuyCalibration(x);
 assert.equal(cal.eligible,true);
 assert.equal(cal.path,"CYCLICAL_VALUE");
 assert.equal(deriveTodayAction(x,false).action,"BUY");
});

test("growth momentum path does not require absolute valuation when archetype valuation is legitimately unavailable",()=>{
 const x={...base,archetype:"hypergrowth",thesisScore:81,opportunityScore:70,companyScore:79,
  timing:{label:"SELECTIVE",score:62},factors:{financial:61,growth:91,forward:80,risk:46},
  valuationAvailable:false,valuationRobustness:"UNAVAILABLE",stabilizationState:"CONFIRMED",marketModelDisagreement:"LOW"};
 const cal=evaluateBuyCalibration(x);
 assert.equal(cal.eligible,true);
 assert.equal(cal.path,"GROWTH_MOMENTUM");
});

test("falling-knife stabilization guard still blocks a strong growth name",()=>{
 const x={...base,archetype:"hypergrowth",thesisScore:84,opportunityScore:76,companyScore:85,
  timing:{label:"SELECTIVE",score:61},factors:{financial:70,growth:95,forward:88,risk:40},
  valuationAvailable:false,valuationRobustness:"UNAVAILABLE",stabilizationState:"REQUIRED",marketModelDisagreement:"LOW"};
 const cal=evaluateBuyCalibration(x);
 assert.equal(cal.eligible,false);
 assert.ok(cal.blockers.some(x=>/stabilization/i.test(x)));
 assert.equal(deriveTodayAction(x,false).action,"WAIT");
});

test("hard veto remains an absolute new-money block",()=>{
 const x={...base,vetoes:["Active filing risk"]};
 const cal=evaluateBuyCalibration(x);
 assert.equal(cal.eligible,false);
 assert.equal(deriveTodayAction(x,false).action,"AVOID");
});

test("buy audit reports the exact closest blocker rather than generic WAIT",()=>{
 const x={...base,timing:{label:"WAIT",score:46},stabilizationState:"WATCH"};
 const cal=evaluateBuyCalibration(x);
 assert.equal(cal.eligible,false);
 assert.ok(cal.closestPath);
 assert.ok(cal.blockers.length>0);
 assert.match(cal.primaryBlocker,/timing|stabilization/i);
});

test("distribution audit counts actions, paths and dominant blockers",()=>{
 const rows=[
  {...base,symbol:"A"},
  {...base,symbol:"B",timing:{label:"WEAK",score:30},stabilizationState:"REQUIRED"},
  {...base,symbol:"C",thesisScore:39,thesisLabel:"BEARISH"},
 ];
 const out=auditDecisionDistribution(rows);
 assert.equal(out.total,3);
 assert.ok(out.actions.BUY>=1);
 assert.ok(out.actions.WAIT>=1);
 assert.ok(out.actions.AVOID>=1);
 assert.ok(Object.keys(out.blockers).length>=1);
});
