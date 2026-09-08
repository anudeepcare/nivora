import test from 'node:test';
import assert from 'node:assert/strict';
let research,fred; try{research=await import('../.engine-test/auryn/v92/research-events.js');fred=await import('../.engine-test/auryn/v92/fred.js')}catch{}

test('V9.2 turns historical earnings releases into point-in-time events only on the release date',()=>{
  assert.ok(research,'V9.2 earnings/revisions adapter must exist');
  const rows=research.normalizeTwelveDataEarnings('AAA',{earnings:[{date:'2024-04-25',time:'After Hours',eps_estimate:1.1,eps_actual:1.3,difference:.2,surprise_prc:18.18}]});
  assert.ok(rows.some(x=>x.metric==='earnings_eps_actual'&&x.value===1.3&&x.availableAt==='2024-04-25'));
  assert.ok(rows.some(x=>x.metric==='earnings_eps_estimate'&&x.value===1.1&&x.availableAt==='2024-04-25'));
  assert.ok(rows.some(x=>x.metric==='earnings_surprise_pct'&&x.value===18.18&&x.availableAt==='2024-04-25'));
});

test('V9.2 revision and sector adapters require explicit public availability and never infer it from period end',()=>{
  assert.ok(research);
  const rows=research.normalizePointInTimeResearchRows([
    {symbol:'AAA',metric:'eps_revision_breadth',value:.25,periodEnd:'2024-06-30',availableAt:'2024-05-01',family:'REVISION'},
    {symbol:'AAA',metric:'sector_relative_strength',value:1.2,availableAt:'2024-05-02',family:'SECTOR'}
  ]);
  assert.equal(rows[0].availableAt,'2024-05-01');
  assert.throws(()=>research.normalizePointInTimeResearchRows([{symbol:'AAA',metric:'eps_revision_breadth',value:.5,periodEnd:'2024-06-30',family:'REVISION'}]),/availableAt|availability/i);
});

test('V9.2 ALFRED/FRED macro adapter uses realtime_start as availability so revised macro data cannot leak backward',()=>{
  assert.ok(fred,'V9.2 FRED vintage adapter must exist');
  const rows=fred.normalizeFredVintageObservations('DFF','rates_regime',{observations:[
    {date:'2024-01-01',realtime_start:'2024-01-02',realtime_end:'2024-02-01',value:'5.33'},
    {date:'2024-01-01',realtime_start:'2024-02-02',realtime_end:'9999-12-31',value:'5.34'}
  ]});
  assert.deepEqual(rows.map(x=>[x.periodEnd,x.availableAt,x.value]),[['2024-01-01','2024-01-02',5.33],['2024-01-01','2024-02-02',5.34]]);
});


test('V9.2 derives point-in-time earnings surprise streak without using future releases',()=>{
  assert.ok(research);
  const rows=research.normalizeTwelveDataEarnings('AAA',{earnings:[
    {date:'2024-01-20',eps_estimate:1,eps_actual:1.1,difference:.1,surprise_prc:10},
    {date:'2024-04-20',eps_estimate:1,eps_actual:1.2,difference:.2,surprise_prc:20},
    {date:'2024-07-20',eps_estimate:1,eps_actual:.9,difference:-.1,surprise_prc:-10}
  ]});
  const streak=rows.filter(x=>x.metric==='surprise_streak').map(x=>[x.availableAt,x.value]);
  assert.deepEqual(streak,[['2024-01-20',1],['2024-04-20',2],['2024-07-20',-1]]);
});
