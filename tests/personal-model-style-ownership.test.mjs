import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(`components/${p}`,'utf8');
test('active personal valuation models own horizon controls, input grids and scenario result cards',()=>{
 assert.match(read('PriceProjection.tsx'),/PriceProjection.module.css/);
 const projection=read('PriceProjection.module.css');
 for(const selector of ['options-nav','options-kpis','options-toolbar','options-scroll','projection-chart']) assert.ok(projection.includes(selector),selector);
 const funded=read('FundedScenarios.module.css');
 assert.match(funded,/funded-fields/); assert.match(funded,/grid-template-columns/);
 assert.match(funded,/funded-results\) \{/);
});
