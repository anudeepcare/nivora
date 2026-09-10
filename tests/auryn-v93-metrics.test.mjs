import test from 'node:test';
import assert from 'node:assert/strict';

let metrics,policy,materialize;
try {
  metrics=await import('../.engine-test/auryn/v93/metrics.js');
  policy=await import('../.engine-test/auryn/v93/policy.js');
  materialize=await import('../.engine-test/auryn/v91/materialize.js');
} catch {}

const day=(n)=>new Date(Date.UTC(2019,0,1+n)).toISOString().slice(0,10);
const make=(n,{rawAlpha=2,costBps=10}={})=>Array.from({length:n},(_,i)=>{
  const signal=i%2?1:-1;
  return {
    featureId:'f',symbol:`S${i%12}`,asOf:day(i),archetype:i%2?'GROWTH':'COMPOUNDER',sector:['TECH','INDUSTRIALS','HEALTH'][i%3],regime:i%2?'RISK_ON':'RISK_OFF',horizon:'20D',signal,
    forwardReturnPct:signal*rawAlpha,benchmarkReturnPct:0,maxDrawdownPct:-5,costBps
  };
});

test('V9.3 metrics use purged OOS rows, bootstrap deterministically and report robustness breadth',()=>{
  assert.ok(metrics&&policy,'V9.3 metrics/policy modules must exist');
  const rows=make(360);
  const a=metrics.evaluateV93Feature('f',rows,policy.V93_POLICY);
  const b=metrics.evaluateV93Feature('f',rows,policy.V93_POLICY);
  assert.deepEqual(a,b);
  assert.ok(a.oosN>=80);
  assert.equal(a.validFoldCount,4);
  assert.ok(a.oosAvgEdgePct>1.8);
  assert.ok(a.costStressOosAvgEdgePct>1.7);
  assert.ok(a.oosConfidence95.low>0);
  assert.ok(a.oosInformationCoefficient>.9);
  assert.equal(a.oosHitRatePct,100);
  assert.ok(a.regimesCovered>=2 && a.regimePositivePct>=60);
  assert.ok(a.archetypesCovered>=2 && a.archetypePositivePct>=60);
  assert.ok(a.sectorsCovered>=2 && a.sectorPositivePct>=60);
  assert.equal(a.positiveFoldPct,100);
});

test('V9.3 exposes when an apparent OOS edge does not survive 2x transaction-cost stress',()=>{
  assert.ok(metrics&&policy,'V9.3 metrics/policy modules must exist');
  const r=metrics.evaluateV93Feature('f',make(360,{rawAlpha:.15,costBps:10}),policy.V93_POLICY);
  assert.ok(r.oosAvgEdgePct>0);
  assert.ok(r.costStressOosAvgEdgePct<0);
});

test('V9.1 materialization carries sector into V9.3 feature observations',()=>{
  assert.ok(materialize,'V9.1 materializer must exist');
  const base=Array.from({length:3},(_,i)=>({
    symbol:'X',asOf:day(i),archetype:'GROWTH',sector:'TECH',regime:'RISK_ON',benchmarkSymbol:'SPY',close:100+i,
    metrics:{rsi14:1+i},outcomes:{'20D':{horizon:'20D',sessions:20,forwardReturnPct:2,benchmarkReturnPct:0,maxDrawdownPct:-3}},costBps:5
  }));
  const candidate={id:'x',baseMetric:'rsi14',family:'MOMENTUM',theory:'RSI',transform:'LEVEL',horizon:'20D',context:'NONE'};
  const out=materialize.materializeFeatureShard(base,[candidate]);
  assert.ok(out.observations.length>0);
  assert.equal(out.observations[0].sector,'TECH');
});
