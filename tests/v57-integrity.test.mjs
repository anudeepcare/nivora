import test from 'node:test';import assert from 'node:assert/strict';
import {buildInvestorDecision} from '../.engine-test/nivora-investor.js';
import {factorCorrelationAudit} from '../.engine-test/nivora-factor-integrity.js';
import {analyzePortfolioRisk} from '../.engine-test/nivora-portfolio-risk.js';
const market={price:100,assetType:'stock',scores:{risk:45,trend:58,momentum:55,flow:52,entry:58,extension:40},levels:{support:94,majorSupport:88,resistance:110,breakout:114,invalidation:84},volatility:{atr14:4}};
const baseCompany={fundamentalSignal:{score:72},fiveYearRecord:{score:74,revenueTrend:'Strong'},rawMetrics:{revGrowth:22,niGrowth:18,opMargin:18,fcf:100,leverage:45,grossMargin:55}};
const contextNoValuation={profile:{finnhubIndustry:'Biotechnology'},surprises:[{surprisePercent:5},{surprisePercent:3},{surprisePercent:2}],recommendations:[{strongBuy:3,buy:4,hold:2,sell:0,strongSell:0},{strongBuy:2,buy:4,hold:3,sell:0,strongSell:0}],summary:{tone:'neutral'}};
test('missing valuation is N/A, not zero bearish evidence',()=>{const d=buildInvestorDecision({market,company:baseCompany,context:contextNoValuation});assert.equal(d.factors.valuation,null);assert.equal(d.factorAvailability.valuation,false);assert.ok(d.opportunityScore>0);});
test('analyst target absence does not create synthetic Street target',()=>{const d=buildInvestorDecision({market,company:baseCompany,context:contextNoValuation});assert.equal(d.streetTarget,null);});
test('factor correlation audit identifies duplicated signal families',()=>{const rows=Array.from({length:30},(_,i)=>({a:i,b:i*2+1,c:(i%7)*3}));const out=factorCorrelationAudit(rows,['a','b','c']);assert.ok(out.some(x=>x.a==='a'&&x.b==='b'&&Math.abs(x.correlation)>.95));});

test('portfolio concentration changes sizing gate without changing thesis',()=>{const r=analyzePortfolioRisk([{symbol:'A',marketValue:70},{symbol:'B',marketValue:15},{symbol:'C',marketValue:15}]);assert.equal(r.riskLabel,'HIGH');assert.equal(r.sizingGate,'BLOCK ADD');assert.equal(r.maxNewPositionPct,0);});

test("preliminary hypergrowth valuation cannot publish absolute price zones",()=>{
  const m={...market,price:210,scores:{...market.scores},levels:{...market.levels},volatility:{...market.volatility}};
  const context={enabled:true,metrics:{psTTM:10},recommendations:[],surprises:[],profile:{finnhubIndustry:"Software"}};
  const company={fundamentalSignal:{score:72},fiveYearRecord:{score:70},rawMetrics:{revGrowth:40,opMargin:5,fcf:1,leverage:30}};
  const d=buildInvestorDecision({market:m,company,context,owns:false});
  assert.ok(d); assert.equal(d.valuationValidity?.zonesAllowed,false); assert.equal(d.valuationRange,null);
  assert.equal(d.zones.some(z=>z.label.startsWith("Fundamental")),false);
});
