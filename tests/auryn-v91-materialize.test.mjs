import test from 'node:test';
import assert from 'node:assert/strict';
let mat,reg;
try { mat=await import('../.engine-test/auryn/v91/materialize.js'); reg=await import('../.engine-test/auryn/v9/feature-registry.js'); } catch {}
const base=Array.from({length:12},(_,i)=>({symbol:'AAA',asOf:`2024-01-${String(i+1).padStart(2,'0')}`,archetype:'SOFTWARE_GROWTH',sector:'Technology',regime:'RISK_ON',benchmarkSymbol:'SPY',close:100+i,metrics:{sma20:-2+i,relative_volume:.5,ma_stack:1,sector_relative_strength:1,realized_vol20:20},outcomes:{'1D':{horizon:'1D',sessions:1,forwardReturnPct:1+i/10,benchmarkReturnPct:.2,maxDrawdownPct:-1}},costBps:8}));

test('V9.1 selects deterministic bounded candidate shards from the full V9 catalog',()=>{
 assert.ok(mat&&reg,'materializer and registry must exist');
 const a=mat.selectCandidateShard({start:100,limit:50});
 const b=mat.selectCandidateShard({start:100,limit:50});
 assert.deepEqual(a,b);
 assert.equal(a.length,50);
 assert.equal(new Set(a.map(x=>x.id)).size,50);
 assert.deepEqual(a,reg.generateFeatureCatalog().slice(100,150));
});

test('V9.1 materializes feature observations from compact history without future leakage',()=>{
 const candidate=reg.generateFeatureCatalog().find(x=>x.baseMetric==='sma20'&&x.transform==='SLOPE'&&x.horizon==='1D'&&x.context==='NONE');
 assert.ok(candidate);
 const result=mat.materializeFeatureShard(base,[candidate]);
 assert.ok(result.observations.length>5);
 assert.ok(result.observations.every(x=>x.featureId===candidate.id&&x.symbol==='AAA'&&x.horizon==='1D'));
 assert.ok(result.observations.every(x=>x.signal===1));
 const shortened=mat.materializeFeatureShard(base.slice(0,7),[candidate]);
 assert.deepEqual(result.observations.slice(0,shortened.observations.length),shortened.observations,'adding future base rows must not alter earlier materialized observations');
});

test('V9.1 context shards skip rows when required same-date confirmation is missing',()=>{
 const candidate=reg.generateFeatureCatalog().find(x=>x.baseMetric==='sma20'&&x.transform==='LEVEL'&&x.horizon==='1D'&&x.context==='SECTOR_CONFIRM');
 const missing=base.map((x,i)=>i<6?{...x,metrics:Object.fromEntries(Object.entries(x.metrics).filter(([k])=>k!=='sector_relative_strength'))}:x);
 const result=mat.materializeFeatureShard(missing,[candidate]);
 assert.ok(result.observations.every(x=>x.asOf>='2024-01-07'));
 assert.ok(result.manifest.skippedMissingContext>0);
});

test('V9.1 does not fabricate feature rows when the candidate horizon outcome is unavailable',()=>{
 const candidate=reg.generateFeatureCatalog().find(x=>x.baseMetric==='sma20'&&x.transform==='LEVEL'&&x.horizon==='1Y'&&x.context==='NONE');
 const result=mat.materializeFeatureShard(base,[candidate]);
 assert.equal(result.observations.length,0);
 assert.equal(result.manifest.skippedMissingOutcome,base.length);
});
