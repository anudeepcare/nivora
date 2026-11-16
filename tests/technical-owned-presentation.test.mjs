import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(`components/${p}`,'utf8');
test('Technical chart controls and Pace readings have explicit scoped owners after legacy removal',()=>{
 const page=read('Research.tsx');
 assert.match(page,/import technical from "\.\/TechnicalPresentation.module.css"/);
 assert.match(page,/className=\{`plot-section \$\{technical.chart\}`\}/);
 const css=read('TechnicalPresentation.module.css');
 for(const name of ['chart','pace','rangeControls','rangeButtons','chartFooter','indicatorGroups','indicatorTrigger','indicatorLabel']) assert.match(css,new RegExp('\\.'+name+'\\b'));
 assert.match(css,/min-height: 44px/);
 const pace=read('PaceReadings.tsx'); assert.match(pace,/PaceReadings.module.css/);
 assert.match(read('PaceReadings.module.css'),/grid-template-columns/);
});
test('Risk metrics own layout and Technical indicator dialog trigger groups its icon/name/count',()=>{
 assert.match(read('TimingContext.tsx'),/TimingContext.module.css/);
 assert.match(read('TechnicalDashboard.tsx'),/className=\{technical.indicatorTrigger\}/);
 assert.match(read('TechnicalDashboard.tsx'),/className=\{technical.indicatorLabel\}/);
});
