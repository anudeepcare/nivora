import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
test('preview brand uses the same three-diamond asset and plain wordmark as workspace', () => {
  const brand = read('components/v2/Primitives.tsx').split('export function Brand()')[1].split('export function Button')[0];
  assert.match(brand, /src="\/icon.svg"/);
  assert.doesNotMatch(brand, /<svg|brandDot/);
  assert.match(brand, /<span>AURYN<\/span>/);
});
test('brand image retains its intrinsic proportions and never shrinks', () => {
  const css = read('components/v2/Preview.module.css');
  assert.match(css, /\.brand img\s*\{[^}]*height: auto;[^}]*flex-shrink: 0;/);
});
test('installed icons and page metadata use current shared branding assets', () => {
  const manifest = JSON.parse(read('public/manifest.webmanifest'));
  assert.ok(manifest.icons.every((i) => /-v2\.png$/.test(i.src)));
  assert.match(read('app/layout.tsx'), /icon: "\/icon.svg/);
  const svg = read('public/icon.svg');
  assert.equal((svg.match(/<rect /g) || []).length, 3);
  for (const color of ['#8074e8','#58aaa2','#efb35e']) assert.ok(svg.includes(color));
});
