import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('V9 research lab has API, page and CLI without changing production CIO weights',()=>{
  const api=readFileSync('app/api/research-lab/route.ts','utf8');
  const page=readFileSync('app/research-lab/page.tsx','utf8');
  const cli=readFileSync('scripts/run_v9_feature_tournament.mjs','utf8');
  const pkg=JSON.parse(readFileSync('package.json','utf8'));
  assert.match(api,/feature|catalog|research/i);
  assert.match(page,/Research Lab/i);
  assert.match(page,/unproven|promotion|candidate/i);
  assert.match(cli,/AURYN_V9_OBSERVATIONS|feature/i);
  assert.ok(pkg.scripts['research:v9']);
  assert.doesNotMatch(cli,/write.*weights|mutate.*cio/i);
});
