import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
test('observed price uses a theme-aware blue, not neutral ink or a directional verdict',()=>{
 const s=read('components/Charts.tsx');
 assert.match(s,/theme === "dark" \? "#75a7ff" : "#3268c8"/);
 assert.doesNotMatch(s,/const accent = palette.getPropertyValue\("--ink"\)/);
});
test('technical categories have distinct categorical accents and compact legible values',()=>{
 const s=read('components/ResearchMetrics.module.css').split('/* Categorical study')[1];
 for(const tone of ['blue','violet','amber','teal']) assert.ok(s.includes(`data-tone="${tone}"`));
 assert.match(s,/font-weight: 500/); assert.match(s,/minmax\(0, 1fr\)/);
 assert.match(s,/max-width: 650px/);
});
test('institutional map uses a readable responsive grid, without fabricated weighting',()=>{
 const s=read('components/ResearchVisualEvidence.module.css').split('/* Ownership reading')[1];
 assert.match(s,/repeat\(2, minmax\(0, 1fr\)\)/);
 assert.match(s,/font-size: 13px/); assert.match(s,/min-height: 44px/);
 assert.match(s,/max-width: 650px/);
 assert.match(read('components/OwnershipEvidenceMap.tsx'),/Equal links indicate reported holdings/);
});
test('radar categories match row bars and preserve missing scores',()=>{
 const s=read('components/DecisionWorkspace.tsx');
 assert.match(s,/fill=\{lensColors\[l.id\]\}/);
 assert.match(s,/background: lensColors\[l.id\]/);
 assert.match(s,/l.score != null &&/);
 assert.match(s,/l.score == null \? "Unscored"/);
});
