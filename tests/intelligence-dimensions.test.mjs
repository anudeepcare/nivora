import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAurynCioAssessment } from '../.engine-test/auryn/v97/cio-engine.js';
import { buildInstitutionalDecisionKernel } from '../.engine-test/auryn/v931/decision-kernel.js';

const base = {
  snapshotId: 'fixture-known-2026-10-16', symbol: 'EXAMPLE', marketPrice: 100,
  executionTradable: true, previousSetupState: null, evidenceCompleteness: 95,
  scores: { business: 90, earningsRevisions: 82, valuation: 80, marketStructure: 85, catalystsRegime: 70, riskAsymmetry: 80 },
  technical: { trend: 85, momentum: 85, flow: 80, structure: 85, nearResistance: false, confirmedBreakout: true, structuralBreak: false, reclaimLevel: 110, invalidation: 80 },
};
test('a broken price setup pauses deployment without breaking a sound business', () => {
  const result = buildInstitutionalDecisionKernel({ ...base, technical: { ...base.technical, structuralBreak: true } });
  assert.equal(result.newMoneyAction, 'WAIT');
  assert.equal(result.longTermAction, 'ATTRACTIVE');
  assert.equal(result.ownerAction, 'HOLD');
  assert.equal(result.executionAction, 'BLOCKED');
  assert.ok(!result.hardVetoReasons.includes('FUNDAMENTAL_THESIS_BREAK'));
  assert.doesNotMatch(result.invalidationTrigger, /thesis/i);
});
test('price-derived risk and catalysts cannot alter slow business quality', () => {
  const a = buildAurynCioAssessment(base);
  const b = buildAurynCioAssessment({ ...base, scores: { ...base.scores, riskAsymmetry: 10, catalystsRegime: 5, marketStructure: 5 } });
  assert.equal(a.compounderQuality, b.compounderQuality);
  assert.equal(a.longTermAction, b.longTermAction);
  assert.equal(b.newMoneyAction, 'WAIT');
});
test('no fundamentals abstains instead of inventing a bearish or neutral business opinion', () => {
  const result = buildAurynCioAssessment({ ...base, scores: { ...base.scores, business: null, earningsRevisions: null } });
  assert.equal(result.compounderQuality, null);
  assert.equal(result.longTermAction, 'UNASSESSED');
  assert.equal(result.newMoneyAction, 'WAIT');
  assert.equal(result.ownerAction, 'WATCH');
});
test('no observed pillars yields an unavailable score and zero coverage despite caller claim', () => {
  const result = buildInstitutionalDecisionKernel({ ...base, scores: Object.fromEntries(Object.keys(base.scores).map(k => [k, null])) });
  assert.equal(result.decisionScore, null);
  assert.equal(result.evidenceCompleteness, 0);
  assert.equal(result.executionAction, 'BLOCKED');
});
test('new capital is withheld when valuation or asymmetry is unknown', () => {
  for (const key of ['valuation', 'riskAsymmetry']) {
    const result = buildAurynCioAssessment({ ...base, scores: { ...base.scores, [key]: null } });
    assert.equal(result.newMoneyAction, 'WAIT');
    assert.notEqual(result.ownerAction, 'ADD');
  }
});
test('six-to-twelve month outlook requires dated forward evidence instead of copying long term', () => {
  const result = buildInstitutionalDecisionKernel(base);
  assert.equal(result.horizons.sixToTwelveMonths, 'UNASSESSED');
  assert.equal(result.horizons.threeToFiveYears, 'ATTRACTIVE');
  const dated = buildInstitutionalDecisionKernel({ ...base, horizonEvidence: { sixToTwelveMonths: { score: 35, asOf: '2026-10-15', evidenceIds: ['guidance-2026Q3'] } } });
  assert.equal(dated.horizons.sixToTwelveMonths, 'CHALLENGING');
  assert.equal(dated.horizons.threeToFiveYears, 'ATTRACTIVE');
});
test('named corroborated fundamental weakness can still produce an avoid decision', () => {
  const result = buildInstitutionalDecisionKernel({ ...base, scores: { ...base.scores, business: 25, earningsRevisions: 20 } });
  assert.equal(result.newMoneyAction, 'AVOID');
  assert.equal(result.longTermAction, 'UNATTRACTIVE');
  assert.ok(result.hardVetoReasons.includes('FUNDAMENTAL_THESIS_BREAK'));
});

import {validateResearchDecision} from '../.engine-test/auryn/v995/research-contract.js';
test('unknown-score decisions can persist only as explicit abstentions',()=>{
 const unknown={snapshotId:'unknown',newMoneyAction:'WAIT',ownerAction:'WATCH',longTermAction:'UNASSESSED',decisionScore:null,evidenceCompleteness:0,setupState:'REPAIRING'};
 assert.equal(validateResearchDecision(unknown),true);
 assert.equal(validateResearchDecision({...unknown,newMoneyAction:'BUY'}),false);
 assert.equal(validateResearchDecision({...unknown,decisionScore:'65',evidenceCompleteness:75}),false);
 assert.equal(validateResearchDecision({...unknown,evidenceCompleteness:null}),false);
});

test('a single sourced operating family may assess business while withholding unsupported forward corroboration',()=>{
 const a=buildAurynCioAssessment({...base,scores:{...base.scores,earningsRevisions:null}});
 assert.equal(a.compounderQuality,90);assert.equal(a.longTermAction,'ATTRACTIVE');
 assert.ok(a.confidence<base.evidenceCompleteness);
});

test('fundamental risk reduction remains executable while new capital is forbidden',()=>{
 const r=buildInstitutionalDecisionKernel({...base,scores:{...base.scores,business:20,earningsRevisions:20},technical:{...base.technical,structuralBreak:true}});
 assert.equal(r.newMoneyAction,'AVOID');assert.ok(['REDUCE','EXIT'].includes(r.ownerAction));assert.equal(r.executionAction,'READY');
});
