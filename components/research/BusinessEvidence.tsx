"use client";
import {useId} from "react";
import {ArrowUpRight, ChevronRight} from "lucide-react";
import AssetLogo from "@/components/AssetLogo";
import MetricHelp from "@/components/MetricHelp";
import {buildBusinessEvidence, formatReportedAmount, researchSourceUrl} from "@/lib/research-evidence";

type Props={company?:any;analystFundamentals?:any;v4Analysis?:any;symbol:string;onNavigate?:(tab:"financials"|"risk"|"valuation")=>void};
type Metric=ReturnType<typeof buildBusinessEvidence>["metrics"][number];
type AnnualKey="revenue"|"operatingCashFlow";
type AnnualPoint={year:string;periodEnd:string;filedAt:string;currency:string;value:number;sourceUrl:string;basis:string};
const metricHelp:Record<string,{term:string;title?:string;body?:string}>={
  revenue:{term:"revenue"},netIncome:{term:"netIncome"},fcf:{term:"freeCashFlow"},
  opMargin:{term:"operatingMargin",title:"Operating margin",body:"Operating income divided by revenue for the same reporting period. It describes operating profitability before interest and tax. Compare matching accounting bases and read the source period."},
  leverage:{term:"liabilitiesToAssets",title:"Liabilities / assets",body:"Total liabilities divided by total assets at the reporting date. This broad balance-sheet ratio includes operating liabilities; it is not a debt-to-equity ratio or a standalone solvency verdict."},
};

export function ReportedMetricTile({metric,compact=false}:{metric:Metric;compact?:boolean}) {
  return <article className={`surfaceMetric ${compact?"surfaceMetricCompact":""}`}>
    <header><small>{metric.label}</small><MetricHelp {...metricHelp[metric.key]}/></header>
    <h3 className={metric.value!=null&&metric.value<0?"surfaceNegative":""}>{metric.display}</h3>
    <span className="surfaceMetricPeriod">{metric.periodEnd?`Period ended ${metric.periodEnd}`:"Reporting period unverified"}</span>
    {metric.value!=null&&metric.accountingBasis&&<small className="surfaceMetricBasis">{metric.accountingBasis}</small>}
    {metric.continuingDisplay&&<small className="surfaceMetricBasis">Continuing operations: {metric.continuingDisplay}</small>}
    {metric.valuationExcluded&&<small className="surfaceMetricCaution">Excluded from current-business valuation</small>}
    <details className="surfaceMetricSource"><summary>Source & basis</summary><div>{metric.filedAt&&<p>Filed {metric.filedAt}</p>}{metric.source?<p>{metric.sourceUrls.length?metric.sourceUrls.map((url,index)=><a key={url} href={url} target="_blank" rel="noreferrer">{index>0?" · ":""}{metric.source} source{metric.sourceUrls.length>1?` ${index+1}`:""} ↗</a>):`Source: ${metric.source}`}</p>:<p>No source reference was returned for this value.</p>}{metric.basis&&<p>{metric.basis}</p>}{metric.value==null&&<p>Not available in the current company record.</p>}</div></details>
  </article>;
}

/** Plot only dated, explicitly comparable annual facts; never bridge currencies or accounting bases. */
export function buildComparableAnnualSeries(company:any,key:AnnualKey):AnnualPoint[] {
  const history=Array.isArray(company?.fiveYearRecord?.history)?company.fiveYearRecord.history:[];
  const points:AnnualPoint[]=history.filter((row:any)=>row.comparable===true).flatMap((row:any)=>{
    const facts=Array.isArray(row.evidence)?row.evidence:[];
    const fact=facts.find((item:any)=>item.key===key);
    const sourceUrl=researchSourceUrl(fact?.sourceUrl);
    const value=row[key],currency=fact?.currency??row.currency;
    const start=fact?.periodStart??row.periodStart,end=fact?.periodEnd??row.periodEnd;
    const duration=(Date.parse(end)-Date.parse(start))/86400000+1;
    if(typeof value!=="number"||!Number.isFinite(value)||!sourceUrl||!fact?.source||fact.periodEnd!==row.periodEnd||fact.currency!==row.currency||!/^[A-Z]{3}$/.test(currency||"")||!Number.isFinite(duration)||duration<330||duration>400||fact?.scope&&fact.scope!=="ANNUAL"||fact?.value!==value)return [];
    const basis=key==="operatingCashFlow"?row.cashFlowBasis:fact.basis??"REPORTED";
    if(key==="operatingCashFlow"&&!['REPORTED','CONTINUING_OPERATIONS'].includes(basis))return [];
    return [{year:String(row.year??end.slice(0,4)),periodEnd:end,filedAt:fact.filedAt??row.filedAt??"Date unavailable",currency,value,sourceUrl,basis}];
  }).sort((a:AnnualPoint,b:AnnualPoint)=>a.periodEnd.localeCompare(b.periodEnd));
  const latest=points.at(-1);
  if(!latest)return [];
  const seen=new Set<string>();
  return points.filter(point=>point.currency===latest.currency&&point.basis===latest.basis&&!seen.has(point.periodEnd)&&Boolean(seen.add(point.periodEnd))).slice(-5);
}

