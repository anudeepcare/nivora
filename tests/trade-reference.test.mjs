import test from 'node:test';import assert from 'node:assert/strict';import {tradeReference} from '../lib/trade-reference.ts';import {demoData} from './fixtures/demo.ts';
test('manual trade reference keeps user assumptions separate and flags stale prices',()=>{
 const r=demoData.research.MSFT,input={capital:10000,risk:1,entry:100,stop:95,target:115,slippage:.1};
 const x=tradeReference(r,input);assert.ok(x);assert.match(x.text,/User-assumed target: 115.00 USD/);assert.match(x.text,/no order is submitted/);assert.match(x.text,/current spread/);
 const old=tradeReference({...r,quote:{...r.quote,stale:true}},input);assert.equal(old.fresh,false);assert.match(old.text,/QUOTE NEEDS RECHECK/);
 assert.equal(tradeReference(r,{...input,stop:120}),null);
});
