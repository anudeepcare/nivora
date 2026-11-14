// Compiled-handler contract test. All account/provider/storage transports are synthetic.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import {setupFixtureAccess,fixtureAccessResponse} from './fixture-access.mjs';
const require=createRequire(import.meta.url), build=path.resolve(process.argv[2]??'.next');
process.env.NODE_ENV='production';
process.env.NEXT_PUBLIC_SUPABASE_URL='https://account.example.invalid';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='fixture-public';
process.env.EODHD_API_KEY='fixture-eod';
for(const key of ['EODHD_API_TOKEN','TWELVE_DATA_API_KEY','MARKETDATA_TOKEN','FINNHUB_API_KEY','SEC_USER_AGENT'])delete process.env[key];
setupFixtureAccess();
process.env.VERCEL_ENV='preview';
process.env.SENTISENSE_API_KEY='fixture-sentisense-not-real';
process.env.SENTISENSE_KEY_EXPIRES_AT=new Date(Date.now()+2*86400000).toISOString();
process.env.AURYN_SENTISENSE_PREVIEW_ENABLED='false';
let user=process.env.AURYN_OWNER_USER_ID;
const now=new Date().toISOString(),today=now.slice(0,10),sourceCalls=[],guards=new Map();
const target={ticker:'TEST',targetLow:80,targetMean:120,targetHigh:160,numberOfAnalysts:12,updatedAt:now,updatedAtEpoch:Math.floor(Date.parse(now)/1000),currentPrice:1,upsidePercent:999,strongBuy:0,buy:0,hold:0,sell:0,strongSell:0};
globalThis.fetch=async(input,options={})=>{
 const u=new URL(String(input));
 const access=fixtureAccessResponse(input);if(access)return access;
 if(u.pathname==='/auth/v1/user')return Response.json({id:user,email_confirmed_at:'2026-01-01'});
 if(u.pathname==='/rest/v1/auryn_request_limits'){
  const method=options.method??'GET';
  if(method==='POST'){
   const row=JSON.parse(options.body);assert.match(row.key,/^[a-f0-9]{64}$/);assert.ok(Number.isInteger(row.count));
   if(guards.has(row.key))return Response.json({code:'23505'},{status:409});
   guards.set(row.key,row);return new Response(null,{status:201});
  }
  if(method==='DELETE'){
   const k=u.searchParams.get('key')?.replace(/^eq\./,''),row=guards.get(k),count=u.searchParams.get('count'),expiry=u.searchParams.get('expires_at');
   if(row&&(!count||row.count===Number(count.replace(/^eq\./,'')))&&(!expiry||Date.parse(row.expires_at)<=Date.parse(expiry.replace(/^lte\./,''))))guards.delete(k);
   return new Response(null,{status:204});
  }
  throw Error('Unexpected guard method '+method);
 }
 if(u.hostname==='app.sentisense.ai'){
  assert.equal(options.headers['X-SentiSense-API-Key'],'fixture-sentisense-not-real');assert.equal(options.redirect,'error');
  sourceCalls.push(u.pathname);
  if(u.pathname==='/api/v1/stocks/TEST/profile')return Response.json({ticker:'TEST',currency:'usd',primaryExchange:'XNYS',country:'United States'});
  if(u.pathname==='/api/v1/analyst/TEST/consensus')return Response.json({isPreview:true,data:target});
  throw Error('Unexpected target path');
 }
 if(u.hostname==='eodhd.com'){
  if(u.pathname.includes('/exchange-symbol-list/'))return Response.json([{Code:'TEST',Name:'Synthetic Company',Country:'USA',Exchange:'NYSE',Currency:'USD',Type:'Common Stock'}]);
  if(u.pathname.includes('/real-time/'))return Response.json({code:'TEST.US',timestamp:Math.floor(Date.now()/1000),open:100,high:101,low:99,close:100,previousClose:100,volume:10,change_p:0});
  if(u.pathname.includes('/fundamentals/'))return Response.json({General:{Code:'TEST',Name:'Synthetic Company',Exchange:'NYSE',CurrencyCode:'USD',CountryISO:'US',UpdatedAt:today},AnalystRatings:{TargetPrice:90,Buy:4,Hold:2},Highlights:{MarketCapitalization:1000}});
  if(u.pathname.includes('/eod/'))return Response.json([{date:today,open:100,high:101,low:99,close:100,volume:10}]);
  if(u.pathname.includes('/splits/'))return Response.json([]);
 }
 throw Error('Unexpected controlled transport '+u.hostname+u.pathname);
};
const route=require(path.join(build,'server/app/api/research/[symbol]/route.js')).routeModule.userland;
const get=async()=>{const response=await route.GET(new Request('https://preview.example.invalid/api/research/TEST',{headers:{authorization:'Bearer fixture'}}),{params:Promise.resolve({symbol:'TEST'})});const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));return data;};
const disabled=await get();assert.equal(sourceCalls.length,0);assert.equal(disabled.analystTargets,undefined);assert.equal(disabled.evidence.consensus.target,90);
process.env.AURYN_SENTISENSE_PREVIEW_ENABLED='true';
const enabled=await get();assert.deepEqual([enabled.analystTargets?.low,enabled.analystTargets?.target,enabled.analystTargets?.high],[80,120,160]);assert.equal(enabled.analystTargets.source,'SentiSense');assert.equal(enabled.quote.price,100);assert.equal(enabled.evidence.consensus.target,90);assert.equal(enabled.evidence.consensus.buy,4);assert.equal(sourceCalls.length,2);assert.equal(guards.size,0);assert.ok(!JSON.stringify(enabled).includes('fixture-sentisense'));
await get();assert.equal(sourceCalls.length,2);
user='00000000-0000-4000-8000-000000000001';assert.equal((await get()).analystTargets,undefined);assert.equal(sourceCalls.length,2);
user=process.env.AURYN_OWNER_USER_ID;process.env.VERCEL_ENV='production';assert.equal((await get()).analystTargets,undefined);assert.equal(sourceCalls.length,2);
process.env.VERCEL_ENV='preview';process.env.SENTISENSE_KEY_EXPIRES_AT=new Date(Date.now()-1000).toISOString();assert.equal((await get()).analystTargets,undefined);assert.equal(sourceCalls.length,2);
const result={passed:true,checks:['disabled-no-provider-call','owner-preview-complete-independent-band','primary-price-evidence-preserved','server-guard-latch-released','cache-no-extra-request','nonowner-withheld','production-withheld','expired-key-withheld','credential-not-in-response'],providerCalls:sourceCalls.length,transport:'controlled fixtures; no network'};
if(!process.argv[2])fs.writeFileSync('verification/sentisense-preview-20261114/compiled-route-results.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
