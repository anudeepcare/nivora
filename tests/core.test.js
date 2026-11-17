import test from 'node:test';
import assert from 'node:assert/strict';
import { RateAwareCache } from '../src/server/cache.js';
import { calculatePace } from '../src/domain/pace.js';
import { calculateScenarios } from '../src/domain/scenarios.js';
import { validateUniverse } from '../src/domain/validation.js';

test('cache deduplicates concurrent loads and respects ttl', async () => {
  let calls = 0;
  const cache = new RateAwareCache({ now: () => 1000 });
  const loader = async () => { calls++; return { value: 7 }; };
  const [a, b] = await Promise.all([cache.getOrLoad('x', 60, loader), cache.getOrLoad('x', 60, loader)]);
  assert.equal(calls, 1); assert.deepEqual(a, b); assert.equal(a.cache, 'miss');
  assert.equal((await cache.getOrLoad('x', 60, loader)).cache, 'hit');
});
test('cache does not store rate limits or provider errors',async()=>{let calls=0;const cache=new RateAwareCache();const loader=async()=>{calls++;return{status:'rate-limited',data:null}};await cache.getOrLoad('x',60,loader);await cache.getOrLoad('x',60,loader);assert.equal(calls,2)});
test('cache key includes request parameters deterministically',()=>{assert.notEqual(RateAwareCache.key('history','AAPL',{from:'2025-01-01'}),RateAwareCache.key('history','AAPL',{from:'2026-01-01'}));assert.equal(RateAwareCache.key('news','AAPL',{limit:10,from:'x'}),RateAwareCache.key('news','AAPL',{from:'x',limit:10}))});

test('pace returns documented P0-P4 dollar zones from dated monthly history', () => {
  const rows = Array.from({ length: 18 }, (_, i) => ({ close: 100-i*2, date: new Date(Date.UTC(2025,i,28)).toISOString().slice(0,10) }));
  const result = calculatePace(rows,{currency:'USD',asOf:rows.at(-1).date});
  assert.equal(result.status,'available');assert.match(result.zone,/^P[0-4]$/);assert.deepEqual(Object.keys(result.boundaries),['P2','P3','P4']);
  assert.ok(result.boundaries.P4 < result.boundaries.P3 && result.boundaries.P3 < result.boundaries.P2);assert.equal('score' in result,false);
});
test('pace rejects zero closes, invalid dates and unsupported currency',()=>{const good=Array.from({length:12},(_,i)=>({date:`2025-${String(i+1).padStart(2,'0')}-28`,close:100+i}));assert.equal(calculatePace([...good.slice(0,11),{date:'2025-12-28',close:0}],{currency:'USD'}).status,'insufficient');assert.equal(calculatePace(good.map(x=>({...x,date:'bad'})),{currency:'USD'}).status,'insufficient');assert.equal(calculatePace(good,{currency:'JPY'}).status,'ineligible')});
test('pace never assumes an unknown security currency is USD',()=>{const rows=Array.from({length:14},(_,i)=>({date:new Date(Date.UTC(2025,i,28)).toISOString().slice(0,10),close:100+i}));const x=calculatePace(rows,{asOf:rows.at(-1).date});assert.equal(x.status,'ineligible');assert.match(x.reason,/currency/i)});

test('pace rejects sparse and non-finite histories honestly', () => {
  assert.equal(calculatePace([{ close: 1 }],{currency:'USD'}).status, 'insufficient');
  assert.equal(calculatePace(Array(30).fill({ close: NaN }),{currency:'USD'}).status, 'insufficient');
});

