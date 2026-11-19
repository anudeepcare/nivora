import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {PGlite} from '@electric-sql/pglite';
const alice='00000000-0000-0000-0000-000000000001',bob='00000000-0000-0000-0000-000000000002';
function migration(){const files=fs.readdirSync('supabase/migrations').filter(x=>x.endsWith('_allow_portfolio_purchase_lots.sql'));assert.equal(files.length,1);return fs.readFileSync('supabase/migrations/'+files[0],'utf8');}
async function setup(legacy=true){const db=new PGlite();await db.exec(`create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('app.user_id',true),'')::uuid$$;grant usage on schema auth to authenticated;insert into auth.users values('${alice}'),('${bob}');`);await db.exec(fs.readFileSync('supabase/migrations/202610170000_workspace_base.sql','utf8'));if(legacy)await db.exec('create unique index portfolio_positions_user_account_symbol_uidx on public.portfolio_positions(user_id,account_name,symbol)');return db;}
async function login(db,id){await db.exec(`reset role;set role authenticated;select set_config('app.user_id','${id}',false);`);}
const insert=async(db,owner,shares=1,cost=10)=> (await db.query('insert into public.portfolio_positions(user_id,symbol,shares,avg_cost,currency) values($1,\'TEST\',$2,$3,\'USD\') returning *',[owner,shares,cost])).rows[0];
test('legacy uniqueness blocks second purchase; migration permits ten lots while preserving IDs, values, PK and owner isolation',async()=>{
 const db=await setup();try{
 await login(db,alice);const original=await insert(db,alice,1.5,12.5);await assert.rejects(insert(db,alice,2,20),e=>e.code==='23505');
 await login(db,bob);const other=await insert(db,bob,4,40);
 await db.exec('reset role');const before=(await db.query('select * from public.portfolio_positions order by user_id')).rows;await db.exec(migration());assert.deepEqual((await db.query('select * from public.portfolio_positions order by user_id')).rows,before);
 await db.exec(migration());await login(db,alice);await insert(db,alice,2,20);assert.equal((await db.query('select count(*)::int n from public.portfolio_positions')).rows[0].n,2);
 for(let i=2;i<10;i++)await insert(db,alice,i/2,10+i);
 const own=(await db.query('select * from public.portfolio_positions')).rows;assert.equal(own.length,10);assert.equal(new Set(own.map(r=>r.id)).size,10);assert.deepEqual(own.find(r=>r.id===original.id),original);
 await assert.rejects(insert(db,bob),e=>e.code==='42501');assert.equal((await db.query('update public.portfolio_positions set shares=999 where id=$1 returning id',[other.id])).rows.length,0);assert.equal((await db.query('delete from public.portfolio_positions where id=$1 returning id',[other.id])).rows.length,0);
 await assert.rejects(db.query('update public.portfolio_positions set user_id=$1 where id=$2',[bob,original.id]),e=>e.code==='42501');
 await assert.rejects(db.query('insert into public.portfolio_positions(id,user_id,symbol,shares,avg_cost) values($1,$2,\'OTHER\',1,1)',[original.id,alice]),e=>e.code==='23505');
 await login(db,bob);assert.deepEqual((await db.query('select * from public.portfolio_positions')).rows,[other]);
 await db.exec('reset role');assert.equal((await db.query('select relrowsecurity from pg_class where oid=\'public.portfolio_positions\'::regclass')).rows[0].relrowsecurity,true);assert.equal((await db.query("select count(*)::int n from pg_indexes where schemaname='public' and indexname='auryn_positions_owner'")).rows[0].n,1);
 }finally{await db.close();}
});
test('fresh UUID-only installations accept migration repeatedly without altering other unique indexes',async()=>{const db=await setup(false);try{await db.exec(migration());await db.exec(migration());await login(db,alice);await insert(db,alice);await insert(db,alice);assert.equal((await db.query('select count(*)::int n from public.portfolio_positions')).rows[0].n,2);await db.exec('reset role');assert.equal((await db.query("select count(*)::int n from pg_indexes where schemaname='public' and tablename='watchlist_items' and indexdef like 'CREATE UNIQUE%'")).rows[0].n,2);}finally{await db.close();}});
