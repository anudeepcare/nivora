
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {assessQuoteIntegrity} from "../.engine-test/nivora-provider-consensus.js";
import {buildDecisionReality,roundPriceZone,applyRealityGuardToToday} from "../.engine-test/nivora-decision-reality.js";
import {evaluateTradingRisk} from "../.engine-test/nivora-trading-risk.js";
import {summarizeCalibrationCohorts} from "../.engine-test/nivora-calibration-v63.js";

const q=(provider,price,ageSeconds,freshness="LIVE",spreadPct=.1)=>({
  symbol:"APP",price,bid:price-.05,ask:price+.05,spreadPct,changePct:null,
  providerTimestamp:"2026-09-01T18:00:00.000Z",ageSeconds,session:"REGULAR",
  freshness,provider,isRealTime:freshness==="LIVE"
});

test("quote integrity verifies agreeing live providers",()=>{
  const x=assessQuoteIntegrity(q("alpaca",100,2),q("twelvedata",100.15,4));
  assert.equal(x.state,"LIVE_VERIFIED");
  assert.equal(x.tradable,true);
  assert.ok(x.disagreementPct<.5);
});

test("quote integrity blocks material provider disagreement",()=>{
  const x=assessQuoteIntegrity(q("alpaca",100,2),q("twelvedata",102,3));
  assert.equal(x.state,"DISAGREEMENT");
  assert.equal(x.tradable,false);
});

test("quote integrity uses a single fresh provider but reports reduced confidence",()=>{
  const x=assessQuoteIntegrity(q("alpaca",100,2),q("twelvedata",99,600,"STALE"));
  assert.equal(x.state,"LIVE_SINGLE_SOURCE");
  assert.equal(x.tradable,true);
});

test("decision reality detects falling knife and market-model disagreement",()=>{
  const x=buildDecisionReality({
    price:311,
    valuationRange:{bear:399,base:525,bull:651,confidence:"Medium"},
    timingScore:29,
    timingLabel:"WEAK",
    technical:{d20:-12,d50:-28,d200:-35,drawdown:-52,volRatio:1.6},
    factors:{forward:70,financial:77,growth:100,risk:61},
    newsTone:"neutral",
    thesisScore:79,
    opportunityScore:69
  });
  assert.equal(x.marketModelDisagreement.level,"HIGH");
  assert.equal(x.stabilization.state,"REQUIRED");
  assert.ok(x.valuationRobustness.score<80);
  assert.ok(x.earlyWarning.score>0);
  assert.ok(x.scoreAttribution.length>=4);
});

test("low-confidence price zones do not pretend to cent precision",()=>{
  const x=roundPriceZone({label:"Starter support",low:305.33,high:308.77,kind:"starter",confidence:"Low",basis:"support"},"Low",311);
  assert.equal(x.low,305);
  assert.equal(x.high,309);
});

test("calibration cohorts stay segmented by archetype horizon and regime",()=>{
  const rows=[
    {score:80,alphaPct:8,archetype:"compounder",horizon:"90D",regime:"RISK_ON"},
    {score:75,alphaPct:4,archetype:"compounder",horizon:"90D",regime:"RISK_ON"},
    {score:70,alphaPct:-2,archetype:"pre_scale",horizon:"90D",regime:"RISK_OFF"}
  ];
  const x=summarizeCalibrationCohorts(rows,2);
  assert.ok(x.some(c=>c.key==="compounder|90D|RISK_ON"&&c.summary.status==="CALIBRATED"));
  assert.ok(x.some(c=>c.key==="pre_scale|90D|RISK_OFF"&&c.summary.status==="COLLECTING"));
});


test("reality guard withholds BUY during required stabilization",()=>{
  const reality=buildDecisionReality({
    price:100,valuationRange:{bear:120,base:150,bull:180,confidence:"Medium"},timingScore:25,timingLabel:"WEAK",
    technical:{d20:-10,d50:-20,d200:-30,drawdown:-45,volRatio:1.7},factors:{business:80,durability:75,forward:70,earnings:65,catalysts:55,institutional:55,financial:70,growth:80,risk:65},
    newsTone:"neutral",thesisScore:80,opportunityScore:75
  });
  const guarded=applyRealityGuardToToday({action:"BUY",blocked:false,reason:"entry",policyVersion:"x"},false,reality);
  assert.equal(guarded.action,"WAIT");
  assert.match(guarded.reason,/Reality guard/);
});

test("trading risk blocks provider disagreement even when both raw quotes are fresh",()=>{
  const intent={side:"BUY",intentType:"ENTER",targetNotional:1000};
  const ctx={equity:100000,cash:50000,dailyPnlPct:0,currentPositionValue:0,openPositions:2,duplicate:false,quote:{price:100,ageSeconds:2,freshness:"LIVE",changePct:0,spreadPct:.1,integrityState:"DISAGREEMENT"}};
  const r=evaluateTradingRisk(intent,ctx);
  assert.equal(r.allowed,false);
  assert.equal(r.code,"QUOTE_INTEGRITY");
});

test("Vercel Hobby config has no cron and GitHub owns paper schedule",()=>{
  const v=JSON.parse(fs.readFileSync(new URL("../vercel.json",import.meta.url),"utf8"));
  assert.deepEqual(v,{});
  const wf=fs.readFileSync(new URL("../.github/workflows/nivora-paper-trading.yml",import.meta.url),"utf8");
  assert.match(wf,/TRADING_LAB_CRON_SECRET/);
  assert.match(wf,/api\/trading-lab\/run-paper/);
  assert.match(wf,/cron:/);
});

test("paper diagnostics endpoint and broker cancel path exist",()=>{
  const r=fs.readFileSync(new URL("../app/api/trading-lab/diagnostics/route.ts",import.meta.url),"utf8");
  assert.match(r,/TRADING_LAB_SELF_TEST_ORDER_ENABLED/);
  assert.match(r,/submitSelfTestOrder/);
  const b=fs.readFileSync(new URL("../lib/alpaca-paper.ts",import.meta.url),"utf8");
  assert.match(b,/cancelOrder/);
});

test("stock cockpit exposes V63 reality layer",()=>{
  const s=fs.readFileSync(new URL("../components/InvestorDecisionHero.tsx",import.meta.url),"utf8");
  assert.match(s,/MARKET REALITY/);
  assert.match(s,/VALUATION ROBUSTNESS/);
  assert.match(s,/STABILIZATION/);
  assert.match(s,/EARLY WARNING/);
  assert.match(s,/WHY THIS SCORE/);
});
