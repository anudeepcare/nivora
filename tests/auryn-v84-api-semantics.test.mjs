import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('analyze API labels price as a completed daily-bar analysis anchor with its own as-of value',()=>{
  const src=fs.readFileSync('app/api/analyze/[symbol]/route.ts','utf8');
  assert.match(src,/analysisAnchorPrice/);
  assert.match(src,/analysisAnchorAsOf/);
  assert.match(src,/COMPLETED_DAILY_BAR/);
  assert.match(src,/priceRole\s*:\s*["']ANALYSIS_ANCHOR["']/);
  assert.doesNotMatch(src,/freshness:\{priceAt:nowIso\(\),decisionAt:nowIso\(\)/);
});

test('quote API timestamps the regular close by the last completed trading session, not by the live provider quote timestamp',()=>{
  const src=fs.readFileSync('app/api/quote/[symbol]/route.ts','utf8');
  assert.match(src,/lastCompletedRegularSessionDate/);
  assert.doesNotMatch(src,/regularCloseTimestamp=twelveDisplay&&!twelveDisplay\.isExtendedHours\?twelveDisplay\.providerTimestamp:null/);
});
