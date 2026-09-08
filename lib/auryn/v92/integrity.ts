import type {HistoricalReplayBundle,PointInTimeMetric} from '../v91/domain';
import {auditHistoricalBundle} from '../v91/quality';
import {auditCorporateActionAdjustments} from './corporate-actions';
import {AURYN_V92_VERSION,type V92IntegrityReport} from './domain';

function contradictoryFacts(rows:PointInTimeMetric[]){
  const m=new Map<string,Set<number>>();for(const r of rows){const k=[r.symbol,r.metric,r.periodEnd??'',r.availableAt].join('|');const s=m.get(k)??new Set<number>();s.add(r.value);m.set(k,s);}return[...m.entries()].filter(([,v])=>v.size>1).map(([k])=>k);
}
const REVISION=new Set(['eps_revision_breadth','revenue_revision_breadth','estimate_dispersion','guidance_delta']);
const SECTOR=new Set(['sector_relative_strength','industry_breadth','peer_revision_breadth']);
const MACRO=new Set(['rates_regime','liquidity_regime','credit_regime','vix_regime','dollar_sensitivity','fed_funds_rate']);
function familyCounts(facts:PointInTimeMetric[],events:PointInTimeMetric[],corporateActions:number){
  const out:Record<string,number>={FUNDAMENTALS:facts.length,EARNINGS:0,REVISION:0,SECTOR:0,MACRO:0,CORPORATE_ACTIONS:corporateActions};
  for(const r of events){if(r.metric.startsWith('earnings_')||r.metric==='surprise_streak')out.EARNINGS++;if(REVISION.has(r.metric)||/revision/i.test(r.metric))out.REVISION++;if(SECTOR.has(r.metric))out.SECTOR++;if(r.symbol==='__MACRO__'||MACRO.has(r.metric))out.MACRO++;}
  return out;
}
function sessionGaps(bundle:HistoricalReplayBundle){
  const benchmarkDates=[...new Set((bundle.benchmarkBars??[]).map(b=>b.date))].sort(),bySymbol=new Map<string,Set<string>>();
  for(const b of bundle.dailyBars??[]){const s=bySymbol.get(b.symbol)??new Set<string>();s.add(b.date);bySymbol.set(b.symbol,s);}
  const gaps:Record<string,string[]>={};let expectedCount=0;
  for(const sec of bundle.securities??[]){const actual=bySymbol.get(sec.symbol);if(!actual?.size)continue;const first=[...actual].sort()[0];const start=sec.activeFrom&&sec.activeFrom>first?sec.activeFrom:first;const end=sec.activeTo||sec.delistedDate||benchmarkDates.at(-1)||first;const expected=benchmarkDates.filter(d=>d>=start&&d<=end);expectedCount+=expected.length;const missing=expected.filter(d=>!actual.has(d));if(missing.length)gaps[sec.symbol]=missing;}
  return{gaps,expectedCount};
}
export function auditV92ReplayBundle(bundle:HistoricalReplayBundle):V92IntegrityReport{
  const base=auditHistoricalBundle(bundle),hardFailures=[...base.errors],warnings=[...base.warnings];
  if(bundle?.meta?.pointInTimeUniverse&&!(bundle.universeSnapshots?.length))hardFailures.push('Dataset claims point-in-time/survivorship-safe universe but provides no dated universe snapshots.');
  if(bundle?.meta?.includesDelisted&&!bundle.securities?.some(s=>s.delistedDate||s.activeTo))hardFailures.push('Dataset claims delisted securities are included but security master contains no removed/delisted record.');
  if(bundle?.meta?.delistingReturnsHandled&&bundle.securities?.filter(s=>s.delistedDate||s.activeTo).some(s=>!Number.isFinite(s.delistingReturnPct)))hardFailures.push('Dataset claims delisting returns are handled but at least one removed/delisted security has no delistingReturnPct.');
  const contradictions=contradictoryFacts([...(bundle.facts??[]),...(bundle.events??[])]);if(contradictions.length)hardFailures.push(`${contradictions.length} contradictory duplicate point-in-time fact identities detected.`);
  const corporateFailures=auditCorporateActionAdjustments(bundle.dailyBars??[],bundle.corporateActions??[]);hardFailures.push(...corporateFailures);
  const barsBySymbol:Record<string,number>={},years:Record<string,number>={},factMetrics:Record<string,number>={};
  for(const b of bundle.dailyBars??[]){barsBySymbol[b.symbol]=(barsBySymbol[b.symbol]??0)+1;const y=b.date.slice(0,4);years[y]=(years[y]??0)+1;}
  for(const f of [...(bundle.facts??[]),...(bundle.events??[])])factMetrics[f.metric]=(factMetrics[f.metric]??0)+1;
  const missingSecurityBars=(bundle.securities??[]).map(s=>s.symbol).filter(s=>!barsBySymbol[s]);if(missingSecurityBars.length)warnings.push(`${missingSecurityBars.length} security-master symbols have no historical bars.`);
  const sessions=sessionGaps(bundle),gaps=sessions.gaps,gapCount=Object.values(gaps).reduce((n,a)=>n+a.length,0);if(gapCount)warnings.push(`${gapCount} benchmark-session gaps detected across ${Object.keys(gaps).length} symbols.`);
  const familyRows=familyCounts(bundle.facts??[],bundle.events??[],bundle.corporateActions?.length??0);
  const adapterCoverage=Object.fromEntries(Object.entries(bundle.adapterCoverage??{}).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,new Set(v).size]));
  const hard=[...new Set(hardFailures)].sort(),warn=[...new Set(warnings)].sort();
  return{version:AURYN_V92_VERSION,status:hard.length?'BLOCKED':'PASS',quality:base.quality,hardFailures:hard,warnings:warn,survivorshipSafe:base.survivorshipSafe,coverage:{securities:bundle.securities?.length??0,symbolsWithBars:Object.keys(barsBySymbol).length,benchmarkBars:bundle.benchmarkBars?.length??0,facts:bundle.facts?.length??0,events:bundle.events?.length??0,universeSnapshots:bundle.universeSnapshots?.length??0,years:Object.fromEntries(Object.entries(years).sort()),barsBySymbol:Object.fromEntries(Object.entries(barsBySymbol).sort()),factMetrics:Object.fromEntries(Object.entries(factMetrics).sort()),missingSecurityBars:missingSecurityBars.sort(),corporateActions:bundle.corporateActions?.length??0,corporateActionCorruptionCount:corporateFailures.length,sessionGapCount:gapCount,sessionExpectedCount:sessions.expectedCount,sessionGapsBySymbol:gaps,familyRows,adapterCoverage},bundle:{meta:bundle.meta}};
}
