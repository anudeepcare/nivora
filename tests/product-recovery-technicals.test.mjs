import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {computeTechnicalSnapshot}=require('../lib/nivora-technical-engine.ts');
const {buildProfessionalMetrics}=require('../lib/auryn/v5/metrics.ts');
const {analyzeTechnicalPatterns}=require('../lib/auryn/v5/technical-patterns.ts');
const v4={factors:{},thesis:{strength:null,direction:'UNASSESSED'},moat:{score:null,direction:'UNASSESSED'}};
const bars=(count=90)=>Array.from({length:count},(_,i)=>({datetime:new Date(Date.UTC(2025,0,i+1)).toISOString().slice(0,10),open:100+i,high:101+i,low:99+i,close:100+i,volume:100000}));
const metric=(rows,id)=>buildProfessionalMetrics({technical:computeTechnicalSnapshot(rows,null,null),v4,bars:rows}).find(x=>x.id===id);
test('absent benchmark produces no relative-strength claim or numeric relative return',()=>{
 const x=computeTechnicalSnapshot(bars(),null,'SPY');assert.equal(x.market.relative20,null);assert.equal(x.market.relativeStrength,'Unavailable');assert.equal(x.market.score,null);
});
test('benchmark must cover the same comparison dates',()=>{
 const x=computeTechnicalSnapshot(bars(90),bars(60),'SPY');assert.equal(x.market.relative20,null);
 const aligned=computeTechnicalSnapshot(bars(90),bars(90),'SPY');assert.equal(aligned.market.relative20,0);assert.equal(aligned.market.relativeStrength,'In line');
});
test('zero-volume history does not manufacture volume evidence',()=>{
 const rows=bars().map(x=>({...x,volume:0}));
 for(const id of ['volumeRatio20','participation','mfi14','cmf20','obvSlope','volumeDryUp','vwap20Distance','anchoredVwapDistance','volumeProfilePocDistance'])assert.equal(metric(rows,id).value,null,id);
 assert.equal(computeTechnicalSnapshot(rows,null,null).labels.flow,'Unavailable');
});
test('unchanged prices are neutral rather than extreme overbought RSI and MFI',()=>{
 const rows=bars().map(x=>({...x,open:100,high:101,low:99,close:100}));assert.equal(metric(rows,'rsi14').value,50);assert.equal(metric(rows,'mfi14').value,50);
});
test('positive money flow with no negative flow reaches 100',()=>assert.equal(metric(bars(),'mfi14').value,100));
test('short histories do not claim a 52-week observation window',()=>assert.equal(computeTechnicalSnapshot(bars(60),null,null).indicators.drawdown52wPct,null));
test('52-week window and annualization account for crypto calendar',()=>{
 const x=computeTechnicalSnapshot(bars(366),null,null,{assetType:'crypto'});assert.ok(Number.isFinite(x.indicators.drawdown52wPct));assert.equal(x.coverage.annualization,365);
});
test('current Ichimoku cloud requires displaced history',()=>{
 assert.equal(metric(bars(60),'ichimokuPosition').value,null);
 const rows=bars(80).map((x,i)=>({...x,open:i<54?100:140,close:i<54?100:140,high:i<54?101:201,low:i<54?99:139}));
 assert.equal(metric(rows,'ichimokuPosition').value,1);
});
test('breakout confirmation evaluates a previously established level',()=>{
 const rows=bars(70).map((x,i)=>({...x,open:100,close:100,high:101,low:99,volume:100000}));
 rows[69]={...rows[69],open:100,close:110,high:111,low:100,volume:200000};
 const t=computeTechnicalSnapshot(rows,null,null),p=analyzeTechnicalPatterns(rows,t).find(x=>x.type==='BREAKOUT_CONFIRMED');assert.ok(p);assert.equal(p.trigger,101);
});
test('invalid or unordered bars cannot generate an apparently valid technical assessment',()=>{
 const rows=bars();rows[30]={...rows[30],close:NaN};assert.equal(computeTechnicalSnapshot(rows,null,null),null);
 assert.equal(computeTechnicalSnapshot(bars().reverse(),null,null),null);
});
test('context-only volatility and oversold studies are not independent positive or negative votes',()=>{
 const rows=bars().reverse().map((x,i)=>({...x,datetime:bars()[i].datetime}));
 const m=metric(rows,'rsi14');assert.equal(m.state,'OVERSOLD');assert.equal(m.decisionImpact,'CONTEXT');
 const width=metric(rows,'bollingerWidth');assert.equal(width.decisionImpact,'CONTEXT');
});
const {computeTimeframeTechnicalState}=require('../lib/auryn/v934/timeframes.ts');
const {deriveV934DecisionTechnical}=require('../lib/auryn/v934/decision-bridge.ts');
test('canonical multi-timeframe path requires aligned benchmark dates and measured volume',()=>{const rows=bars(),old=bars().map(x=>({...x,datetime:x.datetime.replace('2025','2024'),close:100}));const s=computeTimeframeTechnicalState(rows.map(x=>({...x,volume:0})),old,'1D','SPY');assert.equal(s.relativeStrength.relativePct,null);assert.equal(s.components.find(x=>x.id==='VOLUME').value,null);assert.equal(s.components.find(x=>x.id==='OBV').value,null);assert.equal(s.participation.available,false);const bridge=deriveV934DecisionTechnical({confirmed:{'1D':s},actionMap:{confirm:1}});assert.equal(bridge.confirmedBreakout,false);assert.equal(bridge.flowAvailable,false);});
test('canonical multi-timeframe RSI handles unchanged prices neutrally',()=>{const rows=bars().map(x=>({...x,open:100,high:101,low:99,close:100}));assert.equal(computeTimeframeTechnicalState(rows,null,'1D',null).components.find(x=>x.id==='RSI_14').value,50);});
test('API-shaped technical coverage does not restore a synthetic participation score',()=>{const rows=bars().map(x=>({...x,volume:0})),t=computeTechnicalSnapshot(rows,null,null),{coverage,...api}=t;const metrics=buildProfessionalMetrics({technical:{...api,technicalCoverage:coverage},v4,bars:rows});assert.equal(metrics.find(x=>x.id==='participation').value,null);});
test('anchored VWAP and volume profile require volume across their own entire windows',()=>{const rows=bars().map((x,i)=>({...x,volume:i<70?undefined:100000}));for(const id of ['anchoredVwapDistance','volumeProfilePocDistance'])assert.equal(metric(rows,id).value,null,id);});

test('unavailable volume is excluded from CIO weighting and setup explanations',()=>{const {buildAurynCioAssessment}=require('../lib/auryn/v97/cio-engine.ts');const {resolveSetupTransition}=require('../lib/auryn/v931/setup-state.ts');const technical={trend:70,momentum:65,flow:0,flowAvailable:false,structure:60,nearResistance:true,confirmedBreakout:false,structuralBreak:false};const input={scores:{business:70,earningsRevisions:60,valuation:65,marketStructure:70,catalystsRegime:60,riskAsymmetry:70},technical,evidenceCompleteness:80};assert.deepEqual(buildAurynCioAssessment(input),buildAurynCioAssessment({...input,technical:{...technical,flow:100}}));const setup=resolveSetupTransition({...technical,previous:null});assert.ok(setup.changedEvidence.includes('participation unavailable'));assert.notEqual(setup.state,'BREAKOUT_READY');});
