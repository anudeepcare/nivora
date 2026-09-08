import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {serializeV6Decision} from '../.engine-test/auryn/v6/learning.js';

const v6={version:'auryn-v6',engineVersion:'auryn-v6-proof-os-1',snapshotId:'BE:close:1',symbol:'BE',asOf:'2026-09-04T20:00:00Z',evidenceConfidence:{score:74,label:'MEDIUM',note:'x'},decisionStrength:{score:72,label:'MEDIUM',note:'x'},modelProof:{grade:'UNPROVEN',exactSampleN:0,promotion:{eligible:false,blockers:['Need evidence']}},multiTimeframe:{alignment:'ALIGNED_BULLISH',summary:'x',weeklyBars:60,daily:null,weekly:null},valuation:{method:'AI_INFRA_SOTP_CAPACITY',state:'MEASURED',score:70,decisionGrade:true,requiredInputs:[],explanation:'x'},portfolio:null,v5:{decision:{primaryAction:'BUY',ownerAction:'HOLD',horizonDecisions:[{horizon:'NOW',action:'HOLD'},{horizon:'THREE_TO_FIVE_YEARS',action:'BUY'}]},v4:{classification:{businessModel:'POWER_UTILITY_INFRA'},thesis:{strength:80,direction:'STABLE'},factors:{}},executionPlan:{snapshotId:'BE:close:1',state:'READY',intent:'ACCUMULATE',initialEntry:{low:200,high:210},dcaZones:[],confirmation:220,invalidation:185,targets:[]}}};

test('V6 learning serializer freezes the exact visible decision and execution plan',()=>{
 const x=serializeV6Decision(v6);
 assert.equal(x.engineVersion,'auryn-v6-proof-os-1');
 assert.equal(x.snapshotId,'BE:close:1');
 assert.equal(x.primaryAction,'BUY');
 assert.equal(x.ownerAction,'HOLD');
 assert.equal(x.executionPlan.snapshotId,'BE:close:1');
 assert.equal(x.classification.businessModel,'POWER_UTILITY_INFRA');
 assert.equal(x.evidenceConfidence.score,74);
});

test('validation route persists canonical V6 snapshot as its own immutable engine cohort',()=>{
 const src=fs.readFileSync('app/api/validation/snapshot/route.ts','utf8');
 assert.match(src,/canonicalDecision/);
 assert.match(src,/engine_version:canonicalDecision\.engineVersion/);
 assert.match(src,/decision:canonicalDecision/);
 assert.match(src,/evidence_fingerprint/);
});

test('stock client upgrades the canonical validation event to V7 trust semantics',()=>{
 const src=fs.readFileSync('components/StockClient.tsx','utf8');
 assert.match(src,/canonicalDecision:v7Analysis\?serializeV7Decision\(v7Analysis\):null/);
});

test('scheduled maturity includes V6 exact-engine outcomes',()=>{
 const wf=fs.readFileSync('.github/workflows/nivora-calibration-mature.yml','utf8');
 const route=fs.readFileSync('app/api/model-health/mature/route.ts','utf8');
 assert.match(wf,/api\/model-health\/mature/);
 assert.match(route,/AURYN_V6_ENGINE_VERSION/);
 assert.match(route,/\.eq\("engine_version",AURYN_V6_ENGINE_VERSION\)/);
});
