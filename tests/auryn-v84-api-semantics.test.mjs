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

test('quote API delegates regular-close timestamping to the canonical gateway and uses the last completed trading session',()=>{
  const route=fs.readFileSync('app/api/quote/[symbol]/route.ts','utf8');
  const gateway=fs.readFileSync('lib/auryn/market-data-gateway.ts','utf8');
  assert.match(route,/market-data-gateway/);
  assert.match(gateway,/lastCompletedRegularSessionDate/);
  assert.match(gateway,/lastCompletedRegularSessionCloseTimestamp/);
  assert.doesNotMatch(gateway,/regularCloseTimestamp=twelveDisplay&&!twelveDisplay\.isExtendedHours\?twelveDisplay\.providerTimestamp:null/);
});
