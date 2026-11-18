import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('followed prices open automatically, with collapse and full watchlist access retained', () => {
  const source = readFileSync('components/HomeWorkspace.tsx', 'utf8');
  assert.match(source, /<details\s+className=\{`home-evidence-panel \$\{homeStyles\.priceDetails\}`\}\s+open\s*>\s*<summary>Followed company prices<\/summary>/);
  assert.match(source, /View all followed companies/);
  assert.match(source, /<HomeCompany/);
});
