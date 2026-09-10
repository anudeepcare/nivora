import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');

test('V9.3.1 exposes a deployment-driven real-world 24/7 reliability audit',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.match(pkg.scripts?.['audit:v931-live']||'',/run_v931_live_reliability_audit/);
 const src=read('scripts/run_v931_live_reliability_audit.mjs');
 for(const x of ['AURYN_BASE_URL','/api/audit/universe','/api/quote/','/api/analyze/','/api/decision/summaries','/api/scan','executionTradable','LIVE_VERIFIED','marketSnapshotId','providerAgreementPct']) assert.match(src,new RegExp(x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 assert.match(src,/crossSurfacePriceGapPct/);
 assert.match(src,/research.*displayPrice/i);
 assert.match(src,/OFFICIAL_CLOSE|RESEARCH_CLOSE/);
 assert.match(src,/process\.exitCode\s*=\s*1/);
 assert.doesNotMatch(src,/TWELVE_DATA_API_KEY\s*=|ALPACA_PAPER_API_SECRET\s*=/);
});

test('strict release gate can require real-world deployment proof instead of silently passing code-only',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.match(pkg.scripts?.['gate:v931:release']||'',/AURYN_REQUIRE_LIVE=1/);
 const gate=read('scripts/run_v931_release_gate.mjs');
 assert.match(gate,/AURYN_REQUIRE_LIVE/);
 assert.match(gate,/CODE_READY_LIVE_VALIDATION_REQUIRED/);
 assert.match(gate,/audit:v931-live/);
 assert.match(gate,/AURYN_BASE_URL/);
});

test('Reliability Lab audits canonical decision projection across non-stock surfaces',()=>{
 const src=read('scripts/run_v931_reliability_lab.mjs');
 for(const f of ['app/api/decision/summaries/route.ts','app/watchlist/page.tsx','app/portfolio/page.tsx','app/alerts/page.tsx']) assert.match(src,new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 assert.match(src,/decision\/summaries/);
});

test('scheduled reliability workflow continuously audits open and closed market states',()=>{
 const path='.github/workflows/auryn-v931-reliability.yml';
 assert.ok(fs.existsSync(path));
 const src=read(path);
 assert.match(src,/workflow_dispatch:/);
 assert.match(src,/schedule:/);
 assert.match(src,/audit:v931-live/);
 assert.match(src,/AURYN_BASE_URL/);
 assert.match(src,/upload-artifact/);
 assert.match(src,/weekend|closed-market/i);
});

test('stored investment scan action is explicitly context and cannot masquerade as canonical action',()=>{
 const src=read('app/api/investment/route.ts');
 assert.match(src,/storedAction:x\.action/);
 assert.match(src,/actionRole:"STORED_SCAN_CONTEXT"/);
 assert.doesNotMatch(src,/\baction:x\.action/);
});
