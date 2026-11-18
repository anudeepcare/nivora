import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(`components/${p}`,'utf8');
test('outcome and evidence share equal columns and stretch to the same row height',()=>{
 const css=read('ReferenceAtlas.module.css');
 assert.match(css,/\.lower\s*\{\s*display: grid;\s*align-items: stretch;\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
 assert.match(css,/\.lower > :is\(\.scenarios, \.evidence\)/);
 assert.match(css,/height: 100%/);assert.match(css,/--case-tint/);
 assert.doesNotMatch(css,/border-top: [234]px/);
});
test('analyst target cells cannot form three plus one at intermediate parent widths',()=>{
 const css=read('SentiSenseConsensus.module.css');
 assert.doesNotMatch(css,/auto-fit/);
 assert.match(css,/repeat\(2, minmax\(0, 1fr\)\)/);
 assert.match(css,/@container \(min-width: 680px\)/);
 assert.match(css,/repeat\(4, minmax\(0, 1fr\)\)/);
 assert.match(css,/container-type: inline-size/);
 assert.match(read('SentiSenseConsensus.tsx'),/layout.container/);
 assert.match(read('SentiSenseConsensus.tsx'),/layout.metricLabel/);
});
