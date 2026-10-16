"use client";
import {useRef, useState} from "react";
import {AlertTriangle,ArrowUpRight, Check, ChevronRight, Expand, Plus, Star} from "lucide-react";
import {financialSeries,periodGrowth} from "@/lib/research-financial-series";
import {Sparkline} from "@/components/research/FinancialTrends";
import PriceChart from "@/components/PriceChart";
import MetricHelp from "@/components/MetricHelp";
import WeeklyStructure from "@/components/research/WeeklyStructure";
import {ReportedMetricTile} from "@/components/research/BusinessEvidence";
import {buildBusinessEvidence, explainResearchActions} from "@/lib/research-evidence";
import {formatMoney} from "@/lib/nivora-format";
import {describeSetupState} from "@/lib/auryn/v934/setup-explanations";
import type {InstitutionalDecision} from "@/lib/auryn/v931/domain";
import type {ValuationEvidence} from "@/lib/research-valuation-workbench";

type Props = {
  symbol?:string; company?:any; valuationEvidence?:ValuationEvidence|null;
  structureCandles?:any[]; structureLoading?:boolean; structureError?:string; onOpenTechnicals?:()=>void;
  decision:InstitutionalDecision; marketTruth:any; displayPrice?:number|null; displayPriceLive?:boolean;
  marketIntelligence?:any; fundamentalScenario?:any; analystFundamentals?:any; technicalEvidence?:any; entryQuality?:number|null;
  chartRange?:"1D"|"1W"|"1M"|"3M"|"6M"|"1Y"|"3Y"|"5Y"; chartLoading?:boolean; chartError?:string; chartCoverage?:string; onRetryChart?:()=>void; onChartRangeChange?:(range:any)=>void;
  onOpenCatalysts?:()=>void; onOpenRisks?:()=>void; onOpenDetails?:()=>void; onOpenThesis?:()=>void; onOpenValuation?:()=>void;
  onBuildPlan?:()=>void; onAddWatchlist?:()=>void; onTrackPosition?:()=>void; watching?:boolean;
  candles:any[]; longTermCandles?:any[]; chartLevels:any; scenario?:any; executionLevelsAllowed?:boolean; executionIntent?:string;
};
const num=(value:unknown):number|null=>value==null||value===""||typeof value==="boolean"||!Number.isFinite(Number(value))?null:Number(value);
const money=(value:unknown)=>num(value)==null?"—":formatMoney(Number(value));
const pretty=(value:unknown)=>String(value||"Unavailable").replaceAll("_"," ");
const scoreLabel=(score:number|null)=>score==null?"Unassessed":score>=75?"Strong":score>=60?"Constructive":score>=45?"Mixed":"Weak";
const tone=(score:number|null)=>score==null?"neutral":score>=65?"positive":score>=45?"caution":"negative";
const unique=(values:unknown[])=>[...new Set(values.filter((value):value is string=>typeof value==="string"&&Boolean(value.trim())).map(value=>value.trim()))];
const stamp=(value:unknown)=>typeof value==="string"&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",timeZone:"UTC",timeZoneName:"short"}):"Timestamp unavailable";

