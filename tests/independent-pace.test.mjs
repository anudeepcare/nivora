import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const path='lib/independent-pace.ts';
test('independent prototype exists without legacy imports',()=>{
 assert.ok(fs.existsSync(path),'new isolated prototype must exist');
 const source=fs.readFileSync(path,'utf8');
 assert.doesNotMatch(source,/^import\s/m);
});
const run=async input=>(await import('../lib/independent-pace.ts')).proposeIndependentPace(input);
const fixture=()=>({instrument:{symbol:'SYNTHETIC',exchange:'TEST',assetType:'stock'},verification:{providerInstrumentId:'SYNTHETIC.TEST',sourceReference:'synthetic fixture, not provider data',retrievedAt:'2026-05-15T00:00:00Z',completedMonthsVerified:true,calendarReference:'synthetic calendar',latestSettledSession:'2026-05-14',eligibility:{status:'eligible',policyId:'synthetic-only',assessedOn:'2026-05-15',evidenceReferences:['synthetic-only fixture']}},asOf:'2026-05-15',source:'EODHD',currency:'USD',adjustmentBasis:'split-and-dividend-adjusted',basisVerified:true,observation:{date:'2026-05-14',close:25,settled:true},history:[{month:'2026-01',close:10},{month:'2026-02',close:20},{month:'2026-03',close:30},{month:'2026-04',close:40}],policy:{lookbackMonths:4,quantiles:[0.2,0.4,0.6,0.8]}});
test('explicit synthetic policy yields exact interpolated evidence, not a trade instruction',async()=>{
 const r=await run(fixture());assert.equal(r.status,'proposed');assert.equal(r.stage,2);assert.equal(r.instruction,null);assert.equal(r.validated,false);assert.deepEqual(r.thresholds,[16,22,28,34]);assert.equal(r.historyThrough,'2026-04');
});
test('boundary ties belong to lower price band; scaling preserves stage',async()=>{
 for(const [close,stage] of [[16,4],[22,3],[28,2],[34,1],[35,0]]){
 const f=fixture();f.observation.close=close;assert.equal((await run(f)).stage,stage);
 f.observation.close*=100;f.history.forEach(p=>p.close*=100);assert.equal((await run(f)).stage,stage);
 }
});
test('required policy and data verification fail closed',async()=>{
 for(const mutate of [f=>delete f.policy,f=>f.policy.quantiles=[.2,.2,.6,.8],f=>f.policy.lookbackMonths=1,f=>f.basisVerified=false,f=>f.currency='',f=>f.source='unknown',f=>f.observation.settled=false,f=>f.observation.close=NaN,f=>f.history[0].close=0,f=>f.adjustmentBasis='unknown']){
 const f=fixture();mutate(f);const r=await run(f);assert.equal(r.status,'unavailable');assert.equal(r.stage,null);assert.equal(r.instruction,null);
 }
});
test('no lookahead, missing months, duplicate months, stale observation, or malformed dates',async()=>{
 for(const mutate of [f=>f.history[3].month='2026-05',f=>f.history.splice(1,1),f=>f.history[2].month='2026-02',f=>f.observation.date='2026-05-16',f=>f.observation.date='2026-04-30',f=>f.asOf='2026-02-30',f=>f.history.reverse()]){
 const f=fixture();mutate(f);assert.equal((await run(f)).status,'unavailable');
 }
});
test('collapsed distribution withholds stage rather than assigning false depth',async()=>{
 const f=fixture();f.history.forEach(p=>p.close=10);assert.equal((await run(f)).status,'unavailable');
});
test('sparse arrays fail closed and never yield a false stage',async()=>{
 const f=fixture();f.policy.quantiles=Array(4);assert.equal((await run(f)).status,'unavailable');
 const g=fixture();g.history=Array(4);assert.equal((await run(g)).status,'unavailable');
});
test('increasing observed price cannot increase depth and input is not mutated',async()=>{
 const f=fixture();const before=JSON.stringify(f);let previous=4;
 for(let price=1;price<=50;price++){const r=await run({...f,observation:{...f.observation,close:price}});assert.ok(r.stage<=previous);previous=r.stage;}
 assert.equal(JSON.stringify(f),before);
});

test('identity, recognized currency, provenance, calendar and explicit eligibility are mandatory',async()=>{
 for(const mutate of [f=>delete f.instrument,f=>f.instrument.symbol='',f=>f.instrument.assetType='crypto',f=>f.verification.providerInstrumentId='OTHER.TEST',f=>f.currency='ZZZ',f=>delete f.verification,f=>f.verification.sourceReference='',f=>f.verification.retrievedAt='2026-05-16T00:00:00Z',f=>f.verification.retrievedAt='2026-05-15T24:00:00Z',f=>f.verification.completedMonthsVerified=false,f=>f.verification.calendarReference='',f=>f.verification.latestSettledSession='2026-05-15',f=>f.verification.eligibility.status='unknown',f=>f.verification.eligibility.status='ineligible',f=>f.verification.eligibility.assessedOn='2026-05-14',f=>f.verification.eligibility.evidenceReferences=[],f=>f.verification.eligibility.policyId='']){
 const f=fixture();mutate(f);const r=await run(f);assert.equal(r.status,'unavailable');assert.equal(r.stage,null);
 }
});
