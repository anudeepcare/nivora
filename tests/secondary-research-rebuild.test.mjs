import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
test('valuation presents contextual metrics without ranking unlike ratios as bar lengths',()=>{
 const code=read('components/ValueStudio.tsx');
 assert.doesNotMatch(code,/barMaximum|multipleTrack/);
 assert.match(code,/Earnings yield/);
 assert.match(code,/<StockPillars/);
});
test('financial period switches have a dedicated one-row mobile treatment',()=>{
 const code=read('components/FinancialPicture.tsx');
 assert.match(code,/layout.periodControls/);
 assert.match(code,/\["ttm", "annual", "quarterly"\]/);
 const css=read('components/ResearchMetrics.module.css');
 assert.match(css,/\.periodControls/);
 assert.match(css,/grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
});
test('options keeps gamma and real contracts behind a compact command bar',()=>{
 const code=read('components/OptionsDesk.tsx');
 assert.match(code,/Volatility & gamma/);
 assert.match(code,/Options workspace/);
 assert.match(code,/Calls & puts/);
});
test('financials lead with a business pulse and keep detailed ratios behind disclosure',()=>{
 const code=read('components/FinancialPicture.tsx');
 assert.match(code,/Business pulse for selected period/);
 assert.match(code,/Explore ratios & reported statements/);
 assert.doesNotMatch(code,/<QuickRead/);
});
test('options facts replace redundant instruction cards and manual valuation is progressive',()=>{
 assert.match(read('components/OptionsDesk.tsx'),/snapshotRibbon/);
 assert.doesNotMatch(read('components/OptionsDesk.tsx'),/<QuickRead/);
 assert.match(read('components/ValueStudio.tsx'),/projectionOpened &&/);
});
test('news creates a true lead story without inventing a summary',()=>{
 assert.match(read('components/NewsCoverage.tsx'),/index === 0 \? s.leadStory/);
 assert.match(read('components/NewsCoverage.tsx'),/n.title/);
});
