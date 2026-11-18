import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('available conditional projection is not replaced by caller-only historical fallback',()=>{
 const s=read('components/SelectedValuation.tsx');
 assert.match(s,/headline &&\s*\(!modelled \|\| extreme\)/);
 assert.doesNotMatch(s,/!modelled \|\| extreme \|\| \(projection.available/);
 assert.match(s,/Historical volatility range/);
 assert.match(s,/Why scenario ranges differ/);
});
test('model unavailable keeps diagnostics in accessible disclosure',()=>{
 const s=read('components/ReferenceAtlas.tsx');
 assert.match(s,/<details className=\{s.evidenceCheck\}/);
 assert.match(s,/m.outcome.caveat/);
 assert.match(s,/check.detail/);
});
test('editable scenarios preserve semantic bear base bull names and source period',()=>{
 const s=read('components/TargetsEstimates.tsx');
 assert.match(s,/data-case=\{c.name.toLowerCase\(\)\}/);
 assert.match(s,/\{c.name\} scenario/);
 assert.doesNotMatch(s,/<dd>Nearest eligible 3-year<\/dd>/);
});
test('historical risk graphic uses actual cases and reference on one scale',()=>{
 const s=read('components/PriceRiskCases.tsx');
 assert.match(s,/cases.map\(\(c\) => c.target\), s.reference/);
 assert.match(s,/cx=\{position\(c.target\)\}/);
 assert.match(s,/x1=\{position\(s.reference\)\}/);
 assert.match(s,/role="img" aria-label="Historical downside/);
});
