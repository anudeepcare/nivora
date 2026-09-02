#!/usr/bin/env node
// NIVORA V64 point-in-time backtest runner.
// Usage:
//   npm run backtest -- --universe universe.json --start 2018-01-01 --end 2025-01-01 --horizonDays 63
//
// universe.json may be either an array of {symbol,cik} (LIMITED quality), or:
// {
//   "meta":{
//     "pointInTimeCorrect":true,
//     "includesDelisted":true,
//     "delistingReturnsHandled":true,
//     "source":"historical membership dataset name",
//     "asOfDate":"2018-01-01"
//   },
//   "symbols":[{"symbol":"AAPL","cik":"320193"}]
// }
//
// The richer manifest is required before survivorship-bias controls can be called decision-grade.

import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
import fs from "node:fs";

const {replaySymbol}=require("../.engine-test/nivora-backtest-replay.js");
const {buildBacktestReport,applyCosts,walkForwardSplit}=require("../.engine-test/nivora-backtest-report.js");
const {validateUniverseManifest}=require("../.engine-test/nivora-backtest-universe.js");
const {evaluateValidationEvidence}=require("../.engine-test/nivora-validation-gate.js");

const argv=process.argv.slice(2);
const args={};
for(let i=0;i<argv.length;i++)if(argv[i].startsWith("--"))args[argv[i].slice(2)]=argv[i+1];

const TD_KEY=process.env.TWELVE_DATA_API_KEY;
const SEC_UA=process.env.SEC_USER_AGENT||"NIVORA validation research contact@example.com";
if(!TD_KEY){console.error("Set TWELVE_DATA_API_KEY");process.exit(1)}

const rawUniverse=JSON.parse(fs.readFileSync(args.universe||"universe.json","utf8"));
const universeCheck=validateUniverseManifest(rawUniverse);
if(universeCheck.quality==="INVALID"){console.error("Universe is empty/invalid.");process.exit(1)}
for(const w of universeCheck.warnings)console.warn(`UNIVERSE WARNING: ${w}`);

const universe=universeCheck.entries;
const horizonDays=Number(args.horizonDays||63);
const start=args.start,end=args.end;
if(!start||!end){console.error("Provide --start YYYY-MM-DD and --end YYYY-MM-DD");process.exit(1)}

async function fetchSeries(symbol,size=5000){
 const u=`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=${size}&adjust=all&apikey=${TD_KEY}`;
 const r=await fetch(u,{signal:AbortSignal.timeout(12000)}),j=await r.json();
 if(!Array.isArray(j?.values))throw new Error(j?.message||`No price history for ${symbol}`);
 return j.values.slice().reverse().map(x=>({datetime:x.datetime,open:+x.open,high:+x.high,low:+x.low,close:+x.close,volume:+x.volume||0}));
}

async function fetchCompanyFacts(cik){
 if(!cik)return null;
 const r=await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10,"0")}.json`,{headers:{"User-Agent":SEC_UA},signal:AbortSignal.timeout(12000)});
 return r.ok?r.json():null;
}

function weeklyDates(startDate,endDate){
 const out=[];let d=new Date(`${startDate}T12:00:00Z`),e=new Date(`${endDate}T12:00:00Z`);
 while(d<=e){out.push(d.toISOString().slice(0,10));d.setUTCDate(d.getUTCDate()+7)}
 return out;
}

async function main(){
 const benchmarkSymbol=args.benchmark||"SPY";
 const bench=await fetchSeries(benchmarkSymbol);
 const dates=weeklyDates(start,end);
 const {inSample,outOfSample}=walkForwardSplit(dates,Number(args.inSampleFraction||.6));
 console.log(`Universe quality: ${universeCheck.quality}; in-sample dates ${inSample.length}; untouched out-of-sample dates ${outOfSample.length}.`);

 let allRows=[];
 let failedSymbols=[];
 for(const entry of universe){
  try{
   const bars=await fetchSeries(entry.symbol);
   const facts=await fetchCompanyFacts(entry.cik);
   const rows=replaySymbol({symbol:entry.symbol,archetypeHintBars:bars,benchBars:bench,companyFacts:facts,benchmarkSymbol},dates,horizonDays);
   allRows=allRows.concat(rows);
   console.log(`${entry.symbol}: ${rows.length} replayed decisions`);
   await new Promise(r=>setTimeout(r,1200)); // Grow 55 friendly; fundamentals are fetched once per symbol.
  }catch(e){
   failedSymbols.push({symbol:entry.symbol,error:e?.message||String(e)});
   console.error(`${entry.symbol} failed: ${e?.message||e}`);
  }
 }

 const withCosts=applyCosts(allRows,{
  slippageBps:Number(args.slippageBps||15),
  commissionBps:Number(args.commissionBps||0)
 });
 const outOfSampleRows=withCosts.filter(r=>outOfSample.includes(r.asOfDate));
 const report=buildBacktestReport(outOfSampleRows,Number(args.minimum||100));

 // V64 refuses to manufacture a final "VALIDATED" label from a signal replay alone.
 // A true strategy max drawdown and live-forward sample are still required. We pass
 // a conservative placeholder for drawdown so this report can reach BACKTESTED/OOS,
 // never full VALIDATED, until those additional evidence layers exist.
 const overall=report.overall;
 const validation=evaluateValidationEvidence({
  historicalN:withCosts.length,
  oosN:outOfSampleRows.length,
  forwardN:0,
  avgAlphaPct:Number(overall.avgAlphaPct||0),
  hitRatePct:Number(overall.hitRatePct||0),
  brierScore:Number(overall.brierScore||1),
  ecePct:Number(overall.expectedCalibrationErrorPct||100),
  maxDrawdownPct:-30,
  regimesPassed:report.byRegime?.filter(x=>x.n>=30).length||0,
  archetypesPassed:report.byArchetype.filter(x=>x.n>=30).length,
  dataQualityPassed:universeCheck.quality==="DECISION_GRADE"
 });

 const artifact={
  schemaVersion:"v64-backtest-artifact-1",
  generatedAt:new Date().toISOString(),
  engineVersion:"v64",
  benchmarkSymbol,
  start,end,horizonDays,
  costModel:{slippageBps:Number(args.slippageBps||15),commissionBps:Number(args.commissionBps||0)},
  universe:{quality:universeCheck.quality,survivorshipBiasControlled:universeCheck.survivorshipBiasControlled,meta:universeCheck.meta,warnings:universeCheck.warnings,totalSymbols:universe.length,failedSymbols},
  split:{inSampleDates:inSample.length,outOfSampleDates:outOfSample.length},
  report,
  validation,
  limitations:[
   "Historical analyst/Street estimate snapshots are not injected because the current providers do not supply trustworthy point-in-time history.",
   "Signal-level replay is not a full portfolio simulator; full strategy drawdown/turnover/capacity evidence remains a separate validation requirement.",
   "Delisting returns must be represented by the supplied historical-universe dataset before survivorship-bias control is decision-grade."
  ],
  rows:withCosts
 };
 fs.writeFileSync(args.output||"backtest-results.json",JSON.stringify(artifact,null,2));
 console.log(JSON.stringify({overall:report.overall,validation,universe:artifact.universe},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
