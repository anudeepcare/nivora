import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('live audit uses session-aware price alignment instead of unconditional live-vs-daily-close gap critical',()=>{
  const src=fs.readFileSync('scripts/run_v8_live_100_audit.mjs','utf8');
  assert.match(src,/evaluatePriceAlignment/);
  assert.match(src,/analysisAnchorPrice/);
  assert.match(src,/intradayDivergences/);
  assert.doesNotMatch(src,/researchAllowed&&gap!==null&&gap>3/);
});
