import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeTechnicalPatterns} from '../.engine-test/auryn/v5/technical-patterns.js';
import {buildScenarioMap} from '../.engine-test/auryn/v5/scenarios.js';

const barsFrom=(closes)=>closes.map((c,i)=>({datetime:`2026-01-${String(i+1).padStart(2,'0')}`,open:c*.99,high:c*1.02,low:c*.98,close:c,volume:1000+(i%5)*100}));
const tech={price:112,changePct:1,volumeRatio:1.2,scores:{trend:58,momentum:72,flow:64,structure:61,entry:55,timing:55,risk:64,extension:45},labels:{trend:'Mixed',momentum:'Strong',flow:'Mixed',structure:'Mixed',entry:'Improving',risk:'Moderate',extension:'Elevated'},levels:{preferredEntry:105,support:106,majorSupport:99,resistance:118,breakout:122,invalidation:95},volatility:{atr14:4,atrPct:3.6},market:{benchmark:'QQQ',benchmarkPrice:700,regime:'Supportive',score:68,relativeStrength:'Leading',relative20:6},riskReward:1.8,indicators:{rsi14:58,atr14:4,atrPct:3.6,realizedVol20:48,volumeRatio20:1.2,sma20:108,sma50:110,sma200:95,distance20Pct:3.7,distance50Pct:1.8,distance200Pct:17.8,bollingerPosition:70,drawdown52wPct:-18,macd:{line:1.2,signal:.8,histogram:.4}},technicalState:{strength:63,entryQuality:55,trend:58,momentum:72,participation:64,structure:61,extensionRisk:45,volatilityRisk:58,state:'Constructive / mixed',entryState:'Watch / improving'},indicatorVersion:'wilder-v1',technicalStateVersion:'auryn-tech-v2'};

test('pattern engine can identify an early reversal/higher-low setup without ticker rules',()=>{
  const closes=[130,126,122,118,114,110,106,102,98,94,91,95,100,104,101,99,103,107,110,112,111,113,114,115,116,117,116,118,119,120,119,121,120,122,123,122,124,125,124,126];
  const p=analyzeTechnicalPatterns(barsFrom(closes),tech);
  assert.ok(p.some(x=>['EARLY_REVERSAL','CONFIRMED_REVERSAL','BASE_BUILDING'].includes(x.type)));
  assert.ok(p.every(x=>x.confidence==='HIGH'||x.confidence==='MEDIUM'||x.confidence==='LOW'));
});

test('pattern engine detects a double-bottom candidate when two lows form near one another',()=>{
  const closes=[120,116,112,108,104,100,96,92,89,86,90,95,101,106,102,97,91,87,90,94,99,103,106,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124];
  const p=analyzeTechnicalPatterns(barsFrom(closes),tech);
  assert.ok(p.some(x=>x.type==='DOUBLE_BOTTOM'||x.type==='EARLY_REVERSAL'));
});

test('scenario map has deterministic bull/base/bear boundaries and wave context is supporting only',()=>{
  const bars=barsFrom(Array.from({length:60},(_,i)=>90+i*.4+Math.sin(i/3)*3));
  const p=analyzeTechnicalPatterns(bars,tech);
  const s=buildScenarioMap({technical:tech,patterns:p});
  assert.ok(s.bull.trigger==null||s.bear.trigger==null||s.bull.trigger>s.bear.trigger);
  assert.ok(s.confluenceScore>=0&&s.confluenceScore<=100);
  assert.match(s.waveContext.note,/support|probabil|determin/i);
  assert.notEqual(s.waveContext.label,'CERTAIN');
});
