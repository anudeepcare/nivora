import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(name)=>readFileSync(`components/${name}`,'utf8');
test('public reference section order preserves honest data and actual destinations',()=>{
 const source=read('PublicLanding.tsx');
 const hero=source.indexOf('aria-labelledby="ap-hero-heading"');
 const ribbon=source.indexOf('landing.paceRibbon',hero), destinations=source.indexOf('landing.destinationGrid',hero), decision=source.indexOf('landing.decisionPair',hero);
 assert.ok(hero < ribbon && ribbon < destinations && destinations < decision);
 assert.match(source,/not market data/);
 assert.match(source,/No live quote or recommendation/);
 assert.doesNotMatch(source,/NOW.*102\.25|155\.82/);
 assert.match(source,/href="\/research\/NOW"/);
});
test('news keeps uniform complete headlines and additional coverage opens outside the grid',()=>{
 const source=read('NewsCoverage.tsx');
 assert.match(source,/const visible = rows.slice\(0, 6\)/);
 assert.doesNotMatch(source,/setExpanded|index === 0|<details/);
 assert.match(source,/className=\{s.story\}/);
 assert.match(source,/<DetailDialog/);
 assert.match(source,/rows.map\(renderArticle\)/);
 assert.match(source,/filings.map\(\(f\) =>/);
});
test('earnings explanations open in a dialog while all dated figures and filing links remain',()=>{
 const source=read('EarningsReview.tsx');
 assert.doesNotMatch(source,/<details/);
 assert.match(source,/<DetailDialog/);
 assert.match(source,/review.actual\?\.toFixed\(2\)/);
 assert.match(source,/Source href=\{bridge.latest.sourceUrl\}/);
 assert.match(source,/Source href=\{bridge.prior.sourceUrl\}/);
});
