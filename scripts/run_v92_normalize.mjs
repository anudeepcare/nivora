import fs from 'node:fs';
import path from 'node:path';
const valueArg=n=>{const p=`--${n}=`;const a=process.argv.find(x=>x.startsWith(p));return a?a.slice(p.length):''};
const inputPath=valueArg('input')||process.env.AURYN_V92_RAW_BUNDLE||'';
const outputPath=valueArg('output')||process.env.AURYN_V92_REPLAY_BUNDLE||'';
if(!inputPath||!outputPath)throw new Error('Usage: npm run normalize:v92 -- --input=/path/raw-provider-bundle.json --output=/path/replay-bundle.json');
const {normalizeTwelveDataDaily}=await import('../.engine-test/auryn/v92/twelve-data.js');
const {normalizeAndDeriveSecCompanyFacts}=await import('../.engine-test/auryn/v92/sec-companyfacts.js');
const {normalizeTwelveDataSplits,normalizeTwelveDataDividends}=await import('../.engine-test/auryn/v92/corporate-actions.js');
const {normalizeTwelveDataEarnings,normalizePointInTimeResearchRows}=await import('../.engine-test/auryn/v92/research-events.js');
const {normalizeFredVintageObservations}=await import('../.engine-test/auryn/v92/fred.js');
const {assembleHistoricalReplayBundle}=await import('../.engine-test/auryn/v92/assemble.js');
const {auditV92ReplayBundle}=await import('../.engine-test/auryn/v92/integrity.js');
const raw=JSON.parse(fs.readFileSync(path.resolve(inputPath),'utf8'));
const benchmark=String(raw.benchmarkSymbol||'SPY').toUpperCase();
const td=raw.twelveData||{};const dailyBars=[];let benchmarkBars=[];const providerDiagnostics=[];
for(const symbol of Object.keys(td).sort()){
  const normalized=normalizeTwelveDataDaily(symbol,td[symbol]);providerDiagnostics.push(normalized.provider);
  if(symbol.toUpperCase()===benchmark)benchmarkBars=normalized.bars;else dailyBars.push(...normalized.bars);
}
if(!benchmarkBars.length)throw new Error(`Raw provider bundle does not contain Twelve Data benchmark payload for ${benchmark}.`);
const coverage=new Map();
const cover=(family,symbol)=>{const f=String(family).toUpperCase(),s=String(symbol).toUpperCase();const set=coverage.get(f)||new Set();set.add(s);coverage.set(f,set)};
for(const [family,symbols] of Object.entries(raw.adapterCoverage||{}))for(const symbol of Array.isArray(symbols)?symbols:[])cover(family,symbol);
const facts=[...(Array.isArray(raw.facts)?raw.facts:[])];
for(const symbol of Object.keys(raw.secCompanyFacts||{}).sort()){facts.push(...normalizeAndDeriveSecCompanyFacts(symbol,raw.secCompanyFacts[symbol]).all);cover('FUNDAMENTALS',symbol);}
const corporateActions=[];const splitPayloads=raw.twelveDataSplits||{},dividendPayloads=raw.twelveDataDividends||{};
for(const symbol of [...new Set([...Object.keys(splitPayloads),...Object.keys(dividendPayloads)])].sort()){
  let splitOk=false,dividendOk=false;
  if(Object.hasOwn(splitPayloads,symbol)){corporateActions.push(...normalizeTwelveDataSplits(symbol,splitPayloads[symbol]));splitOk=true;}
  if(Object.hasOwn(dividendPayloads,symbol)){corporateActions.push(...normalizeTwelveDataDividends(symbol,dividendPayloads[symbol]));dividendOk=true;}
  if(splitOk&&dividendOk)cover('CORPORATE_ACTIONS',symbol);
}
const events=[];
const baseEvents=[...(Array.isArray(raw.events)?raw.events:[]),...(Array.isArray(raw.researchEvents)?raw.researchEvents:[])];
if(baseEvents.length){events.push(...normalizePointInTimeResearchRows(baseEvents));for(const row of baseEvents){const metric=String(row?.metric||'');const symbol=String(row?.symbol||'').toUpperCase();const family=String(row?.family||'').toUpperCase();if(family)cover(family,symbol);else{if(/revision/i.test(metric)||['estimate_dispersion','guidance_delta'].includes(metric))cover('REVISION',symbol);if(['sector_relative_strength','industry_breadth','peer_revision_breadth'].includes(metric))cover('SECTOR',symbol);if(symbol==='__MACRO__')cover('MACRO','__MACRO__');}}}
for(const symbol of Object.keys(raw.twelveDataEarnings||{}).sort()){events.push(...normalizeTwelveDataEarnings(symbol,raw.twelveDataEarnings[symbol]));cover('EARNINGS',symbol);}
for(const item of Array.isArray(raw.fredVintages)?raw.fredVintages:[]){events.push(...normalizeFredVintageObservations(item.seriesId,item.metric,item.payload));cover('MACRO','__MACRO__');}
const adapterCoverage=Object.fromEntries([...coverage.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([family,symbols])=>[family,[...symbols].sort()]));
const bundle=assembleHistoricalReplayBundle({datasetId:String(raw.datasetId||`auryn-v92-${Date.now()}`),version:raw.version??'1',source:String(raw.source||'TWELVE_DATA+SEC+PIT_RESEARCH'),benchmarkSymbol:benchmark,generatedAt:raw.generatedAt??null,securities:Array.isArray(raw.securities)?raw.securities:[],dailyBars,benchmarkBars,facts,events,corporateActions,adapterCoverage,universeSnapshots:Array.isArray(raw.universeSnapshots)?raw.universeSnapshots:[],pointInTimeUniverse:raw.pointInTimeUniverse===true,includesDelisted:raw.includesDelisted===true,delistingReturnsHandled:raw.delistingReturnsHandled===true});
const report=auditV92ReplayBundle(bundle);const out=path.resolve(outputPath);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(bundle,null,2)+'\n');
const reportPath=valueArg('report')?path.resolve(valueArg('report')):`${out}.v92-audit.json`;fs.writeFileSync(reportPath,JSON.stringify({...report,providerDiagnostics},null,2)+'\n');
console.log(JSON.stringify({version:report.version,state:'NORMALIZED',output:out,report:reportPath,status:report.status,quality:report.quality,coverage:report.coverage,warnings:report.warnings},null,2));
if(report.status==='BLOCKED')process.exitCode=1;
