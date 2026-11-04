import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('desktop navigation can scroll in short windows',()=>{
 const css=readFileSync(new URL('../components/WorkspaceShell.module.css',import.meta.url),'utf8');
 assert.match(css.match(/\.sidebar\s*\{([^}]+)\}/s)?.[1]||'',/overflow-y:\s*auto/);
});
test('crypto overview cannot open company-only financial or valuation tabs',()=>{
 const source=readFileSync(new URL('../components/ResearchEvidenceGrid.tsx',import.meta.url),'utf8');
 assert.match(source,/!evidence\.crypto\s*\|\|\s*\(tab !== "Financials" && tab !== "Valuation"\)/);
});
