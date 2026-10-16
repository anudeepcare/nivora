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

// Browser-authored V6/V7 writes were retired: canonical-write-boundary.test.mjs
// now exercises the authenticated server recalculation boundary. Historical serializers stay tested above.
import {persistAutonomousResearch,AUTONOMOUS_RESEARCH_ENGINE_VERSION} from '../.engine-test/auryn/v995/persist-research.js';
test('server research persistence freezes policy and market provenance together',async()=>{
 const rows=[];const db={from:name=>{assert.equal(name,'nivora_v59_decision_snapshots');return {insert:async row=>{rows.push(structuredClone(row));return {error:null};}}}};
 const decision={policyVersion:AUTONOMOUS_RESEARCH_ENGINE_VERSION,snapshotId:'server-1',newMoneyAction:'WAIT',ownerAction:'HOLD',longTermAction:'SELECTIVE',decisionScore:60,evidenceCompleteness:80,setupState:'REPAIRING'};
 const mi={snapshotId:'market-intelligence-1',marketTruthSnapshotId:'market-1',actionMap:{invalidation:90}};
 await persistAutonomousResearch(db,'TEST',{state:'RESEARCH_READY',decision,marketTruth:{snapshotId:'market-1',decisionPrice:100},marketIntelligence:mi});
 decision.newMoneyAction='BUY';
 assert.equal(rows[0].decision.newMoneyAction,'WAIT');assert.equal(rows[0].engine_version,AUTONOMOUS_RESEARCH_ENGINE_VERSION);
 assert.equal(rows[0].evidence.v995.policyVersion,AUTONOMOUS_RESEARCH_ENGINE_VERSION);assert.equal(rows[0].evidence.v934.snapshotId,'market-intelligence-1');
 assert.equal(rows[0].evidence.v935.marketSnapshotId,'market-1');
});

test('scheduled maturity includes V6 exact-engine outcomes',()=>{
 const wf=fs.readFileSync('.github/workflows/nivora-calibration-mature.yml','utf8');
 const route=fs.readFileSync('app/api/model-health/mature/route.ts','utf8');
 assert.match(wf,/api\/model-health\/mature/);
 assert.match(route,/AURYN_V6_ENGINE_VERSION/);
 assert.match(route,/\.eq\("engine_version",AURYN_V6_ENGINE_VERSION\)/);
});