function AnnualTrend({company,metric,label}:{company:any;metric:AnnualKey;label:string}) {
  const id=useId(),points=buildComparableAnnualSeries(company,metric);
  const max=Math.max(0,...points.map(point=>point.value)),min=Math.min(0,...points.map(point=>point.value));
  const spread=max-min||1,y=(value:number)=>20+(max-value)/spread*100,zero=y(0);
  const short=(value:number)=>new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:1}).format(value);
  return <article className="researchCard surfaceAnnualTrend"><header><h3>{label}</h3><MetricHelp term={metric}/></header>{points.length>=2?<>
    <p className="surfaceTrendCaption">Annual · {points[0].currency} · {points.length} comparable periods</p>
    <svg viewBox="0 0 340 158" role="img" aria-labelledby={id}><title id={id}>{`${label}: ${points.map(point=>`${point.year}: ${formatReportedAmount(point.value,point.currency)}`).join("; ")}`}</title>
      <line x1="46" x2="330" y1={zero} y2={zero} className="surfaceChartBaseline"/>
      {max!==0&&<text x="38" y="24" textAnchor="end">{short(max)}</text>}{min!==0&&<text x="38" y="124" textAnchor="end">{short(min)}</text>}<text x="38" y={zero+4} textAnchor="end">0</text>
      {points.map((point,index)=>{const slot=280/points.length,x=48+index*slot+slot*.2,width=slot*.6,height=Math.abs(y(point.value)-zero);return <g key={point.periodEnd}><rect x={x} y={Math.min(y(point.value),zero)} width={width} height={height} rx="3" className={point.value<0?"surfaceBarNegative":"surfaceBarPositive"}/>{point.value===0&&<line x1={x} x2={x+width} y1={zero} y2={zero} className="surfaceZeroBar"/>}<text x={x+width/2} y="147" textAnchor="middle">{point.year}</text></g>})}
    </svg><details className="surfaceMetricSource"><summary>Values & source filings</summary><dl>{points.map(point=><div key={point.periodEnd}><dt><a href={point.sourceUrl} target="_blank" rel="noreferrer">{point.year} ↗</a></dt><dd>{formatReportedAmount(point.value,point.currency)}</dd></div>)}</dl><p>{metric==="operatingCashFlow"?"Operating cash flow is before capital expenditure; it is not free cash flow.":"Only matching annual reporting currencies and accounting bases are compared."}</p></details>
  </>:<div className="surfaceTrendMissing"><strong>Comparable trend unavailable</strong><p>At least two sourced, comparable annual periods are needed.</p></div>}</article>;
}

