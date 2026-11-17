import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
test('support storage denies browser access, deduplicates retries and enforces persistent limits',async()=>{
 const db=new PGlite();try{
 await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
 await db.exec(await fs.readFile(new URL('../supabase/migrations/20261025002448_auryn_support_inbox.sql',import.meta.url),'utf8'));
 await db.exec('set role anon');await assert.rejects(db.query('select * from auryn_support_requests'),/permission denied/);
 await db.exec('reset role;set role authenticated');await assert.rejects(db.query('select * from auryn_support_requests'),/permission denied/);
 await db.exec('reset role;set role service_role');
 const body=n=>({id:`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,category:'General enquiry',email:'test@example.com',message:'A useful question about AURYN.',page:'/contact'});
 const submit=(n,hash='same')=>db.query('select auryn_submit_support($1::jsonb,$2,$3) id',[JSON.stringify(body(n)),'sender',hash]);
 assert.equal((await submit(1)).rows[0].id,body(1).id);await submit(1);
 assert.equal((await db.query('select count(*)::int n from auryn_support_requests')).rows[0].n,1);
 await assert.rejects(submit(1,'different'),/identity mismatch/);
 await submit(2);await submit(3);await assert.rejects(submit(4),/limit reached/);
 }finally{await db.close();}
});
