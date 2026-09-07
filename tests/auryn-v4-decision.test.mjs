import test from "node:test";
import assert from "node:assert/strict";
import {buildDecisionConfidence} from "../.engine-test/auryn/v4/confidence.js";

test("confidence falls when model suitability and coverage are weak",()=>{
  const hi=buildDecisionConfidence({coverage:90,freshness:90,sourceQuality:90,modelSuitability:90,agreement:80,validationState:"MEASURED"});
  const lo=buildDecisionConfidence({coverage:45,freshness:70,sourceQuality:60,modelSuitability:40,agreement:50,validationState:"HEURISTIC"});
  assert.ok(hi.score>lo.score);
  assert.equal(hi.label,"HIGH");
  assert.equal(lo.label,"LOW");
});

import {resolveV4Decision} from "../.engine-test/auryn/v4/decision.js";

const confidence={score:82,label:"HIGH",coverage:90,freshness:90,sourceQuality:90,modelSuitability:85,agreement:80,validationState:"MEASURED"};
const base={
  businessModel:"GENERAL_COMPOUNDER",
  slowScore:90,opportunityScore:84,riskScore:35,technicalScore:82,valuationScore:80,catalystScore:80,sectorScore:80,
  thesis:{strength:90,direction:"STABLE"},moat:{score:90,direction:"STABLE"},confidence,
  missingRequired:[],hardVetoes:[],softConstraints:[],modelSuitability:.85
};

test("strong evidence can produce STRONG_BUY without WAIT",()=>{
  const x=resolveV4Decision(base);
  assert.equal(x.primaryAction,"STRONG_BUY");
  assert.ok(x.horizonDecisions.every(h=>h.action!=="INSUFFICIENT_EVIDENCE"));
  assert.ok(!x.horizonDecisions.some(h=>String(h.action).includes("WAIT")));
});

test("weak technicals can constrain NOW while long-term remains BUY",()=>{
  const x=resolveV4Decision({...base,technicalScore:28,softConstraints:["TECHNICAL_INSTABILITY"]});
  assert.equal(x.primaryAction,"BUY");
  assert.equal(x.horizonDecisions.find(h=>h.horizon==="NOW").action,"HOLD");
  assert.ok(["BUY","STRONG_BUY"].includes(x.horizonDecisions.find(h=>h.horizon==="THREE_TO_FIVE_YEARS").action));
});

test("broken thesis sells even when valuation looks cheap",()=>{
  const x=resolveV4Decision({...base,slowScore:28,valuationScore:92,thesis:{strength:28,direction:"BROKEN"}});
  assert.equal(x.primaryAction,"SELL");
});

test("missing required evidence produces INSUFFICIENT_EVIDENCE instead of neutral HOLD",()=>{
  const x=resolveV4Decision({...base,missingRequired:["FUNDAMENTALS_EARNINGS"]});
  assert.equal(x.primaryAction,"INSUFFICIENT_EVIDENCE");
});
