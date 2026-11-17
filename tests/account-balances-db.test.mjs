import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
test('account balances SQL seeds only the owner, preserves managed values on rerun and enforces cross-account isolation',async()=>{
 const db=new PGlite(),a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
 try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text);insert into auth.users values('${a}','anudeep39@gmail.com'),('${b}','other@example.invalid');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;grant usage on schema auth to authenticated;`);
 const sql=await readFile('docs/sql/ACCOUNT_BALANCES_SETUP.sql','utf8');await db.exec(sql);
 assert.equal((await db.query('select count(*)::int as n from auryn_account_balances')).rows[0].n,1);
 await db.query('update auryn_account_balances set managed_value=120500 where user_id=$1',[a]);await db.exec(sql);
 assert.equal(Number((await db.query('select managed_value from auryn_account_balances')).rows[0].managed_value),120500);
 await db.exec(`set role authenticated;set request.uid='${b}'`);
 assert.equal((await db.query('select * from auryn_account_balances')).rows.length,0);
 await assert.rejects(db.query('insert into auryn_account_balances(user_id,margin_debt) values($1,0)',[a]),/row-level security/);
 await db.query('insert into auryn_account_balances(user_id,margin_debt) values($1,100)',[b]);
 await db.exec(`set request.uid='${a}'`);
 const mine=(await db.query('select margin_debt from auryn_account_balances')).rows;assert.equal(mine.length,1);assert.equal(Number(mine[0].margin_debt),116312);
 await db.exec('reset role;set role anon');await assert.rejects(db.query('select * from auryn_account_balances'),/permission denied/);
 }finally{await db.close();}
});
