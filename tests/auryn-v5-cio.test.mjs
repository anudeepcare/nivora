import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveV5CioDecision} from '../.engine-test/auryn/v5/cio.js';
import {buildAurynV5Analysis} from '../.engine-test/auryn/v5/analyze.js';
const confidence={score:78,label:'MEDIUM',coverage:80,freshness:80,sourceQuality:80,modelSuitability:.9,agreement:75,validationState:'MEASURED'};
const horizons=['NOW','SWING','SIX_TO_TWELVE_MONTHS','THREE_TO_FIVE_YEARS'];
const v4=(thesis=82,dir='STRENGTHENING',valuation=68,risk=65,tech=45,primary='HOLD')=>({version:'auryn-v4',engineVersion:'v4',symbol:'TEST',classification:{assetClass:'EQUITY',sector:null,industry:null,businessModel:'GENERAL_COMPOUNDER',lifecycle:'HYPERGROWTH',capitalIntensity:'MEDIUM',cyclicality:'MODERATE',profitabilityStage:'PROFITABLE',confidence:.9,evidenceIds:[]},analystModel:{id:'general',version:'1',suitability:.9},factors:{BUSINESS_QUALITY:{factor:'BUSINESS_QUALITY',score:82,reason:'',evidenceIds:[],validationState:'MEASURED',weight:.2,available:true},GROWTH_INFLECTION:{factor:'GROWTH_INFLECTION',score:86,reason:'',evidenceIds:[],validationState:'MEASURED',weight:.2,available:true},VALUATION:valuation==null?undefined:{factor:'VALUATION',score:valuation,reason:'',evidenceIds:[],validationState:'MEASURED',weight:.15,available:true},TECHNICALS:{factor:'TECHNICALS',score:tech,reason:'',evidenceIds:[],validationState:'MEASURED',weight:.1,available:true},RISK:{factor:'RISK',score:risk,reason:'',evidenceIds:[],validationState:'MEASURED',weight:.15,available:true}},thesis:{strength:thesis,direction:dir,directionDelta:null,companyState:'',whyItCanWin:[],marketMayBeMissing:[],strengtheningEvidence:[],weakeningEvidence:[],invalidationConditions:[],evidenceFingerprint:'x',lastMaterialChangeAt:'x'},moat:{score:78,direction:'EXPANDING',delta:null,drivers:[],threats:[]},narrative:{marketNarrative:[],aurynThesis:[],contrarianEdge:{state:'NO_DEFENSIBLE_EDGE',reason:null}},primaryAction:primary,ownerAction:primary,horizonDecisions:horizons.map(h=>({horizon:h,action:primary,confidence,reasonCodes:[]})),confidence,reasonCodes:[]});
const market=(ok=true)=>({snapshotId:'TEST-snap',symbol:'TEST',asOf:'2026-09-08T15:00:00Z',session:'REGULAR',calendarState:'OPEN',priceState:ok?'LIVE_VERIFIED':'UNVERIFIED',decisionPrice:ok?100:null,displayPrice:ok?100:null,regularClose:99,extendedPrice:null,providerAgreementPct:.3,sources:[],priceSensitiveAllowed:ok,decisionAllowed:ok,reason:ok?'verified':'blocked'});
const tech={price:100,changePct:1,volumeRatio:1.1,scores:{trend:42,momentum:58,flow:52,structure:50,entry:45,timing:45,risk:70,extension:55},labels:{trend:'Mixed',momentum:'Mixed',flow:'Mixed',structure:'Mixed',entry:'Poor',risk:'High',extension:'Elevated'},levels:{preferredEntry:94,support:95,majorSupport:90,resistance:106,breakout:112,invalidation:86},volatility:{atr14:4,atrPct:4},market:{benchmark:'QQQ',benchmarkPrice:700,regime:'Mixed',score:50,relativeStrength:'In line',relative20:0},riskReward:1.4,indicators:{rsi14:52,atr14:4,atrPct:4,realizedVol20:45,volumeRatio20:1.1,sma20:98,sma50:100,sma200:90,distance20Pct:2,distance50Pct:0,distance200Pct:11,bollingerPosition:60,drawdown52wPct:-18,macd:{line:.2,signal:.1,histogram:.1}},technicalState:{strength:50,entryQuality:45,trend:42,momentum:58,participation:52,structure:50,extensionRisk:55,volatilityRisk:60,state:'Constructive / mixed',entryState:'Neutral'},indicatorVersion:'wilder-v1',technicalStateVersion:'auryn-tech-v2'};

