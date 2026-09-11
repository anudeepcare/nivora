import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url).pathname;
const pkg=JSON.parse(fs.readFileSync(root+'package.json','utf8'));

test('package exposes V9.3.6 focused and release gates',()=>{
 assert.match(pkg.scripts['test:v936']||'',/auryn-v936-opportunity/);
 assert.match(pkg.scripts['test:v936']||'',/auryn-v936-research-ui/);
 assert.match(pkg.scripts['gate:v936']||'',/run_v936_release_gate/);
});

test('V9.3.6 release note locks canonical data and premium product contract',()=>{
 const s=fs.readFileSync(root+'AURYN_V9_3_6_RELEASE.md','utf8');
 assert.match(s,/V9\.3\.5 canonical snapshot remains the data authority/i);
 assert.match(s,/Scenario balance.*not probability/i);
 assert.match(s,/mobile/i);
 assert.match(s,/CODE_READY_LIVE_VALIDATION_REQUIRED/);
});
