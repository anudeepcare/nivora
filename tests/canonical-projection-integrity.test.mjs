import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import fs from 'node:fs';
const exports={};
const policy='auryn-intelligence-2026-10-16';
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/auryn/v935/canonical.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
  {exports,require:name=>name.endsWith('/domain')?{INTELLIGENCE_POLICY_VERSION:policy}:name.endsWith('/projections')?{projectMarketIntelligence:m=>({...m,levels:{confirmation:101},timeframes:['1D']})}:{},process:{env:{}},Date,Map,Promise,Number});
const row=over=>({observed_at:new Date().toISOString(),decision:{thesis:{strength:null}},evidence:{v931:{policyVersion:policy,snapshotId:'canonical',newMoneyAction:'WAIT',ownerAction:'HOLD',longTermAction:'ATTRACTIVE',decisionScore:null,evidenceCompleteness:60,drivers:['cashflow'],counterEvidence:['funding']},v995:{autonomous:true,policyVersion:policy}},...over});
test('null scores remain unavailable through persisted projection',()=>{
  const r=exports.researchFromRow(row());assert.equal(r.thesisScore,null);assert.equal(r.decisionScore,null);
});
test('every consumer receives the original decision and its provenance',()=>{
  const r=exports.researchFromRow(row());assert.equal(r.decision?.snapshotId,'canonical');assert.equal(r.decision?.drivers[0],'cashflow');assert.equal(r.policyVersion,policy);
});
test('old client-authored snapshots cannot become current canonical instructions',()=>{
  const r=exports.researchFromRow(row({evidence:{v931:{snapshotId:'old',newMoneyAction:'BUY'}}}));assert.notEqual(r.state,'READY');assert.equal(r.action,null);
});
