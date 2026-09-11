import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

test('V9.3.4 exposes a deployed 30/100/500 market-intelligence audit',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.match(pkg.scripts?.['audit:v934-live']||'',/run_v934_live_audit/);
 for(const n of ['30','100','500']) assert.match(pkg.scripts?.[`audit:live:${n}`]||'',/audit:v93(?:4|5)-live/);
 const src=read('scripts/run_v934_live_audit.mjs');
 for(const token of ['AURYN_BASE_URL','/api/audit/universe','/api/quote/','/api/analyze/','/api/decision/summaries','/api/scan','marketIntelligence','marketTruthSnapshotId','confirmed','actionMap','researchActive','providerAgreementPct']) assert.match(src,new RegExp(esc(token)));
 assert.match(src,/15M/);assert.match(src,/4H/);assert.match(src,/1D/);assert.match(src,/1W/);
 assert.match(src,/invalidation.*preferredEntry|preferredEntry.*confirm/i);
 assert.match(src,/process\.exitCode\s*=\s*1/);
 assert.doesNotMatch(src,/TWELVE_DATA_API_KEY\s*=|ALPACA_PAPER_API_SECRET\s*=/);
});

test('V9.3.4 strict release gate requires deployed proof when requested',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.match(pkg.scripts?.['gate:v934']||'',/run_v934_release_gate/);
 assert.match(pkg.scripts?.['gate:v934:release']||'',/AURYN_REQUIRE_LIVE=1/);
 const gate=read('scripts/run_v934_release_gate.mjs');
 for(const token of ['test:v934-core','test:v931-core','audit:v931-reliability','test:v92-core','test:v93-core','audit:v8-reality','audit:v65','AURYN_REQUIRE_LIVE','AURYN_BASE_URL','audit:v934-live','CODE_READY_LIVE_VALIDATION_REQUIRED']) assert.match(gate,new RegExp(esc(token)));
});

test('scheduled workflow uses V9.3.4 audit without duplicating the old V9.3.1 schedule',()=>{
 const path='.github/workflows/auryn-v931-reliability.yml';
 const src=read(path);
 assert.match(src,/V9\.3\.4 Market Intelligence Reliability/);
 assert.match(src,/schedule:/);
 assert.match(src,/audit:v934-live/);
 assert.match(src,/test:v934-core/);
 assert.match(src,/AURYN_BASE_URL/);
 assert.match(src,/upload-artifact/);
 assert.doesNotMatch(src,/audit:v931-live/);
});
