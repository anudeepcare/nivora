import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');

test('canonical stock UX speaks V6 or neutral canonical language instead of exposing V5 migration copy',()=>{
  const stock=read('components/StockClient.tsx');
  const thesis=read('components/stock/StockThesisPanel.tsx');
  const visible=[stock,thesis].join('\n');
  assert.doesNotMatch(visible,/shown above.*V5|same V5 decision|V5 snapshot|V5 CANONICAL ANALYSIS|V5 ExecutionPlan|same V5 thesis|canonical V5/i);
  assert.match(stock,/AURYN V6|canonical AURYN/i);
  assert.match(thesis,/same V6 decision|canonical AURYN/i);
});
