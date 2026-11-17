import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeWatchlistEvidence,renderWatchlistQueue,WatchlistEvidenceRequests} from '../src/public/watchlist-queue.js';
import {readFile} from 'node:fs/promises';

const response=overrides=>({
  identity:{canonical:'AAPL.US'},
  analytics:{
    pace:{status:'available',zone:'P3',currentPrice:80,currency:'USD',provenance:{currentPrice:{asOf:'2026-11-16'}}},
    scenarios:{status:'available',currency:'USD',asOf:'2026-10-25',bear:{price:60},base:{price:100},bull:{price:130}}
  },
  ...overrides
});
const now=new Date('2026-11-17T12:00:00Z');

test('watchlist evidence preserves model outputs and distinct evidence dates',()=>{
  const result=normalizeWatchlistEvidence('AAPL.US',response(),{now});
  assert.deepEqual(result,{status:'available',symbol:'AAPL.US',currency:'USD',zone:'P3',currentPrice:80,bear:60,base:100,bull:130,baseGapPercent:25,priceAsOf:'2026-11-16',scenarioAsOf:'2026-10-25'});
});

test('watchlist evidence rejects mismatched, stale, and currency-inconsistent research',()=>{
  assert.equal(normalizeWatchlistEvidence('MSFT.US',response(),{now}).reason,'identity-mismatch');
  const stale=response();stale.analytics.pace.provenance.currentPrice.asOf='2026-10-01';
  assert.equal(normalizeWatchlistEvidence('AAPL.US',stale,{now}).reason,'stale-price');
  const mixed=response();mixed.analytics.scenarios.currency='EUR';
  assert.equal(normalizeWatchlistEvidence('AAPL.US',mixed,{now}).reason,'currency-mismatch');
});

test('watchlist evidence never coerces absent model prices to zero',()=>{
  for(const key of ['bear','base','bull']){
    const missing=response();missing.analytics.scenarios[key]={price:null};
    const result=normalizeWatchlistEvidence('AAPL.US',missing,{now});
    assert.equal(result.status,'unavailable');
    assert.equal(result.reason,'invalid-model-values');
  }
});

test('watchlist evidence resolves bare US aliases to the same canonical security',()=>{
  const bare=response();delete bare.identity;bare.symbol='AAPL';
  assert.equal(normalizeWatchlistEvidence('AAPL.US',bare,{now}).status,'available');
  const canonical=response();
  assert.equal(normalizeWatchlistEvidence('AAPL',canonical,{now}).status,'available');
  assert.equal(normalizeWatchlistEvidence('MSFT',bare,{now}).reason,'identity-mismatch');
});

test('watchlist request generations invalidate removed and re-added symbols',()=>{
  const requests=new WatchlistEvidenceRequests(),first=requests.next('AAPL.US');
  assert.equal(requests.isCurrent('AAPL.US',first),true);
  requests.invalidate('AAPL.US');
  const second=requests.next('AAPL.US');
  assert.equal(requests.isCurrent('AAPL.US',first),false);
  assert.equal(requests.isCurrent('AAPL.US',second),true);
});

