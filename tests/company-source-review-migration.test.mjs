import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
test('source-review PostgreSQL migration permits server append/read and denies browser writes and audit mutation',async()=>{
 const db=new PGlite();try{
 await db.exec('create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);grant usage on schema public,auth to anon,authenticated,service_role;');
 const file=fs.readdirSync('supabase/migrations').find(f=>f.endsWith('_auryn_company_source_reviews.sql'));const sql=fs.readFileSync(`supabase/migrations/${file}`,'utf8');await db.exec(sql);await db.exec(sql);
 const uid='11111111-1111-4111-8111-111111111111';await db.query('insert into auth.users values($1)',[uid]);await db.exec('set role service_role');
 const payload={evidenceRevision:'a'.repeat(64),citationsReviewed:true,readEvidenceIds:['source'],reviewNotes:'Reviewed disclosed share classes.',valuationReview:null,businessEvidence:[]};
 await db.query('insert into public.auryn_company_source_reviews(symbol,cik,evidence_revision,reviewed_by,payload) values($1,$2,$3,$4,$5)',['TEST','0000000001','a'.repeat(64),uid,JSON.stringify(payload)]);
 assert.equal((await db.query('select count(*)::int as count from public.auryn_company_source_reviews')).rows[0].count,1);
 await assert.rejects(()=>db.exec("update public.auryn_company_source_reviews set symbol='FAKE'"),/permission denied/);
 await assert.rejects(()=>db.exec('delete from public.auryn_company_source_reviews'),/permission denied/);
 await assert.rejects(()=>db.query('insert into public.auryn_company_source_reviews(symbol,cik,evidence_revision,reviewed_by,payload) values($1,$2,$3,$4,$5)',['TEST','0000000001','b'.repeat(64),uid,JSON.stringify(payload)]),/check constraint/);
 for(const role of ['authenticated','anon']){await db.exec(`reset role;set role ${role}`);await assert.rejects(()=>db.exec('select * from public.auryn_company_source_reviews'),/permission denied/);await assert.rejects(()=>db.exec("insert into public.auryn_company_source_reviews(symbol,cik,evidence_revision,reviewed_by,payload) values('TEST','1','abc',null,'{}')"),/permission denied/);}
 await db.exec('reset role');assert.equal((await db.query("select relrowsecurity from pg_class where relname='auryn_company_source_reviews'")).rows[0].relrowsecurity,true);
 }finally{await db.close();}
});
