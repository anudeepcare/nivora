import test from 'node:test';
import assert from 'node:assert/strict';
let mod;
try { mod=await import('../.engine-test/auryn/v91/factory.js'); } catch {}
const dates=Array.from({length:330},(_,i)=>new Date(Date.UTC(2020,0,2+i)).toISOString().slice(0,10));
const bars=(symbol,start,step)=>dates.map((date,i)=>{const close=start+i*step+(i%11===0?.5:0);return{symbol,date,open:close-.2,high:close+.8,low:close-.8,close,volume:1_000_000+(i%9)*10_000,adjusted:true};});
const bundle=()=>({
 meta:{datasetId:'v91-fixture',version:'1',source:'TEST',benchmarkSymbol:'SPY',adjustedPrices:true,pointInTimeUniverse:true,includesDelisted:true,delistingReturnsHandled:true,generatedAt:'2026-09-08T00:00:00Z'},
 securities:[{symbol:'AAA',archetype:'SOFTWARE_GROWTH',sector:'Technology',activeFrom:dates[0]},{symbol:'BBB',archetype:'MATURE',sector:'Industrials',activeFrom:dates[0]}],
 dailyBars:[...bars('AAA',100,.3),...bars('BBB',50,.1)],
 benchmarkBars:bars('SPY',300,.08),
 facts:[
  {symbol:'AAA',metric:'gross_margin',value:70,periodEnd:'2020-06-30',availableAt:dates[150]},
  {symbol:'AAA',metric:'gross_margin',value:75,periodEnd:'2020-09-30',availableAt:dates[260]},
  {symbol:'BBB',metric:'forward_pe',value:18,periodEnd:'2020-06-30',availableAt:dates[140]}
 ],
 events:[{symbol:'AAA',metric:'eps_revision_breadth',value:.4,availableAt:dates[200]}],
 universeSnapshots:[{date:dates[0],symbols:['AAA','BBB']}]
});

test('V9.1 builds deterministic compact base observations with sparse point-in-time metrics and multiple outcomes',()=>{
 assert.ok(mod,'V9.1 factory module must exist');
 const a=mod.buildHistoricalBaseObservations(bundle(),{cadence:'DAILY',minHistoryBars:60,defaultCostBps:8});
 const b=mod.buildHistoricalBaseObservations(bundle(),{cadence:'DAILY',minHistoryBars:60,defaultCostBps:8});
 assert.deepEqual(a,b,'identical bundle/options must be deterministic');
 assert.ok(a.baseObservations.length>100);
 const early=a.baseObservations.find(x=>x.symbol==='AAA'&&x.asOf<dates[150]);
 const mid=a.baseObservations.find(x=>x.symbol==='AAA'&&x.asOf>=dates[150]&&x.asOf<dates[260]);
 const late=a.baseObservations.find(x=>x.symbol==='AAA'&&x.asOf>=dates[260]);
 assert.ok(early&&mid&&late);
 assert.equal('gross_margin' in early.metrics,false,'future filing must not leak backward');
 assert.equal(mid.metrics.gross_margin,70);
 assert.equal(late.metrics.gross_margin,75,'later revision becomes visible only after availableAt');
 assert.equal(mid.costBps,8);
 assert.ok(Object.keys(mid.outcomes).includes('1D'));
 assert.ok(Object.keys(mid.outcomes).includes('20D'));
 assert.equal(a.manifest.quality,'DECISION_GRADE');
 assert.equal(a.manifest.baseObservations,a.baseObservations.length);
});

test('V9.1 drops incomplete forward horizons instead of extrapolating them',()=>{
 const r=mod.buildHistoricalBaseObservations(bundle(),{cadence:'DAILY',minHistoryBars:60});
 const last=r.baseObservations.filter(x=>x.symbol==='AAA').at(-1);
 assert.ok(last);
 assert.equal('1Y' in last.outcomes,false);
 assert.ok(Object.keys(last.outcomes).length>0,'row should remain when at least one shorter horizon is labelable');
 assert.ok(last.asOf<dates.at(-1),'final bar cannot be an observation because no forward outcome exists');
});

test('V9.1 default weekly cadence reduces storage and manifest reports missing evidence honestly',()=>{
 const daily=mod.buildHistoricalBaseObservations(bundle(),{cadence:'DAILY',minHistoryBars:60});
 const weekly=mod.buildHistoricalBaseObservations(bundle(),{minHistoryBars:60});
 assert.ok(weekly.baseObservations.length<daily.baseObservations.length/3);
 assert.ok(weekly.manifest.missingMetricCounts.iv_rank>0,'missing options history must stay visible');
 assert.ok(weekly.manifest.observationsByHorizon['1D']>0);
 assert.ok(weekly.manifest.symbolsProcessed>=2);
});

test('V9.1 refuses INVALID bundles rather than producing research rows',()=>{
 const bad=bundle();bad.meta.adjustedPrices=false;
 assert.throws(()=>mod.buildHistoricalBaseObservations(bad,{minHistoryBars:60}),/INVALID|adjusted/i);
});
