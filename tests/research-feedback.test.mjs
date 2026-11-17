import test from 'node:test';import assert from 'node:assert/strict';
import {researchDecision} from '../lib/decision-research.ts';
import {riskBrief} from '../lib/risk-brief.ts';
import {demoData} from './fixtures/demo.ts';
const r=demoData.research.MSFT;
test('reported cash per share survives delayed or missing quote without manufacturing market multiples',()=>{const a=researchDecision(r),b=researchDecision({...r,quote:{...r.quote,price:null,asOf:null,stale:true}});assert.ok(a.modelCashFlowPerShare>0);assert.equal(b.modelCashFlowPerShare,a.modelCashFlowPerShare);assert.equal(b.modelSbcPerShare,a.modelSbcPerShare);});
test('per-share cash still rejects expired share basis and mixed currencies',()=>{const old={...r,facts:r.facts.map(f=>f.metric==='shares'?{...f,end:'2020-01-01'}:f),quote:{...r.quote,stale:true}};assert.equal(researchDecision(old).modelCashFlowPerShare,null);assert.equal(researchDecision({...r,facts:r.facts.map(f=>f.currency==='USD'?{...f,currency:'EUR',unit:f.unit==='USD'?'EUR':f.unit}:f)}).modelCashFlowPerShare,null);});
test('risk brief uses completed evidence and keeps missing data unknown',()=>{const a=riskBrief(r),b=riskBrief({...r,quote:{...r.quote,price:null,stale:true}});assert.deepEqual(a,b);assert.equal(a.cards.length,3);assert.ok(a.cards.every(c=>c.value==null||Number.isFinite(c.value)));const empty=riskBrief({...r,history:[]});assert.ok(empty.cards.every(c=>c.value===null));assert.equal(empty.asOf,null);});
