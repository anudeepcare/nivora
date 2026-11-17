import test from 'node:test';import assert from 'node:assert/strict';import {quoteHealth} from '../lib/quote-health.ts';
test('cached market-open labels cannot keep a twelve-minute old observation fresh',()=>{const q={price:28,currency:'USD',changePct:4,asOf:'2026-10-19T13:30:00Z',session:'Market open',source:'Twelve Data',stale:false};const result=quoteHealth(q,Date.parse('2026-10-19T13:42:00Z'));assert.equal(result.stale,true);assert.equal(result.asOf,q.asOf);assert.equal(q.stale,false);assert.equal(quoteHealth({...q,price:Infinity},Date.parse(q.asOf)).price,null);});
test('delayed data remains labelled delayed, while old streaming ticks expire sooner',()=>{const now=Date.parse('2026-10-19T14:00:00Z'),q={price:28,currency:'USD',changePct:null,asOf:'2026-10-19T13:45:00Z',session:'Delayed quote',source:'EODHD · delayed / indicative',stale:false};assert.equal(quoteHealth(q,now).stale,false);assert.equal(quoteHealth({...q,session:'Live · regular session',source:'stream'},now).stale,true);});
test('disconnected cached streamed trades keep the short freshness window',()=>{
 const q={price:28,currency:'USD',changePct:null,asOf:'2026-10-19T14:00:00Z',session:'Last streamed trade · reconnecting',source:'EODHD trade stream',stale:false};
 assert.equal(quoteHealth(q,Date.parse('2026-10-19T14:02:30Z')).stale,true);
});
