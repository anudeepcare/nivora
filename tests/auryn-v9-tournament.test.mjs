import test from 'node:test';
import assert from 'node:assert/strict';

let tmod,pmod;
try { tmod=await import('../.engine-test/auryn/v9/tournament.js'); pmod=await import('../.engine-test/auryn/v9/promotion.js'); } catch {}

const make=(id,n,{oosEdge=2,trainEdge=2,regimes=['RISK_ON','RISK_OFF','NEUTRAL']}={})=>Array.from({length:n},(_,i)=>{
  const oos=i>=Math.floor(n*.6), signal=i%2?1:-1, edge=oos?oosEdge:trainEdge;
  return{featureId:id,symbol:`S${i%25}`,asOf:`2023-${String(1+Math.floor(i/28)).padStart(2,'0')}-${String(1+i%28).padStart(2,'0')}`,archetype:'GENERAL_COMPOUNDER',regime:regimes[i%regimes.length],horizon:'20D',signal,forwardReturnPct:signal*edge,benchmarkReturnPct:0,maxDrawdownPct:-5,costBps:5};
});

test('tournament rejects in-sample-only winners and surfaces robust OOS candidates',()=>{
  assert.ok(tmod&&pmod,'V9 tournament modules must exist');
  const overfit=make('overfit',240,{trainEdge:5,oosEdge:-2});
  const robust=make('robust',300,{trainEdge:2,oosEdge:2.5});
  const result=tmod.runFeatureTournament([...overfit,...robust],{featureIds:['overfit','robust']});
  const a=result.results.find(x=>x.featureId==='overfit');
  const b=result.results.find(x=>x.featureId==='robust');
  assert.ok(['REJECTED','UNTESTED'].includes(a.status));
  assert.ok(['OOS_SURVIVOR','SHADOW','PRODUCTION_CANDIDATE'].includes(b.status));
  assert.equal(a.promotion.eligible,false);
});

test('promotion gate requires OOS positive lower bound, breadth, sample and FDR significance',()=>{
  const metric={featureId:'x',totalN:400,inSampleN:240,outOfSampleN:160,avgEdgePct:2,outOfSampleAvgEdgePct:2.3,outOfSampleConfidence95:{mean:2.3,low:1.2,high:3.4,iterations:1000},informationCoefficient:.12,hitRatePct:61,avgMaxDrawdownPct:-8,regimesCovered:3,archetypesCovered:1,regimeStabilityPct:100,pValue:.001};
  const pass=pmod.assessFeaturePromotion(metric,.01);
  assert.equal(pass.eligible,true);
  const fail=pmod.assessFeaturePromotion({...metric,outOfSampleConfidence95:{...metric.outOfSampleConfidence95,low:-.2}},.01);
  assert.equal(fail.eligible,false);
});
