import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
test('public Free migration preserves ownership and watchlist caps; monthly allowance counts 100 distinct companies and permits revisits',async()=>{
 const d=new PGlite(),owner='00000000-0000-4000-8000-000000000001',u='00000000-0000-4000-8000-000000000002';
 try{
 await d.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text);insert into auth.users values('${owner}','owner@example.com'),('${u}','free@example.com');create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create table watchlist_items(id uuid primary key default gen_random_uuid(),user_id uuid,symbol text);grant select,insert,update,delete on watchlist_items to authenticated;`);
 for(const name of ['20261023130718_beta_access.sql','20261023144637_stripe_billing.sql'])await d.exec(await fs.readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
 await d.query("update auryn_access_config set enforced=true,owner_id=$1,body=body||'{\"mode\":\"private\",\"freeResearch\":5,\"proResearch\":100}'::jsonb",[owner]);
 await d.exec(await fs.readFile(new URL('../supabase/migrations/20261023155152_open_free_membership.sql',import.meta.url),'utf8'));
 const cfg=(await d.query('select body from auryn_access_config')).rows[0].body;assert.equal(cfg.mode,'beta');assert.equal(cfg.freeResearch,100);assert.equal(cfg.proResearch,-1);
 await d.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${u}',false)`);
 for(const symbol of ['AAPL','MSFT','APP','IREN','NBIS'])await d.query('insert into watchlist_items(user_id,symbol) values($1,$2)',[u,symbol]);
 await assert.rejects(d.query('insert into watchlist_items(user_id,symbol) values($1,$2)',[u,'META']),/Watchlist allowance/);
 await assert.rejects(d.query('insert into watchlist_items(user_id,symbol) values($1,$2)',['00000000-0000-4000-8000-000000000003','ATTACK']),/ownership/);
 await d.exec('reset role;set role service_role');
 const reserve=s=>d.query("select auryn_access_reserve($1,'research',$2,100) r",[u,s]);
 for(let i=0;i<100;i++)assert.equal((await reserve('T'+i)).rows[0].r.allowed,true);
 assert.equal((await reserve('T100')).rows[0].r.allowed,false);const revisit=(await reserve('T0')).rows[0].r;assert.equal(revisit.allowed,true);assert.equal(revisit.used,100);
 }finally{await d.close();}
});
