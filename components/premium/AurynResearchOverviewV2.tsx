"use client";
import {useRef, useState} from "react";
import {ArrowUpRight, Check, ChevronRight, Expand, Plus, Star} from "lucide-react";
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
  chartRange?:"1D"|"1W"|"1M"|"3M"|"6M"|"1Y"|"3Y"|"5Y"; chartLoading?:boolean; onChartRangeChange?:(range:any)=>void;
  onOpenCatalysts?:()=>void; onOpenRisks?:()=>void; onOpenDetails?:()=>void; onOpenThesis?:()=>void; onOpenValuation?:()=>void;
  onAddWatchlist?:()=>void; onTrackPosition?:()=>void; watching?:boolean;
  candles:any[]; longTermCandles?:any[]; chartLevels:any; scenario?:any; executionLevelsAllowed?:boolean; executionIntent?:string;
};
const num=(value:unknown):number|null=>value==null||value===""||typeof value==="boolean"||!Number.isFinite(Number(value))?null:Number(value);
const money=(value:unknown)=>num(value)==null?"—":formatMoney(Number(value));
const pretty=(value:unknown)=>String(value||"Unavailable").replaceAll("_"," ");
const scoreLabel=(score:number|null)=>score==null?"Unassessed":score>=75?"Strong":score>=60?"Constructive":score>=45?"Mixed":"Weak";
const tone=(score:number|null)=>score==null?"neutral":score>=65?"positive":score>=45?"caution":"negative";
const unique=(values:unknown[])=>[...new Set(values.filter((value):value is string=>typeof value==="string"&&Boolean(value.trim())).map(value=>value.trim()))];
const stamp=(value:unknown)=>typeof value==="string"&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",timeZone:"UTC",timeZoneName:"short"}):"Timestamp unavailable";

