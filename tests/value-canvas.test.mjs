import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('reported multiples never acquire a positive color from their array position',()=>{const s=fs.readFileSync('components/ValueStudio.tsx','utf8');assert.doesNotMatch(s,/i<4\?"blue":"teal"/);assert.match(s,/data-tone="neutral"/)});
test('manual projections are clearly optional and not a competing automatic headline model',()=>{const s=fs.readFileSync('components/ValueStudio.tsx','utf8');assert.match(s,/<details className="value-personal-model"/);assert.match(s,/Your assumptions · optional workbench/)});
test('yield numbers carry their percent unit',()=>{const s=fs.readFileSync('components/ValueStudio.tsx','utf8');assert.match(s,/toFixed\(2\).*%/)});
test('ordinary stock footnotes never claim they are crypto',()=>{const s=fs.readFileSync('components/ValueStudio.tsx','utf8');assert.match(s,/assetType === "crypto"/)});
