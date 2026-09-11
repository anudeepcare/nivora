import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');

test('V9.3.4 is part of quick/full verification and full engine regression',()=>{
 const pkg=JSON.parse(read('package.json'));
 assert.match(pkg.scripts?.['test:v934-core']||'',/auryn-v934-timeframes/);
 assert.match(pkg.scripts?.['test:v934-core']||'',/auryn-v934-reliability/);
 assert.match(pkg.scripts?.['verify:quick']||'',/test:v934-core/);
 assert.match(pkg.scripts?.['verify:release']||'',/gate:v93(?:4|5)/);
 const engine=pkg.scripts?.['test:engine']||'';
 for(const f of ['auryn-v934-timeframes.test.mjs','auryn-v934-zones.test.mjs','auryn-v934-snapshot.test.mjs','auryn-v934-provider-contract.test.mjs','auryn-v934-cross-surface.test.mjs','auryn-v934-decision-bridge.test.mjs','auryn-v934-ui-contract.test.mjs','auryn-v934-session-matrix.test.mjs','auryn-v934-reliability.test.mjs','auryn-v934-live-validation.test.mjs','auryn-v934-package-contract.test.mjs']) assert.match(engine,new RegExp(f.replaceAll('.','\\.')));
});

test('release note states code ready but live proof required',()=>{
 assert.ok(fs.existsSync('AURYN_V9_3_4_RELEASE.md'));
 const src=read('AURYN_V9_3_4_RELEASE.md');
 assert.match(src,/CODE_READY_LIVE_VALIDATION_REQUIRED/);
 assert.match(src,/30.*100.*500/s);
 assert.match(src,/15M.*1H.*4H.*1D.*1W/s);
 assert.match(src,/Research.*Portfolio.*Monitor.*Trading Lab/s);
});
