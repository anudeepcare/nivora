import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildExecutionPlan} from '../.engine-test/auryn/v5/execution-plan.js';
import {formatProfessionalMetricValue,formatScoreValue,formatScoreBand,formatRiskBand} from '../.engine-test/auryn/v5/format.js';
import {resolveTwelveRegularClose} from '../.engine-test/nivora-live-quote.js';
import {buildCanonicalMarketSnapshot} from '../.engine-test/auryn/market-truth.js';
import {resolvePaperInvalidation} from '../.engine-test/v65/paper-invalidation.js';

const market=()=>({snapshotId:'BE-2026-09-07-test',symbol:'BE',asOf:'2026-09-07T22:30:00.000Z',session:'CLOSED',calendarState:'HOLIDAY',priceState:'OFFICIAL_CLOSE',decisionPrice:252.87,displayPrice:252.87,regularClose:252.87,extendedPrice:null,providerAgreementPct:.82,sources:[],priceSensitiveAllowed:true,decisionAllowed:true,reason:'holiday close'});
const tech={price:252.87,changePct:7.35,volumeRatio:1.34,scores:{trend:65,momentum:94,flow:65,structure:64,entry:45,timing:45,risk:88,extension:66},labels:{trend:'Mixed',momentum:'Strong',flow:'Mixed',structure:'Mixed',entry:'Neutral',risk:'High',extension:'Elevated'},levels:{preferredEntry:245,support:245,majorSupport:220,resistance:265.51,breakout:284.78,invalidation:212.87},volatility:{atr14:18,atrPct:7.1},market:{benchmark:'QQQ',benchmarkPrice:700,regime:'Supportive',score:68,relativeStrength:'Leading',relative20:6},riskReward:1.7,indicators:{rsi14:63.09,atr14:18,atrPct:7.1,realizedVol20:77.5,volumeRatio20:1.34,sma20:218,sma50:226,sma200:191,distance20Pct:15.71,distance50Pct:11.65,distance200Pct:32.22,bollingerPosition:100,drawdown52wPct:-28,macd:{line:1.2,signal:.8,histogram:4.4043}},technicalState:{strength:73,entryQuality:45,trend:65,momentum:94,participation:65,structure:64,extensionRisk:66,volatilityRisk:89,state:'Constructive',entryState:'Neutral'},indicatorVersion:'wilder-v1',technicalStateVersion:'auryn-tech-v2'};

const metric=(id,value,unit=null)=>({id,label:id,family:'MOMENTUM',role:'TIMING',value,unit,state:'BULLISH',interpretation:'x',available:true,higherIsBetter:true,source:'test'});

test('professional metric formatting never leaks raw floating point precision',()=>{
  assert.equal(formatProfessionalMetricValue(metric('adx14',13.210369719590044)),'13.2');
  assert.equal(formatProfessionalMetricValue(metric('stochasticK',99.3617338041066,'%')),'99.4%');
  assert.equal(formatProfessionalMetricValue(metric('cci20',162.59030549638385)),'162.6');
  assert.equal(formatProfessionalMetricValue(metric('cmf20',-0.016799293249364022)),'-0.017');
  assert.equal(formatProfessionalMetricValue(metric('volumeDryUp',1.031230523739108,'x')),'1.03×');
  assert.equal(formatScoreValue(96.33333333333333),'96/100');
});

test('holiday official close uses quote close, not previous_close baseline',()=>{
  const raw={close:'252.87',previous_close:'235.55',is_extended_hours:false};
  assert.equal(resolveTwelveRegularClose(raw,new Date('2026-09-07T22:30:00.000Z')),252.87);
});

test('premarket and after-hours regular close uses previous_close when quote is extended',()=>{
  const raw={close:'266.14',previous_close:'252.87',is_extended_hours:true};
  assert.equal(resolveTwelveRegularClose(raw,new Date('2026-09-08T12:00:00.000Z')),252.87);
  assert.equal(resolveTwelveRegularClose(raw,new Date('2026-09-08T22:00:00.000Z')),252.87);
});

test('HOLD with unavailable valuation publishes watch zones, not active DCA instructions',()=>{
  const p=buildExecutionPlan({marketTruth:market(),technical:tech,thesis:{strength:73,direction:'STABLE'},riskScore:88,primaryAction:'HOLD',ownerAction:'HOLD',valuationDecisionGrade:false});
  assert.equal(p.intent,'WATCH');
  assert.equal(p.dcaZones.length,0);
  assert.ok(p.initialEntry);
  assert.match(p.initialEntry.label,/watch|zone/i);
});

