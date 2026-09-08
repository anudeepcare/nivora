import {generateFeatureCatalog,RESEARCH_HORIZONS} from '../v9/feature-registry';
import type {ResearchHorizon} from '../v9/domain';
import {auditHistoricalBundle} from './quality';
import {resolvePointInTimeMetrics} from './point-in-time';
import {computeHistoricalBaseMetrics} from './base-metrics';
import {labelForwardOutcome} from './outcomes';
import {AURYN_V91_OBSERVATION_VERSION} from './version';
import type {ForwardOutcome,HistoricalBar,HistoricalBaseObservation,HistoricalObservationManifest,HistoricalReplayBundle,HistoricalSecurity,HistoricalUniverseSnapshot} from './domain';

export type ObservationCadence='DAILY'|'WEEKLY'|'MONTHLY';
export type HistoricalFactoryOptions={cadence?:ObservationCadence;minHistoryBars?:number;defaultCostBps?:number;startDate?:string;endDate?:string;maxSymbols?:number};
const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));

function groupedBars(rows:HistoricalBar[]){
 const m=new Map<string,HistoricalBar[]>();
 for(const r of rows){const a=m.get(r.symbol)??[];a.push(r);m.set(r.symbol,a);}
 for(const a of m.values())a.sort((x,y)=>x.date.localeCompare(y.date));
 return m;
}
function cadenceStep(c:ObservationCadence){return c==='DAILY'?1:c==='MONTHLY'?21:5;}
function activeSecurity(sec:HistoricalSecurity|undefined,date:string){
 if(!sec)return true;
 if(sec.activeFrom&&date<sec.activeFrom)return false;
 if(sec.activeTo&&date>sec.activeTo)return false;
 return true;
}
function latestUniverseSnapshot(snapshots:HistoricalUniverseSnapshot[],date:string){
 let best:HistoricalUniverseSnapshot|undefined;
 for(const s of snapshots){if(s.date<=date&&(!best||s.date>best.date))best=s;}
 return best;
}
function inHistoricalUniverse(symbol:string,date:string,snapshots:HistoricalUniverseSnapshot[],strict:boolean){
 if(!strict||!snapshots.length)return true;
 const s=latestUniverseSnapshot(snapshots,date);
 return s?new Set(s.symbols).has(symbol):false;
}

export function buildHistoricalBaseObservations(bundle:HistoricalReplayBundle,options:HistoricalFactoryOptions={}){
 const quality=auditHistoricalBundle(bundle);
 if(!quality.valid)throw new Error(`INVALID historical bundle: ${quality.errors.join(' | ')}`);
 const cadence=options.cadence??'WEEKLY',step=cadenceStep(cadence),minHistory=Math.max(20,Math.floor(options.minHistoryBars??252));
 const defaultCostBps=clamp(finite(options.defaultCostBps)?options.defaultCostBps:10,0,500);
 const bySymbol=groupedBars(bundle.dailyBars),securityMap=new Map(bundle.securities.map(s=>[s.symbol,s] as const));
 const symbols=[...bySymbol.keys()].sort().slice(0,Math.max(0,Math.floor(options.maxSymbols??Number.MAX_SAFE_INTEGER)));
 const uniqueBaseMetrics=[...new Set(generateFeatureCatalog().map(x=>x.baseMetric))].sort();
 const missingMetricCounts:Record<string,number>=Object.fromEntries(uniqueBaseMetrics.map(x=>[x,0]));
 const observationsByHorizon:Record<string,number>=Object.fromEntries(RESEARCH_HORIZONS.map(h=>[h,0]));
 const skipped={insufficientHistory:0,outsideHistoricalUniverse:0,noForwardOutcome:0};
 const emittedSymbols=new Set<string>(),emittedDates=new Set<string>();
 const baseObservations:HistoricalBaseObservation[]=[];
 const facts=bundle.facts??[],events=bundle.events??[],snapshots=(bundle.universeSnapshots??[]).slice().sort((a,b)=>a.date.localeCompare(b.date));
 for(const symbol of symbols){
  const bars=bySymbol.get(symbol)!;const sec=securityMap.get(symbol);
  for(let i=0;i<bars.length;i++){
   if(i<minHistory-1){skipped.insufficientHistory++;continue;}
   const offset=i-(minHistory-1);if(offset%step!==0)continue;
   const date=bars[i].date;
   if(options.startDate&&date<options.startDate)continue;if(options.endDate&&date>options.endDate)continue;
   if(!activeSecurity(sec,date)||!inHistoricalUniverse(symbol,date,snapshots,Boolean(bundle.meta.pointInTimeUniverse))){skipped.outsideHistoricalUniverse++;continue;}
   const external=resolvePointInTimeMetrics(facts,events,symbol,date);
   const computed=computeHistoricalBaseMetrics(bars,bundle.benchmarkBars,external,i);
   const outcomes:Record<string,ForwardOutcome>={};
   for(const horizon of RESEARCH_HORIZONS){
    const o=labelForwardOutcome(bars,bundle.benchmarkBars,i,horizon as ResearchHorizon,{delistingReturnPct:sec?.delistingReturnPct??null});
    if(o){outcomes[horizon]=o;observationsByHorizon[horizon]++;}
   }
   if(!Object.keys(outcomes).length){skipped.noForwardOutcome++;continue;}
   const costFromData=external.slippage_estimate_bps;
   const costBps=clamp(finite(costFromData)?costFromData:defaultCostBps,0,500);
   for(const metric of uniqueBaseMetrics)if(!finite(computed.metrics[metric]))missingMetricCounts[metric]++;
   baseObservations.push({symbol,asOf:date,archetype:sec?.archetype||'UNKNOWN',sector:sec?.sector||null,regime:computed.regime,benchmarkSymbol:bundle.meta.benchmarkSymbol,close:bars[i].close,metrics:computed.metrics,outcomes,costBps});
   emittedSymbols.add(symbol);emittedDates.add(date);
  }
 }
 baseObservations.sort((a,b)=>a.asOf.localeCompare(b.asOf)||a.symbol.localeCompare(b.symbol));
 const manifest:HistoricalObservationManifest={version:AURYN_V91_OBSERVATION_VERSION,datasetId:bundle.meta.datasetId,datasetVersion:bundle.meta.version??null,source:bundle.meta.source,quality:quality.quality,survivorshipSafe:quality.survivorshipSafe,adjustedPricesVerified:quality.adjustedPricesVerified,warnings:[...quality.warnings],symbolsProcessed:emittedSymbols.size,datesProcessed:emittedDates.size,baseObservations:baseObservations.length,observationsByHorizon,missingMetricCounts,skipped};
 return{baseObservations,manifest,qualityReport:quality};
}