test('watchlist queue renders truthful loading and evidence controls without ranking claims',()=>{
  const escape=value=>String(value).replaceAll('<','&lt;');
  const html=renderWatchlistQueue(['AAPL.US','<BAD>'],new Map([
    ['AAPL.US',normalizeWatchlistEvidence('AAPL.US',response(),{now})],
    ['<BAD>',{status:'loading'}]
  ]),escape);
  assert.match(html,/P3 · \$80\.00 USD/);
  assert.match(html,/Base \$100\.00 · \+25\.0%/);
  assert.match(html,/Price 2026-11-16 · fundamentals 2026-10-25/);
  assert.match(html,/data-watchlist-refresh="AAPL\.US"/);
  assert.match(html,/&lt;BAD>/);
  assert.match(html,/Loading provider evidence/);
  assert.doesNotMatch(html,/top pick|buy now|rank #/i);
});

test('watchlist page binds add remove research and on-demand refresh without bulk loading',async()=>{
  const app=await readFile(new URL('../src/public/app.js',import.meta.url),'utf8');
  assert.match(app,/renderWatchlistQueue/);
  assert.match(app,/data-watchlist-refresh/);
  assert.match(app,/data-watchlist-remove/);
  assert.match(app,/watchlist-page-form/);
  assert.match(app,/normalizeWatchlistEvidence/);
  assert.match(app,/const liveQueue=content\.querySelector/);
  assert.match(app,/watchlistEvidenceRequests\.invalidate\(result\.symbol\)/);
  assert.doesNotMatch(app,/Promise\.all\(watchlist\.symbols/);
});

test('every Watchlist mutation path uses the shared request invalidation helpers',async()=>{
  const app=await readFile(new URL('../src/public/app.js',import.meta.url),'utf8');
  assert.match(app,/function addWatchlistSymbol\(value\).*watchlistEvidenceRequests\.invalidate/s);
  assert.match(app,/function removeWatchlistSymbol\(value\).*watchlistEvidenceRequests\.invalidate/s);
  const portfolio=app.slice(app.indexOf('function bindPortfolio'),app.indexOf('function renderSettings'));
  assert.match(portfolio,/removeWatchlistSymbol\(button\.dataset\.remove\)/);
  assert.match(portfolio,/addWatchlistSymbol\(form\.elements\.symbol\.value\)/);
  assert.doesNotMatch(portfolio,/watchlist\.(?:add|remove)\(/);
});

test('successful Watchlist and Today refreshes persist customer-scoped snapshots while removal clears them',async()=>{const app=await readFile(new URL('../src/public/app.js',import.meta.url),'utf8');assert.match(app,/new WatchlistSnapshots\(userStorage\)/);assert.match(app,/watchlistSnapshots\.record\(value\)/);assert.match(app,/watchlistSnapshots\.clear\(result\.symbol\)/);assert.match(app,/bindWatchlistSnapshotSummaries\(\(\)=>watchlistSnapshots\.summaries\(\)\)/)});
test('snapshot persistence result cannot replace valid fetched provider evidence',async()=>{const app=await readFile(new URL('../src/public/app.js',import.meta.url),'utf8');assert.match(app,/watchlistEvidence\.set=\(symbol,value\)=>\{if\(value\?\.status==='available'\)watchlistSnapshots\.record\(value\);return setWatchlistEvidence\(symbol,value\)\}/)});

test('watchlist queue renders actual snapshot changes and evidence-expiry next review',()=>{const item=normalizeWatchlistEvidence('AAPL.US',response(),{now}),snapshots=new Map([['AAPL.US',{status:'changed',change:{priceDelta:4,priceDeltaPercent:5,baseGapDelta:-5,zoneFrom:'P3',zoneTo:'P2'},nextReview:'2026-11-23'}]]),html=renderWatchlistQueue(['AAPL.US'],new Map([['AAPL.US',item]]),String,snapshots);for(const term of['Price \\+\\$4\\.00 \\(\\+5\\.0%\\)','Base gap -5\\.0pp','P3 → P2','Next review by 2026-11-23'])assert.match(html,new RegExp(term));assert.doesNotMatch(html,/live change|alert/i)});
test('watchlist queue resolves bare US symbols against canonical snapshot keys',()=>{const item=normalizeWatchlistEvidence('AAPL',response(),{now}),snapshots=new Map([['AAPL.US',{status:'baseline',nextReview:'2026-11-23'}]]),html=renderWatchlistQueue(['AAPL'],new Map([['AAPL',item]]),String,snapshots);assert.match(html,/Baseline captured/);assert.match(html,/Next review by 2026-11-23/);assert.doesNotMatch(html,/No saved comparison snapshot/)});
