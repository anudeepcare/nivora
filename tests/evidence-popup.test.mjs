import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('additional evidence uses detail dialogs, not full-width overflow slabs',()=>{
 const s=fs.readFileSync('components/ResearchEvidenceGrid.tsx','utf8');
 assert.match(s,/<DetailDialog/);
 assert.match(s,/renderRows\(ordered, key, true\)/);
 assert.doesNotMatch(s,/className=\{`[^`]*\$\{s\.more\}/);
 assert.match(s,/"TrailingPE",\s*"ForwardPE",\s*"EnterpriseValueRevenue",\s*"marketCap"/);
});
