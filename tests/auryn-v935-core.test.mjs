import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
test('V9.3.5 canonical snapshot contract exists',()=>{const s=read('lib/auryn/v935/canonical.ts');assert.match(s,/AURYN_V9_3_5_CANONICAL_SNAPSHOT/);assert.match(s,/loadCanonicalMarketSnapshot/);assert.match(s,/nivora_v59_decision_snapshots/);});
test('research uses canonical snapshot instead of direct quote route',()=>{const s=read('components/StockClient.tsx');assert.match(s,/\/api\/canonical\//);assert.doesNotMatch(s,/fetch\(`\/api\/quote\//);assert.match(s,/LAST VERIFIED AURYN DECISION/);});
test('portfolio watchlist and monitor consume canonical batch',()=>{for(const p of ['app/portfolio/page.tsx','app/watchlist/page.tsx','app/alerts/page.tsx']){const s=read(p);assert.match(s,/\/api\/canonical\?symbols=/);}});
test('trading lab requires V9.3.5 canonical provenance',()=>{const s=read('app/api/trading-lab/run-paper/route.ts');assert.match(s,/V935_CANONICAL_SNAPSHOT_MISSING/);assert.match(s,/AURYN_V9_3_5_CANONICAL_SNAPSHOT/);});
