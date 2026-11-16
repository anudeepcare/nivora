import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('reported multiples never acquire a positive color from their array position',()=>{const s=fs.readFileSync('components/ValueStudio.tsx','utf8');assert.doesNotMatch(s,/i<4\?"blue":"teal"/);assert.match(s,/data-tone="neutral"/)});
test('manual projections are clearly optional and not a competing automatic headline model',()=>{const s=fs.readFileSync('components/PriceProjection.tsx','utf8');assert.match(s,/if \(!supported\) return null/);assert.match(s,/<details className="value-personal-model"/);assert.match(s,/Adjust scenarios/)});
test('yield numbers carry their percent unit',()=>{const s=fs.readFileSync('components/ValueStudio.tsx','utf8');assert.match(s,/toFixed\(2\).*%/)});
test('ordinary stock footnotes never claim they are crypto',()=>{const s=fs.readFileSync('components/ValueStudio.tsx','utf8');assert.match(s,/assetType === "crypto"/)});

test('valuation reference pairs calculator with cases and collapses only on narrow screens',()=>{
 const css=fs.readFileSync('components/ValueStudio.module.css','utf8');
 assert.match(css,/grid-template-columns: minmax\(0, 1.6fr\) minmax\(0, 1fr\)/);
 assert.match(css,/\.root > \.calculator[\s\S]*?grid-column: 1;[\s\S]*?grid-row: 1/);
 assert.match(css,/\.root > \.scenarios[\s\S]*?grid-column: 2;[\s\S]*?grid-row: 1/);
 assert.match(css,/@media \(max-width: 800px\)/);
 assert.doesNotMatch(css,/valuation-board-grid > article|nth-child/);
});
