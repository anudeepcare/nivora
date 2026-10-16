import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const modulePath=process.env.WORKSPACE_SQL_TEST_MODULE||"@electric-sql/pglite";
test('workspace RLS isolates users and original journal/review evidence is immutable',async()=>{
 const {PGlite}=await import(modulePath),db=new PGlite();try{
 await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to authenticated;");
 const file=fs.readdirSync('supabase/migrations').find(s=>s.endsWith('_auryn_research_workspace.sql'));assert.ok(file);await db.exec(fs.readFileSync(`supabase/migrations/${file}`,'utf8'));
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';await db.exec(`insert into auth.users values('${a}'),('${b}');set role authenticated;`);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);
 await db.query('insert into public.auryn_research_workspace(user_id,kind,key,payload) values($1,$2,$3,$4)',[a,'watch','AAA',JSON.stringify({symbol:'AAA'})]);
 await assert.rejects(()=>db.query('insert into public.auryn_research_workspace(user_id,kind,key,payload) values($1,$2,$3,$4)',[b,'watch','BBB','{}']),/row-level security/);
 await db.query('insert into public.auryn_research_workspace(user_id,kind,key,payload) values($1,$2,$3,$4)',[a,'decision-journal','d',JSON.stringify({id:'d',kind:'DECISION',immutable:true,symbol:'AAA',thesis:'Original'})]);
 await db.exec("update public.auryn_research_workspace set payload='{}' where kind='decision-journal';delete from public.auryn_research_workspace where kind='decision-journal'");assert.equal((await db.query("select payload from public.auryn_research_workspace where kind='decision-journal'")).rows[0].payload.thesis,'Original');
 await db.query('insert into public.auryn_research_workspace(user_id,kind,key,payload) values($1,$2,$3,$4)',[a,'decision-review','r',JSON.stringify({id:'r',kind:'REVIEW',decisionId:'d',notes:'Review'})]);
 await db.exec("update public.auryn_research_workspace set payload='{}' where kind='decision-review';delete from public.auryn_research_workspace where kind='decision-review'");assert.equal((await db.query("select payload from public.auryn_research_workspace where kind='decision-review'")).rows[0].payload.notes,'Review');
 await assert.rejects(()=>db.query('insert into public.auryn_research_workspace(user_id,kind,key,payload) values($1,$2,$3,$4)',[a,'decision-review','missing',JSON.stringify({id:'missing',kind:'REVIEW',decisionId:'not-mine'})]),/foreign key/);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[b]);assert.equal((await db.query('select count(*)::int n from public.auryn_research_workspace')).rows[0].n,0);
 await assert.rejects(()=>db.query('insert into public.auryn_research_workspace(user_id,kind,key,payload) values($1,$2,$3,$4)',[b,'decision-review','r2',JSON.stringify({id:'r2',kind:'REVIEW',decisionId:'d'})]),/foreign key/);
 }finally{await db.close();}
});
