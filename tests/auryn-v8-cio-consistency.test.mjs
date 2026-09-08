import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveV5CioDecision} from '../.engine-test/auryn/v5/cio.js';
const confidence={score:74,label:'MEDIUM',coverage:80,freshness:80,sourceQuality:80,modelSuitability:.85,agreement:72,validationState:'MEASURED'};
const factor=(factor,score)=>({factor,score,reason:'',evidenceIds:[],validationState:'MEASURED',weight:.1,available:true});
const market={snapshotId:'S',symbol:'X',asOf:'2026-09-07',session:'CLOSED',calendarState:'CLOSED',priceState:'REGULAR_CLOSE_VERIFIED',decisionPrice:50,displayPrice:50,regularClose:50,extendedPrice:null,providerAgreementPct:.2,sources:[],priceSensitiveAllowed:true,decisionAllowed:true,reason:'verified close'};
const technical=(strength,entry,momentum=35,structure=35,risk=75)=>({price:50,changePct:0,volumeRatio:1,scores:{trend:strength,momentum,flow:45,structure,entry,timing:entry,risk,extension:50},labels:{trend:'',momentum:'',flow:'',structure:'',entry:'',risk:'',extension:''},levels:{preferredEntry:48,support:47,majorSupport:44,resistance:53,breakout:56,invalidation:42},volatility:{atr14:3,atrPct:6},market:{benchmark:'SPY',benchmarkPrice:700,regime:'Mixed',score:50,relativeStrength:'In line',relative20:0},riskReward:1,riskReward:null,indicators:{rsi14:45,atr14:3,atrPct:6,realizedVol20:60,volumeRatio20:1,sma20:52,sma50:54,sma200:55,distance20Pct:-4,distance50Pct:-7,distance200Pct:-9,bollingerPosition:40,drawdown52wPct:-30,macd:{line:-.2,signal:-.1,histogram:-.1}},technicalState:{strength,entryQuality:entry,trend:strength,momentum,participation:45,structure,extensionRisk:50,volatilityRisk:risk,state:'Weak',entryState:'Weak'},indicatorVersion:'wilder-v1',technicalStateVersion:'auryn-tech-v2'});
const v4=({thesis,business,growth,fund,moat,risk,dir='STABLE',model='SPACE_SATELLITE'})=>({version:'auryn-v4',engineVersion:'v4',symbol:'X',classification:{assetClass:'EQUITY',sector:null,industry:null,businessModel:model,lifecycle:'UNKNOWN',capitalIntensity:'EXTREME',cyclicality:'MODERATE',profitabilityStage:'PRE_PROFIT',confidence:.8,evidenceIds:[]},analystModel:{id:'x',version:'1',suitability:.8},factors:{BUSINESS_QUALITY:factor('BUSINESS_QUALITY',business),GROWTH_INFLECTION:factor('GROWTH_INFLECTION',growth),FUNDAMENTALS_EARNINGS:factor('FUNDAMENTALS_EARNINGS',fund),RISK:factor('RISK',risk)},thesis:{strength:thesis,direction:dir,directionDelta:null,companyState:'',whyItCanWin:[],marketMayBeMissing:[],strengtheningEvidence:[],weakeningEvidence:[],invalidationConditions:[],evidenceFingerprint:'x',lastMaterialChangeAt:'x'},moat:{score:moat,direction:'STABLE',delta:null,drivers:[],threats:[]},narrative:{marketNarrative:[],aurynThesis:[],contrarianEdge:{state:'NO_DEFENSIBLE_EDGE',reason:null}},primaryAction:'HOLD',ownerAction:'HOLD',horizonDecisions:[],confidence,reasonCodes:[]});

test('ASTS-style broad bearish horizon consensus cannot be hidden behind HOLD just because valuation is unavailable',()=>{
 const d=resolveV5CioDecision({v4:v4({thesis:36,business:36,growth:30,fund:28,moat:27,risk:67}),technical:technical(31,52,40,30,67),marketTruth:market});
 const actions=d.horizonDecisions.map(h=>h.action);
 assert.ok(actions.filter(a=>a==='REDUCE'||a==='SELL').length>=3,actions.join(','));
 assert.equal(d.primaryAction,'REDUCE');
 assert.equal(d.ownerAction,'REDUCE');
});

test('HIMS-style healthy long-horizon HOLD can coexist with near-term REDUCE without forcing portfolio exit',()=>{
 const d=resolveV5CioDecision({v4:v4({thesis:61,business:60,growth:80,fund:29,moat:62,risk:75,model:'DIGITAL_HEALTH_PLATFORM'}),technical:technical(22,40,30,28,75),marketTruth:market});
 assert.equal(d.horizonDecisions.find(h=>h.horizon==='NOW')?.action,'REDUCE');
 assert.equal(d.horizonDecisions.find(h=>h.horizon==='SWING')?.action,'REDUCE');
 assert.equal(d.horizonDecisions.find(h=>h.horizon==='THREE_TO_FIVE_YEARS')?.action,'HOLD');
 assert.equal(d.primaryAction,'HOLD');
 assert.equal(d.ownerAction,'HOLD');
});
