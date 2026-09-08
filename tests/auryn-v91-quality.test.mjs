import test from 'node:test';
import assert from 'node:assert/strict';

let mod;
try { mod=await import('../.engine-test/auryn/v91/quality.js'); } catch {}

const bar=(symbol,date,close=100,adjusted=true)=>({symbol,date,open:close-1,high:close+2,low:close-2,close,volume:1000000,adjusted});
const goodBundle=()=>({
  meta:{datasetId:'fixture',version:'1',source:'TEST',benchmarkSymbol:'SPY',adjustedPrices:true,pointInTimeUniverse:true,includesDelisted:true,delistingReturnsHandled:true,generatedAt:'2026-09-08T00:00:00Z'},
  securities:[{symbol:'AAA',archetype:'SOFTWARE_GROWTH',activeFrom:'2020-01-01'},{symbol:'OLD',archetype:'MATURE',activeFrom:'2020-01-01',activeTo:'2024-01-01',delistedDate:'2024-01-01',delistingReturnPct:-25}],
  dailyBars:[bar('AAA','2024-01-02'),bar('AAA','2024-01-03',101),bar('OLD','2024-01-02',10)],
  benchmarkBars:[bar('SPY','2024-01-02',450),bar('SPY','2024-01-03',451)],
  facts:[{symbol:'AAA',metric:'revenue_growth',value:20,periodEnd:'2023-12-31',availableAt:'2024-02-15'}],
  events:[{symbol:'AAA',metric:'eps_revision_breadth',value:.4,availableAt:'2024-03-01'}],
  universeSnapshots:[{date:'2024-01-02',symbols:['AAA','OLD']}]
});

test('V9.1 grades a complete adjusted point-in-time bundle decision grade',()=>{
  assert.ok(mod,'V9.1 quality module must exist');
  const q=mod.auditHistoricalBundle(goodBundle());
  assert.equal(q.quality,'DECISION_GRADE');
  assert.equal(q.valid,true);
  assert.equal(q.survivorshipSafe,true);
  assert.equal(q.adjustedPricesVerified,true);
  assert.equal(q.errors.length,0);
});

test('V9.1 rejects unadjusted historical bars instead of silently backtesting them',()=>{
  const b=goodBundle();
  b.dailyBars[0].adjusted=false;
  const q=mod.auditHistoricalBundle(b);
  assert.equal(q.quality,'INVALID');
  assert.ok(q.errors.some(x=>/adjusted/i.test(x)));
});

test('V9.1 exposes survivorship limitations instead of calling current-only data decision grade',()=>{
  const b=goodBundle();
  b.meta.includesDelisted=false;
  b.meta.delistingReturnsHandled=false;
  b.universeSnapshots=[];
  const q=mod.auditHistoricalBundle(b);
  assert.equal(q.quality,'LIMITED');
  assert.equal(q.survivorshipSafe,false);
  assert.ok(q.warnings.some(x=>/survivorship|delisted|universe/i.test(x)));
});

test('V9.1 rejects facts/events without an availability timestamp',()=>{
  const b=goodBundle();
  delete b.facts[0].availableAt;
  const q=mod.auditHistoricalBundle(b);
  assert.equal(q.quality,'INVALID');
  assert.ok(q.errors.some(x=>/availableAt/i.test(x)));
});

test('V9.1 rejects duplicate or invalid OHLC bars',()=>{
  const b=goodBundle();
  b.dailyBars.push({...b.dailyBars[0]});
  b.dailyBars[1]={...b.dailyBars[1],low:200};
  const q=mod.auditHistoricalBundle(b);
  assert.equal(q.quality,'INVALID');
  assert.ok(q.errors.some(x=>/duplicate/i.test(x)));
  assert.ok(q.errors.some(x=>/OHLC/i.test(x)));
});
