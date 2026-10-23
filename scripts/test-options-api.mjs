// Built-handler tests with synthetic auth and dataset transport. No live provider calls.
import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),route=require('../.next/server/app/api/options/[symbol]/route.js').routeModule.userland;
process.env.NEXT_PUBLIC_SUPABASE_URL='https://options-fixture.invalid';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='fixture';process.env.AURYN_ACCESS_ENABLED='false';process.env.AURYN_SHARED_MARKET_GUARD='false';process.env.EODHD_API_KEY='fixture-not-a-secret';process.env.AURYN_OPTIONS_ENABLED='false';
let vendor=0;globalThis.fetch=async(input)=>{const u=new URL(String(input));if(u.pathname==='/auth/v1/user')return Response.json({id:'fixture-user',email:'fixture@example.invalid',app_metadata:{},user_metadata:{}});if(u.hostname==='eodhd.com'){vendor++;assert.equal(u.pathname,'/api/mp/unicornbay/options/contracts');assert.equal(u.searchParams.get('filter[underlying_symbol]'),'APP');return Response.json({data:[{attributes:{contract:'APP280121C00100000',type:'call',strike:100,exp_date:'2028-01-21',tradetime:'2026-10-22',bid:10,ask:11,open_interest:200,gamma:.02,volatility:.4}}],meta:{total:1}})}throw Error('Unexpected request '+u.pathname)};
const req=(symbol,auth=true)=>new Request('https://auryn.example/api/options/'+symbol,{headers:auth?{Authorization:'Bearer fixture'}:{}}),ctx=s=>({params:Promise.resolve({symbol:s})});
let r=await route.GET(req('APP',false),ctx('APP'));assert.equal(r.status,401);
r=await route.GET(req('APP'),ctx('APP'));assert.equal(r.status,200);assert.equal((await r.json()).status,'unavailable');assert.equal(vendor,0);
r=await route.GET(req('BTC/USD'),ctx('BTC/USD'));assert.equal(r.status,400);assert.equal(vendor,0);
process.env.AURYN_OPTIONS_ENABLED='true';r=await route.GET(req('APP'),ctx('APP'));assert.equal(r.status,200);const data=await r.json();assert.equal(data.contracts.length,1);assert.equal(data.complete,true);assert.equal(data.contracts[0].oi,200);assert.equal(vendor,1);
r=await route.GET(req('APP'),ctx('APP'));assert.equal(r.status,200);assert.equal(vendor,1);
console.log('5 options API checks passed: auth, disabled entitlement, instrument validation, normalized chain, shared read cache. Synthetic transport only.');
