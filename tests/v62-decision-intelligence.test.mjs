
import test from "node:test";
import assert from "node:assert/strict";
import {summarizeCalibration} from "../.engine-test/nivora-calibration-v62.js";
import {checkValuationSanity,consolidateEntryZones} from "../.engine-test/nivora-valuation-sanity.js";
import {buildAdversarialRisks} from "../.engine-test/nivora-adversarial-risk.js";
import {buildActionTriggers} from "../.engine-test/nivora-action-triggers.js";
import {classifyArchetype} from "../.engine-test/nivora-investor.js";

test("calibration reports sample size hit rate alpha brier and ECE",()=>{
 const rows=[
  {score:80,alphaPct:10,archetype:"compounder"},
  {score:75,alphaPct:5,archetype:"compounder"},
  {score:40,alphaPct:-8,archetype:"compounder"},
  {score:35,alphaPct:-2,archetype:"compounder"}
 ];
 const x=summarizeCalibration(rows,3);
 assert.equal(x.n,4);
 assert.equal(x.status,"CALIBRATED");
 assert.equal(x.hitRatePct,50);
 assert.ok(x.brierScore>=0&&x.brierScore<=1);
 assert.ok(x.expectedCalibrationErrorPct>=0);
 assert.ok(x.medianAlphaPct>0);
 assert.ok(x.confidence95);
});

test("valuation sanity warns when even bear case is far above spot",()=>{
 const x=checkValuationSanity(312.73,{bear:400.68,base:527.21,bull:653.74,confidence:"Medium"});
 assert.equal(x.status,"WARN");
 assert.ok(x.warnings.some(w=>w.includes("Bear case")));
});

test("overlapping entry bands consolidate rather than show false precision",()=>{
 const z=consolidateEntryZones([
  {label:"Fundamental starter",low:303.35,high:312.73,kind:"starter",confidence:"Medium",basis:"a"},
  {label:"Fundamental accumulate",low:300.22,high:312.73,kind:"accumulate",confidence:"Medium",basis:"b"},
  {label:"Strong accumulate / thesis intact",low:300.22,high:312.73,kind:"strong",confidence:"Low",basis:"c"},
  {label:"Do not chase / resistance",low:317.6,high:326.2,kind:"chase",confidence:"Medium",basis:"d"}
 ]);
 assert.equal(z.filter(x=>["starter","accumulate","strong"].includes(x.kind)).length,1);
 assert.match(z[0].label,/Accumulation zone/);
});

test("adversarial risk never returns an empty risk panel",()=>{
 const risks=buildAdversarialRisks({archetype:"compounder",timingScore:29,factors:{growth:80,financial:75,forward:77,risk:45},existingRisks:[],breakers:["FCF deteriorates"],valuationWarnings:["Bear case implies unusually large upside."]});
 assert.ok(risks.length>=3);
 assert.ok(risks.some(r=>r.category==="TIMING"));
 assert.ok(risks.some(r=>r.category==="VALUATION"));
});

test("WAIT explains exact path to BUY",()=>{
 const x=buildActionTriggers({action:"WAIT",owns:false,thesisScore:79,opportunityScore:69,companyScore:92,timingScore:29,timingLabel:"WEAK",thesisState:"Strengthening",valuationLabel:"Deeply attractive"});
 assert.equal(x.targetAction,"BUY");
 assert.ok(x.requirements.some(r=>r.includes("Timing")));
 assert.ok(x.blockers.some(r=>r.includes("29")));
});

test("transition-aware archetypes separate AI infrastructure and pre-scale milestone companies",()=>{
 const ai=classifyArchetype({profile:{finnhubIndustry:"Mining",description:"GPU AI cloud data center infrastructure"}},{revGrowth:55,opMargin:18,fcf:-10},"stock");
 const pre=classifyArchetype({profile:{finnhubIndustry:"Telecommunication",description:"space-based satellite constellation direct-to-device"}},{revGrowth:80,opMargin:-120,fcf:-500},"stock");
 assert.equal(ai,"ai_infrastructure");
 assert.equal(pre,"pre_scale");
});