export default function AurynResearchOverviewV2({symbol="Research", company, valuationEvidence, structureCandles=[], structureLoading=false, structureError="", onOpenTechnicals, decision, marketTruth, displayPrice, analystFundamentals, entryQuality, chartRange="3M", chartLoading=false, onChartRangeChange, onOpenCatalysts, onOpenRisks, onOpenThesis, onOpenValuation, onAddWatchlist, onTrackPosition, watching=false, candles=[], chartLevels, scenario, executionLevelsAllowed=false, executionIntent="WATCH"}:Props) {
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
  return <section className="researchOverview researchOverviewPremium">
    <article className="researchCard researchChart surfaceChart">
      <header><div><small>Market history</small><h2>Price chart <MetricHelp term="price"/></h2></div><div className="surfaceChartActions">
        <button type="button" aria-label={watching?"Investment is on your watchlist":"Add investment to watchlist"} aria-pressed={watching} onClick={onAddWatchlist}>{watching?<Check size={17}/>:<Star size={17}/>}<span>{watching?"Watching":"Watch"}</span></button>
        <button type="button" className="surfacePrimary" onClick={onTrackPosition}><Plus size={17}/><span>Track position</span></button>
        <button type="button" aria-label="Expand price chart" onClick={()=>chartDialog.current?.showModal()}><Expand size={18}/></button>
      </div></header>
      <div className="surfaceChartControls"><div className="researchRanges" aria-label="Chart period">{["1D","1W","1M","3M","6M","1Y","3Y","5Y"].map(range=><button type="button" aria-pressed={chartRange===range} onClick={()=>onChartRangeChange?.(range)} key={range}>{range}</button>)}</div><label className="surfaceIndicator">Indicators<select aria-label="Chart indicators" value={showMovingAverages?"moving":"none"} onChange={event=>setShowMovingAverages(event.target.value==="moving")}><option value="none">Price & volume</option><option value="moving">20 / 50 bar averages</option></select></label></div>
      <div className="researchChartStage" aria-busy={chartLoading}>{candles.length?<PriceChart candles={candles} levels={visibleChartLevels} showTrend={showMovingAverages}/>:<div className="researchEmpty">Price history is unavailable. No synthetic prices are displayed.</div>}{chartLoading&&<span className="researchChartLoading" role="status">Updating history…</span>}</div>
      <footer className="surfaceChartFoot"><span>{chartRange} view · {candles.length?`${candles.length} observations`:"Awaiting history"}</span>{onOpenTechnicals&&<button type="button" onClick={onOpenTechnicals}>Fib & weekly <ArrowUpRight size={15}/></button>}</footer>
      <dialog ref={chartDialog} className="researchExpandedDialog" aria-label="Expanded price chart"><header><h2>{symbol} · {chartRange}</h2><form method="dialog"><button aria-label="Close expanded chart">Close</button></form></header><div className="researchExpandedChart"><PriceChart candles={candles} levels={visibleChartLevels} showTrend={showMovingAverages}/></div></dialog>
    </article>

    <div className="surfaceLenses" aria-label="Three investment lenses">{lenses.map(lens=><article className={`surfaceLens ${lens.tone}`} key={lens.key}><div className="surfaceLensLabel"><i aria-hidden="true"/><span>{lens.label}</span><MetricHelp term={lens.key}/></div><button type="button" onClick={lens.open} disabled={!lens.open}><span><strong>{lens.value}</strong><small>{lens.detail}</small></span><ChevronRight size={18}/></button></article>)}</div>

    {facts.length>0?<section className="surfaceFactStrip" aria-label="Reported business facts">{facts.map(metric=><ReportedMetricTile key={metric.key} metric={metric} compact/>)}</section>:<div className="surfaceInlineNote">Reported business facts are unavailable for this security.{onOpenThesis&&<button onClick={onOpenThesis}>Review evidence <ChevronRight size={16}/></button>}</div>}

    <article className="researchCard surfaceAnalystSummary">
      <header><div><small>Canonical analyst view</small><h2>Your investment lens</h2></div><span className="surfaceConfidence">{num(decision.confidenceScore)==null?"Unscored":`${decision.confidenceScore}/100 model confidence`}<MetricHelp term="confidence" title="Model confidence" body="Model confidence measures evidence quality, not a probability of profit. It does not override the independent actions for new money, existing positions or the multi-year horizon."/></span></header>
      <div className="surfaceActionHorizons">{[["New money · today",decision.newMoneyAction,actions.newMoney],["Existing position",decision.ownerAction,actions.owner],["Multi-year outlook",decision.longTermAction,actions.longTerm]].map(([label,action,meaning])=><div key={label}><small>{label}</small><strong className={/AVOID|EXIT|REDUCE|UNATTRACTIVE/.test(action)?"surfaceCaution":""}>{pretty(action)}</strong><p>{meaning}</p></div>)}</div>
      <div className="surfaceSummaryFoot"><p>Business quality, value and entry timing remain independent.</p>{onOpenValuation&&<button type="button" onClick={onOpenValuation}>Open valuation <ArrowUpRight size={16}/></button>}</div>
      <details className="surfaceDisclosure"><summary>Why this decision?</summary><div className="surfaceDisclosureBody"><p>{decision.pillars.business.why}</p><p className="researchConfidenceNote">Model confidence measures evidence quality, not a probability of profit.</p><dl className="researchData"><div><dt>Evidence coverage</dt><dd>{num(decision.evidenceCompleteness)==null?"—":`${decision.evidenceCompleteness}/100`}</dd></div>{dimensionRows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{num(value)==null?"Unassessed":`${Math.round(Number(value))}/100 · model`}</dd></div>)}</dl><p><b>Market setup: {setup.title}.</b> {setup.meaning} {setup.actionImplication}</p>{executionLevelsAllowed?<><p><b>What upgrades it:</b> {decision.nextDecisionTrigger||"A new canonical evidence review is required."}</p><p><b>What changes the case:</b> {decision.invalidationTrigger||"Reassess on verified operating deterioration or a change in valuation evidence."}</p></>:<p>Price-sensitive decision triggers are withheld until canonical verification is restored.</p>}{pattern&&<p><b>Pattern evidence: {pattern.title}.</b> {pattern.meaning} {compatibleScenario.waveContext?.note}</p>}</div></details>
    </article>

    <div className="surfaceHighlightGrid">{[{label:"What supports the case?",items:supporting,open:onOpenCatalysts,empty:"No canonical supporting evidence loaded.",tone:"positive"},{label:"What could change?",items:risks,open:onOpenRisks,empty:"No counter-evidence loaded; absence of evidence is not absence of risk.",tone:"caution"}].map(group=><article className={`researchCard surfaceHighlight ${group.tone}`} key={group.label}><header><h3>{group.label}</h3>{group.open&&<button type="button" aria-label={`Open ${group.label}`} onClick={group.open}><ChevronRight size={18}/></button>}</header><p>{group.items[0]||group.empty}</p>{group.items.length>1&&<details className="surfaceDisclosure"><summary>{group.items.length-1} more observations</summary><ul>{group.items.slice(1).map(item=><li key={item}>{item}</li>)}</ul></details>}</article>)}</div>

    <details className="researchCard surfaceDisclosure surfaceExecution"><summary>Execution plan <span>{executionLevelsAllowed?entryLabel:"Execution levels unavailable"}</span></summary><div className="surfaceDisclosureBody"><p>{!executionLevelsAllowed?"Execution levels unavailable until price and canonical trust are verified.":!permitsEntry?"No new entry or averaging while the canonical plan calls for reducing or exiting exposure.":executionIntent==="WATCH"?"Structural watch levels are context only; they do not authorize an active entry or averaging.":"Use these levels only within the canonical execution plan."}</p>{executionLevelsAllowed&&<div className="researchChartLevels">{executionRows.filter(([,value])=>value!=null).map(([label,value])=><div key={label}><small>{label}</small><strong>{money(value)}</strong></div>)}</div>}<p>Setup invalidation is a tactical risk level. Business thesis failure requires fundamental evidence.</p></div></details>
    <details className="researchCard surfaceDisclosure"><summary>Valuation inputs & source context <span>{pretty(valuationState)}</span></summary><div className="surfaceDisclosureBody"><p>Selected method: {pretty(valuationMethod)}.</p>{fair==null&&<><h3>Valuation inputs needed</h3>{missingInputs.length?<ul>{missingInputs.map(item=><li key={item}>{item}</li>)}</ul>:<p>Source-backed assumptions and validation of the selected method.</p>}<p>Reloading prices alone cannot complete a fundamental valuation.</p></>}{valuationEvidence?.fcfYieldPct!=null&&<p>Annual FCF yield: <b>{valuationEvidence.fcfYieldPct.toFixed(1)}%</b> <MetricHelp term="fcfYield"/>{valuationEvidence.fcfYieldBasis}</p>}{valuationEvidence?.periodEnd&&<p>Cash-flow period ended {valuationEvidence.periodEnd}. Filed {valuationEvidence.filedAt||"date unavailable"}.{valuationEvidence.sourceUrl&&<> <a href={valuationEvidence.sourceUrl} target="_blank" rel="noreferrer">Source filing ↗</a></>}</p>}{onOpenValuation&&<button onClick={onOpenValuation}>Review valuation assumptions <ArrowUpRight size={16}/></button>}</div></details>
    <details className="researchCard researchRoadmap surfaceDisclosure" onToggle={event=>setWeeklyOpen(event.currentTarget.open)}><summary>Weekly structure & supporting evidence</summary>{weeklyOpen&&<WeeklyStructure key={symbol} symbol={symbol} bars={structureCandles} loading={structureLoading} error={structureError}/>}</details>
    {onOpenThesis&&<button type="button" className="surfaceEvidenceLink" onClick={onOpenThesis}>Open business evidence <ChevronRight size={18}/></button>}
    <footer className="researchProvenance">Research snapshot: {stamp(marketTruth?.decisionPriceAsOf)} · Canonical actions preserved across horizons.</footer>
  </section>;
}