test('BUY with decision-grade valuation may publish staged DCA levels in strict descending order',()=>{
  const p=buildExecutionPlan({marketTruth:market(),technical:tech,thesis:{strength:82,direction:'STRENGTHENING'},riskScore:65,primaryAction:'BUY',ownerAction:'BUY',valuationDecisionGrade:true});
  assert.equal(p.intent,'ACCUMULATE');
  assert.ok(p.dcaZones.length>=1);
  const highs=[p.initialEntry.high,...p.dcaZones.map(z=>z.high),p.invalidation];
  for(let i=1;i<highs.length;i++)assert.ok(highs[i] < highs[i-1],`expected ${highs[i]} < ${highs[i-1]}`);
  assert.ok(p.confirmation>p.initialEntry.high);
});

test('REDUCE and SELL never publish DCA zones',()=>{
  for(const action of ['REDUCE','SELL']){
    const p=buildExecutionPlan({marketTruth:market(),technical:tech,thesis:{strength:55,direction:'WEAKENING'},riskScore:88,primaryAction:action,ownerAction:action,valuationDecisionGrade:true});
    assert.equal(p.dcaZones.length,0);
    assert.ok(['REDUCE','EXIT'].includes(p.intent));
  }
});

test('V5 UI uses centralized professional formatting for hero and evidence explorer',()=>{
  const hero=fs.readFileSync(new URL('../components/stock/v5/StockV5Decision.tsx',import.meta.url),'utf8');
  const explorer=fs.readFileSync(new URL('../components/stock/v5/ProfessionalMetricExplorer.tsx',import.meta.url),'utf8');
  assert.match(hero,/formatProfessionalMetricValue/);
  assert.match(explorer,/formatProfessionalMetricValue/);
  assert.doesNotMatch(hero,/`\$\{m\.value\}\$\{m\.unit/);
  assert.doesNotMatch(explorer,/`\$\{m\.value\}\$\{m\.unit/);
});

test('canonical analysis resolves CIO decision before building the execution plan',()=>{
  const s=fs.readFileSync(new URL('../lib/auryn/v5/analyze.ts',import.meta.url),'utf8');
  assert.match(s,/const decision=resolveV5CioDecision[\s\S]*const executionPlan=buildExecutionPlan/);
  assert.match(s,/primaryAction:decision\.primaryAction/);
  assert.match(s,/ownerAction:decision\.ownerAction/);
});

test('canonical quote gateway resolves the official regular close from Twelve quote semantics instead of raw previous_close',()=>{
  const route=fs.readFileSync(new URL('../app/api/quote/[symbol]/route.ts',import.meta.url),'utf8');
  const gateway=fs.readFileSync(new URL('../lib/auryn/market-data-gateway.ts',import.meta.url),'utf8');
  assert.match(route,/market-data-gateway/);
  assert.match(gateway,/resolveTwelveRegularClose/);
  assert.doesNotMatch(gateway,/regularClose:twelveDisplay\?\.regularClose/);
});

test('execution plan UI labels WATCH as structural watch levels and never calls it active DCA',()=>{
  const s=fs.readFileSync(new URL('../components/stock/v5/ExecutionPlanPanel.tsx',import.meta.url),'utf8');
  assert.match(s,/plan\.intent/);
  assert.match(s,/WATCH ZONE|STRUCTURAL WATCH|Watch/i);
  assert.match(s,/ACCUMULATE/);
  assert.match(s,/REDUCE|EXIT/);
});

test('V5 metric grids protect long values from colliding across columns',()=>{
  const css=fs.readFileSync(new URL('../app/auryn-product.css',import.meta.url),'utf8');
  assert.match(css,/\.aurynMetricGrid article b\{[^}]*overflow-wrap:anywhere/s);
  assert.match(css,/\.aurynDecisionSummary \.aurynMemoSignals b\{[^}]*overflow-wrap:anywhere/s);
});

test('technical tab describes V5 watch zones differently from active DCA tiers',()=>{
  const s=fs.readFileSync(new URL('../components/StockClient.tsx',import.meta.url),'utf8');
  assert.match(s,/executionPlan\.intent===\"ACCUMULATE\"/);
  assert.match(s,/STRUCTURAL WATCH ZONE/);
  assert.doesNotMatch(s,/Canonical V5 initial-entry zone/);
});

test('options underlying call is sourced from the V5 canonical decision, not a legacy view label',()=>{
  const s=fs.readFileSync(new URL('../components/StockClient.tsx',import.meta.url),'utf8');
  assert.match(s,/formatInvestmentAction\(v5Analysis\.decision\.primaryAction\)/);
  assert.doesNotMatch(s,/<small>UNDERLYING CALL<\/small><b className=\{tone\(view\.label\)\}>\{view\.label\}/);
});

test('earnings and options grids round provider decimals before rendering',()=>{
  const s=fs.readFileSync(new URL('../components/StockClient.tsx',import.meta.url),'utf8');
  assert.match(s,/formatOptionPercent/);
  assert.match(s,/formatOptionPrice/);
  assert.match(s,/formatEpsValue/);
});

test('Ichimoku cloud position renders as a professional semantic state instead of -1/0/1',()=>{
  assert.equal(formatProfessionalMetricValue(metric('ichimokuPosition',1)),'Above cloud');
  assert.equal(formatProfessionalMetricValue(metric('ichimokuPosition',0)),'Inside cloud');
  assert.equal(formatProfessionalMetricValue(metric('ichimokuPosition',-1)),'Below cloud');
});

test('legacy Pro technical grid is suppressed whenever the V5 canonical explorer is available',()=>{
  const s=fs.readFileSync(new URL('../components/StockClient.tsx',import.meta.url),'utf8');
  assert.match(s,/depth==="pro"&&\!v5Analysis&&<div className="osTechGrid"/);
});

test('closed-market snapshot carries the timestamp of the verified close instead of presenting request time as price time',()=>{
  const closeTs='2026-09-04T20:00:00.000Z';
  const snap=buildCanonicalMarketSnapshot({symbol:'BE',asOf:new Date('2026-09-07T23:30:00.000Z'),regularClose:252.87,regularCloseTimestamp:closeTs});
  assert.equal(snap.priceState,'OFFICIAL_CLOSE');
  assert.equal(snap.decisionPriceAsOf,closeTs);
  assert.equal(snap.asOf,'2026-09-07T23:30:00.000Z');
});

test('stock toolbar consumes canonical V5 execution-plan levels instead of legacy d.levels',()=>{
  const s=fs.readFileSync(new URL('../components/StockClient.tsx',import.meta.url),'utf8');
  assert.match(s,/v5Analysis\?\.executionPlan/);
  assert.match(s,/Plan zone|Watch zone|Confirm/);
  assert.doesNotMatch(s,/const supportText=`Support \$\{displayMoney\(Number\(d\.levels\.support\)\)\}`/);
});

test('validation snapshot freezes the V5 execution plan and canonical levels for downstream learning',()=>{
  const s=fs.readFileSync(new URL('../components/StockClient.tsx',import.meta.url),'utf8');
  assert.match(s,/canonicalValidationLevels/);
  assert.match(s,/executionPlan:v5Analysis\.executionPlan/);
  assert.match(s,/levels:canonicalValidationLevels/);
});

test('paper sizing prefers the frozen V5 canonical invalidation over legacy risk-zone levels',()=>{
  const x=resolvePaperInvalidation({entry:100,decision:{zones:[{kind:'risk',low:91}]},evidence:{v5:{executionPlan:{invalidation:94}},levels:{invalidation:89,majorSupport:82}}});
  assert.equal(x.value,94);
  assert.equal(x.source,'v5-execution-plan');
});

test('paper runner consumes V5 canonical scores when V5 evidence is present',()=>{
  const s=fs.readFileSync(new URL('../app/api/trading-lab/run-paper/route.ts',import.meta.url),'utf8');
  assert.match(s,/v5Meta\?\.thesisStrength/);
  assert.match(s,/v5Meta\?\.businessQuality/);
  assert.match(s,/v5Meta\?\.entryQuality/);
});

test('business and catalyst tabs use canonical V5 wording rather than legacy label/state language',()=>{
  const s=fs.readFileSync(new URL('../components/StockClient.tsx',import.meta.url),'utf8');
  assert.match(s,/canonicalBusinessLabel/);
  assert.doesNotMatch(s,/same V4 evidence state/);
});

test('one canonical score band vocabulary is shared across V5 tabs',()=>{
  assert.equal(formatScoreBand(63),'Good');
  assert.equal(formatScoreBand(59),'Mixed');
  assert.equal(formatScoreBand(75),'Strong');
  assert.equal(formatRiskBand(88),'High');
  const thesis=fs.readFileSync(new URL('../components/stock/StockThesisPanel.tsx',import.meta.url),'utf8');
  const stock=fs.readFileSync(new URL('../components/StockClient.tsx',import.meta.url),'utf8');
  assert.match(thesis,/formatScoreBand/);
  assert.match(stock,/formatScoreBand/);
});

test('legacy stock summary also uses the shared canonical V5 score vocabulary if it is ever rendered',()=>{
  const s=fs.readFileSync(new URL('../components/stock/StockDecisionSummary.tsx',import.meta.url),'utf8');
  assert.match(s,/formatScoreBand/);
  assert.doesNotMatch(s,/const scoreWord=/);
});
