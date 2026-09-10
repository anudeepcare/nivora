import test from 'node:test';
import assert from 'node:assert/strict';

let tournament,promotion,policy;
try {
  tournament=await import('../.engine-test/auryn/v93/tournament.js');
  promotion=await import('../.engine-test/auryn/v93/promotion.js');
  policy=await import('../.engine-test/auryn/v93/policy.js');
} catch {}

const candidate=(id)=>({id,baseMetric:'x',family:'MOMENTUM',theory:'X',transform:'LEVEL',horizon:'20D',context:'NONE'});
const good=(featureId,overrides={})=>({
  featureId,horizon:'20D',totalN:400,trainN:200,oosN:200,validFoldCount:4,
  folds:[0,1,2,3].map(index=>({index,testN:50,meanEdgePct:1.5,costStressMeanEdgePct:1.2})),
  oosAvgEdgePct:1.5,costStressOosAvgEdgePct:1.2,oosConfidence95:{mean:1.5,low:.8,high:2.2,iterations:1000},
  oosInformationCoefficient:.15,oosHitRatePct:61,avgMaxDrawdownPct:-8,positiveFoldPct:100,
  regimesCovered:3,regimePositivePct:100,archetypesCovered:3,archetypePositivePct:100,sectorsCovered:4,sectorPositivePct:100,pValue:.000001,
  ...overrides
});

test('V9.3 promotes only a feature that passes every automated gate',()=>{
  assert.ok(tournament&&promotion&&policy,'V9.3 tournament modules must exist');
  const catalog=[candidate('robust'),candidate('costly'),candidate('unstable'),candidate('overfit')];
  const metrics=[
    good('robust'),
    good('costly',{costStressOosAvgEdgePct:-.2}),
    good('unstable',{positiveFoldPct:50,regimePositivePct:50}),
    good('overfit',{oosAvgEdgePct:-1,oosConfidence95:{mean:-1,low:-1.5,high:-.5,iterations:1000},pValue:.000001}),
  ];
  const out=tournament.finalizeV93Tournament(catalog,metrics,policy.V93_POLICY);
  const by=Object.fromEntries(out.results.map(x=>[x.featureId,x]));
  assert.equal(by.robust.disposition,'V94_CANDIDATE');
  assert.equal(by.robust.promotion.eligible,true);
  assert.equal(by.costly.disposition,'REJECTED_COST');
  assert.equal(by.unstable.disposition,'REJECTED_ROBUSTNESS');
  assert.equal(by.overfit.disposition,'REJECTED_OOS');
  assert.equal(out.v94CandidateCount,1);
});

test('V9.3 applies BH across the complete submitted catalog and can reject a nominal p-value',()=>{
  assert.ok(tournament&&policy,'V9.3 tournament modules must exist');
  const catalog=[candidate('a'),candidate('b'),candidate('c'),candidate('d')];
  const metrics=[good('a',{pValue:.04}),good('b',{pValue:.5}),good('c',{pValue:.7}),good('d',{pValue:.9})];
  const out=tournament.finalizeV93Tournament(catalog,metrics,policy.V93_POLICY);
  const a=out.results.find(x=>x.featureId==='a');
  assert.equal(out.fdrScopeCount,4);
  assert.ok(a.qValue>.05);
  assert.equal(a.disposition,'REJECTED_FDR');
});

test('V9.3 dispositions missing evidence instead of silently excluding hypotheses from FDR scope',()=>{
  assert.ok(tournament&&policy,'V9.3 tournament modules must exist');
  const catalog=[candidate('has-data'),candidate('missing')];
  const out=tournament.finalizeV93Tournament(catalog,[good('has-data')],policy.V93_POLICY);
  const missing=out.results.find(x=>x.featureId==='missing');
  assert.equal(out.fdrScopeCount,2);
  assert.equal(out.dispositionCount,2);
  assert.equal(missing.disposition,'REJECTED_NO_EVIDENCE');
  assert.equal(missing.pValue,1);
  assert.equal(missing.promotion.eligible,false);
});
