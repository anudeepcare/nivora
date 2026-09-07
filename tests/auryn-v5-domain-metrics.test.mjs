import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProfessionalMetrics} from '../.engine-test/auryn/v5/metrics.js';

const tech={
  indicators:{rsi14:72.4,atr14:2.1,atrPct:4.8,realizedVol20:58.2,volumeRatio20:1.45,sma20:100,sma50:95,sma200:80,distance20Pct:6,distance50Pct:11,distance200Pct:32,bollingerPosition:94,drawdown52wPct:-8,macd:{line:2,signal:1.2,histogram:.8}},
  technicalState:{strength:76,entryQuality:48,trend:70,momentum:82,participation:74,structure:71,extensionRisk:78,volatilityRisk:68,state:'Strong bullish',entryState:'Neutral'},
  market:{relativeStrength:'Leading',relative20:9,regime:'Supportive',score:72,benchmark:'QQQ',benchmarkPrice:500},
  levels:{preferredEntry:95,support:96,majorSupport:90,resistance:110,breakout:115,invalidation:86},riskReward:1.9,price:106,changePct:2,volumeRatio:1.45,volatility:{atr14:2.1,atrPct:4.8},scores:{trend:70,momentum:82,flow:74,structure:71,entry:48,timing:48,risk:68,extension:78},labels:{trend:'Strong',momentum:'Strong',flow:'Strong',structure:'Strong',entry:'Improving',risk:'Moderate',extension:'Stretched'},indicatorVersion:'wilder-v1',technicalStateVersion:'auryn-tech-v2'
};
const v4={factors:{BUSINESS_QUALITY:{score:82,validationState:'MEASURED'},GROWTH_INFLECTION:{score:88,validationState:'MEASURED'},VALUATION:{score:null,validationState:'COLLECTING'},RISK:{score:73,validationState:'MEASURED'}},thesis:{strength:84,direction:'STRENGTHENING'},moat:{score:79,direction:'EXPANDING'}};

test('RSI is interpreted, not merely displayed',()=>{
  const m=buildProfessionalMetrics({technical:tech,v4});
  const rsi=m.find(x=>x.id==='rsi14');
  assert.equal(rsi?.state,'OVERBOUGHT');
  assert.match(rsi?.interpretation||'',/momentum|chase/i);
  assert.equal(rsi?.family,'MOMENTUM');
});

test('risk metrics use inverse semantics and valuation missing stays unavailable',()=>{
  const m=buildProfessionalMetrics({technical:tech,v4});
  const risk=m.find(x=>x.id==='riskPressure');
  assert.equal(risk?.higherIsBetter,false);
  const val=m.find(x=>x.id==='valuation');
  assert.equal(val?.available,false);
  assert.equal(val?.value,null);
  assert.equal(val?.state,'N/A');
});

test('metric registry exposes technical, business and thesis families with decision roles',()=>{
  const m=buildProfessionalMetrics({technical:tech,v4});
  assert.ok(m.some(x=>x.family==='TREND'));
  assert.ok(m.some(x=>x.family==='VOLATILITY'));
  assert.ok(m.some(x=>x.family==='BUSINESS'));
  assert.ok(m.some(x=>x.family==='THESIS'));
  assert.ok(m.every(x=>['DECISION','TIMING','RISK','CONTEXT','EXPLANATION'].includes(x.role)));
});

test('Extreme Pro metric universe includes advanced momentum, flow, volatility and structure evidence when bars exist',()=>{
  const bars=Array.from({length:80},(_,i)=>{const c=80+i*.45+Math.sin(i/4)*3;return{datetime:`d${i}`,open:c-.5,high:c+2,low:c-2,close:c,volume:1000000+(i%7)*50000};});
  const m=buildProfessionalMetrics({technical:tech,v4,bars});
  for(const id of ['stochasticK','cci20','mfi14','cmf20','roc20','bollingerWidth','donchianPosition','vwap20Distance','volumeDryUp'])assert.ok(m.some(x=>x.id===id),id);
});

test('preliminary heuristic valuation zero is displayed as N/A rather than 0/100 bearish certainty',()=>{
  const x=structuredClone(v4);
  x.factors.VALUATION={factor:'VALUATION',score:0,reason:'Preliminary high-growth sales-multiple model is not allowed to publish fair value.',evidenceIds:[],validationState:'HEURISTIC',weight:.2,available:true};
  const m=buildProfessionalMetrics({technical:tech,v4:x});
  const val=m.find(z=>z.id==='valuation');
  assert.equal(val.available,false);
  assert.equal(val.value,null);
  assert.equal(val.state,'N/A');
});

test('Extreme Pro includes deeper trend, cloud, anchored VWAP, volume-profile and squeeze diagnostics',()=>{
  const bars=Array.from({length:120},(_,i)=>{const base=90+i*.35+Math.sin(i/5)*4;const c=base+(i>90?(i-90)*.18:0);return{datetime:`d${i}`,open:c-.7,high:c+2.4,low:c-2.1,close:c,volume:900000+(i%11)*70000};});
  const m=buildProfessionalMetrics({technical:tech,v4,bars});
  for(const id of ['adx14','dmiSpread','ichimokuPosition','anchoredVwapDistance','volumeProfilePocDistance','squeezeState'])assert.ok(m.some(x=>x.id===id),id);
});
