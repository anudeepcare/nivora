import test from "node:test";
import assert from "node:assert/strict";
import {evaluateV4Factors} from "../.engine-test/auryn/v4/factors.js";

const obs=(factor,score)=>({factor,score,reason:factor,evidenceIds:[`e-${factor}`],validationState:"MEASURED"});
const model={
  id:"test",version:"1",businessModels:["GENERAL_COMPOUNDER"],
  factorWeights:{BUSINESS_QUALITY:.4,FUNDAMENTALS_EARNINGS:.3,VALUATION:.2,TECHNICALS:.1},
  requiredFactors:["BUSINESS_QUALITY","FUNDAMENTALS_EARNINGS","VALUATION"],
  optionalFactors:["TECHNICALS"],allowOptionalRenormalization:true,maxActionWhenSuitabilityLow:"HOLD"
};

test("missing required evidence is reported rather than filled with 50",()=>{
  const x=evaluateV4Factors([obs("BUSINESS_QUALITY",85),obs("VALUATION",70)],model);
  assert.deepEqual(x.missingRequired,["FUNDAMENTALS_EARNINGS"]);
  assert.equal(x.assessments.FUNDAMENTALS_EARNINGS,undefined);
  assert.ok(x.coverage<100);
});

test("missing optional factor renormalizes only over available active weights",()=>{
  const x=evaluateV4Factors([obs("BUSINESS_QUALITY",80),obs("FUNDAMENTALS_EARNINGS",70),obs("VALUATION",60)],model);
  assert.equal(x.missingRequired.length,0);
  assert.equal(Math.round(x.weightedOverall),72);
});

import {adaptCurrentEvidenceToV4} from "../.engine-test/auryn/v4/current-evidence-adapter.js";

test("legacy adapter does not manufacture moat or positioning scores",()=>{
  const x=adaptCurrentEvidenceToV4({
    symbol:"APP",asOf:"2026-09-07T18:00:00Z",
    market:{scores:{trend:45,momentum:40,flow:50,risk:55}},
    company:{rawMetrics:{revGrowth:30,opMargin:25,fcf:10,leverage:30},fundamentalSignal:{currentScore:86},fiveYearRecord:{score:84}},
    context:{profile:{finnhubIndustry:"Software",description:"software advertising platform"},surprises:[{surprisePercent:8}]},
    legacyDecision:{valuationLabel:"Fair",timing:{score:42},factors:{catalysts:60,risk:55}}
  });
  assert.equal(x.observations.some(o=>o.factor==="MOAT"),false);
  assert.equal(x.observations.some(o=>o.factor==="POSITIONING"),false);
});

test("legacy adapter may expose a conservative moat proxy only when source-backed durability evidence exists",()=>{
  const x=adaptCurrentEvidenceToV4({
    symbol:"NVDA",asOf:"2026-09-07T18:00:00Z",
    market:{scores:{risk:42}},
    company:{rawMetrics:{revGrowth:62,grossMargin:74},fundamentalSignal:{currentScore:94},fiveYearRecord:{score:92,revenueTrend:"Strong"}},
    context:{profile:{finnhubIndustry:"Semiconductors",description:"accelerated compute platform"}},
    legacyDecision:{strategicContext:{runwayScore:94,executionScore:91,evidence:["Multi-year revenue trend: Strong.","Demand/runway language detected in current company context."]},factors:{business:94,growth:95,financial:90,valuation:62,risk:42}}
  });
  const moat=x.observations.find(o=>o.factor==="MOAT");
  assert.ok(moat);
  assert.equal(moat.validationState,"HEURISTIC");
  assert.match(moat.reason,/competitive-durability proxy/i);
  assert.ok(moat.evidenceIds.length>0);
  assert.equal(x.moatSignals.length,1);
});
