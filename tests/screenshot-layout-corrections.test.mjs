import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(`components/${p}`,'utf8');
test('consensus labels wrap and use readable words rather than raw enum delimiters',()=>{
 assert.match(read('SentiSenseConsensus.tsx'),/consensusLabel\s*\.replaceAll\("_", " "\)/);
 const css=read('SentiSenseConsensus.module.css');
 assert.match(css,/overflow-wrap: anywhere/);assert.match(css,/white-space: normal/);
 assert.match(css,/repeat\(2, minmax\(0, 1fr\)\)/);
 assert.doesNotMatch(css,/border-(top|bottom): 3px/);
});
test('Pace chart spans the canvas and history headers align with their cells',()=>{
 const css=read('ResearchLens.module.css');
 assert.match(css,/\.paceChartFirst > :global\(\.accumulation-chart\)\s*\{\s*grid-column: 1 \/ -1/);
 assert.match(css,/\.paceChartFirst > :global\(\.accumulation-summary\)\s*\{\s*grid-column: 1 \/ -1/);
 assert.match(read('PaceHistoryInsights.module.css'),/\.history\.history table :is\(th, td\)\s*\{\s*text-align: right/);
});
test('metric compactness retains actual chart series and no unsupported strength labels',()=>{
 assert.match(read('DirectResearchLenses.module.css'),/> svg\s*\{\s*height: 48px/);
 const tsx=read('IndicatorOverview.tsx');assert.match(tsx,/points=\{points.join/);
 assert.doesNotMatch(tsx,/Strong|Below value|Oversold/);
});
