// Compiled route verification with fixture transports only; no provider requests.
import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),route=require('../.next/server/app/api/congress/route.js').routeModule.userland;
process.env.NEXT_PUBLIC_SUPABASE_URL='https://account.example.invalid';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='fixture';process.env.AURYN_ACCESS_ENABLED='false';delete process.env.SUPABASE_SERVICE_ROLE_KEY;delete process.env.AURYN_SHARED_MARKET_GUARD;delete process.env.AURYN_REQUIRE_DISTRIBUTED_BUDGET;
let upstream=0;const today=new Date().toISOString().slice(0,10);
globalThis.fetch=async input=>{const u=new URL(String(input));if(u.pathname==='/auth/v1/user')return Response.json({id:'00000000-0000-4000-8000-000000000001'});if(u.hostname==='eodhd.com'&&u.pathname==='/api/congressional-trades'){upstream++;return Response.json({data:[{chamber:'senate',member:{full_name:'Example Member'},asset:{symbol:'ATLS'},transaction:{type:'purchase',transaction_date:today,disclosure_date:today,amount_range:'$1,001 - $15,000'},source:{filing_identifier:'fixture',filing_url:'https://efdsearch.senate.gov/search/view/ptr/fixture/'}}],meta:{total:1}});}throw Error('Unexpected fixture request '+u.pathname);};
const auth={Authorization:'Bearer fixture'};let checks=0;
assert.equal((await route.GET(new Request('https://auryn.test/api/congress?symbol=ATLS'))).status,401);checks++;
assert.equal((await route.GET(new Request('https://auryn.test/api/congress?symbol=BTC/USD',{headers:auth}))).status,400);checks++;
process.env.EODHD_API_KEY='fixture';
const r=await route.GET(new Request('https://auryn.test/api/congress?symbol=ATLS',{headers:auth}));assert.equal(r.status,200);const data=await r.json();assert.equal(data.rows[0].member,'Example Member');assert.equal(data.rows[0].amountRange,'$1,001 - $15,000');assert.equal(data.rows[0].lagDays,0);checks++;
const again=await route.GET(new Request('https://auryn.test/api/congress?symbol=ATLS',{headers:auth}));assert.equal(again.status,200);assert.equal(upstream,1);checks++;
console.log(JSON.stringify({checks,passed:checks,upstreamRequests:upstream,liveProvider:false}));
