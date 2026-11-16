import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url),'utf8');
test('research composes visible scenarios with explanation, not four equal giant tiles',()=>{
 const code=read('components/IntegratedResearch.tsx');
 assert.match(code,/className=\{s.scenarioStage\}/);
 assert.match(code,/<StockPillars research=\{r\} decision=\{d\}/);
 assert.match(code,/className=\{s.priceContext\}/);
});
test('secondary home research tools mount only after opening',()=>{
 const code=read('components/HomeWorkspace.tsx');
 assert.match(code,/toolsOpen &&/);
 assert.match(code,/dynamic\(\(\) => import\("\.\/OpportunityMap"\)/);
});
test('research responsive scenario composition retains no heavy outlines',()=>{
 const css=read('components/ResearchOverview.module.css');
 assert.match(css,/\.scenarioStage/);
 assert.match(css,/@media \(max-width: 700px\)/);
 assert.doesNotMatch(css,/border: 1px solid var\(--workspace-edge\)/);
});
test('home does not compete with primary quotes for all-symbol research',()=>{
 assert.match(read('components/HomeWorkspace.tsx'),/useWorkspaceData\("all", toolsOpen\)/);
 assert.match(read('components/WorkspaceShared.tsx'),/scanEnabled && \(quotes.ready \|\| !!product.demo\)/);
});
test('portfolio history scope is independent of arriving quote batches and reuses research range',()=>{
 const code=read('components/ApprovedPortfolioChart.tsx');
 const selection=code.slice(code.indexOf('const symbols ='),code.indexOf('const key ='));
 assert.doesNotMatch(selection,/quotes\[/);
 assert.match(code,/range=5Y/);
 assert.match(code,/setHistory\(\(prior\)/);
});
test('Pace errors have a short retry window instead of a successful 15-minute cache',()=>{
 const code=read('components/WorkspacePace.tsx');
 assert.match(code,/cached\[symbol\]\.error/);
 assert.match(code,/incomplete \? 30000 : 900000/);
});
