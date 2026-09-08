import test from 'node:test';
import assert from 'node:assert/strict';

let evalMod, stats;
try { evalMod=await import('../.engine-test/auryn/v9/evaluation.js'); stats=await import('../.engine-test/auryn/v9/statistics.js'); } catch {}

const obs=(i,signal,ret,bench=0,regime=i%2?'RISK_ON':'RISK_OFF',arch='AI_DATA_CENTER_INFRA')=>({featureId:'f',symbol:`S${i%20}`,asOf:`2024-${String(1+Math.floor(i/28)).padStart(2,'0')}-${String(1+i%28).padStart(2,'0')}`,archetype:arch,regime,horizon:'20D',signal,forwardReturnPct:ret,benchmarkReturnPct:bench,maxDrawdownPct:-Math.abs(ret)/2,costBps:10});

test('feature evaluation is chronological, cost-adjusted and reports OOS evidence',()=>{
  assert.ok(evalMod,'V9 evaluation module must exist');
  const rows=Array.from({length:100},(_,i)=>obs(i,1,i<60?2:3,0));
  const r=evalMod.evaluateFeature('f',rows,{inSampleFraction:.6});
  assert.equal(r.totalN,100);
  assert.equal(r.inSampleN,60);
  assert.equal(r.outOfSampleN,40);
  assert.ok(r.outOfSampleAvgEdgePct>2.8 && r.outOfSampleAvgEdgePct<3);
  assert.ok(r.outOfSampleConfidence95.low>0);
  assert.ok(r.regimesCovered>=2);
});

test('information coefficient rewards signal/forward-alpha alignment',()=>{
  const rows=Array.from({length:120},(_,i)=>{const s=i%2?1:-1;return obs(i,s,s*2.5,0)});
  const r=evalMod.evaluateFeature('f',rows);
  assert.ok(r.informationCoefficient>.9);
});

test('Benjamini-Hochberg controls false-discovery q values monotonically',()=>{
  assert.ok(stats,'V9 statistics module must exist');
  const out=stats.benjaminiHochberg([{id:'a',pValue:.001},{id:'b',pValue:.01},{id:'c',pValue:.2},{id:'d',pValue:.8}],.05);
  const m=Object.fromEntries(out.map(x=>[x.id,x]));
  assert.equal(m.a.significant,true);
  assert.equal(m.b.significant,true);
  assert.equal(m.d.significant,false);
  assert.ok(m.a.qValue<=m.b.qValue && m.b.qValue<=m.c.qValue && m.c.qValue<=m.d.qValue);
});
