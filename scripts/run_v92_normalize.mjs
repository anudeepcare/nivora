import fs from 'node:fs';
import path from 'node:path';
const valueArg=n=>{const p=`--${n}=`;const a=process.argv.find(x=>x.startsWith(p));return a?a.slice(p.length):''};
const inputPath=valueArg('input')||process.env.AURYN_V92_RAW_BUNDLE||'';
const outputPath=valueArg('output')||process.env.AURYN_V92_REPLAY_BUNDLE||'';
if(!inputPath||!outputPath)throw new Error('Usage: npm run normalize:v92 -- --input=/path/raw-provider-bundle.json --output=/path/replay-bundle.json');
const {normalizeTwelveDataDaily}=await import('../.engine-test/auryn/v92/twelve-data.js');
const {normalizeAndDeriveSecCompanyFacts}=await import('../.engine-test/auryn/v92/sec-companyfacts.js');
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
const facts=[...(Array.isArray(raw.facts)?raw.facts:[])];
for(const symbol of Object.keys(raw.secCompanyFacts||{}).sort())facts.push(...normalizeAndDeriveSecCompanyFacts(symbol,raw.secCompanyFacts[symbol]).all);
const bundle=assembleHistoricalReplayBundle({datasetId:String(raw.datasetId||`auryn-v92-${Date.now()}`),version:raw.version??'1',source:String(raw.source||'TWELVE_DATA+SEC'),benchmarkSymbol:benchmark,generatedAt:raw.generatedAt??null,securities:Array.isArray(raw.securities)?raw.securities:[],dailyBars,benchmarkBars,facts,events:Array.isArray(raw.events)?raw.events:[],universeSnapshots:Array.isArray(raw.universeSnapshots)?raw.universeSnapshots:[],pointInTimeUniverse:raw.pointInTimeUniverse===true,includesDelisted:raw.includesDelisted===true,delistingReturnsHandled:raw.delistingReturnsHandled===true});
const report=auditV92ReplayBundle(bundle);const out=path.resolve(outputPath);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(bundle,null,2)+'\n');
const reportPath=valueArg('report')?path.resolve(valueArg('report')):`${out}.v92-audit.json`;fs.writeFileSync(reportPath,JSON.stringify({...report,providerDiagnostics},null,2)+'\n');
console.log(JSON.stringify({version:report.version,state:'NORMALIZED',output:out,report:reportPath,status:report.status,quality:report.quality,coverage:report.coverage,warnings:report.warnings},null,2));
if(report.status==='BLOCKED')process.exitCode=1;
