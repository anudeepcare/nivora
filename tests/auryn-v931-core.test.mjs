import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDecisionSnapshot} from '../.engine-test/auryn/v931/decision-snapshot.js';
import {resolveSetupTransition} from '../.engine-test/auryn/v931/setup-state.js';

const market={snapshotId:'SPY-x',symbol:'SPY',asOf:'2026-09-09T23:00:00.000Z',session:'CLOSED',calendarState:'CLOSED',priceState:'OFFICIAL_CLOSE',decisionPrice:650,displayPrice:650,decisionPriceAsOf:'2026-09-09T20:00:00.000Z',decisionPriceRole:'REGULAR_CLOSE',regularClose:650,regularClosePrice:650,regularCloseAsOf:'2026-09-09T20:00:00.000Z',liveMarketPrice:null,liveMarketPriceAsOf:null,executionPrice:null,executionPriceAsOf:null,extendedPrice:null,providerAgreementPct:null,contextProviderGapPct:null,sources:[],priceSensitiveAllowed:true,decisionAllowed:true,executionTradable:false,priceUse:'RESEARCH_CLOSE',reason:'closed'};

test('DecisionSnapshot fingerprint is deterministic and stable across object key ordering',()=>{
 const a=buildDecisionSnapshot({symbol:'SPY',asOf:'2026-09-09T23:00:00.000Z',marketTruth:market,completedDailyBarCutoff:'2026-09-09',fundamentalsAsOf:'2026-09-09',earningsAsOf:null,estimatesAsOf:null,newsCutoff:'2026-09-09T22:00:00.000Z',macroAsOf:'2026-09-09',featureVersion:'v9.3',modelVersion:'v7',policyVersion:'v9.3.1',evidence:{b:2,a:1}});
 const b=buildDecisionSnapshot({symbol:'SPY',asOf:'2026-09-09T23:00:00.000Z',marketTruth:{...market},completedDailyBarCutoff:'2026-09-09',fundamentalsAsOf:'2026-09-09',earningsAsOf:null,estimatesAsOf:null,newsCutoff:'2026-09-09T22:00:00.000Z',macroAsOf:'2026-09-09',featureVersion:'v9.3',modelVersion:'v7',policyVersion:'v9.3.1',evidence:{a:1,b:2}});
 assert.equal(a.snapshotId,b.snapshotId);
 assert.equal(a.fingerprint,b.fingerprint);
});

test('setup state machine prevents threshold chatter and forbids multi-state teleporting',()=>{
 const held=resolveSetupTransition({previous:'BREAKOUT_WATCH',trend:56,momentum:67,flow:61,structure:59,nearResistance:true,confirmedBreakout:false,structuralBreak:false});
 assert.equal(held.state,'BREAKOUT_WATCH');
 assert.equal(held.changed,false);
 const next=resolveSetupTransition({previous:'BREAKOUT_WATCH',trend:63,momentum:72,flow:68,structure:66,nearResistance:true,confirmedBreakout:false,structuralBreak:false});
 assert.equal(next.state,'BREAKOUT_READY');
 assert.equal(next.changed,true);
 const damaged=resolveSetupTransition({previous:'BREAKOUT_READY',trend:18,momentum:45,flow:40,structure:25,nearResistance:false,confirmedBreakout:false,structuralBreak:false});
 assert.notEqual(damaged.state,'DAMAGED');
 assert.equal(damaged.state,'BREAKOUT_WATCH');
});

test('setup transition attribution records measured evidence rather than generic metric names',()=>{
 const x=resolveSetupTransition({previous:'RECLAIM_ATTEMPT',trend:63,momentum:72,flow:68,structure:66,nearResistance:true,confirmedBreakout:false,structuralBreak:false});
 assert.equal(x.changed,true);
 assert.match(x.changedEvidence.join(' '),/trend 63\/100/i);
 assert.match(x.changedEvidence.join(' '),/momentum 72\/100/i);
 assert.match(x.changedEvidence.join(' '),/participation 68\/100/i);
 assert.match(x.changedEvidence.join(' '),/structure 66\/100/i);
 assert.match(x.changedEvidence.join(' '),/near resistance yes/i);
});
