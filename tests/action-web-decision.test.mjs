import test from 'node:test';
import assert from 'node:assert/strict';
import * as policy from '../lib/auryn-decision.ts';
import {pacePresentation} from '../lib/pace-presentation.ts';
import {overviewEvidence} from '../lib/overview-evidence.ts';
import {demoData} from './fixtures/demo.ts';
const base={ownsPosition:false,priceUsable:true,financialsUsable:true,business:'strong',value:'attractive',extended:false,distress:false,deterioration:false,insolvency:false};
test('confirmed paused Pace blocks adding even when the business valuation supports a purchase',()=>{
 assert.equal(policy.evaluateDecision({...base,confirmedPace:0}),'Wait');
 assert.equal(policy.evaluateDecision({...base,confirmedPace:0,ownsPosition:true}),'Hold');
 assert.equal(policy.evaluateDecision({...base,confirmedPace:2}),'Buy');
 assert.equal(policy.evaluateDecision({...base,confirmedPace:2,ownsPosition:true}),'Add');
});
const funded={applicable:true,financialsUsable:true,growth:35,margin:-10,priorMargin:-20,cash:500,netDebt:-100,operatingCashFlow:-100,freeCashFlow:-200,operatingRunway:60,investmentRunway:30,dilution:5};
test('funded growth can qualify without positive operating profit or free cash flow',()=>{
 assert.equal(typeof policy.fundedGrowthCase,'function');
 assert.equal(policy.fundedGrowthCase(funded).eligible,true);
 assert.equal(policy.evaluateDecision({...base,business:'developing',growthEligible:true}),'Buy');
 assert.equal(policy.evaluateDecision({...base,business:'developing',growthEligible:true,ownsPosition:true}),'Add');
});
test('growth does not override funding, dilution, deterioration or missing evidence',()=>{
 assert.equal(typeof policy.fundedGrowthCase,'function');
 for(const patch of [{growth:19},{priorMargin:null},{cash:0},{netDebt:1},{dilution:11},{dilution:null},{investmentRunway:17},{operatingRunway:23},{financialsUsable:false},{applicable:false},{cash:NaN}]) assert.equal(policy.fundedGrowthCase({...funded,...patch}).eligible,false,JSON.stringify(patch));
 assert.equal(policy.evaluateDecision({...base,business:'developing',growthEligible:true,distress:true}),'Avoid');
 assert.equal(policy.evaluateDecision({...base,business:'developing',growthEligible:true,value:'unassessed'}),'Review');
});
test('one decision exposes entry and holder guidance without counting watchlisting as ownership',()=>{
 const r=demoData.research.MSFT;
 const d=policy.aurynDecision(r,{now:Date.parse(r.retrievedAt)});
 assert.ok(d.actions);
 assert.equal(d.actions.entry,'Buy');
 assert.equal(d.actions.holding,'Add');
 assert.equal(d.contextLabel,'For new purchases');
 const held=policy.aurynDecision(r,{ownsPosition:true,now:Date.parse(r.retrievedAt)});
 assert.equal(held.contextLabel,'For your holding');
 assert.deepEqual(held.actions,d.actions);
});
test('Pace explicitly presents accumulation only when the final action permits it',()=>{
 assert.equal(pacePresentation('Buy',4).actionLabel,'Buy gradually');
 assert.equal(pacePresentation('Add',2).effectiveCode,'P2');
 assert.equal(pacePresentation('Hold',4).effectiveCode,null);
 assert.equal(pacePresentation('Wait',4).effectiveCode,null);
 assert.equal(pacePresentation('Reduce',4).effectiveCode,null);
 assert.equal(pacePresentation('Buy',null).effectiveCode,null);
 assert.equal(pacePresentation('Buy',0).effectiveCode,null);
});
test('cash balances are dated as of a point in time and market multiples expose update dates',()=>{
 const r=structuredClone(demoData.research.MSFT);
 r.facts.push({...r.facts.find(f=>f.scope==='annual'&&f.end==='2026-06-30'),id:'cash-test',metric:'cash',value:500e9,scope:'instant',start:''});
 r.evidence={...r.evidence,updatedAt:'2026-10-16',multiples:{ForwardPE:25}};
 const e=overviewEvidence(r);
 assert.equal(e.business.find(m=>m.key==='cash').periodBasis,'As of');
 assert.equal(e.valuation.find(m=>m.key==='ForwardPE').period,'2026-10-16');
 assert.equal(e.valuation.find(m=>m.key==='ForwardPE').periodBasis,'Updated');
});
test('conflicting diluted share observations cannot support funded growth',()=>{
 const r=structuredClone(demoData.research.MSFT);
 const anchor=r.facts.find(f=>f.scope==='annual'&&f.end==='2026-06-30');
 for(const [id,value] of [['shares-a',100e6],['shares-b',200e6]]) r.facts.push({...anchor,id,metric:'weightedShares',value,unit:'shares',currency:null});
 const d=policy.aurynDecision(r,{now:Date.parse(r.retrievedAt)});
 assert.equal(d.status,'paused');
 assert.equal(d.growthAssessment.eligible,false);
});
test('workspace guidance preserves financial analysis with too little monthly price history',async()=>{
 const {workspaceGuidance}=await import('../lib/edge-research.ts');
 const r=structuredClone(demoData.research.MSFT);r.history=r.history.slice(-20);
 const d=workspaceGuidance(r,false,Date.parse(r.retrievedAt));
 assert.equal(d.multiplier,null);assert.ok(d.actions);assert.equal(d.actions.entry,'Review');assert.equal(d.actions.holding,'Review');assert.equal(d.view.effectiveCode,null);
});

test('comparable prior margin conflicts cannot qualify a growth path',()=>{
 const r=structuredClone(demoData.research.MSFT);
 const f=r.facts.find(f=>f.metric==='operatingIncome'&&f.scope==='annual'&&f.end==='2025-06-30');
 r.facts.push({...f,id:'prior-margin-conflict',value:f.value*2});
 const d=policy.aurynDecision(r,{now:Date.parse(r.retrievedAt)});
 assert.equal(d.status,'paused');assert.equal(d.growthAssessment.eligible,false);
});
