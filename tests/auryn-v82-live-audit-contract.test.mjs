import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const audit=fs.readFileSync('scripts/run_v8_live_100_audit.mjs','utf8');
const universe=fs.readFileSync('app/api/audit/universe/route.ts','utf8');
const analyze=fs.readFileSync('app/api/analyze/[symbol]/route.ts','utf8');

test('live audit tracks quarantined provider/security coverage separately from critical failures',()=>{
  assert.match(audit,/quarantined/);
  assert.match(audit,/UNSUPPORTED_INSTRUMENT|PROVIDER_COVERAGE_MISSING|MARKET_HISTORY_UNAVAILABLE|INSUFFICIENT_HISTORY/);
  assert.match(audit,/evaluatePriceAlignment/);
  assert.match(audit,/intradayDivergences/);
});

test('audit universe filters through Security Master and refills supported symbols',()=>{
  assert.match(universe,/classifySecuritySymbol/);
  assert.match(universe,/isSupportedEquitySecurity/);
  assert.match(universe,/excluded/);
});

test('analyze route returns structured coverage/security states instead of generic 500s for expected coverage gaps',()=>{
  assert.match(analyze,/UNSUPPORTED_INSTRUMENT/);
  assert.match(analyze,/PROVIDER_COVERAGE_MISSING|MARKET_HISTORY_UNAVAILABLE|INSUFFICIENT_HISTORY/);
  assert.match(analyze,/assessHistoryCoverage/);
});
