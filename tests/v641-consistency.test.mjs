
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
import {deriveTodayAction} from "../.engine-test/nivora-today.js";
import {buildActionTriggers} from "../.engine-test/nivora-action-triggers.js";
import {validateDecisionConsistency} from "../.engine-test/nivora-consistency.js";
import {presentPriceZone,formatScenario} from "../.engine-test/nivora-decision-presentation.js";
import {deriveTradeIntent} from "../.engine-test/nivora-trade-intent.js";

const coherent={thesisScore:80,opportunityScore:74,companyScore:75,thesisLabel:"BULLISH",thesisState:"Intact",timing:{label:"ATTRACTIVE",score:72},valuationLabel:"Attractive",vetoes:[],consistency:{ok:true,notes:[]}};

test("BUY and ADD are deterministically reachable under coherent evidence",()=>{
 assert.equal(deriveTodayAction(coherent,false).action,"BUY");
 assert.equal(deriveTodayAction(coherent,true).action,"ADD");
});
test("bearish new-money state is AVOID, not a misleading WAIT",()=>{
 const x=deriveTodayAction({...coherent,thesisScore:40,thesisLabel:"BEARISH",thesisState:"Mixed"},false);
 assert.equal(x.action,"AVOID");assert.equal(x.blocked,true);
});
test("hard veto new-money state is AVOID and cannot create a trade intent",()=>{
 const today=deriveTodayAction({...coherent,vetoes:["financial health","filing risk"]},false);
 assert.equal(today.action,"AVOID");
 const intent=deriveTradeIntent({symbol:"OSCR",snapshotId:"1",evidenceFingerprint:"x",price:29.77,observedAt:"2026-09-01T18:00:00Z",thesisScore:40,opportunityScore:42,companyScore:40,today});
 assert.equal(intent,null);
});
test("bearish/veto trigger language does not advertise Path to BUY",()=>{
 const t=buildActionTriggers({action:"AVOID",owns:false,thesisScore:40,opportunityScore:42,companyScore:40,timingScore:61,timingLabel:"SELECTIVE",thesisState:"Mixed",thesisLabel:"BEARISH",vetoes:["Financial health"]});
 assert.equal(t.targetAction,"REASSESS");
 assert.doesNotMatch(t.summary,/BUY conditions/i);
});
test("WAIT turns entry zone into watch zone while BUY makes it actionable",()=>{
 const z={label:"Accumulation zone",low:299.5,high:311.5,kind:"accumulate",confidence:"Medium",basis:"valuation"};
 assert.equal(presentPriceZone(z,"WAIT").heading,"POTENTIAL ENTRY");
 assert.equal(presentPriceZone(z,"BUY").heading,"ACTIONABLE ENTRY");
});
test("collapsed low-confidence price ranges render as approximate single levels",()=>{
 const z={label:"Support context",low:28,high:28,kind:"starter",confidence:"Low",basis:"support"};
 assert.equal(presentPriceZone(z,"WAIT").value,"~$28");
});
test("valuation scenario display includes bear/base/bull and upside/downside",()=>{
 const x=formatScenario({bear:250,base:350,bull:450,method:"DCF",confidence:"Medium"},311.56);
 assert.equal(x.length,3);assert.equal(x[0].label,"BEAR");assert.match(x[0].delta,/^-19\./);assert.equal(x[1].label,"BASE");assert.equal(x[2].label,"BULL");
});
test("consistency engine catches contradictory new-money states",()=>{
 const x=validateDecisionConsistency({thesisLabel:"BEARISH",todayAction:"BUY",vetoes:[],zones:[{kind:"starter",low:29,high:30}],valuationRange:null,valuationAvailable:false,support:29,resistance:31,metricProofs:{thesis:{}}});
 assert.equal(x.ok,false);assert.ok(x.errors.some(e=>e.code==="BEARISH_BUY"));
});
test("consistency engine catches malformed valuation ordering and support/resistance",()=>{
 const x=validateDecisionConsistency({thesisLabel:"BULLISH",todayAction:"WAIT",vetoes:[],zones:[],valuationRange:{bear:400,base:350,bull:500},valuationAvailable:true,support:40,resistance:30,metricProofs:{thesis:{}}});
 assert.equal(x.ok,false);assert.ok(x.errors.some(e=>e.code==="VALUATION_ORDER"));assert.ok(x.errors.some(e=>e.code==="LEVEL_ORDER"));
});
test("new Hero uses click/tap metric help and separate risk concepts",()=>{
 const s=fs.readFileSync(new URL("../components/InvestorDecisionHero.tsx",import.meta.url),"utf8");
 const info=fs.readFileSync(new URL("../components/v65/MetricInfo.tsx",import.meta.url),"utf8");
 const p=fs.readFileSync(new URL("../lib/nivora-decision-presentation.ts",import.meta.url),"utf8");
 assert.match(info,/onClick/);assert.match(info,/aria-expanded/);assert.match(p,/BEAR CASE/);assert.match(p,/BASE CASE/);assert.match(p,/BULL CASE/);
 assert.match(s,/TECHNICAL RISK/);assert.match(s,/THESIS INVALIDATION/);
});
test("duplicated legacy overview analyst/quality strip is removed",()=>{
 const s=fs.readFileSync(new URL("../components/StockClient.tsx",import.meta.url),"utf8");
 assert.doesNotMatch(s,/className="v48ValueEvidence"/);
 assert.doesNotMatch(s,/ANALYST CONSENSUS/);
});
