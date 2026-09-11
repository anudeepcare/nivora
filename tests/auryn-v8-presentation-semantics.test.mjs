import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync('components/stock/StockThesisPanel.tsx','utf8');

test('thesis UI separates strength from trend instead of rendering score plus STABLE as one quality label',()=>{
  assert.match(src,/Thesis strength/);
  assert.match(src,/Thesis trend/i);
  assert.doesNotMatch(src,/thesisScore\)\/100 · \$\{v4\.thesis\.direction/);
});

test('moat UI separates strength from trend',()=>{
  assert.match(src,/Moat strength|Moat \/ durability/i);
  assert.match(src,/Moat trend/i);
  assert.doesNotMatch(src,/moatScore\)\/100 · \$\{v4\.moat\.direction/);
});

test('user-facing archetype/lifecycle copy is humanized rather than raw enum identifiers',()=>{
  assert.match(src,/humanModel|humanizeClassification/);
  assert.doesNotMatch(src,/v4\.thesis\.companyState\}\. This tab/);
});

test('primary stock surface identifies the current institutional decision layer while preserving V8 engine provenance',()=>{
  const hero=fs.readFileSync('components/stock/v5/StockV5Decision.tsx','utf8');
  assert.match(hero,/AURYN V8 · REALITY AUDITED/);
  const client=fs.readFileSync('components/StockClient.tsx','utf8');
  const current=fs.readFileSync('components/premium/AurynResearchOverview.tsx','utf8');
  assert.match(client,/AurynResearchOverview/);
  assert.match(current,/AURYN CALL/);
});
