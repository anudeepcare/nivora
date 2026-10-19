import test from 'node:test';import assert from 'node:assert/strict';
import {decisionGuide} from '../lib/decision-guide.ts';import {demoData} from './fixtures/demo.ts';
import {holdingAttention,pricedInvestmentReturns} from '../lib/product-attention.ts';
test('a fresh observed quote after the research snapshot does not request another refresh',()=>{
 const r={...demoData.research.MSFT,retrievedAt:'2026-10-19T14:00:00Z',priceObservedAt:'2026-10-19T14:38:00Z',quote:{...demoData.research.MSFT.quote,asOf:'2026-10-19T14:38:00Z',session:'Live · regular session',stale:false}};
 assert.notEqual(decisionGuide(r).buying.label,'Refresh price');
 assert.equal(decisionGuide({...r,quote:{...r.quote,asOf:'2026-10-19T14:41:00Z'}}).buying.label,'Refresh price');
 assert.equal(decisionGuide({...r,priceObservedAt:'2026-10-19T14:45:00Z'}).buying.label,'Refresh price');
});
const positions=[{id:'a',symbol:'A',quantity:2,cost:50,currency:'USD',assetType:'stock'},{id:'b',symbol:'B',quantity:1,cost:100,currency:'USD',assetType:'stock'},{id:'c',symbol:'C',quantity:1,cost:10,currency:'USD',assetType:'stock'}];
const quotes={A:{price:100,currency:'USD',stale:false},B:{price:200,currency:'USD',stale:false}};
test('partial returns stay usable while unpriced and unknown-cost holdings stay explicit',()=>{
 const x=pricedInvestmentReturns(positions,quotes);assert.equal(x.pnl,200);assert.equal(x.cost,200);assert.equal(x.returnPct,100);assert.equal(x.covered,2);assert.equal(x.total,3);assert.equal(x.complete,false);
 const missing=pricedInvestmentReturns(positions.map(p=>({...p,currency:null})),quotes);assert.equal(missing.pnl,null);assert.equal(missing.covered,0);
});
test('attention ranks supplied upcoming events by actual USD exposure and deduplicates events',()=>{
 const e={symbol:'A',kind:'Earnings',date:'2026-10-28',detail:'After market close'};
 const x=holdingAttention(positions,quotes,[e,e,{...e,symbol:'B'},{...e,symbol:'C'},{...e,symbol:'A',date:'2026-10-01'}],'2026-10-19');
 assert.equal(x.length,3);assert.equal(x[0].value,200);assert.equal(x[0].weight,50);assert.equal(x.filter(v=>v.symbol==='A').length,1);assert.equal(x.find(v=>v.symbol==='C').value,null);
});
test('risk summary counts each earnings holding once and separates crypto from cash',async()=>{
 const {portfolioRiskSummary}=await import('../lib/product-attention.ts');
 const e={symbol:'A',kind:'Earnings',date:'2026-10-23',detail:''};
 const x=portfolioRiskSummary([...positions,{id:'cash',symbol:'USD',quantity:100,cost:1,currency:'USD',assetType:'cash'}],quotes,[e,e,{...e,symbol:'B',date:'2026-11-03'}],'2026-10-19');
 assert.equal(x.earningsValue,200);assert.equal(x.earningsWeight,40);assert.equal(x.topThree,80);assert.equal(x.crypto,0);
});
