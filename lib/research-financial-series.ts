import type {FinancialFact} from './sec-company-evidence';
export type FinancialPeriod={periodEnd:string;periodStart:string|null;currency:string;basis:string;filedAt:string;sourceUrl:string|null;revenue:number|null;netIncome:number|null;operatingIncome:number|null;operatingCashFlow:number|null;capex:number|null;fcf:number|null;operatingMargin:number|null};
const fields=['revenue','netIncome','operatingIncome','operatingCashFlow','capex'] as const;
export function financialSeries(company:any,scope:'ANNUAL'|'QUARTER'='ANNUAL'):FinancialPeriod[]{
 const facts:FinancialFact[]=(company?.financials?.facts??[]).filter((f:FinancialFact)=>f.scope===scope&&fields.includes(f.metric as any)&&Number.isFinite(f.value)&&f.currency&&f.source==='SEC');
 const newest=[...facts].sort((a,b)=>b.periodEnd.localeCompare(a.periodEnd)||b.filedAt.localeCompare(a.filedAt));
 const currency=newest.find(f=>f.metric==='revenue')?.currency??newest[0]?.currency;
 const groups=new Map<string,FinancialFact[]>();
 for(const f of facts.filter(f=>f.currency===currency)){const key=`${f.periodStart}|${f.periodEnd}|${f.basis}`;groups.set(key,[...(groups.get(key)??[]),f]);}
 return [...groups.values()].map(group=>{
  const sorted=[...group].sort((a,b)=>b.filedAt.localeCompare(a.filedAt)),anchor=sorted[0];
  const get=(metric:string)=>sorted.find(f=>f.metric===metric);
  const revenue=get('revenue'),income=get('netIncome'),operating=get('operatingIncome'),cfo=get('operatingCashFlow'),capex=get('capex');
  const fcf=cfo&&capex&&cfo.currency===capex.currency&&cfo.periodStart===capex.periodStart&&cfo.periodEnd===capex.periodEnd&&cfo.accession===capex.accession&&cfo.filedAt===capex.filedAt?cfo.value-Math.abs(capex.value):null;
  return{periodEnd:anchor.periodEnd,periodStart:anchor.periodStart,currency:anchor.currency!,basis:anchor.basis,filedAt:anchor.filedAt,sourceUrl:anchor.sourceUrl,revenue:revenue?.value??null,netIncome:income?.value??null,operatingIncome:operating?.value??null,operatingCashFlow:cfo?.value??null,capex:capex?.value??null,fcf,operatingMargin:revenue&&revenue.value>0&&operating?operating.value/revenue.value*100:null};
 }).sort((a,b)=>a.periodEnd.localeCompare(b.periodEnd)).slice(scope==='ANNUAL'?-6:-8);
}
export function periodGrowth(rows:FinancialPeriod[],key:'revenue'|'fcf'|'operatingCashFlow'){
 const current=rows.at(-1),previous=rows.at(-2),a=current?.[key],b=previous?.[key];
 const days=current&&previous?(Date.parse(current.periodEnd)-Date.parse(previous.periodEnd))/86400000:NaN;
 return a!=null&&b!=null&&b>0&&days>=330&&days<=400&&current?.currency===previous?.currency?(a/b-1)*100:null;
}
