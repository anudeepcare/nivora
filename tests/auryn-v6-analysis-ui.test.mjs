import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildAurynV6Analysis} from '../.engine-test/auryn/v6/analyze.js';

function bars(n=300){const out=[];let p=100;const d=new Date('2025-07-01T00:00:00Z');while(out.length<n){if(![0,6].includes(d.getUTCDay())){const i=out.length,o=p;p+=.35+Math.sin(i/8)*.1;out.push({datetime:d.toISOString().slice(0,10),open:o,high:p+1,low:o-1,close:p,volume:1e6+i*1000})}d.setUTCDate(d.getUTCDate()+1)}return out}
const technical={price:205,changePct:1,volumeRatio:1,scores:{trend:70,momentum:72,flow:65,structure:68,entry:62,timing:62,risk:45,extension:40},labels:{trend:'Strong',momentum:'Strong',flow:'Mixed',structure:'Strong',entry:'Good',risk:'Moderate',extension:'Elevated'},levels:{preferredEntry:190,support:195,majorSupport:185,resistance:215,breakout:220,invalidation:175},volatility:{atr14:5,atrPct:2.4},market:{benchmark:null,benchmarkPrice:null,regime:'Supportive',score:70,relativeStrength:'Leading',relative20:6},riskReward:2,indicators:{rsi14:62,atr14:5,atrPct:2.4,realizedVol20:40,volumeRatio20:1.2,sma20:195,sma50:185,sma200:160,distance20Pct:5,distance50Pct:10,distance200Pct:28,bollingerPosition:70,drawdown52wPct:-8,macd:{line:2,signal:1,histogram:1}},technicalState:{strength:70,entryQuality:62,trend:70,momentum:72,participation:65,structure:68,extensionRisk:40,volatilityRisk:45,state:'Bullish',entryState:'Attractive'},indicatorVersion:'wilder-v1',technicalStateVersion:'auryn-tech-v2'};
const marketTruth={snapshotId:'BE:2026-09-04',symbol:'BE',asOf:'2026-09-04T20:00:00Z',session:'CLOSED',priceState:'VERIFIED_CLOSE',integrityState:'VERIFIED',reason:'Verified close',provider:'twelve',ageSeconds:0,providerAgreementPct:99,integrityTradable:true,priceSensitiveAllowed:true,decisionPrice:205,displayPrice:205,regularClose:205,previousClose:195,changePct:5.1};
const classification={assetClass:'EQUITY',sector:'Industrials',industry:'Power',businessModel:'POWER_UTILITY_INFRA',lifecycle:'INFLECTION',capitalIntensity:'HIGH',cyclicality:'MODERATE',profitabilityStage:'PRE_PROFIT',confidence:.9,evidenceIds:[]};
const valuation={factor:'VALUATION',score:65,reason:'Measured valuation',evidenceIds:['v'],validationState:'MEASURED',weight:.1,available:true};
const v4={version:'auryn-v4',engineVersion:'v4',symbol:'BE',classification,analystModel:{id:'ai-power-infrastructure',version:'1',suitability:.9},factors:{VALUATION:valuation},thesis:{strength:78,direction:'STABLE',directionDelta:0,companyState:'INFLECTION',whyItCanWin:[],marketMayBeMissing:[],strengtheningEvidence:[],weakeningEvidence:[],invalidationConditions:[],evidenceFingerprint:'x',lastMaterialChangeAt:'2026-09-01'},moat:{score:70,direction:'STABLE',delta:0,drivers:[],threats:[]},narrative:{marketNarrative:[],aurynThesis:[],contrarianEdge:{state:'CONSENSUS_ALIGNED',reason:null}},confidence:{score:74,label:'MEDIUM',coverage:80,freshness:80,sourceQuality:80,modelSuitability:90,agreement:70,validationState:'MEASURED'},primaryAction:'BUY',ownerAction:'BUY',horizonDecisions:[],validationState:'MEASURED'};
const v5={version:'auryn-v5',engineVersion:'v5',snapshotId:marketTruth.snapshotId,symbol:'BE',asOf:marketTruth.asOf,marketTruth,v4,technical,bars:bars(),metrics:[],patterns:[],scenario:null,executionPlan:{snapshotId:marketTruth.snapshotId,state:'READY',intent:'ACCUMULATE',reason:'x',currentPrice:205,initialEntry:{label:'ENTRY',low:195,high:202,multiplier:1,basis:'structure'},dcaZones:[],confirmation:220,invalidation:175,targets:[],riskPerShare:30},decision:{primaryAction:'BUY',ownerAction:'BUY',horizonDecisions:[],summary:'Buy',why:[],watch:[],confidenceLabel:'MEDIUM',confidenceScore:74}};

test('V6 separates current evidence confidence from historical model proof',()=>{
  const x=buildAurynV6Analysis({v5});
  assert.equal(x.version,'auryn-v6');
  assert.equal(x.evidenceConfidence.score,74);
  assert.equal(x.evidenceConfidence.label,'MEDIUM');
  assert.equal(x.modelProof.grade,'UNPROVEN');
  assert.equal(x.valuation.method,'AI_INFRA_SOTP_CAPACITY');
  assert.ok(x.multiTimeframe.weekly);
  assert.match(x.decisionStrength.note,/not.*probability/i);
});

test('V8 stock hero preserves V6 model proof while adding reality-audited trust without probability claims',()=>{
  const src=fs.readFileSync('components/stock/v5/StockV5Decision.tsx','utf8');
  assert.match(src,/AURYN V8/);
  assert.match(src,/EVIDENCE CONFIDENCE/);
  assert.match(src,/MODEL PROOF/);
  assert.match(src,/SYSTEM TRUST/);
  assert.doesNotMatch(src,/WIN PROBABILITY|PROBABILITY OF PROFIT/i);
});

test('stock client consumes model-health proof instead of permanently showing UNPROVEN',()=>{
  const src=fs.readFileSync('components/StockClient.tsx','utf8');
  assert.match(src,/\/api\/model-health\?archetype=/);
  assert.match(src,/modelProof:modelHealth\?\.proof/);
});
