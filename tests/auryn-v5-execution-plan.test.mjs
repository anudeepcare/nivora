import test from 'node:test';
import assert from 'node:assert/strict';
import {buildExecutionPlan} from '../.engine-test/auryn/v5/execution-plan.js';
const market=(ok=true)=>({snapshotId:'IREN-2026-09-08-abc',symbol:'IREN',asOf:'2026-09-08T15:00:00Z',session:'REGULAR',calendarState:'OPEN',priceState:ok?'LIVE_VERIFIED':'UNVERIFIED',decisionPrice:ok?44.68:null,displayPrice:ok?44.68:null,regularClose:41.65,extendedPrice:null,providerAgreementPct:.4,sources:[],priceSensitiveAllowed:ok,decisionAllowed:ok,reason:ok?'verified':'blocked'});
const tech={price:44.68,changePct:7,volumeRatio:1.3,scores:{trend:58,momentum:72,flow:64,structure:61,entry:55,timing:55,risk:70,extension:48},labels:{trend:'Mixed',momentum:'Strong',flow:'Mixed',structure:'Mixed',entry:'Improving',risk:'High',extension:'Elevated'},levels:{preferredEntry:41.2,support:42.1,majorSupport:38.8,resistance:48.7,breakout:52.2,invalidation:35.9},volatility:{atr14:3.2,atrPct:7.2},market:{benchmark:'QQQ',benchmarkPrice:700,regime:'Supportive',score:68,relativeStrength:'Leading',relative20:6},riskReward:1.7,indicators:{rsi14:57,atr14:3.2,atrPct:7.2,realizedVol20:80,volumeRatio20:1.3,sma20:42,sma50:40,sma200:35,distance20Pct:6,distance50Pct:11,distance200Pct:27,bollingerPosition:82,drawdown52wPct:-35,macd:{line:1.2,signal:.8,histogram:.4}},technicalState:{strength:63,entryQuality:55,trend:58,momentum:72,participation:64,structure:61,extensionRisk:48,volatilityRisk:78,state:'Constructive / mixed',entryState:'Watch / improving'},indicatorVersion:'wilder-v1',technicalStateVersion:'auryn-tech-v2'};
const thesis={strength:80,direction:'STRENGTHENING'};

test('one execution plan owns all staged entry/DCA levels and snapshot id',()=>{
 const p=buildExecutionPlan({marketTruth:market(true),technical:tech,thesis,riskScore:70});
 assert.equal(p.state,'READY'); assert.equal(p.snapshotId,'IREN-2026-09-08-abc'); assert.ok(p.initialEntry);
 const zones=[p.initialEntry,...p.dcaZones].filter(Boolean);
 for(const z of zones){assert.ok(z.low<=z.high);assert.ok(z.low>p.invalidation);}
 assert.ok(p.dcaZones.length>=2); assert.ok(p.dcaZones[0].high<=p.initialEntry.high);
 assert.ok((p.confirmation??0)>p.initialEntry.high);
 assert.ok(p.targets.length>=2);
});

test('unverified market truth blocks every price-sensitive level',()=>{
 const p=buildExecutionPlan({marketTruth:market(false),technical:tech,thesis,riskScore:70});
 assert.equal(p.state,'BLOCKED'); assert.equal(p.currentPrice,null); assert.equal(p.initialEntry,null); assert.deepEqual(p.dcaZones,[]); assert.equal(p.confirmation,null); assert.equal(p.invalidation,null); assert.deepEqual(p.targets,[]);
});

test('weak or broken thesis does not publish aggressive averaging plan',()=>{
 const p=buildExecutionPlan({marketTruth:market(true),technical:tech,thesis:{strength:32,direction:'BROKEN'},riskScore:85});
 assert.equal(p.state,'READY'); assert.equal(p.dcaZones.length,0); assert.match(p.reason,/thesis|average/i);
});
