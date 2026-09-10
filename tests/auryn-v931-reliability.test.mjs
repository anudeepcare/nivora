import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {auditCrossSurfaceDecision,auditDecisionTransition} from '../.engine-test/auryn/v931/reliability.js';

test('cross-surface invariant catches any canonical mismatch',()=>{
 const ok=auditCrossSurfaceDecision([{surface:'stock',snapshotId:'s',price:10,action:'HOLD',ownerAction:'HOLD',setupState:'REPAIRING'},{surface:'watchlist',snapshotId:'s',price:10,action:'HOLD',ownerAction:'HOLD',setupState:'REPAIRING'}]);
 assert.equal(ok.ok,true);
 const bad=auditCrossSurfaceDecision([{surface:'stock',snapshotId:'s',price:10,action:'HOLD',ownerAction:'HOLD',setupState:'REPAIRING'},{surface:'portfolio',snapshotId:'s',price:11,action:'HOLD',ownerAction:'HOLD',setupState:'REPAIRING'}]);
 assert.equal(bad.ok,false);
});

test('decision transition requires a causal attribution',()=>{
 assert.equal(auditDecisionTransition({previousAction:'BUY',nextAction:'HOLD',changedEvidence:[],trigger:null}).ok,false);
 assert.equal(auditDecisionTransition({previousAction:'BUY',nextAction:'HOLD',changedEvidence:['tech.reclaim'],trigger:'Reclaim failed'}).ok,true);
});

test('release scripts expose a permanent reliability lab and gate',()=>{
 const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
 assert.match(pkg.scripts['test:v931-core']||'',/auryn-v931/);
 assert.match(pkg.scripts['audit:v931-reliability']||'',/run_v931_reliability_lab/);
 assert.match(pkg.scripts['gate:v931']||'',/run_v931_release_gate/);
});
