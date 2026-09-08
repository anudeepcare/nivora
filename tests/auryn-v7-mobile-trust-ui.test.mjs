import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');

test('mobile preserves one-column decision shell and two-column factor grid',()=>{
 const css=read('app/auryn-product.css');
 assert.match(css,/@media\(max-width:900px\)[\s\S]*\.aurynDecisionSummary\{grid-template-columns:1fr\}/);
 assert.match(css,/@media\(max-width:560px\)[\s\S]*\.aurynCoreFactors\{[^}]*grid-template-columns:1fr 1fr/);
});

test('mobile execution plan and metric explorer do not require horizontal page overflow',()=>{
 const css=read('app/auryn-product.css');
 assert.match(css,/@media\(max-width:620px\)\{\.aurynMetricGrid,\.aurynExecutionPlanV5\{grid-template-columns:1fr\}/);
 assert.doesNotMatch(css,/\.aurynExecutionPlanV5\{[^}]*min-width:\s*[7-9]\d\dpx/s);
 assert.doesNotMatch(css,/\.aurynMetricExplorer\{[^}]*min-width:\s*[7-9]\d\dpx/s);
});

test('scenario map and compact levels stack safely on narrow phones',()=>{
 const css=read('app/auryn-product.css');
 assert.match(css,/@media\(max-width:430px\)[\s\S]*\.aurynScenarioCompactLevels\{grid-template-columns:1fr\}/);
 assert.match(css,/overflow-wrap:anywhere/);
});
