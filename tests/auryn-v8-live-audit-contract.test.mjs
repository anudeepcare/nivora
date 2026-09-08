import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('live 100-ticker audit is deployment-driven, bounded, and fail-closed',()=>{
  const src=fs.readFileSync('scripts/run_v8_live_100_audit.mjs','utf8');
  assert.match(src,/AURYN_BASE_URL/);
  assert.match(src,/V8_GOLDEN_UNIVERSE|golden/);
  assert.match(src,/\/api\/quote\//);
  assert.match(src,/\/api\/analyze\//);
  assert.match(src,/critical/i);
  assert.match(src,/process\.exitCode\s*=\s*1/);
  assert.doesNotMatch(src,/TWELVE_DATA_API_KEY\s*=|ALPACA_PAPER_API_SECRET\s*=/);
});
