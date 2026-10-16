import test from 'node:test';import assert from 'node:assert/strict';
const {deriveV934DecisionTechnical}=await import('../.engine-test/auryn/v934/decision-bridge.js').catch(()=>({}));
const st=(rating,score,trend,momentum,participation,price=100)=>({rating,score,asOf:'2026-09-09T20:00:00Z',price,trend:{score:trend,label:''},momentum:{score:momentum,label:''},participation:{score:participation,label:''},relativeStrength:{score:60,benchmark:'SPY',returnPct:1,benchmarkReturnPct:0,relativePct:1},counts:{buy:10,neutral:8,sell:4}});
const snap={snapshotId:'x',confirmed:{'4H':st('BUY',35,70,72,66,99),'1D':st('NEUTRAL',10,58,62,55,100),'1W':st('BUY',42,76,68,64,97)},livePreview:{'1D':st('SELL',-30,20,30,25,94)},actionMap:{confirm:104,invalidation:90}};

test('confirmed multi-timeframe state drives decision technical inputs, not live preview',()=>{const x=deriveV934DecisionTechnical(snap);assert.ok(x.marketStructureScore>50);assert.equal(x.confirmedPrice,100);assert.equal(x.livePreviewRating,'SELL');assert.equal(x.confirmedBreakout,false);assert.match(x.why,/1D NEUTRAL/);assert.match(x.why,/4H BUY/);assert.match(x.why,/1W BUY/);});

test('structural break uses completed daily price and canonical invalidation',()=>{const x=deriveV934DecisionTechnical({...snap,confirmed:{...snap.confirmed,'1D':st('SELL',-55,20,25,30,88)}});assert.equal(x.structuralBreak,true);});

test('identical confirmed inputs produce identical bridge even if live preview changes',()=>{const a=deriveV934DecisionTechnical(snap);const b=deriveV934DecisionTechnical({...snap,livePreview:{'1D':st('BUY',80,90,90,90,110)}});assert.equal(a.marketStructureScore,b.marketStructureScore);assert.equal(a.trend,b.trend);assert.equal(a.nearResistance,b.nearResistance);});

import {buildCanonicalAssessment} from '../.engine-test/auryn/v931/canonical-assessment.js';
test('shared client and worker adapter uses confirmed structure despite changing preview',()=>{
 const input={symbol:'TEST',marketTruth:{snapshotId:'m1',decisionPrice:100,asOf:'2026-10-16T15:00:00Z',executionTradable:false},v5:{metrics:[],v4:{classification:{businessModel:'GENERAL_COMPOUNDER'}},decision:{primaryAction:'HOLD',ownerAction:'HOLD'},technical:null},company:null,context:null,marketData:{marketIntelligence:snap}};
 const a=buildCanonicalAssessment(input),b=buildCanonicalAssessment({...input,marketData:{marketIntelligence:{...snap,livePreview:{'1D':st('BUY',80,90,90,90,110)}}}});
 assert.equal(a.decision.pillars.marketStructure.score,b.decision.pillars.marketStructure.score);
 assert.equal(a.decision.pillars.marketStructure.score,64);
 assert.equal(a.decision.longTermAction,'UNASSESSED');
});

test('absent canonical levels stay unavailable rather than zero-price triggers',()=>{
 const r=deriveV934DecisionTechnical({...snap,actionMap:{confirm:null,invalidation:null}});
 assert.equal(r.reclaimLevel,null);assert.equal(r.invalidation,null);assert.equal(r.nearResistance,false);
});

test('an empty technical payload contributes neither neutral points nor a measured setup',()=>{
 const input={symbol:'TEST',marketTruth:{snapshotId:'m1',decisionPrice:100,asOf:'2026-10-16T15:00:00Z',executionTradable:false},v5:{metrics:[],v4:{classification:{businessModel:'GENERAL_COMPOUNDER'}},decision:{primaryAction:'HOLD',ownerAction:'HOLD'},technical:null},company:null,context:null,marketData:{marketIntelligence:{confirmed:{},livePreview:{},actionMap:{}}}};
 const r=buildCanonicalAssessment(input).decision;
 assert.equal(r.pillars.marketStructure.score,null);assert.equal(r.evidenceCompleteness,0);assert.equal(r.setupState,'UNASSESSED');assert.equal(r.horizons.swing,'UNASSESSED');
 assert.doesNotMatch(r.changeExplanation.trigger,/measured setup evidence/);
});
