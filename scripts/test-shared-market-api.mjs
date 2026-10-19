// Compiled route checks with mocked account, RPC and provider transport. No network.
import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),load=p=>require(`../.next/server/app/api/${p}/route.js`).routeModule.userland;
process.env.NEXT_PUBLIC_SUPABASE_URL='https://guard-account.example.invalid';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='fixture-public';process.env.SUPABASE_SERVICE_ROLE_KEY='fixture-service';process.env.EODHD_API_KEY='fixture-eodhd';process.env.AURYN_SHARED_MARKET_GUARD='true';delete process.env.TWELVE_DATA_API_KEY;
let mode='reserved',userAllowed=true,requests=0,publishes=0;
globalThis.fetch=async(input,init)=>{
 const u=new URL(String(input));
 if(u.pathname==='/auth/v1/user')return Response.json({id:'00000000-0000-4000-8000-000000000001',email_confirmed_at:'2026-01-01'});
 if(u.pathname.endsWith('/auryn_market_user_allow'))return Response.json(userAllowed);
 if(u.pathname.endsWith('/auryn_market_stream_lease'))return Response.json(false);
 if(u.pathname.endsWith('/auryn_market_acquire'))return Response.json(mode==='cached'?{status:'cached',value:[]}:{status:mode,lease:'00000000-0000-4000-8000-000000000011'});
 if(u.pathname.endsWith('/auryn_market_publish')){publishes++;return Response.json(true);}
 if(u.hostname==='eodhd.com'&&u.pathname==='/api/user')return Response.json({dailyRateLimit:'10000',apiRequests:'2880',apiRequestsDate:new Date().toISOString().slice(0,10)});
 if(u.hostname==='eodhd.com'&&u.pathname.startsWith('/api/search/')){requests++;return Response.json([]);}
 throw Error('Unexpected fixture request: '+u.pathname);
};
const search=load('search'),get=q=>search.GET(new Request(`http://localhost/api/search?q=${q}`,{headers:{Authorization:'Bearer fixture'}}));
assert.equal((await get('GUARDRESERVE')).status,200);assert.equal(requests,1);assert.equal(publishes,1);
mode='cached';assert.equal((await get('GUARDCACHED')).status,200);assert.equal(requests,1);
mode='limited';const denied=await get('GUARDLIMIT');assert.equal(denied.status,503);assert.match((await denied.json()).error,/daily budget/);assert.equal(requests,1);
userAllowed=false;assert.equal((await get('GUARDUSER')).status,429);assert.equal(requests,1);
userAllowed=true;const stream=await load('price-stream').GET(new Request('http://localhost/api/price-stream?symbols=APP',{headers:{Authorization:'Bearer fixture'}}));assert.equal(stream.status,503);assert.match((await stream.json()).error,/capacity/);
console.log('5 shared-market API checks passed: reservation/publish, shared hit, global cap, user quota and stream ownership.');
