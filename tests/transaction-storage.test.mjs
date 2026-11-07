import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
test('transaction ledgers isolate owners and reject stale revisions',async()=>{const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$ select current_setting('request.jwt.claim.sub',true)::uuid $$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;insert into auth.users values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');`);
 await db.exec(await fs.readFile('supabase/migrations/20261107124819_auryn_transaction_ledger.sql','utf8'));
 await db.exec(`set role authenticated;set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';insert into auryn_transaction_ledgers(user_id) values ('00000000-0000-4000-8000-000000000001');`);
 await assert.rejects(db.exec(`insert into auryn_transaction_ledgers(user_id) values ('00000000-0000-4000-8000-000000000002')`),/row-level security/);
 await db.exec(`set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002'`);assert.equal((await db.query('select * from auryn_transaction_ledgers')).rows.length,0);
 await db.exec(`set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001'`);assert.equal((await db.query('update auryn_transaction_ledgers set revision=2 where revision=1 returning revision')).rows.length,1);assert.equal((await db.query('update auryn_transaction_ledgers set revision=2 where revision=1 returning revision')).rows.length,0);
 await db.exec('reset role;set role anon');await assert.rejects(db.query('select * from auryn_transaction_ledgers'),/permission denied/);
 }finally{await db.close();}});
