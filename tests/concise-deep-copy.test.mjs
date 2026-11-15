import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=n=>fs.readFileSync(`components/${n}.tsx`,'utf8');
test('history and chart method detail use accessible help without removing data',()=>{
 const history=read('BusinessHistory');
 assert.match(history, /<Help label="Business history limitations"/);
 assert.match(history, /h\.rows/);
 assert.match(history, /Historical charts/);
 const chart=read('PriceStudyChart');
 assert.match(chart, /<Help label="Pace zone details"/);
 assert.match(chart, /Blue bands · Pace zones/);
});
test('trade sample keeps material incompleteness visible while detail is in help',()=>{
 const tape=read('OptionsTape');
 assert.match(tape,/Partial sample/);assert.match(tape,/Incomplete chain/);
 assert.match(tape,/<Help label="Trade sample details"/);
 assert.match(tape,/customerText\(reply.source\)/);
 assert.match(tape,/reply\.contracts\.join/);
});
test('comparison still identifies price return and currency while source text is sanitized',()=>{
 const comparison=read('ComparisonCharts');
 assert.match(comparison,/Price return · local currency/);
 assert.match(comparison,/customerText\(s.source\)/);
 assert.match(comparison,/<Help label="Comparison method"/);
 assert.match(comparison,/Dividends|dividends/);
});
