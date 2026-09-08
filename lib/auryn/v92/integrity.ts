import type {HistoricalReplayBundle,PointInTimeMetric} from '../v91/domain';
import {auditHistoricalBundle} from '../v91/quality';
import {AURYN_V92_VERSION,type V92IntegrityReport} from './domain';

function contradictoryFacts(rows:PointInTimeMetric[]){
  const m=new Map<string,Set<number>>();for(const r of rows){const k=[r.symbol,r.metric,r.periodEnd??'',r.availableAt].join('|');const s=m.get(k)??new Set<number>();s.add(r.value);m.set(k,s);}return[...m.entries()].filter(([,v])=>v.size>1).map(([k])=>k);
}
export function auditV92ReplayBundle(bundle:HistoricalReplayBundle):V92IntegrityReport{
  const base=auditHistoricalBundle(bundle),hardFailures=[...base.errors],warnings=[...base.warnings];
  if(bundle?.meta?.pointInTimeUniverse&&!(bundle.universeSnapshots?.length))hardFailures.push('Dataset claims point-in-time/survivorship-safe universe but provides no dated universe snapshots.');
  if(bundle?.meta?.includesDelisted&&!bundle.securities?.some(s=>s.delistedDate||s.activeTo))hardFailures.push('Dataset claims delisted securities are included but security master contains no removed/delisted record.');
  if(bundle?.meta?.delistingReturnsHandled&&bundle.securities?.filter(s=>s.delistedDate||s.activeTo).some(s=>!Number.isFinite(s.delistingReturnPct)))hardFailures.push('Dataset claims delisting returns are handled but at least one removed/delisted security has no delistingReturnPct.');
  const contradictions=contradictoryFacts([...(bundle.facts??[]),...(bundle.events??[])]);if(contradictions.length)hardFailures.push(`${contradictions.length} contradictory duplicate point-in-time fact identities detected.`);
  const barsBySymbol:Record<string,number>={},years:Record<string,number>={},factMetrics:Record<string,number>={};
  for(const b of bundle.dailyBars??[]){barsBySymbol[b.symbol]=(barsBySymbol[b.symbol]??0)+1;const y=b.date.slice(0,4);years[y]=(years[y]??0)+1;}
  for(const f of [...(bundle.facts??[]),...(bundle.events??[])])factMetrics[f.metric]=(factMetrics[f.metric]??0)+1;
  const missingSecurityBars=(bundle.securities??[]).map(s=>s.symbol).filter(s=>!barsBySymbol[s]);if(missingSecurityBars.length)warnings.push(`${missingSecurityBars.length} security-master symbols have no historical bars.`);
  const hard=[...new Set(hardFailures)].sort(),warn=[...new Set(warnings)].sort();
  return{version:AURYN_V92_VERSION,status:hard.length?'BLOCKED':'PASS',quality:base.quality,hardFailures:hard,warnings:warn,survivorshipSafe:base.survivorshipSafe,coverage:{securities:bundle.securities?.length??0,symbolsWithBars:Object.keys(barsBySymbol).length,benchmarkBars:bundle.benchmarkBars?.length??0,facts:bundle.facts?.length??0,events:bundle.events?.length??0,universeSnapshots:bundle.universeSnapshots?.length??0,years:Object.fromEntries(Object.entries(years).sort()),barsBySymbol:Object.fromEntries(Object.entries(barsBySymbol).sort()),factMetrics:Object.fromEntries(Object.entries(factMetrics).sort()),missingSecurityBars:missingSecurityBars.sort()},bundle:{meta:bundle.meta}};
}
