import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchJsonCache, createResearchWarmCache, isCurrentCompanyEvidence} from '../lib/client-research-cache.mjs';

const chart=(symbol,range)=>`/api/chart/${encodeURIComponent(symbol)}?range=${range}`;
function fixture(options={}) {
  let time=1_000;
  const calls=[];
  const cache=createResearchJsonCache({now:()=>time,...options,fetcher:(url,{signal})=>new Promise((resolve,reject)=>{
    const call={url,signal,resolve:(data,status=200)=>resolve({ok:status<400,status,json:async()=>data}),reject};
    calls.push(call);
    signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});
  })});
  return {cache,calls,advance:ms=>{time+=ms}};
}

test('selected 5Y chart and roadmap share one in-flight request',async()=>{
  const {cache,calls}=fixture();
  const a=cache.get(chart('IREN','5Y'),{ttlMs:300_000});
  const b=cache.get(chart('IREN','5Y'),{ttlMs:300_000});
  assert.equal(calls.length,1);
  const response={candles:[{close:10}],range:'5Y'};
  calls[0].resolve(response);
  assert.equal(await a,response);assert.equal(await b,response);
});

test('Overview reentry and back navigation reuse a completed response without extending its TTL',async()=>{
  const {cache,calls,advance}=fixture();const url=chart('IREN','3M');
  const first=cache.get(url,{ttlMs:100});calls[0].resolve({candles:[{close:10}]});await first;
  advance(80);assert.equal(cache.peek(url,100).candles[0].close,10);
  await cache.get(url,{ttlMs:100});assert.equal(calls.length,1);
  advance(20);assert.equal(cache.peek(url,100),undefined);
  const expired=cache.get(url,{ttlMs:100});assert.equal(calls.length,2);calls[1].resolve({candles:[{close:11}]});await expired;
});

test('ranges and distinct securities, including exchange-qualified symbols, never share responses',async()=>{
  const {cache,calls}=fixture();
  const urls=[chart('IREN','3M'),chart('IREN','5Y'),chart('ABC:NYSE','3M'),chart('ABC:TSX','3M'),chart('BTC/USD','1D')];
  const requests=urls.map(url=>cache.get(url,{ttlMs:100}));
  assert.equal(calls.length,5);
  calls.forEach((call,i)=>call.resolve({securityAndRange:urls[i]}));
  const values=await Promise.all(requests);
  values.forEach((value,i)=>assert.equal(value.securityAndRange,urls[i]));
  await Promise.all(urls.map(url=>cache.get(url,{ttlMs:100})));assert.equal(calls.length,5);
});

test('one unmount cannot cancel another subscriber to the same response',async()=>{
  const {cache,calls}=fixture();const a=new AbortController(),b=new AbortController(),url=chart('IREN','5Y');
  const first=cache.get(url,{signal:a.signal,ttlMs:100});
  const rejected=assert.rejects(first,{name:'AbortError'});
  const second=cache.get(url,{signal:b.signal,ttlMs:100});
  a.abort();await rejected;assert.equal(calls.length,1);assert.equal(calls[0].signal.aborted,false);
  calls[0].resolve({candles:[1]});assert.deepEqual(await second,{candles:[1]});
});

test('Strict Mode cleanup followed by synchronous resubscription keeps one network request',async()=>{
  const {cache,calls}=fixture();const controller=new AbortController(),url=chart('IREN','3M');
  const first=cache.get(url,{signal:controller.signal,ttlMs:100});const rejected=assert.rejects(first,{name:'AbortError'});
  controller.abort();const remount=cache.get(url,{ttlMs:100});
  await rejected;assert.equal(calls.length,1);assert.equal(calls[0].signal.aborted,false);
  calls[0].resolve({candles:[1]});await remount;
});

test('last unmount aborts the underlying request and never caches a late response',async()=>{
  const {cache,calls}=fixture();const controller=new AbortController(),url=chart('IREN','3M');
  const request=cache.get(url,{signal:controller.signal,ttlMs:100});const rejected=assert.rejects(request,{name:'AbortError'});
  controller.abort();await rejected;await Promise.resolve();
  assert.equal(calls[0].signal.aborted,true);calls[0].resolve({candles:[99]});await Promise.resolve();
  assert.equal(cache.peek(url,100),undefined);
  const next=cache.get(url,{ttlMs:100});assert.equal(calls.length,2);calls[1].resolve({candles:[2]});await next;
});

