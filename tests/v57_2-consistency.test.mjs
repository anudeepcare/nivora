import test from "node:test";import assert from "node:assert/strict";
import {buildZones,buildInvestorDecision} from "../.engine-test/nivora-investor.js";

const market={price:210,assetType:"stock",scores:{risk:55,trend:52,momentum:50,flow:48,entry:52,extension:42},levels:{support:204.56,majorSupport:183.11,resistance:218.53,breakout:229.98,invalidation:174.35},volatility:{atr14:17.5,atrPct:8.3}};

test("technical entry tiers are monotonic and non-overlapping",()=>{
  const z=buildZones(market,"NEUTRAL",52,false,null);
  const s=z.find(x=>x.kind==="starter"),a=z.find(x=>x.kind==="accumulate"),g=z.find(x=>x.kind==="strong");
  assert.ok(s&&a&&g);
  assert.ok(g.high < a.low,`strong ${g.low}-${g.high} must be below accumulate ${a.low}-${a.high}`);
  assert.ok(a.high < s.low,`accumulate ${a.low}-${a.high} must be below starter ${s.low}-${s.high}`);
});

test("missing absolute fair value does not become valuation zero",()=>{
  const company={fundamentalSignal:{score:72},fiveYearRecord:{score:70,revenueTrend:"Strong"},rawMetrics:{revGrowth:40,opMargin:5,fcf:1,leverage:30}};
  const context={enabled:true,metrics:{psTTM:10},recommendations:[],surprises:[],profile:{finnhubIndustry:"Software"}};
  const d=buildInvestorDecision({market,company,context});
  assert.ok(d);
  assert.equal(d.valuationRange,null);
  assert.notEqual(d.factors.valuation,0);
  assert.ok(d.decisionGradeEvidence < d.dataCompleteness);
});
