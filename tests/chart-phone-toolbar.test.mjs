import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('phone tools scroll as one row without shrinking or removing controls',()=>{
 const css=readFileSync('components/ChartReferences.module.css','utf8').split('/* One swipeable')[1];
 assert.match(css,/flex-wrap: nowrap/); assert.match(css,/overflow-x: auto/);
 assert.match(css,/flex-shrink: 0/); assert.match(css,/min-height: 44px/);
 assert.doesNotMatch(css,/display: none/);
});
test('compact reference titles preserve axis numbers and visible legend, not Fibonacci ratios',()=>{
 const chart=readFileSync('components/Charts.tsx','utf8');
 assert.match(chart,/if \(width > 0\) setCompact\(width < 480\)/);
 assert.match(chart,/title: compactLevelTitles && compact \? "" : l.label/);
 assert.match(chart,/axisLabelVisible: true/);
 const study=readFileSync('components/PriceStudyChart.tsx','utf8');
 assert.match(study,/compactLevelTitles=\{!overlay\}/);
 assert.match(study,/<details className=\{s.referenceDetails\} open>/);
 assert.match(study,/\{row.label\} \{amount\(row.price, research.quote.currency\)\}/);
});
