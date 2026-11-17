import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
test('shared market cache leases enforce weighted quotas, isolation and one stream owner',async()=>{
 const db=new PGlite();try{
 await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');
 await db.exec(await readFile(new URL('../supabase/migrations/20261019140303_shared_market_guard.sql',import.meta.url),'utf8'));
 await db.exec('set role service_role');
 const acquire=async(key,cost=5,cap=10,remote=0)=>(await db.query('select public.auryn_market_acquire($1,$2,$3,$4,$5) as value',[key,'eodhd-test',cost,cap,remote])).rows[0].value;
 const first=await acquire('APP');assert.equal(first.status,'reserved');assert.equal(first.used,5);
 assert.equal((await acquire('APP')).status,'wait');
 const published=await db.query('select public.auryn_market_publish($1,$2,$3,$4) as ok',['APP',first.lease,JSON.stringify({price:12,asOf:'2026-10-19T14:00:00Z'}),60]);assert.equal(published.rows[0].ok,true);
 const cached=await acquire('APP',10,0);assert.equal(cached.status,'cached');assert.equal(cached.value.price,12);
 assert.equal((await acquire('OTHER',6)).status,'limited');assert.equal((await acquire('OTHER',5)).used,10);
 assert.equal((await acquire('THIRD',1)).status,'limited');
 const denied=await db.query('select public.auryn_market_publish($1,$2,$3,$4) as ok',['APP','00000000-0000-4000-8000-000000000099',JSON.stringify({price:999}),60]);assert.equal(denied.rows[0].ok,false);
 const actor='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002';
 const allow=async(user)=>(await db.query('select public.auryn_market_user_allow($1,1) as ok',[user])).rows[0].ok;assert.equal(await allow(actor),true);assert.equal(await allow(actor),false);assert.equal(await allow(other),true);
 const stream=async(owner)=>(await db.query('select public.auryn_market_stream_lease($1,$2) as ok',['token-hash',owner])).rows[0].ok;assert.equal(await stream(actor),true);assert.equal(await stream(other),false);assert.equal(await stream(actor),true);
 await db.query('select public.auryn_market_pause($1,60)',['eodhd-test']);assert.equal((await acquire('PAUSED',1,100)).status,'paused');assert.equal((await acquire('APP',1,100)).status,'cached');
 await db.exec('reset role;set role anon');await assert.rejects(acquire('private'),/permission denied/);await assert.rejects(db.query('select * from auryn_product_private.market_cache'),/permission denied/);
 }finally{await db.close();}
});