test('strong thesis plus weak chart is not converted into SELL',()=>{const d=resolveV5CioDecision({v4:v4(82,'STRENGTHENING',68,65,38),technical:tech,marketTruth:market(true)});assert.notEqual(d.primaryAction,'SELL');assert.ok(['BUY','HOLD'].includes(d.primaryAction));});
test('missing valuation caps new-money action at HOLD rather than insufficient evidence',()=>{const d=resolveV5CioDecision({v4:v4(84,'STRENGTHENING',null,60,65),technical:tech,marketTruth:market(true)});assert.equal(d.primaryAction,'HOLD');assert.notEqual(d.horizonDecisions.find(x=>x.horizon==='THREE_TO_FIVE_YEARS')?.action,'INSUFFICIENT_EVIDENCE');});
test('broken structural thesis is a SELL even if chart is strong',()=>{const d=resolveV5CioDecision({v4:v4(25,'BROKEN',80,55,90,'SELL'),technical:{...tech,scores:{...tech.scores,trend:90,momentum:90}},marketTruth:market(true)});assert.equal(d.primaryAction,'SELL');assert.equal(d.ownerAction,'SELL');});
test('unverified market truth preserves research judgment but blocks execution through canonical snapshot',()=>{const a=buildAurynV5Analysis({symbol:'TEST',marketTruth:market(false),v4:v4(82,'STRENGTHENING',70,60,65),technical:tech,bars:[]});assert.equal(a.executionPlan.state,'BLOCKED');assert.equal(a.snapshotId,'TEST-snap');assert.match(a.decision.summary,/price|execution|verified/i);});

test('preliminary heuristic valuation score of zero is treated as unavailable, not bearish certainty',()=>{
 const x=v4(78,'STABLE',0,70,58,'HOLD');
 x.factors.VALUATION.validationState='HEURISTIC';
 x.factors.VALUATION.reason='Preliminary high-growth sales-multiple model is not allowed to publish fair value.';
 const d=resolveV5CioDecision({v4:x,technical:tech,marketTruth:market(true)});
 assert.equal(d.primaryAction,'HOLD');
 assert.notEqual(d.horizonDecisions.find(h=>h.horizon==='THREE_TO_FIVE_YEARS')?.action,'REDUCE');
});

test('strong buy thesis gives existing owners an add-capable posture instead of contradictory HOLD-only guidance',()=>{
 const d=resolveV5CioDecision({v4:v4(94,'STRENGTHENING',92,40,75,'BUY'),technical:{...tech,technicalState:{...tech.technicalState,strength:82,entryQuality:72,momentum:85,structure:80,participation:78,volatilityRisk:45}},marketTruth:market(true)});
 assert.equal(d.primaryAction,'STRONG_BUY');
 assert.ok(['BUY','STRONG_BUY'].includes(d.ownerAction));
});

test('headline new-money action cannot be STRONG BUY when near-term timing is HOLD/REDUCE',()=>{
 const weakTiming={...tech,technicalState:{...tech.technicalState,strength:33,entryQuality:54,trend:30,momentum:42,participation:45,structure:38,volatilityRisk:82}};
 const d=resolveV5CioDecision({v4:v4(94,'STRENGTHENING',92,55,33,'BUY'),technical:weakTiming,marketTruth:market(true)});
 assert.equal(d.horizonDecisions.find(x=>x.horizon==='SIX_TO_TWELVE_MONTHS')?.action,'STRONG_BUY');
 assert.equal(d.horizonDecisions.find(x=>x.horizon==='THREE_TO_FIVE_YEARS')?.action,'STRONG_BUY');
 assert.ok(['HOLD','BUY'].includes(d.primaryAction));
 assert.notEqual(d.primaryAction,'STRONG_BUY');
});

test('STRONG BUY requires HIGH decision confidence and is capped to BUY at medium confidence',()=>{
 const strongTech={...tech,technicalState:{...tech.technicalState,strength:86,entryQuality:78,trend:84,momentum:88,participation:82,structure:86,volatilityRisk:35}};
 const x=v4(96,'STRENGTHENING',94,35,86,'BUY');
 x.confidence={...x.confidence,score:74,label:'MEDIUM'};
 const d=resolveV5CioDecision({v4:x,technical:strongTech,marketTruth:market(true)});
 assert.equal(d.confidenceLabel,'MEDIUM');
 assert.equal(d.primaryAction,'BUY');
 assert.notEqual(d.horizonDecisions.find(h=>h.horizon==='SIX_TO_TWELVE_MONTHS')?.action,'STRONG_BUY');
 assert.notEqual(d.horizonDecisions.find(h=>h.horizon==='THREE_TO_FIVE_YEARS')?.action,'STRONG_BUY');
});
