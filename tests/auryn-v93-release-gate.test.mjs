import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

test('V9.3 package exposes focused tournament, report audit and strict release gates',()=>{
  assert.match(pkg.scripts['research:v93']||'',/run_v93_feature_tournament/);
  assert.match(pkg.scripts['audit:v93-report']||'',/audit_v93_report/);
  assert.match(pkg.scripts['test:v93-core']||'',/auryn-v93-folds/);
  assert.match(pkg.scripts['test:v93-core']||'',/auryn-v93-release-gate/);
  assert.match(pkg.scripts['gate:v93']||'',/run_v93_release_gate/);
});

test('V9.3 report audit enforces full catalog, upstream quality, survivor gates and deterministic twin-run identity',()=>{
  const s=fs.readFileSync('scripts/audit_v93_report.mjs','utf8');
  assert.match(s,/46464/);
  assert.match(s,/completeCatalog/);
  assert.match(s,/DECISION_GRADE/);
  assert.match(s,/survivorshipSafe/);
  assert.match(s,/adjustedPricesVerified/);
  assert.match(s,/promotion\.eligible/);
  assert.match(s,/deterministicFingerprint/);
  assert.match(s,/second-run-manifest/);
});

test('V9.3 strict gate preserves upstream and production safety gates and runs the full tournament twice',()=>{
  const s=fs.readFileSync('scripts/run_v93_release_gate.mjs','utf8');
  for(const token of ['test:v93-core','npm','audit:v8-reality','audit:v65','audit:v92-data','research:v93','audit:v93-report','run-1','run-2','--require-data']) assert.match(s,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(s,/AURYN_V92_REPLAY_BUNDLE/);
  assert.match(s,/AURYN_V93_BASE_OBSERVATIONS/);
  assert.match(s,/AURYN_V93_OBSERVATION_MANIFEST/);
});

test('V9.3 release contract makes clear that zero survivors can pass but unproven survivors cannot',()=>{
  const s=fs.readFileSync('AURYN_V9_3_RELEASE.md','utf8');
  assert.match(s,/46,464/);
  assert.match(s,/V94_CANDIDATE/);
  assert.match(s,/zero survivors/i);
  assert.match(s,/BLOCKED/);
  assert.match(s,/no automatic production/i);
});
