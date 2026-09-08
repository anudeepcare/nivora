import test from 'node:test';
import assert from 'node:assert/strict';
let pit,out;
try { pit=await import('../.engine-test/auryn/v91/point-in-time.js'); out=await import('../.engine-test/auryn/v91/outcomes.js'); } catch {}
const bar=(symbol,date,close)=>({symbol,date,open:close,high:close,low:close,close,volume:1000,adjusted:true});

test('V9.1 point-in-time resolver hides later revisions until their availableAt',()=>{
  assert.ok(pit,'point-in-time module must exist');
  const rows=[
    {symbol:'AAA',metric:'revenue_growth',value:10,periodEnd:'2023-12-31',availableAt:'2024-02-10'},
    {symbol:'AAA',metric:'revenue_growth',value:14,periodEnd:'2023-12-31',availableAt:'2024-04-01'},
    {symbol:'AAA',metric:'eps_growth',value:8,periodEnd:'2023-12-31',availableAt:'2024-02-15'}
  ];
  assert.equal(pit.latestMetricAsOf(rows,'AAA','revenue_growth','2024-03-01'),10);
  assert.equal(pit.latestMetricAsOf(rows,'AAA','revenue_growth','2024-04-02'),14);
  assert.equal(pit.latestMetricAsOf(rows,'AAA','revenue_growth','2024-01-01'),null);
});

test('V9.1 combines facts and events only when they were public by asOf',()=>{
  const facts=[{symbol:'AAA',metric:'revenue_growth',value:10,availableAt:'2024-02-10'}];
  const events=[{symbol:'AAA',metric:'eps_revision_breadth',value:.5,availableAt:'2024-03-10'}];
  assert.deepEqual(pit.resolvePointInTimeMetrics(facts,events,'AAA','2024-03-01'),{revenue_growth:10});
  assert.deepEqual(pit.resolvePointInTimeMetrics(facts,events,'AAA','2024-03-11'),{eps_revision_breadth:.5,revenue_growth:10});
});

test('V9.1 maps research horizons to trading sessions exactly',()=>{
  assert.ok(out,'outcomes module must exist');
  assert.deepEqual(out.HORIZON_SESSIONS,{'1D':1,'5D':5,'20D':20,'90D':63,'180D':126,'1Y':252});
});

test('V9.1 labels forward return, benchmark return and drawdown on exact future sessions',()=>{
  const bars=[100,105,90,110].map((c,i)=>bar('AAA',`2024-01-0${i+1}`,c));
  const bench=[200,202,204,206].map((c,i)=>bar('SPY',`2024-01-0${i+1}`,c));
  const r=out.labelForwardOutcome(bars,bench,0,'5D',{sessionsOverride:3});
  assert.ok(r);
  assert.equal(r.sessions,3);
  assert.equal(r.forwardReturnPct,10);
  assert.equal(r.benchmarkReturnPct,3);
  assert.equal(r.maxDrawdownPct,-10);
});

test('V9.1 drops outcomes when future or aligned benchmark history is incomplete',()=>{
  const bars=[bar('AAA','2024-01-02',100),bar('AAA','2024-01-03',101)];
  const bench=[bar('SPY','2024-01-02',200)];
  assert.equal(out.labelForwardOutcome(bars,bench,0,'5D'),null);
  const mismatch=[bar('SPY','2024-01-01',200),bar('SPY','2024-01-03',202)];
  assert.equal(out.labelForwardOutcome(bars,mismatch,0,'1D'),null);
});

test('V9.1 can incorporate an explicit delisting return instead of erasing failed securities',()=>{
  const bars=[bar('OLD','2024-01-02',100),bar('OLD','2024-01-03',80)];
  const bench=[bar('SPY','2024-01-02',200),bar('SPY','2024-01-03',202),bar('SPY','2024-01-04',204),bar('SPY','2024-01-05',206)];
  const r=out.labelForwardOutcome(bars,bench,0,'5D',{sessionsOverride:3,delistingReturnPct:-50});
  assert.ok(r);
  assert.equal(r.forwardReturnPct,-60);
  assert.equal(r.benchmarkReturnPct,3);
  assert.equal(r.maxDrawdownPct,-60);
});
