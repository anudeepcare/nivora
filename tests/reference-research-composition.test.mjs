import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css = name => fs.readFileSync(`components/${name}.module.css`,'utf8');
test('technical levels respond to their panel width instead of desktop viewport alone',()=>{
 assert.match(css('TechnicalLevelMap'),/container-type: inline-size/);
 assert.match(css('TechnicalLevelMap'),/@container \(max-width: 480px\)/);
});
test('desktop chart and real Pace rationale share a row without hiding controls',()=>{
 const styles=css('ResearchLens');
 assert.match(styles,/@media \(min-width: 1000px\)/);
 assert.match(styles,/accumulation-chart\) \{ grid-column: 1/);
 assert.match(styles,/accumulation-summary\) \{ grid-column: 2/);
 const source=fs.readFileSync('components/AccumulationDesk.tsx','utf8');
 assert.match(source,/PaceReadings/); assert.match(source,/PriceChart/); assert.match(source,/showEvaluation/);
});
