import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('V9.3 deterministic fingerprint is compatible with the app ES2017 TypeScript target',()=>{
  const src=fs.readFileSync('lib/auryn/v93/report.ts','utf8');
  assert.doesNotMatch(src,/\b(?:0x[0-9a-fA-F]+|\d+)n\b/,'BigInt literal syntax requires an ES2020 target');
  assert.match(src,/BigInt\(['"]14695981039346656037['"]\)/,'fingerprint must preserve the FNV-1a 64-bit offset basis');
  assert.match(src,/BigInt\(['"]1099511628211['"]\)/,'fingerprint must preserve the FNV-1a 64-bit prime');
  assert.match(src,/BigInt\(['"]0xffffffffffffffff['"]\)/,'fingerprint must preserve the 64-bit mask');
});
