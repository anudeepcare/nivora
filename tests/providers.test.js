import test from 'node:test';
import assert from 'node:assert/strict';
import { EodhdProvider } from '../src/server/providers/eodhd.js';
import { SentiSenseProvider } from '../src/server/providers/sentisense.js';
import { EntitlementTracker } from '../src/server/entitlements.js';
import { QuotaScheduler } from '../src/server/quota-scheduler.js';

test('providers return unavailable without credentials and make no request', async () => {
  let calls = 0; const fetcher = async () => { calls++; };
  const e = await new EodhdProvider({ token: '', fetcher }).quote('AAPL');
  const s = await new SentiSenseProvider({ token: '', fetcher }).sentiment('AAPL');
  assert.equal(e.status, 'unavailable'); assert.equal(s.status, 'unavailable'); assert.equal(calls, 0);
});
test('unsupported SentiSense market mappings make no provider request',async()=>{let calls=0;const provider=new SentiSenseProvider({token:'x',fetcher:async()=>{calls++}});for(const result of await Promise.all([provider.rating(null),provider.analystRatings(null),provider.documents(null),provider.institutionalHolders(null),provider.optionsSummary(null)]))assert.equal(result.status,'unsupported-market');assert.equal(calls,0)});
test('providers return controlled busy state when the bounded queue is saturated',async()=>{const scheduler={schedule:async()=>({status:'busy',data:null,reason:'Provider queue is at capacity'})};for(const provider of[new SentiSenseProvider({token:'x',scheduler}),new EodhdProvider({token:'x',scheduler})]){const x=provider instanceof SentiSenseProvider?await provider.price('AAPL'):await provider.quote('AAPL');assert.equal(x.status,'busy');assert.equal(x.data,null);assert.match(x.reason,/capacity/i)}});

test('eodhd normalizes a live response with provenance', async () => {
  const fetcher = async () => ({ ok: true, json: async () => ({ code:'AAPL.US', close: 201.5, timestamp: 1700000000 }) });
  const x = await new EodhdProvider({ token:'secret', fetcher }).quote('aapl');
  assert.equal(x.status, 'live'); assert.equal(x.source, 'EODHD'); assert.equal(x.data.price, 201.5);
  assert.ok(!JSON.stringify(x).includes('secret'));
});
test('eodhd quote rejects a mismatched security and never invents a missing timestamp',async()=>{const response=body=>async()=>({ok:true,status:200,headers:{get:()=>null},json:async()=>body});const mismatch=await new EodhdProvider({token:'x',fetcher:response({code:'MSFT.US',close:100,timestamp:1700000000,currency:'USD'})}).quote('AAPL');assert.equal(mismatch.status,'malformed-response');assert.equal(mismatch.data,null);const unknownTime=await new EodhdProvider({token:'x',fetcher:response({code:'AAPL.US',close:100,currency:'USD'})}).quote('AAPL');assert.equal(unknownTime.status,'live');assert.equal(unknownTime.asOf,null)});
test('eodhd quote preserves unknown time for out-of-range timestamps',async()=>{const response=async()=>({ok:true,status:200,headers:{get:()=>null},json:async()=>({code:'AAPL.US',close:100,timestamp:1e20,currency:'USD'})}),x=await new EodhdProvider({token:'x',fetcher:response}).quote('AAPL');assert.equal(x.status,'live');assert.equal(x.asOf,null)});
test('eodhd quote preserves absent optional change fields as unknown rather than zero',async()=>{const response=async()=>({ok:true,status:200,headers:{get:()=>null},json:async()=>({code:'AAPL.US',close:100,timestamp:1700000000,currency:'USD',change:null,change_p:null})}),x=await new EodhdProvider({token:'x',fetcher:response}).quote('AAPL');assert.equal(x.data.change,null);assert.equal(x.data.changePercent,null)});

test('provider rate limits are typed, not fabricated', async () => {
  const fetcher = async () => ({ ok:false, status:429, headers:{ get:()=> '30' }, json: async()=>({}) });
  const x = await new SentiSenseProvider({ token:'secret', fetcher, scheduler:new QuotaScheduler({maxConcurrent:1,minIntervalMs:0,timeoutMs:1000}) }).sentiment('AAPL');
  assert.equal(x.status, 'rate-limited'); assert.equal(x.retryAfterSeconds, 30); assert.equal(x.data, null);
});
test('non-JSON 429 responses still apply Retry-After cooldown',async()=>{let deferred=0;const scheduler={schedule:fn=>fn(new AbortController().signal),deferFor:ms=>{deferred=ms}};const fetcher=async()=>({ok:false,status:429,headers:{get:k=>k==='retry-after'?'9':null},json:async()=>{throw Error('html')}});const x=await new SentiSenseProvider({token:'x',fetcher,scheduler}).price('AAPL');assert.equal(x.status,'rate-limited');assert.equal(x.retryAfterSeconds,9);assert.equal(deferred,9000)});
test('HTTP-date Retry-After is parsed into a bounded cooldown',async()=>{let deferred=0;const scheduler={schedule:fn=>fn(new AbortController().signal),deferFor:ms=>{deferred=ms}};const retry=new Date(Date.now()+5000).toUTCString();const fetcher=async()=>({ok:false,status:429,headers:{get:k=>k==='retry-after'?retry:null},json:async()=>({})});const x=await new EodhdProvider({token:'x',fetcher,scheduler}).quote('AAPL');assert.equal(x.status,'rate-limited');assert.ok(deferred>=3000&&deferred<=6000)});

