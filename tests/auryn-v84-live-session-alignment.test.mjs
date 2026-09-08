import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCanonicalMarketSnapshot} from '../.engine-test/auryn/market-truth.js';

let alignment;
try { alignment = await import('../.engine-test/auryn/v84/price-alignment.js'); } catch {}

const q=(provider,price,age=5,freshness='LIVE',session='REGULAR',ts='2026-09-08T13:35:00.000Z')=>({provider,symbol:'TEST',price,bid:null,ask:null,spreadPct:null,changePct:null,providerTimestamp:ts,ageSeconds:age,session,freshness,isRealTime:freshness==='LIVE'});

test('regular-session live price may diverge materially from completed daily anchor without becoming a critical error',()=>{
  assert.ok(alignment, 'V8.4 price alignment module must exist');
  const r=alignment.evaluatePriceAlignment({
    session:'REGULAR', priceState:'LIVE_VERIFIED', priceUse:'LIVE_EXECUTION', researchAllowed:true,
    decisionPrice:109.38, decisionPriceRole:'LIVE_MARKET', executionTradable:true, executionPrice:109.38,
    regularClosePrice:100, regularCloseAsOf:'2026-09-04T20:00:00.000Z',
    analysisAnchorPrice:100, analysisAnchorAsOf:'2026-09-04', analysisAnchorRole:'COMPLETED_DAILY_BAR'
  });
  assert.deepEqual(r.criticalIssues,[]);
  assert.equal(r.intradayMovePct,9.38);
});

test('closed-session official close and completed daily anchor mismatch remains critical',()=>{
  assert.ok(alignment, 'V8.4 price alignment module must exist');
  const r=alignment.evaluatePriceAlignment({
    session:'CLOSED', priceState:'OFFICIAL_CLOSE', priceUse:'RESEARCH_CLOSE', researchAllowed:true,
    decisionPrice:104, decisionPriceRole:'REGULAR_CLOSE', executionTradable:false, executionPrice:null,
    regularClosePrice:104, regularCloseAsOf:'2026-09-04T20:00:00.000Z',
    analysisAnchorPrice:100, analysisAnchorAsOf:'2026-09-04', analysisAnchorRole:'COMPLETED_DAILY_BAR'
  });
  assert.ok(r.criticalIssues.some(x=>/close.*anchor|anchor.*close/i.test(x)));
});

test('execution price is present only for independently verified execution-tradable live state',()=>{
  assert.ok(alignment, 'V8.4 price alignment module must exist');
  const invalid=alignment.evaluatePriceAlignment({
    session:'REGULAR',priceState:'LIVE_SINGLE_SOURCE',priceUse:'RESEARCH_LIVE_SINGLE_SOURCE',researchAllowed:true,
    decisionPrice:100,decisionPriceRole:'LIVE_MARKET',executionTradable:false,executionPrice:100,
    regularClosePrice:99,regularCloseAsOf:'2026-09-04T20:00:00.000Z',analysisAnchorPrice:99,analysisAnchorAsOf:'2026-09-04',analysisAnchorRole:'COMPLETED_DAILY_BAR'
  });
  assert.ok(invalid.criticalIssues.some(x=>/execution price/i.test(x)));
});

test('Market Truth exposes explicit live/close/decision/execution price roles',()=>{
  const live=buildCanonicalMarketSnapshot({symbol:'TEST',asOf:new Date('2026-09-08T13:35:05.000Z'),primary:q('alpaca',100,4),secondary:q('twelvedata',100.2,6),regularClose:96,regularCloseTimestamp:'2026-09-04T20:00:00.000Z'});
  assert.equal(live.liveMarketPrice, live.decisionPrice);
  assert.equal(live.decisionPriceRole,'LIVE_MARKET');
  assert.equal(live.executionPrice, live.decisionPrice);
  assert.equal(live.executionPriceAsOf, live.decisionPriceAsOf);
  assert.equal(live.regularClosePrice,96);

  const single=buildCanonicalMarketSnapshot({symbol:'TEST',asOf:new Date('2026-09-08T13:35:05.000Z'),primary:q('alpaca',100,4),secondary:null,regularClose:96,regularCloseTimestamp:'2026-09-04T20:00:00.000Z'});
  assert.equal(single.decisionPriceRole,'LIVE_MARKET');
  assert.equal(single.executionPrice,null);

  const closed=buildCanonicalMarketSnapshot({symbol:'TEST',asOf:new Date('2026-09-09T01:00:00.000Z'),primary:null,secondary:null,regularClose:101,regularCloseTimestamp:'2026-09-08T20:00:00.000Z'});
  assert.equal(closed.decisionPriceRole,'REGULAR_CLOSE');
  assert.equal(closed.regularClosePrice,101);
  assert.equal(closed.executionPrice,null);
});
