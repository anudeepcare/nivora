import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('desktop navigation uses one top header and keeps secondary destinations reachable',()=>{
 const source=readFileSync(new URL('../components/Shell.tsx',import.meta.url),'utf8');
 assert.match(source,/aria-label="Main navigation"/);
 assert.match(source,/aria-label="More workspace actions"/);
 assert.doesNotMatch(source,/<aside/);
 for(const route of ['compare','research-lab','settings','plans','alerts','trading','help']) assert.ok(source.includes('path: "'+route+'"'));
});
test('crypto overview cannot open company-only financial or valuation tabs',()=>{
 const source=readFileSync(new URL('../components/ResearchEvidenceGrid.tsx',import.meta.url),'utf8');
 assert.match(source,/!evidence\.crypto\s*\|\|\s*\(tab !== "Financials" && tab !== "Valuation"\)/);
});
