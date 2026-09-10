import test from 'node:test';
import assert from 'node:assert/strict';

let runner,report;
try {
  runner=await import('../.engine-test/auryn/v93/runner.js');
  report=await import('../.engine-test/auryn/v93/report.js');
} catch {}

const day=(n)=>new Date(Date.UTC(2018,0,1+n)).toISOString().slice(0,10);
const base=Array.from({length:300},(_,i)=>({
  symbol:`S${i%10}`,asOf:day(i),archetype:i%2?'GROWTH':'COMPOUNDER',sector:['TECH','INDUSTRIALS','HEALTH'][i%3],regime:i%2?'RISK_ON':'RISK_OFF',benchmarkSymbol:'SPY',close:100+i/10,
  metrics:{sma20:i%2?1:-1,sma50:i%2?1:-1,rsi14:i%2?1:-1,relative_volume:1.5,sector_relative_strength:i%2?1:-1,ma_stack:i%2?1:-1},
  outcomes:{'1D':{horizon:'1D',sessions:1,forwardReturnPct:i%2?2:-2,benchmarkReturnPct:0,maxDrawdownPct:-4},'5D':{horizon:'5D',sessions:5,forwardReturnPct:i%2?2:-2,benchmarkReturnPct:0,maxDrawdownPct:-4},'20D':{horizon:'20D',sessions:20,forwardReturnPct:i%2?2:-2,benchmarkReturnPct:0,maxDrawdownPct:-4},'90D':{horizon:'90D',sessions:63,forwardReturnPct:i%2?2:-2,benchmarkReturnPct:0,maxDrawdownPct:-4},'180D':{horizon:'180D',sessions:126,forwardReturnPct:i%2?2:-2,benchmarkReturnPct:0,maxDrawdownPct:-4},'1Y':{horizon:'1Y',sessions:252,forwardReturnPct:i%2?2:-2,benchmarkReturnPct:0,maxDrawdownPct:-4}},
  costBps:5
}));
const manifest={version:'V91',datasetId:'fixture-v93',datasetVersion:'1',source:'TEST',quality:'DECISION_GRADE',survivorshipSafe:true,adjustedPricesVerified:true,warnings:[],symbolsProcessed:10,datesProcessed:300,baseObservations:300,observationsByHorizon:{},missingMetricCounts:{},skipped:{insufficientHistory:0,outsideHistoricalUniverse:0,noForwardOutcome:0}};

test('V9.3 runner is deterministic and keeps partial development runs explicitly non-release',()=>{
  assert.ok(runner&&report,'V9.3 runner/report modules must exist');
  const a=runner.runV93TournamentFromBaseObservations(base,manifest,{candidateStart:0,candidateLimit:24,shardSize:8});
  const b=runner.runV93TournamentFromBaseObservations(base,manifest,{candidateStart:0,candidateLimit:24,shardSize:8});
  assert.deepEqual(a,b);
  assert.equal(a.report.catalog.canonicalCount,46464);
  assert.equal(a.report.catalog.selectedCount,24);
  assert.equal(a.report.catalog.completeCatalog,false);
  assert.equal(a.report.tournament.dispositionCount,24);
  assert.equal(a.survivorRegistry.researchOnly,true);
  assert.equal(a.survivorRegistry.autoProductionPromotion,false);
  assert.deepEqual(a.report.tournament.results.map(x=>x.featureId),[...a.report.tournament.results.map(x=>x.featureId)].sort());
});

test('V9.3 canonical serialization ignores object key insertion order',()=>{
  assert.ok(report,'V9.3 report module must exist');
  assert.equal(report.stableStringify({b:2,a:{d:4,c:3}}),report.stableStringify({a:{c:3,d:4},b:2}));
  assert.equal(report.deterministicFingerprint({b:2,a:1}),report.deterministicFingerprint({a:1,b:2}));
});
