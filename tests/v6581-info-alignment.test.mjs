import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync('app/globals.css','utf8');
const stock=fs.readFileSync('components/StockClient.tsx','utf8');
test('metric info controls stay inline with metric labels',()=>{
  assert.match(css,/\.v658MetricLabelRow\{[^}]*display:inline-flex[^}]*align-items:center/);
  assert.match(css,/\.v658VerdictMetrics article>div[^}]*align-items:center/);
});
test('factor grid uses the same aligned label row',()=>{
  assert.match(stock,/className="metricLabel v658MetricLabelRow"/);
});
