import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {paidThrough,validProPrice,billingReturnOrigin} from '../lib/billing-policy.ts';
import Stripe from 'stripe';
test('billing only accepts the exact monthly price and a fixed HTTPS origin',()=>{
 const p={active:true,currency:'usd',unit_amount:299,recurring:{interval:'month',interval_count:1}};
 assert.equal(validProPrice(p),true);for(const bad of [{unit_amount:29900},{currency:'eur'},{active:false},{recurring:{interval:'year',interval_count:1}},{recurring:null}])assert.equal(validProPrice({...p,...bad}),false);
 assert.equal(billingReturnOrigin('https://www.auryninvest.com'),'https://www.auryninvest.com');
 for(const url of ['http://example.com','https://user:pass@example.com','https://example.com/?next=evil','https://example.com/path'])assert.throws(()=>billingReturnOrigin(url));
});
test('failed renewals never extend paid time; successful invoices extend it without shortening existing access',()=>{
 const old='2026-10-30T00:00:00.000Z',next=Date.parse('2026-11-30')/1000;
 assert.equal(paidThrough({status:'open',lines:{data:[{period:{end:next}}]}},old),old);
 assert.equal(paidThrough({status:'paid',lines:{data:[{period:{end:next}}]}},old),'2026-11-30T00:00:00.000Z');
 assert.equal(paidThrough(null,old),old);assert.equal(paidThrough(null,null),'1970-01-01T00:00:00.000Z');
});
test('Stripe signature verification rejects tampering and expired signatures',()=>{
 const stripe=new Stripe('sk_test_fixture_only'),payload=JSON.stringify({id:'evt_fixture',object:'event'}),secret='whsec_fixture_only';
 const header=stripe.webhooks.generateTestHeaderString({payload,secret});assert.equal(stripe.webhooks.constructEvent(payload,header,secret).id,'evt_fixture');
 assert.throws(()=>stripe.webhooks.constructEvent(payload+' ',header,secret));assert.throws(()=>stripe.webhooks.constructEvent(payload,header,'whsec_wrong'));
 const expired=stripe.webhooks.generateTestHeaderString({payload,secret,timestamp:1});assert.throws(()=>stripe.webhooks.constructEvent(payload,expired,secret));
});
test('billing database denies self-promotion, leases checkout, isolates sandbox and atomically handles duplicate/stale events',async()=>{
 const d=new PGlite(),u='00000000-0000-4000-8000-000000000002';
 try{
 await d.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${u}');create table auryn_access_config(id boolean primary key,body jsonb,enforced boolean,owner_id uuid);create table auryn_beta_grants(user_id uuid,revoked_at timestamptz,expires_at timestamptz);create schema auryn_private;create table watchlist_items(id uuid,user_id uuid,symbol text);create function auth.uid() returns uuid language sql as $$select null::uuid$$;create table auryn_subscriptions(user_id uuid primary key,status text,paid_until timestamptz,updated_at timestamptz default now());`);
 await d.exec(await fs.readFile(new URL('../supabase/migrations/20261023144637_stripe_billing.sql',import.meta.url),'utf8'));
 await d.exec('set role authenticated');await assert.rejects(d.query('select * from auryn_billing_customers'));await assert.rejects(d.query("select auryn_billing_checkout_lease($1,'test')",[u]));
 await d.exec('reset role');await d.query("insert into auryn_billing_customers(user_id,mode,customer_id) values($1,'test','cus_test'),($1,'live','cus_live')",[u]);
 const lease=()=>d.query("select auryn_billing_checkout_lease($1,'test') r",[u]);const first=(await lease()).rows[0].r;assert.equal(first.allowed,true);assert.equal((await lease()).rows[0].r.allowed,false);
 await d.exec('update auryn_billing_customers set lease_until=null');assert.equal((await lease()).rows[0].r.nonce,first.nonce);
 const apply=(mode,sub,status,clock,event,cancel=false)=>d.query('select auryn_billing_apply($1,$2,$3,$4,$5,$6,$7,$8,$9)',[u,mode,'cus_'+mode,sub,status,'2030-01-01',cancel,clock,event]);
 await apply('test','sub_test','active',10,'evt_test');assert.equal((await d.query('select * from auryn_subscriptions')).rows.length,0);
 await apply('live','sub_live','active',10,'evt_1',true);let rows=(await d.query('select * from auryn_subscriptions')).rows;assert.equal(rows[0].status,'active');
 await apply('live','sub_live','canceled',20,'evt_2');await apply('live','sub_live','active',30,'evt_2');assert.equal((await d.query('select status from auryn_subscriptions')).rows[0].status,'canceled');
 await apply('live','sub_live','active',15,'evt_old');assert.equal((await d.query('select status from auryn_subscriptions')).rows[0].status,'canceled');
 await apply('live','sub_new','active',40,'evt_new');await apply('live','sub_live','canceled',50,'evt_old_cancel');assert.equal((await d.query('select status from auryn_subscriptions')).rows[0].status,'active');
 await assert.rejects(d.query("select auryn_billing_apply($1,'test','cus_wrong','sub_attack','active','2030-01-01',false,100,'evt_bad')",[u]));
 }finally{await d.close();}
});
