import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCanonicalMarketSnapshot} from '../.engine-test/auryn/market-truth.js';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const session=require('../.engine-test/nivora-market-session.js');
const securityMaster=require('../.engine-test/auryn/v82/security-master.js');
const {lastCompletedRegularSessionCloseTimestamp}=session;
const {providerMarketHint}=securityMaster;

const q=(provider,price,age=5,freshness='LIVE',session='REGULAR',ts='2026-09-08T20:32:00.000Z',symbol='TEST')=>({
  provider,symbol,price,bid:null,ask:null,spreadPct:null,changePct:null,
  providerTimestamp:ts,ageSeconds:age,session,freshness,isRealTime:freshness==='LIVE'
});

test('after-hours stale providers fall back to the verified regular close instead of blanking research',()=>{
  const s=buildCanonicalMarketSnapshot({
    symbol:'SPY',asOf:new Date('2026-09-08T20:32:24.000Z'),
    primary:q('alpaca',650.10,260,'STALE','AFTER_HOURS','2026-09-08T20:28:04.000Z','SPY'),
    secondary:q('twelvedata',650.30,280,'STALE','AFTER_HOURS','2026-09-08T20:27:44.000Z','SPY'),
    regularClose:649.95,regularCloseTimestamp:'2026-09-08T20:00:00.000Z'
  });
  assert.equal(s.session,'AFTER_HOURS');
  assert.equal(s.priceState,'OFFICIAL_CLOSE');
  assert.equal(s.displayPrice,649.95);
  assert.equal(s.decisionPrice,649.95);
  assert.equal(s.priceSensitiveAllowed,true);
  assert.equal(s.executionTradable,false);
  assert.equal(s.priceUse,'RESEARCH_CLOSE');
  assert.equal(s.providerAgreementPct,null);
  assert.ok((s.contextProviderGapPct??99)<0.1);
});

test('after-hours fresh independent quotes remain usable for research but never become regular-session execution truth',()=>{
  const s=buildCanonicalMarketSnapshot({
    symbol:'BE',asOf:new Date('2026-09-08T20:32:24.000Z'),
    primary:q('alpaca',100.00,15,'LIVE','AFTER_HOURS','2026-09-08T20:32:09.000Z','BE'),
    secondary:q('twelvedata',100.40,20,'LIVE','AFTER_HOURS','2026-09-08T20:32:04.000Z','BE'),
    regularClose:99.50,regularCloseTimestamp:'2026-09-08T20:00:00.000Z'
  });
  assert.equal(s.priceState,'LIVE_VERIFIED');
  assert.equal(s.priceSensitiveAllowed,true);
  assert.equal(s.executionTradable,false);
  assert.equal(s.executionPrice,null);
  assert.equal(s.priceUse,'RESEARCH_EXTENDED');
  assert.equal(s.extendedPrice,s.decisionPrice);
});

test('premarket fresh quote is research context, not regular-session execution permission',()=>{
  const s=buildCanonicalMarketSnapshot({
    symbol:'ASTS',asOf:new Date('2026-09-08T12:00:00.000Z'),
    primary:q('alpaca',50.00,10,'LIVE','PRE_MARKET','2026-09-08T11:59:50.000Z','ASTS'),
    secondary:q('twelvedata',50.10,12,'LIVE','PRE_MARKET','2026-09-08T11:59:48.000Z','ASTS'),
    regularClose:49.25,regularCloseTimestamp:'2026-09-07T20:00:00.000Z'
  });
  assert.equal(s.session,'PRE_MARKET');
  assert.equal(s.priceSensitiveAllowed,true);
  assert.equal(s.executionTradable,false);
  assert.equal(s.priceUse,'RESEARCH_EXTENDED');
});

test('extended-hours disagreement degrades to verified regular close rather than taking the whole research page offline',()=>{
  const s=buildCanonicalMarketSnapshot({
    symbol:'TEST',asOf:new Date('2026-09-08T20:32:24.000Z'),
    primary:q('alpaca',100,10,'LIVE','AFTER_HOURS','2026-09-08T20:32:14.000Z'),
    secondary:q('twelvedata',115,12,'LIVE','AFTER_HOURS','2026-09-08T20:32:12.000Z'),
    regularClose:101,regularCloseTimestamp:'2026-09-08T20:00:00.000Z'
  });
  assert.equal(s.priceState,'OFFICIAL_CLOSE');
  assert.equal(s.decisionPrice,101);
  assert.equal(s.priceSensitiveAllowed,true);
  assert.equal(s.executionTradable,false);
  assert.match(s.reason,/extended|regular close|disagree/i);
});

test('regular-session verification semantics remain strict and execution-tradable only with independent fresh agreement',()=>{
  const s=buildCanonicalMarketSnapshot({
    symbol:'TEST',asOf:new Date('2026-09-08T15:00:05.000Z'),
    primary:q('alpaca',100,4,'LIVE','REGULAR','2026-09-08T15:00:01.000Z'),
    secondary:q('twelvedata',100.2,6,'LIVE','REGULAR','2026-09-08T14:59:59.000Z'),
    regularClose:99,regularCloseTimestamp:'2026-09-07T20:00:00.000Z'
  });
  assert.equal(s.priceState,'LIVE_VERIFIED');
  assert.equal(s.executionTradable,true);
  assert.equal(s.executionPrice,s.decisionPrice);
  assert.equal(s.priceUse,'LIVE_EXECUTION');
});

test('overnight closed window remains fully research-usable from the verified regular close',()=>{
  const s=buildCanonicalMarketSnapshot({
    symbol:'SPY',asOf:new Date('2026-09-09T01:00:00.000Z'),
    primary:null,secondary:null,regularClose:649.95,regularCloseTimestamp:'2026-09-08T20:00:00.000Z'
  });
  assert.equal(s.session,'CLOSED');
  assert.equal(s.priceState,'OFFICIAL_CLOSE');
  assert.equal(s.decisionPrice,649.95);
  assert.equal(s.priceSensitiveAllowed,true);
  assert.equal(s.executionTradable,false);
});

test('last completed regular-session timestamp is the actual NYSE close instant, including early closes',()=>{
  assert.equal(lastCompletedRegularSessionCloseTimestamp(new Date('2026-09-08T20:32:00.000Z')),'2026-09-08T20:00:00.000Z');
  assert.equal(lastCompletedRegularSessionCloseTimestamp(new Date('2026-11-27T19:00:00.000Z')),'2026-11-27T18:00:00.000Z');
});

test('SAP carries an explicit US listing hint so Twelve Data cannot silently resolve a different venue/currency',()=>{
  assert.deepEqual(providerMarketHint('SAP'),{exchange:'NYSE',currency:'USD'});
  const src=fs.readFileSync('lib/nivora-trading-market-data.ts','utf8');
  assert.match(src,/providerMarketHint\(symbol\)/);
  assert.match(src,/exchange=/);
});

test('stock UI labels premarket and after-hours explicitly instead of claiming the regular market is open',()=>{
  const src=fs.readFileSync('components/StockClient.tsx','utf8');
  assert.match(src,/AFTER_HOURS/);
  assert.match(src,/PRE_MARKET/);
  assert.match(src,/After-hours/i);
  assert.match(src,/Pre-market/i);
});

test('quote API never pairs a verified regular-close display with an extended-hours percent change',()=>{
  const route=fs.readFileSync('app/api/quote/[symbol]/route.ts','utf8');
  const gateway=fs.readFileSync('lib/auryn/market-data-gateway.ts','utf8');
  assert.match(route,/market-data-gateway/);
  assert.match(gateway,/priceState==='OFFICIAL_CLOSE'\?null/);
});

