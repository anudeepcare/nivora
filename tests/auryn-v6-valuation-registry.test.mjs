import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveValuationMethod} from '../.engine-test/auryn/v6/valuation-registry.js';

const c=(businessModel,lifecycle='SCALE')=>({businessModel,lifecycle,assetClass:'EQUITY',sector:null,industry:null,capitalIntensity:'MEDIUM',cyclicality:'MODERATE',profitabilityStage:'PROFITABLE',confidence:.9,evidenceIds:[]});
const factor=(score=70,state='MEASURED',reason='Measured relative valuation.')=>({factor:'VALUATION',score,reason,evidenceIds:['v'],validationState:state,weight:.1,available:true});

test('valuation method registry selects archetype-specific methods',()=>{
  assert.equal(resolveValuationMethod(c('SAAS_SOFTWARE'),factor()).method,'GROWTH_EV_SALES_FCF');
  assert.equal(resolveValuationMethod(c('SEMICONDUCTOR_MEMORY_CYCLICAL'),factor()).method,'CYCLE_NORMALIZED');
  assert.equal(resolveValuationMethod(c('AI_DATA_CENTER_INFRA'),factor()).method,'AI_INFRA_SOTP_CAPACITY');
  assert.equal(resolveValuationMethod(c('POWER_UTILITY_INFRA'),factor()).method,'AI_INFRA_SOTP_CAPACITY');
  assert.equal(resolveValuationMethod(c('BANK'),factor()).method,'BANK_PB_ROE_NIM');
  assert.equal(resolveValuationMethod(c('REIT'),factor()).method,'REIT_FFO_AFFO');
  assert.equal(resolveValuationMethod(c('SPACE_SATELLITE','VALIDATION'),factor()).method,'FRONTIER_SCENARIO_RUNWAY');
});

test('missing valuation stays unavailable and never becomes a bearish zero',()=>{
  const x=resolveValuationMethod(c('AI_DATA_CENTER_INFRA'),undefined);
  assert.equal(x.state,'UNAVAILABLE');
  assert.equal(x.score,null);
  assert.equal(x.decisionGrade,false);
  assert.ok(x.requiredInputs.length>=3);
});

test('preliminary heuristic valuation is PARTIAL and cannot publish decision-grade fair value',()=>{
  const x=resolveValuationMethod(c('SAAS_SOFTWARE'),factor(55,'HEURISTIC','Preliminary sales multiple; not allowed to publish absolute fair value.'));
  assert.equal(x.state,'PARTIAL');
  assert.equal(x.decisionGrade,false);
  assert.equal(x.score,55);
});

test('measured valuation is decision grade but still labeled with its archetype method',()=>{
  const x=resolveValuationMethod(c('BANK'),factor(66,'MEASURED','Measured peer and historical valuation.'));
  assert.equal(x.state,'MEASURED');
  assert.equal(x.decisionGrade,true);
  assert.equal(x.score,66);
  assert.match(x.explanation,/bank/i);
});
