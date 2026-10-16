import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// Run with PAPER_SQL_TEST_MODULE pointing to an installed @electric-sql/pglite ESM entry.
const modulePath=process.env.PAPER_SQL_TEST_MODULE||"@electric-sql/pglite";
test('paper migration enforces lease fencing, pause and browser isolation in PostgreSQL',async()=>{
 const {PGlite}=await import(modulePath);const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to authenticated,service_role;create table public.nivora_provider_health(id bigint generated always as identity primary key);`);
  for(const file of ['supabase/20260901_nivora_v61_trading_lab.sql','supabase/20260901_nivora_v61_trading_lab_console.sql','supabase/20260904_v65_trading_runs.sql'])await db.exec(fs.readFileSync(file,'utf8'));
  const migration=fs.readdirSync('supabase/migrations').find(x=>x.endsWith('_auryn_paper_execution_safety.sql'));assert.ok(migration);
  const sql=fs.readFileSync(`supabase/migrations/${migration}`,'utf8');await db.exec(sql);await db.exec(sql);
  const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
  await db.exec(`insert into auth.users values('${a}'),('${b}');set role service_role;`);
  const lease=async(owner,operation)=>(await db.query('select public.auryn_paper_lease($1,$2) as ok',[owner,operation])).rows[0].ok;
  assert.equal(await lease(a,'acquire'),false,'new deployment starts paused');
  await db.exec('update public.auryn_paper_control set paused=false');
  assert.equal(await lease(a,'acquire'),true);assert.equal(await lease(b,'acquire'),false);assert.equal(await lease(b,'release'),false);
  await db.exec('update public.auryn_paper_control set paused=true');assert.equal(await lease(a,'renew'),false);
  assert.equal(await lease(a,'release'),true);assert.equal(await lease(b,'observe'),true);assert.equal(await lease(b,'renew'),false);assert.equal(await lease(b,'release'),true);await db.exec('update public.auryn_paper_control set paused=false');assert.equal(await lease(b,'acquire'),true);
  await db.exec("update public.auryn_paper_control set lease_until=now()-interval '1 second'");assert.equal(await lease(b,'renew'),false);assert.equal(await lease(a,'acquire'),true);
  await db.exec(`insert into public.auryn_manual_paper_orders(id,user_id,symbol,side,quantity,limit_price,status) values('${a}','${a}','TEST','BUY',1,10,'accepted'),('${b}','${b}','TEST','BUY',1,10,'accepted');reset role;set role authenticated;`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);
  assert.equal((await db.query('select count(*)::int as n from public.auryn_manual_paper_orders')).rows[0].n,1);
  await assert.rejects(()=>lease(a,'acquire'),/permission denied/);
  await assert.rejects(()=>db.exec('update public.auryn_paper_control set paused=false'),/permission denied/);
  await assert.rejects(()=>db.exec("update public.auryn_manual_paper_orders set status='filled'"),/permission denied/);
 }finally{await db.close()}
});
