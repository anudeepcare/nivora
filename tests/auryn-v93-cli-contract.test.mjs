import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V9.3 CLI writes the canonical machine-readable tournament artifacts and never a production registry',()=>{
  const script=fs.readFileSync('scripts/run_v93_feature_tournament.mjs','utf8');
  assert.match(script,/--base=/);
  assert.match(script,/--manifest=/);
  assert.match(script,/--output-dir=/);
  assert.match(script,/auryn-v93-tournament-report\.json/);
  assert.match(script,/auryn-v93-survivor-registry\.json/);
  assert.match(script,/auryn-v93-rejections\.jsonl/);
  assert.match(script,/auryn-v93-run-manifest\.json/);
  assert.doesNotMatch(script,/v9-production-feature-registry\.json/);
});
