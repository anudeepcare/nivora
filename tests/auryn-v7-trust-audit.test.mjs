import test from 'node:test';import assert from 'node:assert/strict';
import {auditCanonicalTrust} from '../.engine-test/auryn/v7/trust-audit.js';

const base={snapshotId:'X1',marketTruth:{snapshotId:'X1',decisionPrice:100,priceSensitiveAllowed:true},executionPlan:{snapshotId:'X1',state:'READY',intent:'ACCUMULATE',currentPrice:100,initialEntry:{low:96,high:99,label:'Initial entry',multiplier:1,basis:'x'},dcaZones:[{low:91,high:94,label:'DCA 1',multiplier:1,basis:'x'}],confirmation:103,invalidation:88,targets:[{label:'T1',price:110},{label:'T2',price:120}]},scenario:{snapshotId:'X1',intent:'ACCUMULATE',bull:{trigger:103,zoneLow:96,zoneHigh:99,targetLow:110,targetHigh:120,invalidation:88}},valuationAvailable:true,primaryAction:'BUY'};

test('canonical trust audit passes when snapshot, plan and scenario are aligned',()=>{
 const a=auditCanonicalTrust(base);assert.equal(a.state,'PASS');assert.equal(a.blockers.length,0);assert.ok(a.score>=95);
});

test('scenario/plan mismatch is a runtime trust blocker',()=>{
 const a=auditCanonicalTrust({...base,scenario:{...base.scenario,bull:{...base.scenario.bull,trigger:104}}});
 assert.equal(a.state,'BLOCK');assert.ok(a.blockers.some(x=>/scenario|trigger/i.test(x)));
});

test('non-accumulate intent cannot carry DCA zones',()=>{
 const plan={...base.executionPlan,intent:'WATCH',dcaZones:[]};
 const good=auditCanonicalTrust({...base,executionPlan:plan,scenario:{...base.scenario,intent:'WATCH'}});assert.notEqual(good.state,'BLOCK');
 const bad=auditCanonicalTrust({...base,executionPlan:{...plan,dcaZones:base.executionPlan.dcaZones},scenario:{...base.scenario,intent:'WATCH'}});assert.equal(bad.state,'BLOCK');
});

test('canonical market price and execution price must agree',()=>{
 const a=auditCanonicalTrust({...base,executionPlan:{...base.executionPlan,currentPrice:101}});assert.equal(a.state,'BLOCK');assert.ok(a.blockers.some(x=>/price/i.test(x)));
});

test('missing valuation cannot coexist with active accumulation',()=>{
 const a=auditCanonicalTrust({...base,valuationAvailable:false});assert.equal(a.state,'BLOCK');assert.ok(a.blockers.some(x=>/valuation/i.test(x)));
});
