import test from 'node:test';
import assert from 'node:assert/strict';
import {marketCalendarAt,marketSessionAt} from '../.engine-test/nivora-market-session.js';
import {buildCanonicalMarketSnapshot} from '../.engine-test/auryn/market-truth.js';

const q=(provider,price,age=5,freshness='LIVE',session='REGULAR',ts='2026-09-08T15:00:00.000Z')=>({provider,symbol:'SAP',price,bid:null,ask:null,spreadPct:null,changePct:null,providerTimestamp:ts,ageSeconds:age,session,freshness,isRealTime:freshness==='LIVE'});

test('Labor Day 2026 is a market holiday, never REGULAR',()=>{
  const at=new Date('2026-09-07T15:00:00.000Z'); // 11:00 ET
  const c=marketCalendarAt(at);
  assert.equal(c.calendarState,'HOLIDAY');
  assert.equal(c.isTradingDay,false);
  assert.equal(marketSessionAt(at),'CLOSED');
});

test('Thanksgiving and Christmas are closed',()=>{
  assert.equal(marketCalendarAt(new Date('2026-11-26T16:00:00.000Z')).calendarState,'HOLIDAY');
  assert.equal(marketCalendarAt(new Date('2026-12-25T16:00:00.000Z')).calendarState,'HOLIDAY');
});

test('day after Thanksgiving honors 1pm ET early close',()=>{
  assert.equal(marketCalendarAt(new Date('2026-11-27T17:30:00.000Z')).session,'REGULAR'); // 12:30 ET
  const c=marketCalendarAt(new Date('2026-11-27T18:30:00.000Z')); // 13:30 ET
  assert.equal(c.calendarState,'EARLY_CLOSE');
  assert.equal(c.session,'AFTER_HOURS');
});

test('normal trading weekday still returns REGULAR',()=>{
  assert.equal(marketSessionAt(new Date('2026-09-08T15:00:00.000Z')),'REGULAR');
});

test('agreeing fresh providers produce one verified decision price',()=>{
  const s=buildCanonicalMarketSnapshot({symbol:'SAP',asOf:new Date('2026-09-08T15:00:05.000Z'),primary:q('alpaca',217,4),secondary:q('twelvedata',217.4,7),regularClose:215});
  assert.equal(s.priceState,'LIVE_VERIFIED');
  assert.equal(s.priceSensitiveAllowed,true);
  assert.ok(s.decisionPrice>216&&s.decisionPrice<218);
  assert.equal(s.displayPrice,s.decisionPrice);
});

test('single fresh provider is explicit and lower-confidence but usable for research',()=>{
  const s=buildCanonicalMarketSnapshot({symbol:'SAP',asOf:new Date('2026-09-08T15:00:05.000Z'),primary:q('alpaca',217,4),secondary:null,regularClose:215});
  assert.equal(s.priceState,'LIVE_SINGLE_SOURCE');
  assert.equal(s.priceSensitiveAllowed,true);
  assert.equal(s.decisionPrice,217);
});

test('16 percent provider disagreement fails closed with no chosen price',()=>{
  const s=buildCanonicalMarketSnapshot({symbol:'NBIS',asOf:new Date('2026-09-08T15:00:05.000Z'),primary:{...q('alpaca',93,4),symbol:'NBIS'},secondary:{...q('twelvedata',111,7),symbol:'NBIS'},regularClose:111});
  assert.equal(s.priceState,'UNVERIFIED');
  assert.equal(s.priceSensitiveAllowed,false);
  assert.equal(s.decisionPrice,null);
  assert.equal(s.displayPrice,null);
  assert.ok((s.providerAgreementPct??0)>10);
});

test('80 percent provider disagreement fails closed',()=>{
  const s=buildCanonicalMarketSnapshot({symbol:'SAP',asOf:new Date('2026-09-08T15:00:05.000Z'),primary:q('alpaca',89,4),secondary:q('twelvedata',217,7),regularClose:217});
  assert.equal(s.priceState,'UNVERIFIED');
  assert.equal(s.decisionPrice,null);
});

test('stale-only open-session quotes never become display or decision price',()=>{
  const s=buildCanonicalMarketSnapshot({symbol:'SAP',asOf:new Date('2026-09-08T15:00:05.000Z'),primary:q('alpaca',89,180,'STALE'),secondary:q('twelvedata',217,240,'STALE'),regularClose:215});
  assert.equal(s.priceState,'UNVERIFIED');
  assert.equal(s.decisionPrice,null);
  assert.equal(s.displayPrice,null);
});

test('holiday uses official regular close rather than stale provider trade',()=>{
  const at=new Date('2026-09-07T15:00:00.000Z');
  const s=buildCanonicalMarketSnapshot({symbol:'SAP',asOf:at,primary:q('alpaca',89,260000,'LAST_TRADE','CLOSED','2026-09-04T20:00:00.000Z'),secondary:q('twelvedata',217,260000,'LAST_TRADE','CLOSED','2026-09-04T20:00:00.000Z'),regularClose:217});
  assert.equal(s.calendarState,'HOLIDAY');
  assert.equal(s.priceState,'OFFICIAL_CLOSE');
  assert.equal(s.decisionPrice,217);
  assert.equal(s.displayPrice,217);
  assert.equal(s.priceSensitiveAllowed,true);
});

test('single-source live price with an extreme discontinuity from regular close fails closed until independently confirmed',()=>{
  const s=buildCanonicalMarketSnapshot({symbol:'PRCT',asOf:new Date('2026-09-08T15:00:05.000Z'),primary:{...q('alpaca',9.4,4),symbol:'PRCT'},secondary:null,regularClose:21.37});
  assert.equal(s.priceState,'UNVERIFIED');
  assert.equal(s.decisionPrice,null);
  assert.match(s.reason,/regular close|discontinuity|confirm/i);
});

test('V4.2 exposes a market-truth engine version for reproducible audits',async()=>{
  const v=await import('../.engine-test/auryn/v4/version.js');
  assert.equal(v.AURYN_V4_ENGINE_VERSION,'auryn-v4.2-market-truth-1');
  assert.equal(v.AURYN_V4_MODEL_REGISTRY_VERSION,'auryn-v4.2-model-registry-1');
});
