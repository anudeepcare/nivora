import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
test('approved Research preserves live decision and range sources', () => {
 const source = read('components/IntegratedResearch.tsx');
 assert.match(source, /approvedResearch\(r, decisionOwns, now\)/);
 assert.match(source, /stockFactRows\(r\)/);
 assert.match(source, /<StockPillars research=\{r\} decision=\{d\}/);
 assert.match(source, /analyst\.target/);
 assert.match(source, /showUnavailable/);
 assert.doesNotMatch(source, /72\.84|102\.39|134\.84|155\.82/);
});
test('approved Research switches desktop chart first to mobile decision first', () => {
 const css = read('components/ResearchOverview.module.css');
 assert.match(css, /\.decisionStage \.chart\s*\{[^}]*grid-column: 1;[^}]*grid-row: 1;/);
 assert.match(css, /\.decisionStage \.paceColumn\s*\{[^}]*grid-column: 2;[^}]*grid-row: 1;/);
 assert.match(css, /@media \(max-width: 900px\)\s*\{[^]*?\.decisionStage \.paceColumn\s*\{[^}]*grid-column: 1;[^}]*grid-row: 1;/);
 assert.match(css, /prefers-reduced-transparency: reduce/);
});
test('evidence rows remain available and margin panel respects preferences', () => {
 const source = read('components/ResearchEvidenceGrid.tsx');
 assert.match(source, /name: "Margins"/);
 assert.match(source, /rows\.map/);
 assert.match(source, /key === "margins"/);
});
