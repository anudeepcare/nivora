import type {Research,Metric} from './types';
import {latestFinancialEvidence} from './analysis.ts';
import {marketMultiples} from './research-summary.ts';
import {researchDecision} from './decision-research.ts';
export type QualityStatus='Reported'|'Calculated'|'Estimated'|'Conflicting'|'Unavailable';
export function metricEvidence(r:Research,metrics:Metric[],calculated=false){
 const p=latestFinancialEvidence(r).latest,day=r.retrievedAt.slice(0,10);
 const facts=r.facts.filter(f=>metrics.includes(f.metric)&&f.end===p?.end&&f.filed<=day&&Number.isFinite(f.value));
 const conflicts=metrics.some(m=>{const rows=facts.filter(f=>f.metric===m);return rows.some(a=>rows.some(b=>a.start===b.start&&a.scope===b.scope&&a.basis===b.basis&&a.unit===b.unit&&a.filed===b.filed&&Math.abs(a.value-b.value)>Math.max(1,Math.abs(a.value)*.01)));});
 const missing=metrics.some(m=>!facts.some(f=>f.metric===m));
 const mixed=facts.some(f=>f.currency&&f.currency!==p?.currency);
 const urls=[...new Set(facts.flatMap(f=>f.sourceUrls??[f.sourceUrl]).filter(u=>/^https:\/\//.test(u)))];
 return {status:(conflicts||mixed?'Conflicting':!p||missing?'Unavailable':calculated?'Calculated':'Reported') as QualityStatus,period:p?.end??null,currency:p?.currency??null,observedAt:r.retrievedAt,urls,explanation:conflicts?'Same-period observations disagree; review the original source.':mixed?'Reporting currencies do not align.':missing?'One or more same-period inputs are missing; no independent verification is claimed.':calculated?'Derived from the displayed reporting period; not independently audited.':'Provider or filing observation; reported does not mean independently verified.'};
}
export function financingContext(r:Research){
 const {latest:p,prior}=latestFinancialEvidence(r);
 const cash=p?.cash,ocf=p?.operatingCashFlow,fcf=p?.fcf;
 const applicable=r.company.assetType==='stock'&&!/bank|insurance|reit/i.test((r.company.sector??'')+' '+(r.evidence?.profile?.industry??''));
 const months=p?(Date.parse(p.end)-Date.parse(p.start))/86400000/30.4375:null;
 const annualBasis=months!=null&&months>=10&&months<=14;
 const runway=(burn:number|null|undefined)=>applicable&&annualBasis&&cash!=null&&cash>=0&&burn!=null&&burn<0?cash/(-burn/12):null;
 const shares=p?.weightedShares,old=prior?.weightedShares;
 const dilution=p&&prior&&p.currency===prior.currency&&p.basis===prior.basis&&shares!=null&&old!=null&&old>0?(shares/old-1)*100:null;
 return {cash:cash??null,currency:p?.currency??null,period:p?.end??null,operatingRunway:runway(ocf),investmentRunway:runway(fcf),dilution,sbcRevenue:p?.sbcRevenue??null,capexRevenue:p?.capexRevenue??null,annualBasis,applicable};
}
export type SavedEvidence={version:string;at:string;period:string|null;currency:string|null;score:number|null;revenue:number|null;flags:string[];filings:string[];};
export function evidenceObservation(r:Research):SavedEvidence{const d=researchDecision(r),p=latestFinancialEvidence(r).latest;return {version:d.version,at:r.retrievedAt,period:p?.end??null,currency:p?.currency??null,score:d.overall,revenue:p?.revenue??null,flags:d.flags.map(f=>f.id).sort(),filings:r.filings.map(f=>f.url)};}
export function evidenceChanges(a:SavedEvidence|null,b:SavedEvidence){
 if(!a)return [];
 const rows:string[]=[];
 if(a.period&&b.period&&a.period!==b.period)rows.push(`New reporting period: ${b.period}`);
 if(a.version===b.version&&a.score!=null&&b.score!=null&&Math.abs(a.score-b.score)>=.1)rows.push(`Balanced screening composite: ${a.score.toFixed(1)} → ${b.score.toFixed(1)}`);
 for(const id of b.flags.filter(x=>!a.flags.includes(x)))rows.push(`New review flag: ${id}`);
 for(const id of a.flags.filter(x=>!b.flags.includes(x)))rows.push(`Previously observed flag no longer present: ${id}. Check data coverage before treating it as resolved.`);
 const n=b.filings.filter(x=>!a.filings.includes(x)).length;if(n)rows.push(`${n} new filing link${n===1?'':'s'} since your saved observation`);
 if(a.period===b.period&&a.currency===b.currency&&a.revenue!=null&&b.revenue!=null&&a.revenue!==b.revenue)rows.push('Same-period revenue changed; inspect a possible revision or source change.');
 return rows;
}
export function peerContext(reports:Research[]){
 const unique=[...new Map(reports.map(r=>[r.company.symbol,r])).values()];
 const sectors=[...new Set(unique.map(r=>r.company.sector||r.evidence?.profile.sector).filter(Boolean))];
 const rows=unique.map(r=>{const p=latestFinancialEvidence(r).latest;return {symbol:r.company.symbol,period:p?.end,currency:p?.currency,margin:p?.margin,fcfYield:marketMultiples(r,p).fcfYield};});
 const periods=rows.flatMap(x=>x.period?[Date.parse(x.period)]:[]);
 const eligible=unique.length>=3&&sectors.length===1&&unique.every(r=>r.company.sector||r.evidence?.profile.sector)&&rows.every(x=>x.period&&x.currency)&&new Set(rows.map(x=>x.currency)).size===1&&Math.max(...periods)-Math.min(...periods)<=100*86400000;
 const median=(values:(number|null|undefined)[])=>{const x=values.filter((n):n is number=>n!=null&&Number.isFinite(n)).sort((a,b)=>a-b);return x.length>=3?(x[Math.floor((x.length-1)/2)]+x[Math.ceil((x.length-1)/2)])/2:null;};
 return {eligible,count:rows.length,sector:sectors[0]??null,marginMedian:eligible?median(rows.map(x=>x.margin)):null,fcfYieldMedian:eligible?median(rows.map(x=>x.fcfYield)):null};
}

export function parseSavedEvidence(raw:unknown):SavedEvidence|null{
 if(!raw||typeof raw!=='object')return null;const x=raw as Record<string,unknown>;
 if(typeof x.version!=='string'||typeof x.at!=='string'||!Number.isFinite(Date.parse(x.at))||!Array.isArray(x.flags)||!x.flags.every(v=>typeof v==='string')||!Array.isArray(x.filings)||!x.filings.every(v=>typeof v==='string')||!(x.score===null||typeof x.score==='number'&&Number.isFinite(x.score))||!(x.revenue===null||typeof x.revenue==='number'&&Number.isFinite(x.revenue))||!(x.period===null||typeof x.period==='string')||!(x.currency===null||typeof x.currency==='string'))return null;
 return x as SavedEvidence;
}
export function operatingEfficiency(r:Research){
 const {latest:p,prior:q}=latestFinancialEvidence(r);const days=p?(Date.parse(p.end)-Date.parse(p.start))/86400000+1:0;
 const compatible=!!p&&!!q&&p.currency===q.currency&&p.basis===q.basis&&days>=330&&days<=400;
 const avg=(a:number|null|undefined,b:number|null|undefined)=>a!=null&&b!=null&&a>=0&&b>=0?(a+b)/2:null;
 const ar=compatible?avg(p?.receivables,q?.receivables):null,inv=compatible?avg(p?.inventory,q?.inventory):null,ap=compatible?avg(p?.payables,q?.payables):null;
 const turnoverDays=(v:number|null,den:number|null|undefined)=>v!=null&&den!=null&&den>0?v/den*days:null;
 const receivableDays=turnoverDays(ar,p?.revenue),inventoryDays=turnoverDays(inv,p?.costOfRevenue),payableDays=turnoverDays(ap,p?.costOfRevenue);
 return {workingCapital:p?.currentAssets!=null&&p.currentLiabilities!=null?p.currentAssets-p.currentLiabilities:null,cashDebt:p?.cash!=null&&p.debt!=null&&p.debt>0?p.cash/p.debt:null,receivableDays,inventoryDays,payableDays,cashCycle:receivableDays!=null&&inventoryDays!=null&&payableDays!=null?receivableDays+inventoryDays-payableDays:null};
}
