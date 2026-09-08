import test from 'node:test';
import assert from 'node:assert/strict';
let reg,tour;
try { reg=await import('../.engine-test/auryn/v9/feature-registry.js'); tour=await import('../.engine-test/auryn/v9/tournament.js'); } catch {}

test('V9 research artifacts are deterministic for identical inputs',()=>{
  assert.ok(reg&&tour);
  assert.deepEqual(reg.generateFeatureCatalog({limit:500}),reg.generateFeatureCatalog({limit:500}));
  const rows=Array.from({length:160},(_,i)=>({featureId:'f',symbol:`S${i%10}`,asOf:`2024-01-${String(1+i%28).padStart(2,'0')}T${String(Math.floor(i/28)).padStart(2,'0')}:00:00Z`,archetype:'SOFTWARE_GROWTH',regime:i%2?'RISK_ON':'RISK_OFF',horizon:'20D',signal:i%2?1:-1,forwardReturnPct:i%2?2:-2,benchmarkReturnPct:0,maxDrawdownPct:-4,costBps:5}));
  assert.deepEqual(tour.runFeatureTournament(rows,{featureIds:['f']}),tour.runFeatureTournament(rows,{featureIds:['f']}));
});