test('already-aborted callers receive no cached data and start no request',async()=>{
  const {cache,calls}=fixture();const url=chart('IREN','3M');
  const first=cache.get(url,{ttlMs:100});calls[0].resolve({candles:[1]});await first;
  const controller=new AbortController();controller.abort();
  await assert.rejects(cache.get(url,{signal:controller.signal,ttlMs:100}),{name:'AbortError'});assert.equal(calls.length,1);
});

test('failed HTTP and provider responses are retryable and are not cached',async()=>{
  const {cache,calls}=fixture();const url=chart('IREN','3M');
  const failed=cache.get(url,{ttlMs:100});calls[0].resolve({error:'Quota unavailable'},429);
  await assert.rejects(failed,/Quota unavailable/);assert.equal(cache.peek(url,100),undefined);
  const provider=cache.get(url,{ttlMs:100});calls[1].resolve({error:'Provider unavailable'});
  await assert.rejects(provider,/Provider unavailable/);
  const retry=cache.get(url,{ttlMs:100});assert.equal(calls.length,3);calls[2].resolve({candles:[2]});await retry;
});

test('bounded completed-response cache evicts the least recently used security',async()=>{
  const {cache,calls}=fixture({maxEntries:2});
  for(const symbol of ['A','B']){const request=cache.get(chart(symbol,'3M'),{ttlMs:100});calls.at(-1).resolve({symbol});await request;}
  await cache.get(chart('A','3M'),{ttlMs:100});
  const third=cache.get(chart('C','3M'),{ttlMs:100});calls.at(-1).resolve({symbol:'C'});await third;
  assert.equal(cache.peek(chart('B','3M'),100),undefined);assert.equal(cache.peek(chart('A','3M'),100).symbol,'A');
  const evicted=cache.get(chart('B','3M'),{ttlMs:100});assert.equal(calls.length,4);calls.at(-1).resolve({symbol:'B'});await evicted;
});

test('cache reads preserve source freshness and timestamps verbatim',async()=>{
  const {cache,calls}=fixture();const payload={freshness:'STALE',asOf:'2026-01-01T00:00:00Z',priceState:'LAST_VERIFIED'};
  const request=cache.get('/api/canonical/IREN',{ttlMs:100});calls[0].resolve(payload);await request;
  assert.equal(await cache.get('/api/canonical/IREN',{ttlMs:100}),payload);assert.deepEqual(payload,{freshness:'STALE',asOf:'2026-01-01T00:00:00Z',priceState:'LAST_VERIFIED'});
});

test('context and ownership refreshes do not renew core or company evidence clocks',()=>{
  let time=1_000;const cache=createResearchWarmCache({now:()=>time,maxEntries:2,maxAgeMs:10_000});
  cache.merge('IREN',{d:{symbol:'IREN'}});time=2_000;cache.merge('IREN',{company:{name:'IREN'}});
  time=4_000;cache.merge('IREN',{context:{news:[]}});time=5_000;cache.merge('IREN',{institutional:{enabled:true}});
  assert.deepEqual(cache.get('IREN'),{d:{symbol:'IREN'},company:{name:'IREN'},context:{news:[]},institutional:{enabled:true},ts:1_000,companyTs:2_000,contextTs:4_000,institutionalTs:5_000});
});

test('warm research memory is bounded and expires without retimestamping persisted evidence',()=>{
  let time=1_000;const cache=createResearchWarmCache({now:()=>time,maxEntries:2,maxAgeMs:100});
  cache.set('A',{d:{symbol:'A'},ts:100});cache.merge('B',{d:{symbol:'B'}});cache.get('A');cache.merge('C',{d:{symbol:'C'}});
  assert.equal(cache.get('B'),undefined);assert.equal(cache.get('A').ts,100);
  time+=100;assert.equal(cache.get('A'),undefined);assert.equal(cache.get('C'),undefined);
});

test('unversioned or older company evidence is rejected even if its cache timestamp is recent',()=>{
  assert.equal(isCurrentCompanyEvidence({rawMetrics:{revenue:1_000_000},dataQuality:{valuationCurrency:'USD'}}),false);
  assert.equal(isCurrentCompanyEvidence({dataQuality:{contractVersion:'sec-company-evidence-v1'}}),false);
  assert.equal(isCurrentCompanyEvidence(null),false);
  assert.equal(isCurrentCompanyEvidence({dataQuality:{contractVersion:'sec-company-evidence-v2',status:'UNAVAILABLE'}}),true);
});
