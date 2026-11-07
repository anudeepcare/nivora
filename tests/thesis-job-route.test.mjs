import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('thesis scheduler has a dedicated protected route and is absent from legacy job',()=>{
 const old=fs.readFileSync('app/api/jobs/route.ts','utf8');
 assert.ok(!old.includes('runThesisQueue'));
 const route=fs.readFileSync('app/api/jobs/theses/route.ts','utf8');
 assert.match(route,/timingSafeEqual/);assert.match(route,/secret.length < 32/);
 assert.match(route,/AURYN_THESIS_JOB_ENABLED/);assert.match(route,/getAccess\(userId\)/);
 assert.match(route,/!access.sampleOnly && access.features.financials/);
});
