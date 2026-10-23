import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeQuote} from '../lib/market.ts';
test('extended observation retains its actual trade time, session and price',()=>{
 const now=Date.parse('2026-10-22T22:00:00Z');
 const q=normalizeQuote({close:'218.50',timestamp:now/1000-30,currency:'USD',is_market_open:false,is_extended_hours:true,previous_close:'220',percent_change:'-0.68'},'BE',now);
 assert.equal(q.session,'After-hours');assert.equal(q.stale,false);assert.equal(q.price,218.5);assert.equal(q.asOf,'2026-10-22T21:59:30.000Z');
 const old=normalizeQuote({close:217.77,timestamp:Date.parse('2026-10-22T19:59:00Z')/1000,currency:'USD',is_market_open:false},'BE',now);
 assert.equal(old.stale,true);assert.equal(old.session,'Last available close');
});
test('extended request falls back only on explicit entitlement denial and remembers it for one hour',async()=>{
 const {readExtendedQuote}=await import('../lib/extended-quote.ts');const calls=[];let now=0;
 const read=async(endpoint,params)=>{calls.push({endpoint,params});if(params.prepost)throw Object.assign(new Error('not entitled'),{entitlementDenied:true});return {close:10};};
 const cache={deniedUntil:0};await readExtendedQuote(read,'BE',cache,now);await readExtendedQuote(read,'APP',cache,now+1000);
 assert.deepEqual(calls.map(x=>x.params.prepost??'false'),['true','false','false']);
 calls.length=0;await assert.rejects(()=>readExtendedQuote(async()=>{throw Error('timeout')},'BE',{deniedUntil:0},100),/timeout/);assert.equal(calls.length,0);
 calls.length=0;await readExtendedQuote(read,'BTC/USD',{deniedUntil:0},100);assert.equal(calls[0].params.prepost,undefined);
});
test('EODHD fallback and display freshness cannot hide an old close during extended hours',async()=>{
 const {normalizeEodQuote}=await import('../lib/eodhd-normalize.ts');const {quoteHealth}=await import('../lib/quote-health.ts');const now=Date.parse('2026-10-22T22:00:00Z');
 const q=normalizeEodQuote('BE',{code:'BE.US',close:217.77,timestamp:Date.parse('2026-10-22T19:59:00Z')/1000},now);assert.equal(q.stale,true);
 assert.equal(quoteHealth({...q,stale:false},now).stale,true);
 const recent=normalizeEodQuote('BE',{code:'BE.US',close:218,timestamp:(now-20*60000)/1000},now);assert.equal(recent.stale,false);assert.match(recent.source,/delayed/);
});
test('regular quotes use last_quote_at rather than the daily candle opening timestamp',()=>{
 const now=Date.parse('2026-10-23T05:00:00Z'),close=Date.parse('2026-10-22T19:59:00Z')/1000;
 const q=normalizeQuote({close:217.77,timestamp:Date.parse('2026-10-22T13:30:00Z')/1000,last_quote_at:close,currency:'USD',is_market_open:false},'BE',now);
 assert.equal(q.asOf,'2026-10-22T19:59:00.000Z');assert.equal(q.price,217.77);
});
test('extended price uses its own timestamp and never inherits the regular close price or change',()=>{
 const now=Date.parse('2026-10-22T22:00:00Z');
 const raw={close:217.77,previous_close:238.5,percent_change:-8.7,timestamp:Date.parse('2026-10-22T13:30:00Z')/1000,last_quote_at:Date.parse('2026-10-22T19:59:00Z')/1000,extended_price:'225.00',extended_timestamp:now/1000-30,currency:'USD',is_market_open:false};
 const q=normalizeQuote(raw,'BE',now);assert.equal(q.price,225);assert.equal(q.asOf,'2026-10-22T21:59:30.000Z');assert.equal(q.session,'After-hours');assert.ok(Math.abs(q.changePct-(225/238.5-1)*100)<1e-8);
 const older=normalizeQuote({...raw,extended_timestamp:raw.last_quote_at-600},'BE',now);assert.equal(older.price,217.77);assert.equal(older.asOf,'2026-10-22T19:59:00.000Z');
});
