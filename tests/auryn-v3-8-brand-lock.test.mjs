import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync('app/auryn-product.css','utf8');
const manifest=fs.readFileSync('app/manifest.ts','utf8');
const layout=fs.readFileSync('app/layout.tsx','utf8');
const appIcon=fs.readFileSync('app/icon.svg','utf8');
const canonical=fs.readFileSync('public/auryn-v38-icon.svg','utf8');

test('locked decision metrics use spacing instead of vertical separators',()=>{
  assert.match(css,/\.aurynMemoSignals span\{[^}]*border-right:0/);
});

test('PWA manifest uses the canonical v38 logo assets',()=>{
  assert.match(manifest,/auryn-v384-192\.png/);
  assert.match(manifest,/auryn-v384-512\.png/);
  assert.doesNotMatch(manifest,/auryn-v37-/);
});

test('site metadata publishes canonical AURYN social preview branding',()=>{
  assert.match(layout,/openGraph:/);
  assert.match(layout,/auryn-v384-social\.png/);
});

test('framework favicon uses the same canonical AURYN sigil geometry',()=>{
  const path='M7 36.5 19.2 11h9.6L41 36.5h-8.7l-2.6-6H18.3l-2.6 6H7';
  assert.ok(canonical.includes(path));
  assert.ok(appIcon.includes(path));
});
