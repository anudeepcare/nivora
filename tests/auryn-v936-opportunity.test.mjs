import test from 'node:test';
import assert from 'node:assert/strict';
import {buildOpportunityLens} from '../.engine-test/auryn/v936/opportunity.js';

const base={
 action:'START_SMALL',hardVeto:false,
 scores:{business:82,earningsRevisions:76,valuation:68,marketStructure:74,catalystsRegime:60,riskAsymmetry:72,entryQuality:70,relativeStrength:66,participation:64,rewardRisk:2.4,volatilityRisk:42}
};

test('opportunity lens is deterministic',()=>{
 const a=buildOpportunityLens(base),b=buildOpportunityLens(base);
 assert.deepEqual(a,b);
});

test('missing valuation lowers coverage without becoming a bearish zero',()=>{
 const full=buildOpportunityLens(base);
 const missing=buildOpportunityLens({...base,scores:{...base.scores,valuation:null}});
 assert.ok(missing.coverage<full.coverage);
 assert.ok(missing.opportunityScore>50);
 assert.ok(missing.constraints.some(x=>/valuation/i.test(x)));
});

test('scenario balance sums to 100 and is explicitly uncalibrated',()=>{
 const x=buildOpportunityLens(base);
 assert.equal(x.scenarioBalance.bull+x.scenarioBalance.base+x.scenarioBalance.bear,100);
 assert.equal(x.scenarioBalance.calibrated,false);
 assert.match(x.scenarioBalance.label,/not probability/i);
});

test('hard veto prevents opportunity from being presented as high conviction',()=>{
 const x=buildOpportunityLens({...base,hardVeto:true,action:'AVOID'});
 assert.ok(x.opportunityScore<=45);
 assert.ok(x.constraints.some(x=>/hard veto/i.test(x)));
});

test('reward risk improves opportunity only when it is finite and plausible',()=>{
 const low=buildOpportunityLens({...base,scores:{...base.scores,rewardRisk:1.1}});
 const high=buildOpportunityLens({...base,scores:{...base.scores,rewardRisk:3.0}});
 const nonsense=buildOpportunityLens({...base,scores:{...base.scores,rewardRisk:99}});
 assert.ok(high.opportunityScore>low.opportunityScore);
 assert.ok(nonsense.opportunityScore<=high.opportunityScore);
});