test('fundamental scenarios preserve bear below base below bull without analyst targets', () => {
  const x = calculateScenarios({price:120,currency:'USD',fundamentals:{revenueTTM:1_000_000_000,operatingMargin:.2,netCash:100_000_000,sharesOutstanding:100_000_000},estimates:{revenueGrowth:.08}});
  assert.ok(x.bear.price < x.base.price && x.base.price < x.bull.price);
  assert.ok(x.drivers.length >= 3);
  assert.equal(x.model,'fundamental-earnings');assert.equal(x.analystTargetsIncluded,false);assert.equal(x.drivers.some(d=>/analyst/i.test(d.name)),false);
});
test('scenarios reject nulls, negatives, unsupported currency and never emit negative prices',()=>{const base={price:10,currency:'USD',fundamentals:{revenueTTM:100,operatingMargin:.2,netCash:-1000,sharesOutstanding:10},estimates:{revenueGrowth:.05}};assert.equal(calculateScenarios({...base,fundamentals:{...base.fundamentals,revenueTTM:null}}).status,'insufficient');assert.equal(calculateScenarios({...base,currency:'JPY'}).status,'ineligible');const x=calculateScenarios(base);assert.ok(x.bear.price>=0&&x.base.price>=0&&x.bull.price>=0)});
test('scenarios reject finite inputs whose intermediate arithmetic overflows',()=>{const x=calculateScenarios({price:10,currency:'USD',fundamentals:{revenueTTM:1e308,operatingMargin:.5,netCash:0,sharesOutstanding:1},estimates:{revenueGrowth:.5}});assert.notEqual(x.status,'available');assert.match(x.reason,/finite intermediate/i)});
test('scenario labels retain their own assumptions under high growth',()=>{const x=calculateScenarios({price:50,currency:'USD',fundamentals:{revenueTTM:1e9,operatingMargin:.3,netCash:0,sharesOutstanding:1e8},estimates:{revenueGrowth:.5}});assert.equal(x.bear.name,'Bear');assert.equal(x.base.name,'Base');assert.equal(x.bull.name,'Bull');assert.ok(x.bear.price<=x.base.price&&x.base.price<=x.bull.price)});
test('scenario assumptions remain ordered under collapse growth and extreme margins',()=>{for(const [growth,margin] of [[-.8,.2],[.05,.9]]){const x=calculateScenarios({price:50,currency:'USD',fundamentals:{revenueTTM:1e9,operatingMargin:margin,netCash:0,sharesOutstanding:1e8},estimates:{revenueGrowth:growth}});assert.equal(x.status,'available');assert.ok(x.bear.assumptions.revenueGrowth<=x.base.assumptions.revenueGrowth);assert.ok(x.base.assumptions.revenueGrowth<=x.bull.assumptions.revenueGrowth);assert.ok(x.bear.assumptions.operatingMargin<=x.base.assumptions.operatingMargin);assert.ok(x.base.assumptions.operatingMargin<=x.bull.assumptions.operatingMargin);assert.ok(x.bear.price<=x.base.price&&x.base.price<=x.bull.price)}});
test('pace rejects split-like discontinuities instead of emitting nonpositive zones',()=>{const rows=Array.from({length:18},(_,i)=>({date:new Date(Date.UTC(2025,i,28)).toISOString().slice(0,10),close:i===8?10000:100+i}));const x=calculatePace(rows,{currency:'USD'});assert.equal(x.status,'ineligible');assert.match(x.reason,/split|outlier/i)});
test('pace rejects partial monthly series and explicitly stale histories',()=>{const partial=Array.from({length:12},(_,i)=>({date:new Date(Date.UTC(2025,i*2,28)).toISOString().slice(0,10),close:100+i}));assert.equal(calculatePace(partial,{currency:'USD'}).status,'insufficient');const complete=Array.from({length:12},(_,i)=>({date:new Date(Date.UTC(2025,i,28)).toISOString().slice(0,10),close:100+i}));const stale=calculatePace(complete,{currency:'USD',asOf:'2026-06-01'});assert.equal(stale.status,'insufficient');assert.match(stale.reason,/stale/i)});
test('pace rejects historical monthly observations that end well before month end',()=>{const partial=Array.from({length:13},(_,i)=>({date:new Date(Date.UTC(2025,i,3)).toISOString().slice(0,10),close:100+i})),current={date:'2026-02-17',close:120},result=calculatePace([...partial,current],{currency:'USD',asOf:'2026-02-17'});assert.equal(result.status,'insufficient');assert.match(result.reason,/month-end coverage/i)});
test('pace retains exact current price when classification is within a cent of a boundary',()=>{const rows=Array.from({length:12},(_,i)=>({date:new Date(Date.UTC(2025,10+i,28)).toISOString().slice(0,10),close:100})),current={date:'2026-11-17',close:90.004},result=calculatePace([...rows,current],{currency:'USD',asOf:'2026-11-17'});assert.equal(result.status,'available');assert.equal(result.boundaries.P2,90);assert.equal(result.zone,'P1');assert.equal(result.currentPrice,90.004)});
test('pace rejects future rows and excludes the unfinished month from its baseline',()=>{const settled=Array.from({length:13},(_,i)=>({date:new Date(Date.UTC(2025,9+i,28)).toISOString().slice(0,10),close:100+i}));const current={date:'2026-11-17',close:200};const x=calculatePace([...settled,current],{currency:'USD',asOf:'2026-11-17'});assert.equal(x.status,'available');assert.equal(x.currentPrice,200);assert.ok(x.cycleAverage<120);const future=calculatePace([...settled,current,{date:'2027-01-02',close:210}],{currency:'USD',asOf:'2026-11-17'});assert.equal(future.status,'insufficient');assert.match(future.reason,/future/i)});

test('synthetic model validation is never described as ticker coverage', () => {
  const symbols = Array.from({ length: 512 }, (_, i) => `SYNTHETIC_CASE_${i}`);
  const report = validateUniverse(symbols);
  assert.equal(report.requested, 512); assert.equal(report.passed + report.failed + report.skipped, 512);
  assert.equal(report.mode, 'synthetic-model-fixtures'); assert.equal(report.passed, 512);assert.equal(report.securityCoverage,false);
});

test('coverage summary never conflates offline fixtures with live validation', async () => {
  const { buildCoverageReport } = await import('../src/domain/validation.js');
  const report=buildCoverageReport(['AAPL','MSFT']);
  assert.equal(report.offlineStructural.mode,'synthetic-model-fixtures');
  assert.equal(report.liveProvider.status,'not-run');
  assert.match(report.liveProvider.reason,/credentials/i);
  assert.equal(report.parityClaim,false);
});
