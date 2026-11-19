import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
test('evidence publication requires current lease and actual bounded JSONB storage; legacy stays unchanged',async()=>{
 const db=new PGlite();try{
 await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');
 await db.exec(await readFile('supabase/migrations/20261019140303_shared_market_guard.sql','utf8'));
 await db.exec(await readFile('docs/sql/market_evidence_publish_v1.sql','utf8'));
 await db.exec('set role service_role');
 const acquire=async key=>(await db.query('select public.auryn_market_acquire($1,$2,1,100,0) as r',[key,'synthetic-provider'])).rows[0].r;
 const publish=async(key,lease,value,ttl=60)=>(await db.query('select public.auryn_market_publish_evidence_v1($1,$2,$3,$4) as r',[key,lease,JSON.stringify(value),ttl])).rows[0].r;
 const probe=(await db.query('select public.auryn_market_publish_evidence_v1(null,null,null,0) as r')).rows[0].r;assert.deepEqual(probe,{stored:false,reason:'invalid-arguments'});
 const concurrent=await Promise.all([acquire('concurrent'),acquire('concurrent')]);assert.deepEqual(concurrent.map(x=>x.status).sort(),['reserved','wait']);
 const first=await acquire('evidence-good');let r=await publish('evidence-good',first.lease,{schema:'test',value:1});assert.equal(r.stored,true);assert.ok(r.expiresAt);assert.equal((await acquire('evidence-good')).value.value,1);
 const expired=await acquire('expired');await db.query("update auryn_product_private.market_cache set lease_until=clock_timestamp()-interval '1 second' where key='expired'");r=await publish('expired',expired.lease,{value:2});assert.equal(r.stored,false);assert.equal(r.reason,'lease-unavailable');
 const stolen=await acquire('stolen');r=await publish('stolen','00000000-0000-4000-8000-000000000001',{value:3});assert.equal(r.stored,false);
 const large=await acquire('large');r=await publish('large',large.lease,{data:'x'.repeat(5242881)});assert.equal(r.stored,false);assert.equal(r.reason,'payload-too-large');assert.equal((await db.query("select payload from auryn_product_private.market_cache where key='large'")).rows[0].payload,null);
 const near=await acquire('near');r=await publish('near',near.lease,{data:'x'.repeat(5242800)});assert.equal(r.stored,true);
 const legacy=await acquire('legacy');await db.query("update auryn_product_private.market_cache set lease_until=clock_timestamp()-interval '1 second' where key='legacy'");assert.equal((await db.query('select public.auryn_market_publish($1,$2,$3,60) as r',['legacy',legacy.lease,JSON.stringify({old:true})])).rows[0].r,true);
 await db.exec('reset role; set role anon');await assert.rejects(publish('x',first.lease,{x:1}),/permission denied/);
 await db.exec('reset role; set role authenticated');await assert.rejects(publish('x',first.lease,{x:1}),/permission denied/);
 }finally{await db.close();}
});