export default function BusinessEvidence({company,analystFundamentals,v4Analysis,symbol,onNavigate}:Props) {
  const evidence=buildBusinessEvidence(company,analystFundamentals,v4Analysis);
  const available=evidence.metrics.filter(metric=>metric.value!=null);
  const observations=[...evidence.moat.drivers.map(reason=>({...reason,kind:"Advantage"})),...evidence.moat.threats.map(reason=>({...reason,kind:"Risk"}))];
  return <div className="researchTabBody researchBusinessEvidence researchBusinessPremium" data-auryn-section="thesis">
    <header className="surfaceBusinessHeading"><div><small>Business · Reported evidence</small><h2>Know the company</h2></div><div className="surfaceCompanyIdentity"><AssetLogo symbol={symbol} name={company?.name} logoUrl={company?.logo}/><span><b>{company?.name||symbol}</b><small>{symbol}</small></span></div></header>
    {available.length?<div className="surfaceBusinessMetrics">{available.map(metric=><ReportedMetricTile key={metric.key} metric={metric}/>)}</div>:<div className="surfaceInlineNote">Revenue, earnings and cash flow are unavailable in the current company record.</div>}
    <div className="surfaceTrends"><AnnualTrend company={company} metric="revenue" label="Revenue trend"/><AnnualTrend company={company} metric="operatingCashFlow" label="Operating cash flow trend"/></div>
    <article className="researchCard surfaceMoat"><header><div><h3>{evidence.moat.assessed?"Competitive moat evidence":"Moat unassessed"} <MetricHelp term="moat"/></h3><p>Dated observations behind a durable advantage.</p></div>{evidence.moat.score!=null&&<span className="surfaceModelBadge">{evidence.moat.score}/100 · source-backed model</span>}</header>
      {observations.length?<div className="surfaceMoatRows">{observations.map((reason,index)=><details key={`${reason.kind}-${index}`} className="surfaceMoatRow"><summary><span className={reason.kind==="Risk"?"surfaceRiskTag":"surfaceAdvantageTag"}>{reason.kind}</span><span>{reason.text}</span><ChevronRight size={17}/></summary><div className="surfaceMoatSources">{reason.sources.map((source,i)=><p key={i}>{source.url?<a href={source.url} target="_blank" rel="noreferrer">{source.source} · {source.date} ↗</a>:`${source.source} · ${source.date}`}</p>)}</div></details>)}</div>:<p>No dated, source-backed moat assessment is available. Financial consistency alone does not prove a competitive advantage.</p>}
    </article>
    <details className="researchCard surfaceDisclosure surfaceDurability"><summary>Financial durability <span>{evidence.durabilityScore!=null?`${evidence.durabilityScore}/100 · model score`:"Reported operating record"}</span></summary><div className="surfaceDisclosureBody">{evidence.history.length?<><p>{company?.fiveYearRecord?.summary||`${evidence.history.length} reported annual periods are available.`}</p><dl className="researchData"><div><dt>Positive net income</dt><dd>{evidence.profitYears||"Unavailable"}</dd></div><div><dt>Positive operating cash flow</dt><dd>{evidence.cashYears||"Unavailable"}</dd></div><div><dt>Annual comparability</dt><dd>{evidence.comparable?"Comparable reported periods":"Limited"}</dd></div></dl></>:<p>No annual financial history is available to assess durability.</p>}<p>Financial consistency does not prove pricing power, switching costs or a competitive moat.</p></div></details>
    <details className="researchCard surfaceDisclosure surfaceFinancialHistory"><summary>Financial history <span>Up to five reported years</span></summary><div className="surfaceDisclosureBody">{evidence.history.length?<><div className="researchTableWrap" tabIndex={0} role="region" aria-label="Annual financial history"><table><thead><tr><th scope="col">Period</th><th scope="col">Revenue</th><th scope="col">Net income</th><th scope="col">Operating cash flow</th></tr></thead><tbody>{evidence.history.map((row,index)=><tr key={`${row.year}-${index}`}><th scope="row">{row.sourceUrl?<a href={row.sourceUrl} target="_blank" rel="noreferrer">{row.year} ↗</a>:row.year}{row.periodEnd&&<small className="researchHistoryPeriod">Ended {row.periodEnd}</small>}{row.filedAt&&<small className="researchHistoryPeriod">Filed {row.filedAt}</small>}</th><td>{row.revenue}</td><td>{row.netIncome}{row.rawNetIncome!=null&&row.earningsBasis&&<small className="researchHistoryPeriod">{row.earningsBasis}</small>}</td><td>{row.operatingCashFlow}{row.rawOperatingCashFlow!=null&&row.cashFlowBasis&&<small className="researchHistoryPeriod">{row.cashFlowBasis}</small>}</td></tr>)}</tbody></table></div><p className="researchProvenance">Amounts retain the reported currency. Operating cash flow is before capital expenditure; it is not free cash flow.{!evidence.comparable?" Periods have comparability limitations; avoid inferring a growth trend from this table.":""}</p></>:<p>No annual financial history returned by the connected company source.</p>}</div></details>
    {evidence.warnings.length>0&&<details className="researchCard surfaceDisclosure researchDataLimits"><summary>Financial data limitations <span>{evidence.warnings.length} notes</span></summary><div className="surfaceDisclosureBody">{evidence.warnings.map((warning,index)=><p key={index}>{warning}</p>)}</div></details>}
    {onNavigate&&<div className="surfaceBusinessLinks"><button onClick={()=>onNavigate("financials")}>Source filings <ArrowUpRight size={17}/></button><button onClick={()=>onNavigate("valuation")}>Check valuation <ChevronRight size={17}/></button><button onClick={()=>onNavigate("risk")}>Review risks <ChevronRight size={17}/></button></div>}
  </div>;
}
