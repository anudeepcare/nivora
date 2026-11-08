import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifyPace,paceFeatures} from '../lib/pace-classifier.ts';
import {researchAccumulation} from '../lib/accumulation-policy-v6.ts';
import {researchAccumulation as oldPolicy} from '../lib/accumulation-policy-v5.ts';
import {paceBoundary} from '../lib/pace-insights.ts';
import {perspective} from '../lib/analysis.ts';
import {publicationInput} from '../lib/pace-publication.ts';
import {PGlite} from '@electric-sql/pglite';
const golden=JSON.parse(fs.readFileSync('tests/fixtures/pace-v6-golden.json'));
const fixtures=JSON.parse(fs.readFileSync('tests/fixtures/pace-v6-bars.json'));
const at='2026-11-07T22:00:00Z';
test('exported TypeScript trees reproduce every one of 589 Python classifier predictions',()=>{
 for(const row of golden) assert.equal(classifyPace(row.features),row.expected,row.symbol);
 assert.equal(classifyPace([NaN]),null);assert.equal(classifyPace([]),null);
});
test('enabled engine changes real current zones while preserving historical readings and ignores future bars',()=>{
 for(const fixture of fixtures){
  const bars=fixture.bars.filter(b=>b.time<='2026-11-06');
  const next=researchAccumulation(bars,at),old=oldPolicy(bars,at);
  assert.equal(next.version,'monthly-v6');
  assert.equal(next.forming.multiplier,golden.find(r=>r.symbol===fixture.symbol).expected);
  assert.equal(next.confirmed.multiplier,old.confirmed.multiplier);
  assert.equal(next.confirmed.policyVersion,'monthly-v5');
  assert.equal(next.forming.buy2,0,'old simple thresholds are not exposed as new model boundaries');
  assert.deepEqual(paceBoundary(next.forming),next.forming.conditionalBoundary);
  const future={...bars.at(-1),time:'2026-11-09',open:1,high:1e6,low:1,close:1e6};
  assert.deepEqual(researchAccumulation([...bars,future],at),next);
  const before='2026-10-31T22:00:00Z';
  assert.equal(researchAccumulation(bars,before).version,'monthly-v5');
  assert.equal(researchAccumulation(bars,at,'crypto').version,'monthly-v5');
 }
});
test('features are scale invariant and insufficient observations cannot fabricate a zone',()=>{
 const bars=fixtures[0].bars;const v=oldPolicy(bars,at).forming;
 const x=paceFeatures(bars,v.z,v.deviation/100);
 const y=paceFeatures(bars.map(b=>({...b,close:b.close*10})),v.z,v.deviation/100);
 x.forEach((n,i)=>assert.ok(Math.abs(n-y[i])<1e-8));
 assert.equal(paceFeatures(bars.slice(-20),v.z,v.deviation/100),null);
});
test('Research perspective used by downstream assessments reads the enabled engine',()=>{
 const fixture=fixtures[0];
 const r={company:{symbol:fixture.symbol,assetType:'stock'},quote:{price:293.69,currency:'USD',asOf:'2026-11-06'},history:fixture.bars,facts:[],retrievedAt:at};
 assert.equal(perspective(r).dca.forming.multiplier,researchAccumulation(fixture.bars,at).forming.multiplier);
 assert.equal(perspective(r).dca.version,'monthly-v6');
});
test('public observations retain v5 and v6 separately without weakening write permissions',async()=>{
 const db=new PGlite();try{
  await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');
  await db.exec(fs.readFileSync('supabase/migrations/20261107135009_auryn_public_pace_record.sql','utf8'));
  await db.exec(fs.readFileSync('scripts/sql/enable-pace-v6.sql','utf8'));
  await db.exec('set role service_role');
  for(const policy of ['monthly-v5','monthly-v6'])await db.query("insert into public.auryn_public_pace_records(symbol,signal_period,policy,pace,reference_price,quote_at,evidence_hash,policy_hash) values('APP','2026-11',$1,3,100,now(),$2,$3)",[policy,'a'.repeat(64),'b'.repeat(64)]);
  await assert.rejects(db.exec('update public.auryn_public_pace_records set pace=4'));
  await db.exec('reset role;set role anon');
  assert.equal((await db.query('select count(*) n from public.auryn_public_pace_records')).rows[0].n,2);
  await assert.rejects(db.exec("insert into public.auryn_public_pace_records(symbol) values('FAKE')"));
 }finally{await db.close()}
 const row=publicationInput({policy:'monthly-v6',symbol:'APP',period:'2026-11',pace:3,price:100,quoteAt:'2026-12-01T20:00:00Z',stale:false,policyHash:'a'.repeat(64),evidenceHash:'b'.repeat(64)},'2026-12-02T20:00:00Z');
 assert.equal(row.policy,'monthly-v6');
});
