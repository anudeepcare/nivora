import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');

test('quote route returns canonical market snapshot fields through the centralized gateway instead of requiring a chosen stale quote',()=>{
  const route=read('app/api/quote/[symbol]/route.ts');
  const gateway=read('lib/auryn/market-data-gateway.ts');
  assert.match(route,/market-data-gateway/);
  assert.match(gateway,/buildCanonicalMarketSnapshot/);
  assert.match(route,/snapshot/);
  assert.match(gateway,/priceSensitiveAllowed|CanonicalMarketSnapshot/);
  assert.doesNotMatch(route,/if\(!chosen\)return NextResponse\.json/);
});

test('StockClient no longer mixes live quote price with analysis price for currentPx',()=>{
  const s=read('components/StockClient.tsx');
  assert.doesNotMatch(s,/liveQuote\?\.price\|\|d\.price/);
  assert.match(s,/canonicalDecisionPrice/);
  assert.match(s,/priceSensitiveAllowed/);
});

test('price-sensitive action plan is suppressed when market truth is blocked',()=>{
  const s=read('components/StockClient.tsx');
  assert.match(s,/<ExecutionPlanPanel plan={v5Analysis\.executionPlan}\/>/);
  const plan=read('components/stock/v5/ExecutionPlanPanel.tsx');
  assert.match(plan,/plan\.state==="BLOCKED"/);
  assert.match(s,/PRICE UNVERIFIED/);
});

test('all research tabs receive canonical market truth context',()=>{
  const s=read('components/StockClient.tsx');
  assert.match(s,/marketTruth=/);
  assert.match(s,/StockTabContext/);
});

test('technical price zones fail closed when canonical market price is unverified',()=>{
  const s=read('components/StockClient.tsx');
  assert.match(s,/Price-sensitive technical zones are hidden until Market Truth verifies the underlying price/);
  assert.match(s,/levels={v5ChartLevels}/);
  assert.match(s,/plan\.state!=="READY"/);
});

test('options contract setups fail closed when the underlying canonical price is unverified',()=>{
  const s=read('components/StockClient.tsx');
  assert.match(s,/Contract setups are blocked until the underlying price is verified/);
  assert.match(s,/!priceSensitiveAllowed\?<div className="optionsState marketTruthBlocked"/);
});

test('near-term horizon cards say verify price rather than showing a tradable call on blocked market truth',()=>{
  const s=read('components/stock/StockDecisionSummary.tsx');
  assert.match(s,/marketBlocked&&\(h\.horizon==="NOW"\|\|h\.horizon==="SWING"\)\?"VERIFY PRICE"/);
});

test('validation learning never persists an unverified or fallback analysis price',()=>{
  const s=read('components/StockClient.tsx');
  assert.match(s,/!priceSensitiveAllowed\|\|canonicalDecisionPrice==null/);
  assert.match(s,/price:canonicalDecisionPrice/);
  assert.doesNotMatch(s,/mode,price:d\.price,score:intelligence\.score/);
});

test('validation snapshot route rejects missing or non-positive canonical prices',()=>{
  const s=read('app/api/validation/snapshot/route.ts');
  assert.match(s,/INVALID_CANONICAL_PRICE/);
  assert.match(s,/Number\.isFinite\(canonicalPrice\)&&canonicalPrice>0/);
});
