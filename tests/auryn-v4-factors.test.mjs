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

test("legacy adapter never converts null valuation or revenue into zero evidence",()=>{
  const x=adaptCurrentEvidenceToV4({
    symbol:"IREN",asOf:"2026-09-07T20:00:00Z",
    market:{assetType:"stock",scores:{risk:80}},
    company:{rawMetrics:{revenue:null,revGrowth:63,opMargin:null,fcf:null},fundamentalSignal:{currentScore:56}},
    context:{profile:{name:"IREN",finnhubIndustry:"Capital Markets",description:"data center operator providing AI cloud GPU compute and bitcoin mining infrastructure"}},
    legacyDecision:{archetype:"ai_infrastructure",valuationLabel:"Unclear",factors:{valuation:null,growth:63,risk:80},strategicContext:{theme:"AI infrastructure / compute & power",runwayScore:82,executionScore:63,evidence:["AI infrastructure demand evidence","Data-center capacity evidence"]}}
  });
  assert.equal(x.observations.some(o=>o.factor==="VALUATION"),false);
  assert.equal(x.classificationInput.revenue,null);
});

import {valuationScore} from "../.engine-test/nivora-investor.js";

test("AI infrastructure valuation derives sales multiple from market cap and reported revenue when provider P/S is missing",()=>{
  const x=valuationScore("ai_infrastructure",{profile:{marketCapitalization:5000},metrics:{}},{revenue:1_000_000_000,revGrowth:60,opMargin:8,fcf:-50});
  assert.equal(x.available,true);
  assert.match(x.basis,/derived.*sales|sales multiple/i);
  assert.ok(x.score>0&&x.score<=100);
});

test("legacy adapter treats unsupported zero valuation as unavailable evidence",()=>{
  const x=adaptCurrentEvidenceToV4({
    symbol:"BE",asOf:"2026-09-07T20:00:00Z",
    market:{assetType:"stock",scores:{risk:70}},
    company:{rawMetrics:{revGrowth:40},fundamentalSignal:{currentScore:70}},
    context:{profile:{name:"PowerCo",finnhubIndustry:"Electrical Equipment",description:"distributed power infrastructure for data centers"}},
    legacyDecision:{valuationLabel:"Unclear",valuationValidity:{status:"UNSUPPORTED",reason:"valuation inputs unavailable",fairValueAllowed:false,zonesAllowed:false},valuationBasis:"Independent valuation is not established from the currently available evidence.",factors:{valuation:0,growth:70,risk:70}}
  });
  assert.equal(x.observations.some(o=>o.factor==="VALUATION"),false);
});

test("legacy adapter can use source-backed news context to classify an AI infrastructure company when profile description is absent",()=>{
  const x=adaptCurrentEvidenceToV4({
    symbol:"INFRA",asOf:"2026-09-07T20:00:00Z",
    market:{assetType:"stock",scores:{risk:65}},
    company:{rawMetrics:{revenue:500_000_000,revGrowth:80},fundamentalSignal:{currentScore:68}},
    context:{profile:{name:"InfraCo",finnhubIndustry:"Mining"},news:[{headline:"InfraCo expands GPU cloud capacity at powered data center campus",summary:"New HPC hosting capacity is expected online next year."}]},
    legacyDecision:{factors:{growth:80,risk:65}}
  });
  assert.match(String(x.classificationInput.description||""),/GPU cloud capacity|HPC hosting/i);
});
