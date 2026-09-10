import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');

test('signature AURYN Setup Map supports compact summary and full bull/base/bear views',()=>{
 const s=read('components/stock/v5/ScenarioMapPanel.tsx');
 assert.match(s,/mode=.*compact|mode\?:/);
 assert.match(s,/AURYN SETUP MAP/);
 assert.match(s,/BULL CASE/);assert.match(s,/BASE CASE/);assert.match(s,/BEAR CASE/);
 assert.match(s,/snapshotId|scenario\.snapshotId/);
 assert.match(s,/intent/);
});

test('Technicals renders the canonical scenario object once as supporting evidence',()=>{
 const s=read('components/StockClient.tsx');
 assert.doesNotMatch(s,/ScenarioMapPanel scenario={v5Analysis\.scenario} mode="compact"/);
 assert.match(s,/ScenarioMapPanel scenario={v5Analysis\.scenario} mode="full"/);
 assert.equal((s.match(/buildScenarioMap/g)||[]).length,0);
});

test('scenario map mobile CSS stacks cases and has no fixed-width overflow',()=>{
 const css=read('app/auryn-product.css');
 assert.match(css,/\.aurynScenarioMap/);
 assert.match(css,/@media\(max-width:760px\)[\s\S]*\.aurynScenarioGrid\{grid-template-columns:1fr\}/);
 assert.doesNotMatch(css,/\.aurynScenarioMap\{[^}]*min-width:\s*[7-9]\d\dpx/s);
});
