import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {GET}=require('../.next/server/app/api/auth/providers/route.js').routeModule.userland;
const before={fetch:globalThis.fetch,url:process.env.NEXT_PUBLIC_SUPABASE_URL,key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY};
try {
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='fixture-public-key';
 let calls=0;globalThis.fetch=async(url,init)=>{calls++;assert.equal(url,'https://example.supabase.co/auth/v1/settings');assert.equal(init.headers.apikey,'fixture-public-key');return Response.json({external:{google:false,x:false,twitter:true},irrelevant:'not returned'});};
 let r=await GET();assert.deepEqual(await r.json(),{google:false,x:false});assert.match(r.headers.get('cache-control'),/s-maxage=300/);assert.equal(calls,1);
 globalThis.fetch=async()=>Response.json({external:{google:true,x:true},secret:'not returned'});r=await GET();assert.deepEqual(await r.json(),{google:true,x:true});
 globalThis.fetch=async()=>{throw Error('offline')};r=await GET();assert.deepEqual(await r.json(),{google:null,x:null});assert.equal(r.headers.get('cache-control'),'no-store');
 console.log('3 public auth-provider route checks passed: disabled, enabled and unavailable; no configuration leakage.');
}finally{globalThis.fetch=before.fetch;for(const [key,value] of [['NEXT_PUBLIC_SUPABASE_URL',before.url],['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',before.key]]){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
