import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
function route(payload){
 const requests=[];
 const load=file=>{const m={exports:{}};const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',js)(id=>{
   if(id==='@/lib/shared-cache')return {sharedJson:async(url,...args)=>{requests.push({url:new URL(url),args});return payload}};
   if(id==='@/lib/auryn/v82/security-master')return {providerMarketHint:()=>({})};
   if(id.startsWith('@/'))return load(path.resolve(id.slice(2)+'.ts'));
   return require(id);
  },m,m.exports);return m.exports;};
 return {handler:load('app/api/chart/[symbol]/route.ts').GET,requests};
}
const point=(time,price=100)=>({datetime:new Date(time).toISOString().replace('T',' ').slice(0,19),open:String(price),high:String(price+1),low:String(price-1),close:String(price),volume:'10'});
const run=async(symbol,range,payload)=>{const old=process.env.TWELVE_DATA_API_KEY;process.env.TWELVE_DATA_API_KEY='test-only';try{const r=route(payload),res=await r.handler(new Request('http://local/api/chart/test?range='+range),{params:Promise.resolve({symbol})});return {status:res.status,body:await res.json(),requests:r.requests};}finally{if(old===undefined)delete process.env.TWELVE_DATA_API_KEY;else process.env.TWELVE_DATA_API_KEY=old;}};
test('crypto day requests enough 15-minute history without stock extended hours',async()=>{const r=await run('ETH/USD','1D',{values:[point(Date.now()-60000)]});const q=r.requests[0].url.searchParams;assert.equal(q.get('prepost'),'false');assert.equal(q.get('interval'),'15min');assert.ok(Number(q.get('outputsize'))>=96);});
test('crypto week requests a complete seven-day hourly window',async()=>{const r=await run('BTC/USD','1W',{values:[point(Date.now()-60000)]});const q=r.requests[0].url.searchParams;assert.equal(q.get('interval'),'1h');assert.ok(Number(q.get('outputsize'))>=168);});
test('provider entitlement error is a recoverable error, never a successful empty chart',async()=>{const r=await run('ZETA','1D',{status:'error',code:403,message:'Internal provider detail'});assert.equal(r.status,503);assert.match(r.body.error,/access|available/i);assert.doesNotMatch(r.body.error,/Internal provider/);});
test('provider rate limit explains retry without exposing provider internals',async()=>{const r=await run('ZETA','1W',{status:'error',code:429,message:'secret server detail'});assert.equal(r.status,503);assert.match(r.body.error,/limit|retry|try again/i);});
test('crypto day excludes old and future timestamps and sorts valid candles',async()=>{const now=Date.now();const r=await run('ETH/USD','1D',{values:[point(now-30000),point(now-25*3600000),point(now+3600000),point(now-3600000)]});assert.equal(r.body.candles.length,2);assert.ok(r.body.candles[0].time<r.body.candles[1].time);});
test('invalid price bars and duplicate timestamps cannot reach the chart',async()=>{const now=Date.now()-60000;const r=await run('ETH/USD','1D',{values:[point(now),point(now),point(now-60000,0),{...point(now-120000),datetime:'invalid'}]});assert.equal(r.body.candles.length,1);});
test('stock day shows the latest available session rather than multiple dates',async()=>{const r=await run('ZETA','1D',{meta:{exchange_timezone:'America/New_York'},values:[point(Date.parse('2026-10-14T15:00:00Z')),point(Date.parse('2026-10-15T15:00:00Z')),point(Date.parse('2026-10-15T16:00:00Z'))]});assert.equal(r.body.candles.length,2);assert.equal(r.requests[0].url.searchParams.get('prepost'),'false');});

test('recovered provider failures are retried and successful history is then cached',async()=>{
 const cached=new Map(),modules=new Map();let providerFetches=0;
 const payloads=[{status:'error',code:429,message:'temporary'}, {values:[point(Date.now()-60000)]}];
 const originalFetch=globalThis.fetch,oldKey=process.env.TWELVE_DATA_API_KEY;
 const load=file=>{
  file=path.resolve(file);if(modules.has(file))return modules.get(file).exports;
  const m={exports:{}};modules.set(file,m);
  const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',js)(id=>{
   if(id==='next/cache')return {unstable_cache:(fn,key)=>async()=>{const k=JSON.stringify(key);if(cached.has(k))return cached.get(k);const result=await fn();cached.set(k,result);return result;}};
   if(id==='@/lib/auryn/v82/security-master')return {providerMarketHint:()=>({})};
   if(id.startsWith('@/'))return load(id.slice(2)+'.ts');
   if(id.startsWith('.'))return load(path.resolve(path.dirname(file),id)+'.ts');
   return require(id);
  },m,m.exports);return m.exports;
 };
 try{
  process.env.TWELVE_DATA_API_KEY='test-only';
  globalThis.fetch=async()=>new Response(JSON.stringify(payloads[Math.min(providerFetches++,1)]),{status:200});
  const get=load('app/api/chart/[symbol]/route.ts').GET;
  const request=()=>get(new Request('http://local/api/chart/ETH%2FUSD?range=1D'),{params:Promise.resolve({symbol:'ETH/USD'})});
  assert.equal((await request()).status,503);
  const recovered=await request();assert.equal(recovered.status,200,'A Retry after provider recovery must not replay cached HTTP-200 errors');
  assert.equal((await recovered.json()).candles.length,1);
  assert.equal((await request()).status,200);assert.equal(providerFetches,2,'Only validated successes should be cached');
 }finally{globalThis.fetch=originalFetch;if(oldKey===undefined)delete process.env.TWELVE_DATA_API_KEY;else process.env.TWELVE_DATA_API_KEY=oldKey;}
});
