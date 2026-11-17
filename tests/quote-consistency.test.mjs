import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEodQuote} from '../lib/eodhd-normalize.ts';
import {normalizeQuote} from '../lib/market.ts';
import {mergePriceTick} from '../lib/live-price.ts';
const now=Date.parse('2026-11-06T15:00:00Z');
test('EOD snapshot preserves previous close for subsequent streaming change',()=>{
 const q=normalizeEodQuote('HIMS',{code:'HIMS.US',close:26,previousClose:25,change_p:4,timestamp:now/1000},now);
 assert.equal(q.previousClose,25);
 const live=mergePriceTick(q,{symbol:'HIMS',price:27,asOf:new Date(now+1000).toISOString(),session:'Live · regular session',changePct:null},now+1000);
 assert.ok(Math.abs(live.changePct-8)<1e-8);
});
test('missing provider percentage can use explicit matching previous close',()=>{
 const q=normalizeQuote({close:26,previous_close:25,timestamp:now/1000,currency:'USD'},'HIMS',now);
 assert.ok(Math.abs(q.changePct-4)<1e-8);
 const e=normalizeEodQuote('HIMS',{code:'HIMS.US',close:25,previousClose:25,timestamp:now/1000},now);
 assert.equal(e.changePct,0);
});
test('daily change remains missing without a reference and is not carried into another session',()=>{
 const q=normalizeEodQuote('HIMS',{code:'HIMS.US',close:26,timestamp:now/1000},now);
 assert.equal(q.changePct,null);
 const next=now+86400000;
 assert.equal(mergePriceTick({...q,previousClose:25},{symbol:'HIMS',price:27,asOf:new Date(next).toISOString(),session:'Live',changePct:null},next).changePct,null);
});

test('shared quote updates notify only the owning account and reject older observations',async()=>{
 const {publishQuotes,subscribeQuotes,cachedQuotes}=await import('../lib/shared-quotes.ts');
 const a=new Map(),b=new Map();let seen=0,other=0;
 const stop=subscribeQuotes(a,()=>seen++);subscribeQuotes(b,()=>other++);
 const quote={price:26,previousClose:25,changePct:4,currency:'USD',asOf:new Date(now).toISOString(),source:'test',session:'Market open',stale:false};
 publishQuotes(a,{HIMS:{quote}});publishQuotes(a,{HIMS:{quote:{...quote,price:20,asOf:new Date(now-1000).toISOString()}}});
 assert.equal(cachedQuotes(a,['HIMS']).HIMS.quote.price,26);assert.equal(seen,1);assert.equal(other,0);
 stop();publishQuotes(a,{HIMS:{quote:{...quote,price:27}}});assert.equal(seen,1);
});

test('same observation cannot lose its supplied daily-change reference during a cache merge',async()=>{
 const {mergePortfolioQuotes}=await import('../lib/portfolio-quotes.ts');
 const quote={price:26,previousClose:25,changePct:4,currency:'USD',asOf:new Date(now).toISOString(),source:'test',session:'Market open',stale:false};
 const rows=mergePortfolioQuotes({HIMS:{quote}},{HIMS:{quote:{...quote,previousClose:undefined,changePct:null}}},['HIMS']);
 assert.equal(rows.HIMS.quote.changePct,4);assert.equal(rows.HIMS.quote.previousClose,25);
});
