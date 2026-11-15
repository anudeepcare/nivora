import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = name => fs.readFileSync(`components/${name}.tsx`,'utf8');
test('estimate and revision metadata use concise labels with accessible details',()=>{
 const t=read('TargetsEstimates'),r=read('EstimateRevisions');
 assert.match(t,/<Help label="Estimate dates"/);
 assert.doesNotMatch(t,/\{r\.evidence\?\.source \?\?/);
 assert.match(r,/<Help label="Comparison dates"/);
 assert.doesNotMatch(r,/\{baseline\.source \?\?/);
});
test('news keeps article publishers, not API feed names, in the reading surface',()=>{
 const s=read('NewsCoverage');
 assert.match(s,/\{n\.source\}/);
 assert.match(s,/<Help label="News information"/);
 assert.doesNotMatch(s,/news\?\.source \|\|/);
});
