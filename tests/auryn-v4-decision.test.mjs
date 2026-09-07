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

test("score weakness alone cannot produce SELL while the structural thesis is intact",()=>{
  const x=resolveV4Decision({...base,slowScore:56,opportunityScore:42,riskScore:80,technicalScore:45,valuationScore:null,catalystScore:55,sectorScore:60,thesis:{strength:58,direction:"STABLE"},moat:{score:55,direction:"STABLE"}});
  assert.notEqual(x.primaryAction,"SELL");
  assert.notEqual(x.horizonDecisions.find(h=>h.horizon==="THREE_TO_FIVE_YEARS").action,"SELL");
});

test("strong intact long-term thesis downgrades medium-term weakness to HOLD rather than REDUCE",()=>{
  const x=resolveV4Decision({...base,slowScore:76,opportunityScore:48,riskScore:78,technicalScore:38,valuationScore:null,catalystScore:58,sectorScore:60,thesis:{strength:78,direction:"STABLE"},moat:{score:76,direction:"STABLE"},softConstraints:["TECHNICAL_INSTABILITY"]});
  assert.equal(x.primaryAction,"HOLD");
  assert.ok(["HOLD","BUY","STRONG_BUY"].includes(x.horizonDecisions.find(h=>h.horizon==="THREE_TO_FIVE_YEARS").action));
});

test("SELL is structural: very weak weighted scores with an intact thesis stop at REDUCE",()=>{
  const x=resolveV4Decision({...base,slowScore:35,opportunityScore:20,riskScore:90,technicalScore:10,valuationScore:10,catalystScore:15,sectorScore:20,thesis:{strength:40,direction:"STABLE"},moat:{score:35,direction:"ERODING"}});
  assert.notEqual(x.primaryAction,"SELL");
  assert.ok(x.horizonDecisions.every(h=>h.action!=="SELL"));
});

test("an intact owner thesis does not become an automatic REDUCE solely because new-money valuation/risk is unattractive",()=>{
  const x=resolveV4Decision({...base,slowScore:68,opportunityScore:42,riskScore:88,technicalScore:45,valuationScore:5,catalystScore:55,sectorScore:60,thesis:{strength:70,direction:"STABLE"},moat:{score:58,direction:"STABLE"}});
  assert.ok(["HOLD","REDUCE"].includes(x.primaryAction));
  assert.equal(x.ownerAction,"HOLD");
});

test("owner action still reduces when structural thesis is actually weakening",()=>{
  const x=resolveV4Decision({...base,slowScore:45,opportunityScore:35,riskScore:86,technicalScore:40,valuationScore:20,catalystScore:40,sectorScore:45,thesis:{strength:48,direction:"WEAKENING"},moat:{score:45,direction:"ERODING"}});
  assert.equal(x.ownerAction,"REDUCE");
});

test("missing valuation alone yields a structural HOLD instead of INSUFFICIENT_EVIDENCE",()=>{
  const x=resolveV4Decision({...base,valuationScore:null,missingRequired:["VALUATION"]});
  assert.equal(x.primaryAction,"HOLD");
  assert.equal(x.ownerAction,"HOLD");
  assert.ok(x.horizonDecisions.every(h=>h.action!=="INSUFFICIENT_EVIDENCE"));
  assert.ok(x.reasonCodes.includes("VALUATION_UNAVAILABLE_CAP"));
});
