import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCanonicalMarketSnapshot} from '../.engine-test/auryn/market-truth.js';

const q=(provider,price,age=5,freshness='LIVE',session='REGULAR',ts='2026-09-08T15:00:00.000Z')=>({provider,symbol:'TEST',price,bid:null,ask:null,spreadPct:null,changePct:null,providerTimestamp:ts,ageSeconds:age,session,freshness,isRealTime:freshness==='LIVE'});

test('holiday official close is research-safe but never execution-tradable and ignores stale provider-gap semantics',()=>{
  const s=buildCanonicalMarketSnapshot({
    symbol:'TEST',
    asOf:new Date('2026-09-07T15:00:00.000Z'),
    primary:q('alpaca',30,260000,'LAST_TRADE','CLOSED','2026-09-04T20:00:00.000Z'),
    secondary:q('twelvedata',70,260000,'LAST_TRADE','CLOSED','2026-09-04T20:00:00.000Z'),
    regularClose:70,
    regularCloseTimestamp:'2026-09-04T20:00:00.000Z'
  });
  assert.equal(s.priceState,'OFFICIAL_CLOSE');
  assert.equal(s.priceSensitiveAllowed,true);
  assert.equal(s.executionTradable,false);
  assert.equal(s.priceUse,'RESEARCH_CLOSE');
  assert.equal(s.providerAgreementPct,null);
  assert.equal(s.decisionPrice,70);
});

test('only independently verified live providers are execution-tradable',()=>{
  const verified=buildCanonicalMarketSnapshot({symbol:'TEST',asOf:new Date('2026-09-08T15:00:05.000Z'),primary:q('alpaca',100,4),secondary:q('twelvedata',100.3,7),regularClose:99});
  assert.equal(verified.priceState,'LIVE_VERIFIED');
  assert.equal(verified.executionTradable,true);
  assert.equal(verified.priceUse,'LIVE_EXECUTION');

  const single=buildCanonicalMarketSnapshot({symbol:'TEST',asOf:new Date('2026-09-08T15:00:05.000Z'),primary:q('alpaca',100,4),secondary:null,regularClose:99});
  assert.equal(single.priceState,'LIVE_SINGLE_SOURCE');
  assert.equal(single.priceSensitiveAllowed,true);
  assert.equal(single.executionTradable,false);
  assert.equal(single.priceUse,'RESEARCH_LIVE_SINGLE_SOURCE');
});

test('large same-session provider disagreement always blocks both research price sensitivity and execution',()=>{
  const s=buildCanonicalMarketSnapshot({symbol:'TEST',asOf:new Date('2026-09-08T15:00:05.000Z'),primary:q('alpaca',100,4),secondary:q('twelvedata',170,7),regularClose:99});
  assert.equal(s.priceState,'UNVERIFIED');
  assert.equal(s.priceSensitiveAllowed,false);
  assert.equal(s.executionTradable,false);
  assert.equal(s.priceUse,'BLOCKED');
  assert.equal(s.decisionPrice,null);
  assert.ok((s.providerAgreementPct??0)>5);
});

test('quote API exposes canonical executionTradable instead of re-deriving tradability from provider state',()=>{
  const src=fs.readFileSync('app/api/quote/[symbol]/route.ts','utf8');
  assert.match(src,/integrityTradable:snapshot\.executionTradable/);
  assert.match(src,/executionTradable:snapshot\.executionTradable/);
});

test('live audit separates research-safe price use from execution tradability and supports a 500-symbol validation run',()=>{
  const src=fs.readFileSync('scripts/run_v8_live_100_audit.mjs','utf8');
  assert.match(src,/executionTradable|integrityTradable/);
  assert.doesNotMatch(src,/if\(allowed&&Number\.isFinite\(providerGap\)&&providerGap>5\)/);
  assert.match(src,/V8_LIVE_AUDIT_LIMIT/);
  assert.match(src,/500/);
  const endpoint=fs.readFileSync('app/api/audit/universe/route.ts','utf8');
  assert.match(endpoint,/nivora_investment_scan|nivora_market_universe/);
  assert.match(endpoint,/Math\.min\(500/);
});

test('paper execution and diagnostics require independently verified live providers, not merely a single-source tradable flag',()=>{
  const runner=fs.readFileSync('app/api/trading-lab/run-paper/route.ts','utf8');
  const diagnostics=fs.readFileSync('app/api/trading-lab/diagnostics/route.ts','utf8');
  assert.match(runner,/market\.integrity\.state\s*!==\s*["']LIVE_VERIFIED["']/);
  assert.match(diagnostics,/integrity\.state\s*!==\s*["']LIVE_VERIFIED["']/);
});

test('stock UI distinguishes research-safe pricing from execution tradability',()=>{
  const src=fs.readFileSync('components/StockClient.tsx','utf8');
  assert.match(src,/executionTradable\?\?|marketTruth\.executionTradable/);
});
