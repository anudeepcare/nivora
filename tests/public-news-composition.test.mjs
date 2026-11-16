import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(name)=>readFileSync(`components/${name}`,'utf8');
test('public journey preserves honest illustration and real next actions',()=>{
 const source=read('PublicLanding.tsx');
 const hero=source.indexOf('className={styles.hero}');
 const workflow=source.indexOf('id="how-it-works"',hero), closing=source.indexOf('className={styles.closing}',hero);
 assert.ok(hero >= 0 && hero < workflow && workflow < closing);
 assert.match(source,/Product guide · not live data/);
 assert.match(source,/not live recommendations/);
 assert.doesNotMatch(source,/NOW.*102\.25|155\.82/);
 assert.match(source,/href="\/login\?mode=signup"/);
});
test('news leads with a complete source headline and preserves additional coverage and filings',()=>{
 const source=read('NewsCoverage.tsx');
 assert.match(source,/const visible = rows.slice\(0, 6\)/);
 assert.doesNotMatch(source,/setExpanded|<details/);
 assert.match(source,/index === 0 \? s.leadStory/);
 assert.match(source,/s.story/);
 assert.match(source,/<h3>\{n.title\}<\/h3>/);
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
