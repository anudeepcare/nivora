import test from 'node:test';
import assert from 'node:assert/strict';
import {buildScenarioMap} from '../.engine-test/auryn/v5/scenarios.js';

const tech={price:44.68,changePct:7,volumeRatio:1.3,scores:{trend:58,momentum:72,flow:64,structure:61,entry:55,timing:55,risk:70,extension:48},labels:{trend:'Mixed',momentum:'Strong',flow:'Mixed',structure:'Mixed',entry:'Improving',risk:'High',extension:'Elevated'},levels:{preferredEntry:41.2,support:42.1,majorSupport:38.8,resistance:48.7,breakout:52.2,invalidation:35.9},volatility:{atr14:3.2,atrPct:7.2},market:{benchmark:'QQQ',benchmarkPrice:700,regime:'Supportive',score:68,relativeStrength:'Leading',relative20:6},riskReward:1.7,indicators:{rsi14:57,atr14:3.2,atrPct:7.2,realizedVol20:80,volumeRatio20:1.3,sma20:42,sma50:40,sma200:35,distance20Pct:6,distance50Pct:11,distance200Pct:27,bollingerPosition:82,drawdown52wPct:-35,macd:{line:1.2,signal:.8,histogram:.4}},technicalState:{strength:63,entryQuality:55,trend:58,momentum:72,participation:64,structure:61,extensionRisk:48,volatilityRisk:78,state:'Constructive / mixed',entryState:'Watch / improving'},indicatorVersion:'wilder-v1',technicalStateVersion:'auryn-tech-v2'};
const patterns=[{type:'BREAKOUT_READY',state:'FORMING',confidence:'MEDIUM',score:70,summary:'Breakout candidate',trigger:48,invalidation:39,target:55,supportingMetrics:['rsi14']}];
const plan={snapshotId:'IREN-2026-09-08-abc',state:'READY',intent:'ACCUMULATE',reason:'verified',currentPrice:44.68,initialEntry:{label:'Initial entry',low:42.12,high:45.93,multiplier:1,basis:'canonical'},dcaZones:[{label:'DCA 1',low:40,high:41,multiplier:1,basis:'canonical'}],confirmation:45.93,invalidation:39.6,targets:[{label:'T1',price:48.39},{label:'T2',price:55.33}],riskPerShare:5.08};

test('scenario map actionable bull case is derived from the canonical execution plan',()=>{
  const s=buildScenarioMap({technical:tech,patterns,executionPlan:plan});
  assert.equal(s.snapshotId,plan.snapshotId);
  assert.equal(s.intent,plan.intent);
  assert.equal(s.bull.trigger,plan.confirmation);
  assert.equal(s.bull.zoneLow,plan.initialEntry.low);
  assert.equal(s.bull.zoneHigh,plan.initialEntry.high);
  assert.equal(s.bull.targetLow,plan.targets[0].price);
  assert.equal(s.bull.targetHigh,plan.targets[1].price);
  assert.equal(s.bull.invalidation,plan.invalidation);
});

test('blocked execution plan blocks all scenario price levels',()=>{
  const blocked={...plan,state:'BLOCKED',intent:'BLOCKED',currentPrice:null,initialEntry:null,dcaZones:[],confirmation:null,invalidation:null,targets:[],riskPerShare:null};
  const s=buildScenarioMap({technical:tech,patterns,executionPlan:blocked});
  assert.equal(s.snapshotId,blocked.snapshotId);
  assert.equal(s.bull.trigger,null);
  assert.equal(s.bull.zoneLow,null);
  assert.equal(s.bull.zoneHigh,null);
  assert.equal(s.bull.targetLow,null);
  assert.equal(s.bull.targetHigh,null);
  assert.equal(s.bull.invalidation,null);
});

test('watch intent never calls its canonical structural zone an active buy zone',()=>{
  const watch={...plan,intent:'WATCH',dcaZones:[],initialEntry:{...plan.initialEntry,label:'Watch / accumulation zone',multiplier:0}};
  const s=buildScenarioMap({technical:tech,patterns,executionPlan:watch});
  assert.equal(s.intent,'WATCH');
  assert.match(s.bull.summary,/watch|confirmation|structural/i);
  assert.doesNotMatch(s.bull.summary,/buy zone/i);
});
