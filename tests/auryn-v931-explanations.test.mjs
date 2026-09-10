import test from 'node:test';
import assert from 'node:assert/strict';
import {buildInstitutionalDecisionKernel} from '../.engine-test/auryn/v931/decision-kernel.js';
import {validateExpertExplanation} from '../.engine-test/auryn/v931/explanation.js';

test('decision kernel emits six meaningful pillars plus owner/new-money/long-term/execution actions',()=>{
 const d=buildInstitutionalDecisionKernel({snapshotId:'s1',symbol:'IREN',marketPrice:47,executionTradable:false,previousSetupState:'REPAIRING',scores:{business:82,earningsRevisions:77,valuation:64,marketStructure:58,catalystsRegime:69,riskAsymmetry:67},technical:{trend:58,momentum:72,flow:66,structure:61,nearResistance:true,confirmedBreakout:false,structuralBreak:false,reclaimLevel:48.39,invalidation:42.10},evidenceCompleteness:94});
 assert.equal(Object.keys(d.pillars).length,6);
 assert.ok(['WAIT','START_SMALL','BUY','ACCUMULATE'].includes(d.newMoneyAction));
 assert.ok(['HOLD','ADD','REDUCE','EXIT'].includes(d.ownerAction));
 assert.equal(d.executionAction,'BLOCKED');
 assert.ok(d.nextDecisionTrigger.includes('48.39'));
 assert.ok(d.drivers.length>0);
 assert.ok(d.counterEvidence.length>0);
});

test('expert explanation gate rejects generic prose and unsupported numbers',()=>{
 const evidence=[{id:'tech.reclaim',text:'Daily reclaim level is $48.39.',values:[48.39],horizon:'5-20D'}];
 const bad=validateExpertExplanation({summary:'Strong fundamentals and improving momentum.',whatChanged:'Momentum improved.',whyItMatters:'This is positive.',actionImpact:'Be cautious.',nextTrigger:'Watch price.',horizon:'Near term',counterEvidence:'Risks remain.',evidenceIds:[]},evidence);
 assert.equal(bad.ok,false);
 const invented=validateExpertExplanation({summary:'Wait for $57.00.',whatChanged:'Reclaim is incomplete at $57.00.',whyItMatters:'The setup is not confirmed.',actionImpact:'New money waits.',nextTrigger:'Daily close above $57.00.',horizon:'5-20D',counterEvidence:'Momentum remains constructive.',evidenceIds:['tech.reclaim']},evidence);
 assert.equal(invented.ok,false);
 const good=validateExpertExplanation({summary:'New money waits because the reclaim is incomplete.',whatChanged:'Price remains below the $48.39 daily reclaim level.',whyItMatters:'A confirmed reclaim is required before AURYN upgrades the setup.',actionImpact:'New money WAIT; existing owners can HOLD while invalidation remains intact.',nextTrigger:'A daily close above $48.39 with participation confirmation changes the call.',horizon:'5-20D',counterEvidence:'Momentum is constructive, so waiting can miss upside if price gaps through confirmation.',evidenceIds:['tech.reclaim']},evidence);
 assert.equal(good.ok,true,good.issues.join('; '));
});

test('institutional kernel carries specific pillar rationale, attribution, and never mislabels evidence coverage as predictive probability',()=>{
 const d=buildInstitutionalDecisionKernel({snapshotId:'s2',symbol:'MSFT',marketPrice:510,executionTradable:true,previousSetupState:'BREAKOUT_WATCH',scores:{business:84,earningsRevisions:73,valuation:58,marketStructure:67,catalystsRegime:62,riskAsymmetry:71},pillarEvidence:{business:{why:'Free-cash-flow durability and returns on capital support the business-quality pillar; the canonical business score is 84/100.',evidenceIds:['metric.businessQuality']},earningsRevisions:{why:'Forward earnings evidence is constructive at 73/100, so expectations are contributing positively rather than merely price momentum.',evidenceIds:['metric.fundamentals']},valuation:{why:'Valuation is 58/100, which is not strong enough to carry the call by itself.',evidenceIds:['metric.valuation']},marketStructure:{why:'Completed-bar market structure is 67/100 and remains above the validated reclaim state.',evidenceIds:['metric.technicalStrength']},catalystsRegime:{why:'Catalyst and regime evidence is 62/100 and therefore supportive but secondary.',evidenceIds:['metric.catalysts']},riskAsymmetry:{why:'Risk/asymmetry is 71/100 after inverting canonical risk pressure; risk is supportive but still governed separately.',evidenceIds:['metric.riskPressure']}},technical:{trend:70,momentum:68,flow:64,structure:70,nearResistance:true,confirmedBreakout:false,structuralBreak:false,reclaimLevel:505,invalidation:470},evidenceCompleteness:96,canonicalAction:'BUY',canonicalOwnerAction:'HOLD'});
 assert.equal(d.pillars.business.why.includes('Free-cash-flow durability'),true);
 assert.deepEqual(d.pillars.business.evidenceIds,['metric.businessQuality']);
 assert.equal(d.confidenceBasis,'EVIDENCE_QUALITY_UNCALIBRATED');
 assert.equal(d.confidenceScore,96);
 assert.equal(d.evidenceCompleteness,96);
 assert.equal(d.attribution.length,6);
 assert.ok(d.attribution.some(x=>x.pillar==='business'&&x.contribution>0));
 assert.doesNotMatch(d.drivers.join(' '),/is supporting the decision/i);
});
