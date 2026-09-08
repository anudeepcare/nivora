import test from 'node:test';
import assert from 'node:assert/strict';
let assemble,factory,research,fred;try{assemble=await import('../.engine-test/auryn/v92/assemble.js');factory=await import('../.engine-test/auryn/v91/factory.js');research=await import('../.engine-test/auryn/v92/research-events.js');fred=await import('../.engine-test/auryn/v92/fred.js')}catch{}
const dates=Array.from({length:80},(_,i)=>new Date(Date.UTC(2024,0,1+i)).toISOString().slice(0,10));
const bars=(symbol,start)=>dates.map((date,i)=>({symbol,date,open:start+i-.2,high:start+i+.8,low:start+i-.8,close:start+i,volume:1_000_000,adjusted:true}));

test('V9.2 sample replay at known historical dates exposes only evidence public by each as-of date',()=>{
  assert.ok(assemble&&factory&&research&&fred,'V9.2 replay integration modules must exist');
  const events=[
    ...research.normalizePointInTimeResearchRows([
      {symbol:'AAA',metric:'eps_revision_breadth',value:.2,availableAt:'2024-01-25',family:'REVISION'},
      {symbol:'AAA',metric:'eps_revision_breadth',value:.8,availableAt:'2024-02-10',family:'REVISION'},
      {symbol:'AAA',metric:'sector_relative_strength',value:1.1,availableAt:'2024-01-20',family:'SECTOR'}
    ]),
    ...fred.normalizeFredVintageObservations('DFF','rates_regime',{observations:[
      {date:'2024-01-01',realtime_start:'2024-01-15',realtime_end:'2024-02-14',value:'5.25'},
      {date:'2024-01-01',realtime_start:'2024-02-15',realtime_end:'9999-12-31',value:'5.50'}
    ]}).map(x=>({...x,symbol:'AAA'}))
  ];
  const bundle=assemble.assembleHistoricalReplayBundle({datasetId:'known-date',source:'TEST',benchmarkSymbol:'SPY',securities:[{symbol:'AAA',sector:'Technology'}],dailyBars:bars('AAA',100),benchmarkBars:bars('SPY',400),events});
  const r=factory.buildHistoricalBaseObservations(bundle,{cadence:'DAILY',minHistoryBars:20});
  const jan30=r.baseObservations.find(x=>x.asOf==='2024-01-30');
  const feb20=r.baseObservations.find(x=>x.asOf==='2024-02-20');
  assert.ok(jan30&&feb20);
  assert.equal(jan30.metrics.eps_revision_breadth,.2);
  assert.equal(jan30.metrics.rates_regime,5.25);
  assert.equal(jan30.metrics.sector_relative_strength,1.1);
  assert.equal(feb20.metrics.eps_revision_breadth,.8);
  assert.equal(feb20.metrics.rates_regime,5.5);
});
