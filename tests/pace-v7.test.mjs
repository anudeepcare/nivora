import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { classifyPaceV7, paceV7Signal } from '../lib/pace-classifier-v7.ts';
import { researchAccumulation } from '../lib/accumulation-policy-v7.ts';
import { researchAccumulation as v6 } from '../lib/accumulation-policy-v6.ts';
import { makePacePriceEvaluator } from '../lib/pace-price-evaluator.ts';
const base='verification/analyst-and-pace-20261112/';
const features=JSON.parse(fs.readFileSync(base+'features.json')).filter(r=>r.features);
const expected=new Map(JSON.parse(fs.readFileSync(base+'candidate-study.json')).rows.map(r=>[r.symbol,r]));
test('active v7 reproduces all frozen predictions and held-out 205/223 result',()=>{
 let n=0,matched=0;
 for(const r of features){const e=expected.get(r.symbol);assert.equal(classifyPaceV7(r.features),e.candidate,r.symbol);if(e.split==='heldOutFromFit'){n++;matched+=classifyPaceV7(r.features)===e.reference?1:0;}}
 assert.equal(features.length,995);assert.equal(n,223);assert.equal(matched,205);
 assert.equal(classifyPaceV7([]),null);assert.equal(classifyPaceV7(Array(42).fill(NaN)),null);
});
test('trim classes map to pause with the correct tier, independently of legacy rules',()=>{
 assert.deepEqual(paceV7Signal(5),{multiplier:0,trimTier:'light',trimReview:true});
 assert.deepEqual(paceV7Signal(6),{multiplier:0,trimTier:'strong',trimReview:true});
 assert.deepEqual(paceV7Signal(3),{multiplier:3,trimTier:null,trimReview:false});
});
test('v7 never backdates its release or changes crypto and prior history',()=>{
 const bars=JSON.parse(fs.readFileSync('tests/fixtures/pace-v6-bars.json'))[0].bars.sort((a,b)=>a.time.localeCompare(b.time));
 assert.deepEqual(researchAccumulation(bars,'2026-11-07T22:00:00Z'),v6(bars,'2026-11-07T22:00:00Z'));
 assert.deepEqual(researchAccumulation(bars,'2026-11-12T22:00:00Z','crypto'),v6(bars,'2026-11-12T22:00:00Z','crypto'));
 const extended=[...bars,{...bars.at(-1),time:'2026-11-11'}];
 const current=researchAccumulation(extended,'2026-11-12T04:00:00Z');
 assert.equal(current.forming.policyVersion,'monthly-v7');
 assert.deepEqual(current.history,v6(extended,'2026-11-12T04:00:00Z').history);
 assert.equal(makePacePriceEvaluator(extended,'monthly-v7')(extended.at(-1).close),current.forming.multiplier);
});

test('v7 public-record migration preserves append-only permissions and older versions',async()=>{
 const {PGlite}=await import('@electric-sql/pglite');const db=new PGlite();
 try{
  await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');
  await db.exec(fs.readFileSync('supabase/migrations/20261107135009_auryn_public_pace_record.sql','utf8'));
  await db.exec(fs.readFileSync('scripts/sql/enable-pace-v7.sql','utf8'));
  await db.exec('set role service_role');
  for(const policy of ['monthly-v5','monthly-v6','monthly-v7'])await db.query("insert into public.auryn_public_pace_records(symbol,signal_period,policy,pace,reference_price,quote_at,evidence_hash,policy_hash) values('APP','2026-11',$1,3,100,now(),$2,$3)",[policy,'a'.repeat(64),'b'.repeat(64)]);
  await assert.rejects(db.exec('update public.auryn_public_pace_records set pace=4'));
  await db.exec('reset role;set role anon');
  assert.equal((await db.query('select count(*) n from public.auryn_public_pace_records')).rows[0].n,3);
  await assert.rejects(db.exec("insert into public.auryn_public_pace_records(symbol) values('FAKE')"));
 }finally{await db.close();}
});
