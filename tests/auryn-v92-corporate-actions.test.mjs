import test from 'node:test';
import assert from 'node:assert/strict';
let mod; try{mod=await import('../.engine-test/auryn/v92/corporate-actions.js')}catch{}
const bar=(symbol,date,close)=>({symbol,date,open:close,high:close*1.01,low:close*.99,close,volume:1000,adjusted:true});

test('V9.2 normalizes Twelve Data split and dividend histories with explicit event dates',()=>{
  assert.ok(mod,'V9.2 corporate-action adapter must exist');
  const splits=mod.normalizeTwelveDataSplits('AAPL',{splits:[{date:'2020-08-31',ratio:0.25,from_factor:4,to_factor:1,description:'4-for-1 split'}]});
  const dividends=mod.normalizeTwelveDataDividends('AAPL',{dividends:[{ex_date:'2021-08-06',amount:0.22}]});
  assert.deepEqual(splits,[{symbol:'AAPL',type:'SPLIT',date:'2020-08-31',ratio:0.25,amount:null,availableAt:'2020-08-31',source:'TWELVE_DATA'}]);
  assert.deepEqual(dividends,[{symbol:'AAPL',type:'DIVIDEND',date:'2021-08-06',ratio:null,amount:0.22,availableAt:'2021-08-06',source:'TWELVE_DATA'}]);
});

test('V9.2 corporate-action audit catches an unadjusted split signature',()=>{
  assert.ok(mod,'V9.2 corporate-action audit must exist');
  const split={symbol:'AAA',type:'SPLIT',date:'2024-06-10',ratio:0.25,amount:null,availableAt:'2024-06-10',source:'TEST'};
  const corrupted=[bar('AAA','2024-06-07',400),bar('AAA','2024-06-10',101)];
  const clean=[bar('AAA','2024-06-07',100),bar('AAA','2024-06-10',101)];
  assert.ok(mod.auditCorporateActionAdjustments(corrupted,[split]).some(x=>/split|adjust/i.test(x)));
  assert.deepEqual(mod.auditCorporateActionAdjustments(clean,[split]),[]);
});

test('V9.2 rejects impossible corporate-action values instead of silently trusting them',()=>{
  assert.ok(mod);
  assert.throws(()=>mod.normalizeTwelveDataSplits('AAA',{splits:[{date:'2024-01-01',ratio:0,from_factor:0,to_factor:1}]}),/split|ratio|factor/i);
  assert.throws(()=>mod.normalizeTwelveDataDividends('AAA',{dividends:[{ex_date:'2024-01-01',amount:-1}]}),/dividend|amount/i);
});


test('V9.2 corporate-action request builders do not send contradictory provider bounds',()=>{
  assert.ok(mod);
  const split=new URL(mod.buildTwelveDataSplitsUrl({symbol:'AAA',apiKey:'secret'}));
  assert.equal(split.pathname,'/splits');
  assert.equal(split.searchParams.get('symbol'),'AAA');
  assert.equal(split.searchParams.has('start_date'),false);
  const bounded=new URL(mod.buildTwelveDataDividendsUrl({symbol:'AAA',apiKey:'secret',startDate:'2020-01-01',endDate:'2024-12-31'}));
  assert.equal(bounded.pathname,'/dividends');
  assert.equal(bounded.searchParams.get('start_date'),'2020-01-01');
  assert.equal(bounded.searchParams.get('end_date'),'2024-12-31');
  assert.equal(bounded.searchParams.has('range'),false,'range=full would override explicit date bounds');
  const full=new URL(mod.buildTwelveDataDividendsUrl({symbol:'AAA',apiKey:'secret'}));
  assert.equal(full.searchParams.get('range'),'full');
});
