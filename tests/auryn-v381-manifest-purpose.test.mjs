import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('manifest icon purpose uses a Next.js Metadata-compatible value', () => {
  const source = fs.readFileSync(new URL('../app/manifest.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /purpose:\s*["']any maskable["']/);
  assert.match(source, /purpose:\s*["']maskable["']/);
});
