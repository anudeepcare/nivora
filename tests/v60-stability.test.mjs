import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
import test from 'node:test';import assert from 'node:assert/strict';
const s=require('../.engine-test/nivora-decision-stability.js');

test('distinguishes evidence-backed action changes from noisy flips',()=>{
 assert.equal(s.classifyDecisionTransition('BUY','WAIT',false),'NOISE_FLIP');
 assert.equal(s.classifyDecisionTransition('BUY','WAIT',true),'EVIDENCE_CHANGE');
 assert.equal(s.classifyDecisionTransition('BUY','BUY',false),'STABLE');
});

test('computes action flip rate and unexplained flip rate',()=>{
 const m=s.decisionStabilityMetrics([
  {action:'BUY',materialEvidenceChanged:false},{action:'WAIT',materialEvidenceChanged:false},{action:'BUY',materialEvidenceChanged:true},{action:'BUY',materialEvidenceChanged:false}
 ]);
 assert.equal(m.transitions,3);assert.equal(m.flips,2);assert.equal(m.unexplainedFlips,1);assert.equal(m.flipRatePct,66.7);assert.equal(m.unexplainedFlipRatePct,33.3);
});
