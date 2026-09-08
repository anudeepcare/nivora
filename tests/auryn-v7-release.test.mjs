import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {AURYN_V7_ENGINE_VERSION} from '../.engine-test/auryn/v7/version.js';

test('V7 release uses immutable trust-and-precision engine version',()=>{
 assert.equal(AURYN_V7_ENGINE_VERSION,'auryn-v7-trust-precision-1');
});

test('V7 release documentation preserves proof discipline and paper-only autonomy',()=>{
 const release=fs.readFileSync('AURYN_V7_RELEASE.md','utf8');
 const readme=fs.readFileSync('README.md','utf8');
 for(const text of [release,readme]){
  assert.match(text,/AURYN V7/i);
  assert.match(text,/canonical trust/i);
  assert.match(text,/Setup Map/i);
  assert.match(text,/live-money autonomous execution remains disabled|live-money.*disabled/i);
  assert.match(text,/not.*probability of profit|not.*guarantee/i);
 }
});