export default function AurynResearchOverviewV2({symbol="Research", company, valuationEvidence, structureCandles=[], structureLoading=false, structureError="", onOpenTechnicals, decision, marketTruth, displayPrice, analystFundamentals, entryQuality, chartRange="3M", chartLoading=false, chartError="", chartCoverage="", onRetryChart, onChartRangeChange, onOpenCatalysts, onOpenRisks, onOpenThesis, onOpenValuation, onBuildPlan, onAddWatchlist, onTrackPosition, watching=false, candles=[], chartLevels, scenario, executionLevelsAllowed=false, executionIntent="WATCH"}:Props) {
  const chartDialog=useRef<HTMLDialogElement>(null);
  const [showMovingAverages,setShowMovingAverages]=useState(false);
  const [weeklyOpen,setWeeklyOpen]=useState(false);
  const business=num(decision.pillars.business.score),timing=num(entryQuality??decision.pillars.marketStructure.score);
  const fair=num(analystFundamentals?.fairValue),margin=num(analystFundamentals?.marginOfSafety);
  const valuationState=analystFundamentals?.valuationState||"UNAVAILABLE";
  const valuationMethod=analystFundamentals?.method||"UNAVAILABLE";
  const permitsEntry=executionIntent==="ACCUMULATE"||executionIntent==="WATCH";
  const entryLabel=executionIntent==="ACCUMULATE"?"Entry":executionIntent==="WATCH"?"Watch zone":"No new entry";
  const visibleChartLevels=executionLevelsAllowed&&chartLevels?{...chartLevels,entryLabel,...(!permitsEntry?{entryLow:null,entryHigh:null,preferredEntry:null,confirm:null,breakout:null,target1:null,target2:null,t1:null,t2:null}:{})}:null;
  const levels=visibleChartLevels||{};
  const executionRows=[[entryLabel,num(levels.entryLow??levels.preferredEntry)],["Confirm",num(levels.confirm??levels.breakout)],["Target 1",num(levels.t1??levels.target1)],["SETUP INVALIDATION",num(levels.invalidation)]] as const;
  const actions=explainResearchActions(decision);
  const setup=describeSetupState({setup:decision.setupState,newMoneyAction:decision.newMoneyAction,confirm:null,invalidation:null});
  const compatibleScenario=scenario?.snapshotId&&scenario.snapshotId===marketTruth?.snapshotId?scenario:null;
  const pattern=compatibleScenario?describeSetupState({setup:String(compatibleScenario.setup||"UNKNOWN").replaceAll(" ","_"),newMoneyAction:decision.newMoneyAction,confirm:null,invalidation:null}):null;
  const facts=buildBusinessEvidence(company,analystFundamentals,null).metrics.filter(metric=>metric.value!=null).slice(0,4);
  const supporting=unique([decision.pillars.catalystsRegime?.why,...(decision.drivers||[])]);
  const risks=unique([...(decision.counterEvidence||[]),...(decision.hardVetoReasons||[])]);
  const missingInputs=unique([...(analystFundamentals?.missingMethodInputs||[]),...(num(analystFundamentals?.independentCrossChecks)==null||Number(analystFundamentals.independentCrossChecks)<1?["A source-backed historical or peer cross-check"]:[])]);
  const dimensions=analystFundamentals?.companyDimensions||{};
  const dimensionRows=[["Growth",dimensions.growth],["Profitability",dimensions.profitability],["Cash generation",dimensions.cashGeneration],["Financial durability",dimensions.durability],["Balance sheet",dimensions.balanceSheet],["Forward evidence",dimensions.forwardEvidence]];
  const lenses=[
    {key:"business",label:"Business",value:scoreLabel(business),tone:tone(business),detail:business==null?"Evidence incomplete":`${business}/100 · model score`,open:onOpenThesis},
    {key:"valuation",label:"Valuation",value:fair==null?"Review inputs":money(fair),tone:fair==null?"caution":"neutral",detail:fair==null?"Fair value not verified":margin==null?"Canonical fair-value estimate":`${margin.toFixed(1)}% margin of safety`,open:onOpenValuation},
    {key:"timing",label:"Timing",value:scoreLabel(timing),tone:tone(timing),detail:executionLevelsAllowed?entryLabel:"Verification required",open:onOpenTechnicals},
  ];
  const financialHistory=financialSeries(company,'ANNUAL'),growth=periodGrowth(financialHistory,'revenue'),last=financialHistory.at(-1);
  const headline=business==null?'Understand the business before acting.':business>=60?(timing!=null&&timing>=60?'Business and timing look constructive.':'Constructive business. Entry needs patience.'):business<45?'Business risks need a closer look.':'The evidence is mixed. Be selective.';
  const observationRows=[{label:'Revenue',value:growth!=null?`${growth>=0?'+':''}${growth.toFixed(1)}% YoY`:facts.find(f=>f.key==='revenue')?.display??'Not available',values:financialHistory.map(r=>r.revenue)}, {label:'Free cash flow',value:last?.fcf!=null?new Intl.NumberFormat('en-US',{style:'currency',currency:last.currency,notation:'compact',maximumFractionDigits:1}).format(last.fcf):facts.find(f=>f.key==='fcf')?.display??'Not available',values:financialHistory.map(r=>r.fcf)}];
  const mainRisk=risks.find(x=>!/^([A-Z_]+)$/.test(x))||company?.fundamentalSignal?.riskReasons?.[0]||'Review funding, valuation and company-specific risks.';
  return <section className="researchOverview researchOverviewPremium clearOverview">
    <header className="clearOverviewHeading" aria-label="Canonical analyst view"><h2>{headline}</h2><div className="clearLenses" aria-label="Three investment lenses">{lenses.map(lens=><button type="button" key={lens.key} onClick={lens.open} className={lens.tone}><span>{lens.label}</span><strong>{lens.value}</strong></button>)}</div></header>
    <article className="clearPriceChart">
      <div className={`researchChartStage ${candles.length?'':'chartWithoutData'}`} aria-busy={chartLoading}><PriceChart rangeKey={chartRange} candles={candles} levels={visibleChartLevels} showTrend={showMovingAverages}/>{!candles.length&&<div className="researchEmpty researchChartEmpty" role="status"><strong>{chartLoading?'Loading market history…':'History unavailable'}</strong>{!chartLoading&&<><p>{chartError||'This time range is not available from the current feed.'}</p>{onRetryChart&&<button onClick={onRetryChart}>Retry</button>}</>}</div>}{chartLoading&&<span className="researchChartLoading" role="status">Updating…</span>}</div>
      <div className="clearChartControls"><div className="researchRanges" aria-label="Chart period">{['1D','1W','1M','3M','1Y','5Y'].map(range=><button type="button" aria-pressed={chartRange===range} onClick={()=>onChartRangeChange?.(range)} key={range}>{range}</button>)}</div><button className="clearExpand" aria-label="Expand chart" onClick={()=>chartDialog.current?.showModal()}><Expand size={17}/></button></div>
      <div className="clearChartMeta"><span>{chartCoverage||'Completed price observations'}</span><button onClick={onOpenTechnicals}>Levels & studies <ChevronRight size={14}/></button></div>
      <dialog ref={chartDialog} className="researchExpandedDialog" aria-label="Expanded price chart"><header><h2>{symbol} · {chartRange}</h2><form method="dialog"><button aria-label="Close expanded chart">Close</button></form></header><div className="researchExpandedChart"><PriceChart rangeKey={chartRange} candles={candles} levels={visibleChartLevels} showTrend={showMovingAverages}/></div><label><input type="checkbox" checked={showMovingAverages} onChange={e=>setShowMovingAverages(e.target.checked)}/>20 / 50 bar averages</label></dialog>
    </article>
    <div className="clearOverviewFacts">{observationRows.map(row=><button key={row.label} onClick={onOpenThesis}><span className="clearFactIcon"><ArrowUpRight size={19}/></span><span><small>{row.label}</small><strong>{row.value}</strong></span><Sparkline values={row.values}/><ChevronRight size={16}/></button>)}</div>
    <button type="button" className="clearRiskNote" onClick={onOpenRisks}><AlertTriangle size={18}/><span><b>Risk:</b> {mainRisk}</span><ChevronRight size={15}/></button>
    <div className="clearPrimaryActions"><button type="button" className="clearPrimary" onClick={onBuildPlan??onTrackPosition}>Build a plan</button><button type="button" onClick={onOpenThesis}>View evidence</button><button type="button" className="clearWatch" aria-label={watching?'On your watchlist':'Add to watchlist'} aria-pressed={watching} onClick={onAddWatchlist}>{watching?<Check size={18}/>:<Star size={18}/>}</button></div>
    <details className="clearDisclosure surfaceDisclosure"><summary>Why this decision · horizons & evidence</summary><div className="clearDecisionRows">{[['New money · today',decision.newMoneyAction,actions.newMoney],['Existing position',decision.ownerAction,actions.owner],['Multi-year outlook',decision.longTermAction,actions.longTerm]].map(([label,action,meaning])=><div key={label}><small>{label}</small><strong>{pretty(action)}</strong><p>{meaning}</p></div>)}</div><p>{decision.pillars.business.why}</p><p><b>Next trigger:</b> {decision.nextDecisionTrigger||'A new company evidence review.'}</p><p>{num(decision.confidenceScore)==null?'Model confidence unavailable':`${decision.confidenceScore}/100 model confidence`} · evidence quality, not a probability of profit. Evidence coverage: {num(decision.evidenceCompleteness)==null?'Unavailable':`${decision.evidenceCompleteness}/100`}.</p><p><b>Market setup:</b> {setup.meaning}</p><p><b>Thesis review trigger:</b> {decision.invalidationTrigger||'Review new operating evidence.'}</p>{pattern&&<p><b>Pattern evidence:</b> {pattern.meaning}</p>}<dl className="researchData">{dimensionRows.filter(([,value])=>num(value)!=null).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{num(value)}/100 · model score</dd></div>)}</dl>{fair==null&&<details className="clearDisclosure"><summary>Valuation inputs needed</summary><ul>{missingInputs.map(input=><li key={input}>{input}</li>)}</ul><button onClick={onOpenValuation}>Open valuation</button></details>}<button onClick={onTrackPosition}>Track a position</button></details>
    <details className="clearDisclosure"><summary>Technical execution levels</summary><p>{executionLevelsAllowed?'Tactical levels describe the price setup. Company thesis risks are reviewed separately.':'Execution levels unavailable. Verified price and matching evidence are required.'}</p>{!permitsEntry&&<p>No new entry · the current action is {pretty(executionIntent)}.</p>}{executionLevelsAllowed&&<div className="researchChartLevels">{executionRows.filter(([,value])=>value!=null).map(([label,value])=><div key={label}><small>{label}</small><strong>{money(value)}</strong></div>)}</div>}</details>
    <footer className="researchProvenance">Evidence as of {stamp(marketTruth?.decisionPriceAsOf)} · <button onClick={onOpenValuation}>Review valuation assumptions</button></footer>
  </section>;
}
