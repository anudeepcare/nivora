import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolvePaperInvalidation} from '../.engine-test/v65/paper-invalidation.js';

test('paper invalidation prefers the decision risk zone',()=>{
 const x=resolvePaperInvalidation({entry:100,decision:{zones:[{kind:'risk',low:91}]},evidence:{levels:{invalidation:88,majorSupport:84}}});
 assert.equal(x.value,91);assert.equal(x.source,'decision-risk-zone');
});

test('paper invalidation uses frozen market evidence when the decision risk zone is missing',()=>{
 const x=resolvePaperInvalidation({entry:100,decision:{zones:[]},evidence:{levels:{invalidation:89,majorSupport:83}}});
 assert.equal(x.value,89);assert.equal(x.source,'evidence-invalidation');
});

test('paper invalidation can use major support as a conservative paper-only fallback',()=>{
 const x=resolvePaperInvalidation({entry:100,decision:{zones:[]},evidence:{levels:{majorSupport:82}}});
 assert.equal(x.value,82);assert.equal(x.source,'evidence-major-support');
});

test('context help is portaled and viewport positioned instead of clipped inside metric cards',()=>{
 const s=fs.readFileSync('components/v65/MetricInfo.tsx','utf8');
 assert.match(s,/createPortal/);
 assert.match(s,/position:\s*['"]fixed['"]/);
 assert.match(s,/getBoundingClientRect/);
});

test('key investor metrics publish plain-English score ranges',()=>{
 const s=fs.readFileSync('lib/nivora-metrics.ts','utf8');
 assert.match(s,/range\?:string/);
 assert.match(s,/opportunity:\{[^}]*range:/s);
 assert.match(s,/timing:\{[^}]*range:/s);
 assert.match(s,/business:\{[^}]*range:/s);
});

test('portfolio learning freezes technical levels so paper sizing can reproduce invalidation',()=>{
 const s=fs.readFileSync('app/api/portfolio/learn/route.ts','utf8');
 assert.match(s,/levels:market\?\.levels/);
});

test('paper runner reads frozen evidence and resolves paper invalidation before sizing',()=>{
 const s=fs.readFileSync('app/api/trading-lab/run-paper/route.ts','utf8');
 assert.match(s,/evidence/);
 assert.match(s,/resolvePaperInvalidation/);
});
