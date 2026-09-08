import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('calibration page leads with V6 proof grade, action ladder and promotion gate',()=>{
  const src=fs.readFileSync('app/calibration/page.tsx','utf8');
  assert.match(src,/MODEL PROOF GRADE/);
  assert.match(src,/ACTION LADDER/);
  assert.match(src,/PROMOTION GATE/);
  assert.match(src,/Evidence confidence.*not.*probability/i);
});
