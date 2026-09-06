import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('v3.8.4 uses dedicated safe-area app and social assets', () => {
  const layout=fs.readFileSync('app/layout.tsx','utf8');
  const manifest=fs.readFileSync('app/manifest.ts','utf8');
  assert.match(layout,/auryn-v384-apple\.png/);
  assert.match(layout,/auryn-v384-social\.png/);
  assert.match(manifest,/auryn-v384-192\.png/);
  assert.match(manifest,/auryn-v384-512\.png/);
});