test('sentisense uses documented header and endpoint paths', async () => {
  const calls=[]; const fetcher=async(url,options)=>{calls.push({url,options});return {ok:true,status:200,headers:{get:()=>null},json:async()=>({data:{currentPrice:123},isPreview:false})}};
  const p=new SentiSenseProvider({token:'ss_live_secret',fetcher});
  await p.price('aapl'); await p.rating('AAPL'); await p.analystRatings('AAPL'); await p.earnings('AAPL'); await p.insiders('AAPL'); await p.politicians('AAPL'); await p.screener({plan:{filters:[]},limit:25});
  assert.deepEqual(calls.map(x=>new URL(x.url).pathname),['/api/v1/stocks/price','/api/v1/rating/AAPL','/api/v1/analyst/AAPL/consensus','/api/v1/stocks/AAPL/earnings-summaries','/api/v1/insider/trades/AAPL','/api/v1/politicians/filings/AAPL','/api/v1/screener/execute']);
  assert.equal(calls.at(-1).options.method,'POST');assert.deepEqual(JSON.parse(calls.at(-1).options.body),{plan:{filters:[]},limit:25});
  assert.ok(calls.every(x=>x.options.headers['X-SentiSense-API-Key']==='ss_live_secret'));
  assert.ok(calls.every(x=>!x.url.includes('ss_live_secret')));
});

test('malformed successful payload is not labeled live',async()=>{const p=new SentiSenseProvider({token:'x',fetcher:async()=>({ok:true,status:200,headers:{get:()=>null},json:async()=>null})});const x=await p.rating('AAPL');assert.equal(x.status,'malformed-response');assert.equal(x.data,null)});
test('provider centrally rejects error envelopes on successful HTTP responses',async()=>{const response={ok:true,status:200,headers:{get:()=>null},json:async()=>({status:'error',message:'failed'})};const x=await new SentiSenseProvider({token:'x',fetcher:async()=>response}).profile('AAPL');assert.equal(x.status,'error');assert.equal(x.data,null);assert.match(x.reason,/failed/i)});
test('invalid JSON and empty success bodies are malformed, not live',async()=>{const broken=new SentiSenseProvider({token:'x',fetcher:async()=>({ok:true,status:200,headers:{get:()=>null},json:async()=>{throw Error('bad json')}})});assert.equal((await broken.rating('AAPL')).status,'malformed-response');const empty=new EodhdProvider({token:'x',fetcher:async()=>({ok:true,status:200,headers:{get:()=> '0'},json:async()=>({})})});const x=await empty.quote('AAPL');assert.equal(x.status,'malformed-response');assert.equal(x.rateLimit.remaining,0)});

test('eodhd covers research endpoint families with token only in query', async () => {
  const calls=[]; const fetcher=async url=>{calls.push(url);return {ok:true,status:200,headers:{get:()=>null},json:async()=>[]}};
  const p=new EodhdProvider({token:'secret',fetcher});
  await p.history('AAPL',{from:'2026-01-01'}); await p.fundamentals('AAPL'); await p.news('AAPL',{limit:10}); await p.sentiment('AAPL'); await p.earnings({from:'2026-01-01',to:'2026-01-31'}); await p.search('Apple'); await p.account();
  assert.deepEqual(calls.map(x=>new URL(x).pathname),['/api/eod/AAPL.US','/api/v1.1/fundamentals/AAPL.US','/api/news','/api/sentiments','/api/calendar/earnings','/api/search/Apple','/api/user']);
  assert.ok(calls.every(x=>new URL(x).searchParams.get('api_token')==='secret'));
});

test('typed errors distinguish auth, entitlement, coverage and preview', async () => {
  const response=(status,body,headers={})=>({ok:status>=200&&status<300,status,headers:{get:k=>headers[k.toLowerCase()]??null},json:async()=>body});
  const auth=await new SentiSenseProvider({token:'x',fetcher:async()=>response(401,{error:'invalid_api_key'})}).price('AAPL');
  const denied=await new SentiSenseProvider({token:'x',fetcher:async()=>response(403,{error:'pro_required'})}).rating('AAPL');
  const missing=await new SentiSenseProvider({token:'x',fetcher:async()=>response(404,{error:'no_coverage',coverage:{message:'No analyst coverage'}})}).analystRatings('AAPL');
  const preview=await new SentiSenseProvider({token:'x',fetcher:async()=>response(200,{isPreview:true,previewReason:'PRO_REQUIRED',data:[1]},{'x-ratelimit-remaining':'29'})}).insiders('AAPL');
  assert.equal(auth.status,'unauthorized'); assert.equal(denied.status,'restricted'); assert.equal(missing.status,'no-coverage'); assert.equal(preview.status,'preview'); assert.equal(preview.rateLimit.remaining,29);
});

test('entitlement tracker records evidence without claiming configured means verified', () => {
  const t=new EntitlementTracker(); t.configured('EODHD'); t.observe('EODHD','quote',{status:'live',asOf:'2026-11-17T00:00:00Z'}); t.observe('SentiSense Pro','analyst-ratings',{status:'restricted'});t.observe('SentiSense Pro','analyst-estimates',{status:'no-coverage'});
  const x=t.snapshot(); assert.equal(x.providers.EODHD.configuration,'configured'); assert.equal(x.providers.EODHD.endpoints.quote.access,'verified'); assert.equal(x.providers['SentiSense Pro'].endpoints['analyst-ratings'].access,'restricted'); assert.equal(x.providers.EODHD.plan,'unknown');
  assert.equal(x.providers['SentiSense Pro'].endpoints['analyst-estimates'].access,'unknown');
});
