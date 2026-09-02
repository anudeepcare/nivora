
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";

test("live decision-audit route summarizes latest real snapshot BUY blockers",()=>{
 const s=fs.readFileSync(new URL("../app/api/decision-audit/route.ts",import.meta.url),"utf8");
 assert.match(s,/nivora_v59_decision_snapshots/);
 assert.match(s,/buyAudit/);
 assert.match(s,/dominantBlockers/);
 assert.match(s,/closestToBuy/);
 assert.match(s,/ENGINE_VERSION/);
});
test("high early-warning risk cannot authorize a new BUY path",async()=>{
 const {evaluateBuyCalibration}=await import("../.engine-test/nivora-buy-calibration.js");
 const x=evaluateBuyCalibration({thesisScore:85,opportunityScore:78,companyScore:88,thesisLabel:"BULLISH",thesisState:"Intact",timing:{label:"ATTRACTIVE",score:75},valuationLabel:"Attractive",vetoes:[],consistency:{ok:true},archetype:"compounder",factors:{financial:85,growth:80,forward:82,risk:35},valuationAvailable:true,valuationRobustness:"ROBUST",stabilizationState:"CONFIRMED",marketModelDisagreement:"LOW",earlyWarningLevel:"HIGH"});
 assert.equal(x.eligible,false);assert.match(x.primaryBlocker,/early-warning/i);
});
