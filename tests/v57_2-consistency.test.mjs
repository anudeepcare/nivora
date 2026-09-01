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

test("long-term thesis is explicitly separated from near-term timing",()=>{
  const company={fundamentalSignal:{score:78},fiveYearRecord:{score:76,revenueTrend:"Strong"},rawMetrics:{revGrowth:38,niGrowth:25,opMargin:18,fcf:2,leverage:35,grossMargin:60}};
  const context={enabled:true,metrics:{peTTM:34,psTTM:8},recommendations:[{strongBuy:10,buy:8,hold:3,sell:1,strongSell:0},{strongBuy:8,buy:8,hold:4,sell:1,strongSell:0}],surprises:[{surprisePercent:12},{surprisePercent:8},{surprisePercent:4}],profile:{finnhubIndustry:"Software"},summary:{tone:"positive"}};
  const weakMarket={...market,scores:{...market.scores,trend:25,momentum:28,entry:30,flow:35,extension:35}};
  const d=buildInvestorDecision({market:weakMarket,company,context});
  assert.ok(d?.longTermThesis);
  assert.ok(d.longTermThesis.score>=60);
  assert.match(d.longTermThesis.nearTerm,/timing weak/i);
});

test("expectation gap is evidence driven and never a price target",()=>{
  const company={fundamentalSignal:{score:75},fiveYearRecord:{score:74,revenueTrend:"Strong"},rawMetrics:{revGrowth:45,niGrowth:30,opMargin:20,fcf:3,leverage:25}};
  const context={enabled:true,metrics:{peTTM:30,psTTM:7},recommendations:[{strongBuy:12,buy:7,hold:2,sell:0,strongSell:0},{strongBuy:7,buy:7,hold:5,sell:1,strongSell:0}],surprises:[{surprisePercent:15},{surprisePercent:6},{surprisePercent:3}],profile:{finnhubIndustry:"Software"},summary:{tone:"positive"}};
  const d=buildInvestorDecision({market,company,context});
  assert.ok(d?.expectationGap);
  assert.equal(d.expectationGap.label,"POSITIVE");
  assert.doesNotMatch(d.expectationGap.reason,/target price|fair value/i);
});
