"use client";
import {useState,useRef} from "react";
import PriceChart from "@/components/PriceChart";
import {formatMoney} from "@/lib/nivora-format";
import type {InstitutionalDecision} from "@/lib/auryn/v931/domain";
import {buildLongTermRoadmap} from "@/lib/auryn/v99925/long-term-roadmap";
import {buildInvestmentNarrative} from "@/lib/auryn/v99925/investment-narrative";
import {buildCioDecision} from "@/lib/auryn/v99929/cio-decision";
import {describeSetupState} from "@/lib/auryn/v934/setup-explanations";
import {validateRegimeStructure} from "@/lib/auryn/v99930/regime-structure";

const num=(x:any)=>x==null||x===""?null:Number.isFinite(Number(x))?Number(x):null;
const money=(x:any)=>num(x)==null?"—":formatMoney(Number(x));
const pretty=(x:any)=>String(x||"—").replaceAll("_"," ");
const band=(x:number|null)=>x==null?"BUILDING":x>=75?"STRONG":x>=60?"CONSTRUCTIVE":x>=45?"MIXED":"WEAK";
const companyBand=(x:number|null)=>x==null?"BUILDING":x>=85?"ELITE COMPOUNDER":x>=72?"HIGH QUALITY":x>=58?"SOLID":x>=43?"MIXED":"CHALLENGED";
const valueBand=(x:number|null)=>x==null?"BUILDING":x>=75?"ATTRACTIVE":x>=60?"REASONABLE":x>=45?"FAIR / RICH":"EXPENSIVE";
const clusterMapNodes=(nodes:any[],threshold=.012)=>{
 const familyFor=(label:string,tone:string)=>/Current|Reference|Entry/.test(label)?"entry":/Thesis|Support/.test(label)?"risk":/Confirm/.test(label)?"confirm":/Target/.test(label)?"target":tone;
 const valid=nodes.filter(([,x])=>num(x)!=null).sort((a,b)=>Number(a[1])-Number(b[1])),out:any[]=[];
 for(const node of valid){const prev=out.at(-1),pv=prev?Number(prev.value):null,nv=Number(node[1]),family=familyFor(node[0],node[2]);const sameSemanticFamily=prev&&prev.family===family;if(sameSemanticFamily&&pv&&Math.abs(nv-pv)/pv<=threshold){prev.labels.push(node[0]);prev.value=(prev.value+nv)/2;}else out.push({labels:[node[0]],value:nv,tone:node[2],family});}
 return out;
};
const buildConfluenceZones=(r:any,current:number|null)=>{
 const near=(a:any,b:any,p=.035)=>num(a)!=null&&num(b)!=null&&Math.abs(Number(a)-Number(b))/Math.max(1,Number(b))<=p;
 const supportEvidence=[["Fib .618",r?.fib618],["50-WMA",r?.wma50],["200-WMA",r?.wma200],["Weekly HMA",r?.weeklyHma],["Structural support",r?.support]].filter(([,x])=>num(x)!=null);
 const activeCandidates=supportEvidence.filter(([,x])=>current!=null&&near(x,current,.12)).sort((a,b)=>Math.abs(Number(a[1])-Number(current))-Math.abs(Number(b[1])-Number(current)));
 const activeSupport=activeCandidates.length?Number(activeCandidates[0][1]):null;
 const deepAnchor=num(r?.fib618)??num(r?.entryLow);
 const deepEvidence=supportEvidence.filter(([,x])=>deepAnchor!=null&&near(x,deepAnchor,.08));
 const deepVals=deepEvidence.map(([,x])=>Number(x)),deepLo=deepVals.length?Math.min(...deepVals):deepAnchor,deepHi=deepVals.length?Math.max(...deepVals):deepAnchor;
 const deepDistance=current!=null&&deepHi!=null?(current-deepHi)/current:null;
 const reclaimVals=[r?.fib50,r?.confirm,r?.wma50,r?.weeklyHma].map(num).filter((x):x is number=>x!=null);
 const pivot=reclaimVals.length?Math.max(...reclaimVals):null;
 const pivotLabel=current!=null&&pivot!=null&&current>=pivot?"HOLD ABOVE":"FUTURE RECLAIM";
 const zones:any[]=[
  {key:"risk",label:"LONG-TERM STRUCTURAL FAILURE",value:r?.invalidation,tone:"risk",detail:"Weekly-cycle invalidation · separate from today's setup"},
  {key:"active",label:"ACTIVE WEEKLY SUPPORT",value:activeSupport,tone:"entry",detail:activeSupport==null?"No nearby weekly support cluster":`${activeCandidates[0]?.[0]||"Weekly structure"} · relevant now`},
 ];
 if(deepAnchor!=null&&deepDistance!=null&&deepDistance>.15)zones.push({key:"deep",label:"DEEP CYCLE SUPPORT",value:deepLo!=null&&deepHi!=null?`${money(deepLo)} – ${money(deepHi)}`:money(deepAnchor),tone:"deep",detail:`${deepEvidence.length||1} structural confirmations · not today's buy zone`});
 zones.push(
  {key:"current",label:"CURRENT POSITION",value:money(current),tone:"current",detail:r?.trendChannel?`${pretty(r.trendChannel)} weekly channel`:"Current weekly position"},
  {key:"pivot",label:pivotLabel,value:money(pivot),tone:"confirm",detail:current!=null&&pivot!=null&&current>=pivot?"Former resistance now acts as a hold-above reference":"Fib / WMA / HMA trend confirmation"},
  {key:"upside",label:"UPSIDE SEQUENCE",value:(()=>{const upsideValues=[r?.priorHigh,r?.extension1272,r?.extension1618].map(num).filter((x):x is number=>x!=null);return upsideValues.length?upsideValues.map(money).join(" → "):"Building"})(),tone:"target",detail:r?.extension1272!=null&&r?.extension1618!=null?"Prior high → 1.272 → 1.618 · conditional sequence":"Prior high shown; extensions publish only after regime validation"}
 );
 return zones;
};
const helpCopy:any={
 business:"Business quality blends growth, profitability, cash generation, balance-sheet resilience, durability/moat and forward evidence. Missing evidence stays missing rather than becoming zero.",
 valuation:"Valuation uses the business-model-appropriate fundamental method, FCF yield and source-backed historical/peer cross-checks when available. Technical targets never become fair value.",
 longTerm:"Long-term structure uses independent 5-year history aggregated to weekly bars. Basis: Fib retracement from validated swing extremes; WMA / HMA trend; volume participation and accumulation; structural support/resistance; consolidation; trend channel and invalidation.",
 timing:"Market timing is the shorter-horizon execution layer: trend, momentum, participation, relative strength, volatility and the canonical Entry / Confirm / Target map."
};
const pos=(value:number|null,all:Array<number|null>)=>{if(value==null)return 50;const a=all.filter((v):v is number=>v!=null&&Number.isFinite(v));if(a.length<2)return 50;const lo=Math.min(...a),hi=Math.max(...a);return hi===lo?50:5+(value-lo)/(hi-lo)*90};

export default function AurynResearchOverviewV2({decision,marketTruth,displayPrice,displayPriceLive=false,marketIntelligence=null,fundamentalScenario=null,analystFundamentals=null,technicalEvidence=null,entryQuality=null,chartRange="3M",chartLoading=false,onChartRangeChange,onOpenCatalysts,onOpenRisks,onOpenDetails,onOpenThesis,onOpenValuation,onAddWatchlist,onTrackPosition,watching=false,candles=[],longTermCandles=[],chartLevels=null,scenario=null,executionLevelsAllowed=false,executionIntent="WATCH"}:{decision:InstitutionalDecision;marketTruth:any;displayPrice?:number|null;displayPriceLive?:boolean;marketIntelligence?:any;fundamentalScenario?:any;analystFundamentals?:any;technicalEvidence?:any;entryQuality?:number|null;chartRange?:"1D"|"1W"|"1M"|"3M"|"6M"|"1Y"|"3Y"|"5Y";chartLoading?:boolean;onChartRangeChange?:(x:any)=>void;onOpenCatalysts?:()=>void;onOpenRisks?:()=>void;onOpenDetails?:()=>void;onOpenThesis?:()=>void;onOpenValuation?:()=>void;onAddWatchlist?:()=>void;onTrackPosition?:()=>void;watching?:boolean;candles:any[];longTermCandles?:any[];chartLevels:any;scenario?:any;executionLevelsAllowed?:boolean;executionIntent?:string}){
 const chartDialog=useRef<HTMLDialogElement>(null);const [showMovingAverages,setShowMovingAverages]=useState(false);
 const current=num(displayPrice??marketTruth?.price), business=num(decision.pillars.business.score), valuation=analystFundamentals?num(analystFundamentals.valuationScore):num(decision.pillars.valuation.score), timing=num(entryQuality??decision.pillars.marketStructure.score);
 const longTerm:any=buildLongTermRoadmap(longTermCandles,current);
 const [activeHelp,setActiveHelp]=useState<string|null>(null);
 const [cioOpen,setCioOpen]=useState<"why"|"changes"|null>(null);
 const [helpAnchor,setHelpAnchor]=useState<string|null>(null);
 const dims=analystFundamentals?.companyDimensions||{}, relative=analystFundamentals?.relativeContext||{}, valuationState=analystFundamentals?.valuationState||"UNAVAILABLE", valuationMethod=analystFundamentals?.method||"BUILDING", margin=num(analystFundamentals?.marginOfSafety), fair=num(analystFundamentals?.fairValue);
 const permitsEntry=executionIntent==="ACCUMULATE"||executionIntent==="WATCH";
 const entryLabel=executionIntent==="ACCUMULATE"?"Entry":executionIntent==="WATCH"?"Watch zone":"No new entry";
 const visibleChartLevels=executionLevelsAllowed&&chartLevels?{...chartLevels,entryLabel,...(!permitsEntry?{entryLow:null,entryHigh:null,preferredEntry:null,confirm:null,breakout:null,target1:null,target2:null,t1:null,t2:null}:{})}:null;
 const levels=visibleChartLevels||{}, thesis=num(levels.invalidation), support=num(levels.majorSupport??levels.support), eLow=num(levels.entryLow??levels.preferredEntry), eHigh=num(levels.entryHigh??levels.preferredEntry), confirm=num(levels.confirm??levels.breakout), t1=num(levels.t1??levels.target1), t2=num(levels.t2??levels.target2);
 const setupExplanation=describeSetupState({setup:decision.setupState,newMoneyAction:decision.newMoneyAction,confirm:null,invalidation:null});
 const compatibleScenario=scenario?.snapshotId&&scenario.snapshotId===marketTruth?.snapshotId?scenario:null;
 const patternExplanation=compatibleScenario?describeSetupState({setup:String(compatibleScenario.setup||"UNKNOWN").replaceAll(" ","_"),newMoneyAction:decision.newMoneyAction,confirm:null,invalidation:null}):null;
 const regimeTruth:any=validateRegimeStructure(longTerm,current);
 const structuralTruthValid=regimeTruth.state==="VALID";
 const activeLongTerm:any=structuralTruthValid?regimeTruth.activeRegime:null;
 const roadmapLongTerm:any=activeLongTerm&&!regimeTruth.extensionsAllowed?{...activeLongTerm,extension1272:null,extension1618:null}:activeLongTerm;
 const historicalContext=regimeTruth.historicalContext;
 const longTermScore=structuralTruthValid?num(activeLongTerm?.score):null;
 const confluenceZones=structuralTruthValid?buildConfluenceZones(roadmapLongTerm,current):[];
 const narrative=buildInvestmentNarrative({businessScore:business,trajectory:analystFundamentals?.trajectory,valuationState:analystFundamentals?.valuationState,fairValue:analystFundamentals?.fairValue,marginOfSafety:analystFundamentals?.marginOfSafety,roadmap:executionLevelsAllowed?roadmapLongTerm:null,timingState:band(timing),activeEntry:executionIntent==="ACCUMULATE"&&eLow!=null&&eHigh!=null?{low:eLow,high:eHigh}:null,setupInvalidation:thesis,deepCycleSupport:executionLevelsAllowed?activeLongTerm?.fib618:null,changed:decision.changeExplanation?.changed?"Decision evidence changed on the latest canonical snapshot.":null});
 const deploymentExplanation=!executionLevelsAllowed?"Execution levels unavailable until price and canonical trust are verified.":!permitsEntry?"No new entry or averaging while the canonical plan calls for reducing or exiting exposure.":executionIntent==="WATCH"?"Structural watch levels are context only; the current decision does not authorize an active entry or averaging.":narrative.whereAccumulate;
 const cio=buildCioDecision({businessScore:business,valuationScore:valuation,longTerm:activeLongTerm,structuralTruthValid,timingScore:timing,current,entryLow:eLow,entryHigh:eHigh,thesis,confirm,t1,fairValue:analystFundamentals?.fairValue,canonicalNewMoneyAction:decision.newMoneyAction,canonicalOwnerAction:decision.ownerAction,canonicalLongTermAction:decision.longTermAction});
 const rail=[thesis,support,eLow,eHigh,current,confirm,t1,t2];
 const decisionLane=(value:number|null)=>{if(value==null)return 0;const p=pos(value,rail);const close=rail.filter(v=>v!=null&&v!==value&&Math.abs(pos(v,rail)-p)<7).length;return close?1:0;};
 const scorePct=(x:number|null)=>x==null?0:Math.max(0,Math.min(100,x));
 const scoreRing=(x:number|null,label:string)=><div className="v99915IndicatorIcon" style={{"--score":`${scorePct(x)}%`} as any} aria-label={`${label} indicator`}><i/></div>;
 const stateBadge=(title:string,sub:string,tone="good")=><div className={`v2StateBadge v99914ContextBadge ${tone}`}><b>{title}</b><small>{sub}</small></div>;
 const businessMetricRows=[["Growth",dims.growth],["Profitability",dims.profitability],["Cash Flow",dims.cashGeneration],["Moat",dims.durability],["Balance Sheet",dims.balanceSheet],["Execution",dims.forwardEvidence]];
 const valuationRows=[["vs History",relative.vsHistory],["vs Peers",relative.vsPeers],["Growth Adj",relative.growthAdjusted],["FCF Yield",num(relative.fcfYield)==null?null:`${Number(relative.fcfYield).toFixed(1)}%`],["Margin of Safety",margin==null?null:`${margin>=0?"+":""}${margin.toFixed(1)}%`]];
 const combinedThesisSupport=thesis!=null&&support!=null&&Math.abs(thesis-support)<0.005;
 const mapNodes=combinedThesisSupport?[["THESIS / SUPPORT",thesis,"risk"],[entryLabel,eLow,"entry"],[displayPriceLive?"Current":"Reference",current,"current"],["Confirm",confirm,"confirm"],["T1",t1,"target"],["T2",t2,"target"]]:[["Thesis",thesis,"risk"],["Support",support,"support"],[entryLabel,eLow,"entry"],[displayPriceLive?"Current":"Reference",current,"current"],["Confirm",confirm,"confirm"],["T1",t1,"target"],["T2",t2,"target"]];
 const clusteredMapNodes=clusterMapNodes(mapNodes,.035);
 const mapLabel=(labels:string[])=>{const x=labels.join(" / ");if(/Entry Range/.test(x)&&/(Current|Reference)/.test(x))return"ENTRY / CURRENT";return x.toUpperCase()};


 const catalysts=[decision.pillars.catalystsRegime.why,...(decision.drivers||[])].filter(Boolean).slice(0,3);
 const risks=[...(decision.counterEvidence||[]),...(decision.hardVetoReasons||[])].filter(Boolean).slice(0,3);
 const timingMetrics=[
  ["Trend",num(technicalEvidence?.trend)?.toFixed(0)||"—"],
  ["Momentum",num(technicalEvidence?.momentum)?.toFixed(0)||"—"],
  ["Participation",num(technicalEvidence?.participation)?.toFixed(0)||"—"],
  ["Relative strength",num(technicalEvidence?.relativeStrengthPct)!=null?`${Number(technicalEvidence.relativeStrengthPct)>=0?"+":""}${Number(technicalEvidence.relativeStrengthPct).toFixed(1)}%`:"—"],
  ["Volatility",num(technicalEvidence?.volatilityRisk)!=null?`${Math.round(Number(technicalEvidence.volatilityRisk))}/100`:"—"]
 ];
 const longTermMetrics=[
  ["20-WMA",money(longTerm?.wma20)],["50-WMA",money(longTerm?.wma50)],["200-WMA",money(longTerm?.wma200)],
  ["Weekly HMA",money(longTerm?.weeklyHma)],["Volume participation",num(longTerm?.volumeRatio)==null?"—":`${Number(longTerm.volumeRatio).toFixed(2)}×`],
  ["Accumulation / Distribution",num(longTerm?.accumulationScore)==null?"—":`${longTerm.accumulationScore}/100`],["Trend channel",pretty(longTerm?.trendChannel)],["Confluence",num(longTerm?.confluenceScore)==null?"—":`${longTerm.confluenceScore}/100`]
 ];
 const callAction=String(decision.newMoneyAction||"WAIT").toUpperCase();
 const callStateTone=/AVOID|SELL|REDUCE/.test(callAction)?"avoid":/BUY|START|ADD/.test(callAction)?"buy":/HOLD/.test(callAction)?"hold":"wait";
 const businessTone=business==null?"neutral":business>=70?"positive":business>=50?"caution":"negative";
 const valuationTone=valuationState==="PARTIAL"?"caution":valuation!=null&&valuation>=65?"positive":valuation!=null&&valuation<40?"negative":"neutral";
 const weeklyStructureLabel=!structuralTruthValid?"REBUILDING":longTermScore!=null&&longTermScore>=70?(num(activeLongTerm?.volumeRatio)!=null&&Number(activeLongTerm.volumeRatio)<.6?"MIXED":"STRONG"):longTermScore!=null&&longTermScore<45?"DEFENSIVE":"MIXED";
 const weeklyTone=!structuralTruthValid?"caution":weeklyStructureLabel==="STRONG"?"positive":weeklyStructureLabel==="DEFENSIVE"?"negative":"caution";
 const timingTone=timing==null?"neutral":timing>=65?"positive":timing<45?"negative":"caution";
 const businessInsight=business==null?"Business evidence is still building.":num(dims.cashGeneration)!=null&&Number(dims.cashGeneration)<35?"Profitability and cash generation are the main constraints.":business>=70?"Business quality is supporting the thesis.":"Business quality is mixed; focus on the weakest operating factors.";
 const fcfYield=num(relative.fcfYield);
 const valuationInsight=fcfYield!=null&&fcfYield<0?"Negative FCF. Conventional FCF valuation is not reliable at this stage.":valuationState==="PARTIAL"?"Valuation is incomplete; AURYN is waiting for enough independent evidence.":margin!=null&&margin<-10?"Valuation is demanding relative to modeled fair value.":"Valuation evidence is usable but should be read with business quality.";
 const weeklyInsight=!structuralTruthValid?"Comparable weekly structure is being rebuilt.":current!=null&&num(activeLongTerm?.weeklyHma)!=null&&Math.abs(current-Number(activeLongTerm.weeklyHma))/current<.08?"Near weekly support; check the 20/50-WMA and participation before upgrading the trend.":current!=null&&num(activeLongTerm?.wma20)!=null&&current<Number(activeLongTerm.wma20)?"Below key weekly averages; trend confirmation is still required.":"Weekly structure is constructive but participation and trend context still matter.";
 const timingInsight=timing!=null&&timing<45?`Trend is weak${num(technicalEvidence?.volatilityRisk)!=null&&Number(technicalEvidence.volatilityRisk)>70?" and volatility elevated":""}; confirmation is preferable to chasing.`:timing!=null&&timing>=65?"Timing evidence is constructive for execution.":"Timing is mixed; wait for price and participation to align.";
 const waveRaw=String(activeLongTerm?.waveCandidate||"").toUpperCase();
 const waveConfidence=num(activeLongTerm?.waveConfidence);
 const waveInvestorState=/BEAR|DOWN/.test(waveRaw)?"Downtrend risk increasing":/CONFIRMED/.test(waveRaw)&&!/UNCONFIRMED/.test(waveRaw)?"Uptrend confirmed":/IMPULSE/.test(waveRaw)?"Uptrend developing":/UNCONFIRMED|CANDIDATE/.test(waveRaw)?"Possible new uptrend":"Trend unclear";
 const waveEvidenceParts=[
  num(activeLongTerm?.weeklyHma)!=null&&current!=null?`Weekly HMA ${money(activeLongTerm.weeklyHma)} (${current>=Number(activeLongTerm.weeklyHma)?"held/reclaimed":"still above price"})`:null,
  num(activeLongTerm?.wma50)!=null&&current!=null?`50-WMA ${money(activeLongTerm.wma50)} (${current>=Number(activeLongTerm.wma50)?"price above":"not reclaimed"})`:null,
  num(activeLongTerm?.volumeRatio)!=null?`Volume participation ${Number(activeLongTerm.volumeRatio).toFixed(2)}×`:null,
  num(activeLongTerm?.confluenceScore)!=null?`Confluence ${Math.round(Number(activeLongTerm.confluenceScore))}/100`:null
 ].filter((x):x is string=>Boolean(x));
 const waveInvestorExplanation=waveInvestorState==="Uptrend confirmed"?"Price structure is confirmed by the current weekly evidence.":waveInvestorState==="Uptrend developing"?"Weekly structure is improving, but AURYN still wants broader price/trend/volume agreement.":waveInvestorState==="Possible new uptrend"?"A possible larger weekly uptrend is forming, but price/trend/volume confirmation is still incomplete.":waveInvestorState==="Downtrend risk increasing"?"Weekly evidence is deteriorating; stronger support and trend confirmation are needed.":"Weekly evidence is mixed and does not support a directional call yet.";
 const roadmapLevels=[
  ["STRUCTURAL BREAK",longTerm?.invalidation,"risk"],["ACCUMULATION",longTerm?.entryLow,"entry"],["ENTRY HIGH",longTerm?.entryHigh,"entry"],
  ["50-WMA / CONFIRM",longTerm?.confirm,"confirm"],["PRIOR HIGH",longTerm?.priorHigh,"target"],["1.272 EXT",longTerm?.extension1272,"target"],["1.618 EXT",longTerm?.extension1618,"stretch"]
 ].filter(([,x])=>num(x)!=null);
 return <section className="researchOverview">
  <div className="researchToolbar"><span>Research workspace <i>•</i> Fundamentals first</span><div><button onClick={onAddWatchlist}>{watching?"✓ Watching":"+ Watchlist"}</button><button className="researchPrimary" onClick={onTrackPosition}>Track position</button></div></div>
  <div className="researchHeroGrid">
   <article className="researchCard researchThesis"><header><h2>Investment thesis</h2><span>{decision.confidenceScore}/100 confidence</span></header><div className="researchVerdict"><strong>{pretty(decision.newMoneyAction)}</strong><span>Canonical decision</span></div><p>{decision.pillars.business.why}</p><dl className="researchData"><div><dt>Business quality</dt><dd>{business==null?"—":`${business}/100`}</dd></div><div><dt>Evidence coverage</dt><dd>{decision.evidenceCompleteness}/100</dd></div><div><dt>Owner action</dt><dd>{pretty(decision.ownerAction)}</dd></div><div><dt>Long-term action</dt><dd>{pretty(decision.longTermAction)}</dd></div></dl><button onClick={onOpenThesis}>View business thesis →</button><p><b>Market setup: {setupExplanation.title}.</b> {setupExplanation.meaning}</p><details><summary>Why this decision?</summary><p>{setupExplanation.actionImplication}</p>{executionLevelsAllowed?<><p><b>What upgrades it:</b> {decision.nextDecisionTrigger||narrative.nextDecision}</p><p><b>What breaks it:</b> {decision.invalidationTrigger||"Reassess on verified thesis deterioration."}</p></>:<p>Price-sensitive decision triggers are withheld until canonical verification is restored.</p>}{patternExplanation&&<p><b>Pattern evidence: {patternExplanation.title}.</b> {patternExplanation.meaning} {compatibleScenario.waveContext?.note}</p>}<p>{narrative.whatChanged}</p></details></article>
   <article className="researchCard researchChart"><header><h2>Price chart</h2><div className="researchChartTools"><label>Indicators<select aria-label="Chart indicators" value={showMovingAverages?"moving":"none"} onChange={e=>setShowMovingAverages(e.target.value==="moving")}><option value="none">Price & volume</option><option value="moving">20 / 50 bar averages</option></select></label><button aria-label="Expand price chart" onClick={()=>chartDialog.current?.showModal()}>⛶</button></div></header><div className="researchRanges" aria-label="Chart period">{["1D","1W","1M","3M","6M","1Y","3Y","5Y"].map(x=><button aria-pressed={chartRange===x} onClick={()=>onChartRangeChange?.(x)} key={x}>{x}</button>)}</div><div className="researchChartStage" aria-busy={chartLoading}>{candles.length?<PriceChart candles={candles} levels={visibleChartLevels} showTrend={showMovingAverages}/>:<div className="researchEmpty">Price history is unavailable. No synthetic prices are displayed.</div>}{chartLoading&&<span className="researchChartLoading" role="status">Updating history…</span>}</div><dialog ref={chartDialog} className="researchExpandedDialog" aria-label="Expanded price chart"><header><h2>Price chart · {chartRange}</h2><form method="dialog"><button aria-label="Close expanded chart">Close</button></form></header><div className="researchExpandedChart"><PriceChart candles={candles} levels={visibleChartLevels} showTrend={showMovingAverages}/></div></dialog><div className="researchChartLevels">{[[entryLabel,eLow],["Confirm",confirm],["Target 1",t1],["Setup invalidation",thesis]].map(([k,v])=><div key={String(k)}><small>{k}</small><strong>{money(v)}</strong></div>)}</div></article>
   <aside className="researchSide"><article className="researchCard"><h2>Key data</h2><dl className="researchData"><div><dt>Fair value</dt><dd>{money(fair)}</dd></div><div><dt>Margin of safety</dt><dd>{margin==null?"—":`${margin.toFixed(1)}%`}</dd></div><div><dt>FCF yield</dt><dd>{fcfYield==null?"—":`${fcfYield.toFixed(1)}%`}</dd></div><div><dt>Method</dt><dd>{pretty(valuationMethod)}</dd></div><div><dt>Valuation evidence</dt><dd>{pretty(valuationState)}</dd></div></dl></article><article className="researchCard"><h2>Business dimensions</h2>{businessMetricRows.map(([label,value])=><div className="researchScore" key={label}><span>{label}</span><progress max="100" value={num(value)??0} aria-label={String(label)}/><b>{num(value)==null?"—":`${Math.round(Number(value))}`}</b></div>)}</article></aside>
  </div>
  <div className="researchClocks">{[["01 · Long-term thesis",pretty(decision.longTermAction),narrative.whyOwn],["02 · Independent valuation",fair==null?"Evidence building":money(fair),narrative.whatWorth],["03 · Tactical deployment",pretty(decision.newMoneyAction),deploymentExplanation]].map(([title,value,detail])=><article className="researchCard" key={title}><small>{title}</small><h3>{value}</h3><p>{detail}</p></article>)}</div>
  <div className="researchTwoColumns"><article className="researchCard"><header><div><small>Independent fundamental valuation</small><h2>Bear, base & bull</h2></div><button onClick={onOpenValuation}>Analysis →</button></header>{fundamentalScenario?.status==="READY"||fundamentalScenario?.base?.value!=null?<><div className="researchScenarios">{["bear","base","bull"].map(k=><div key={k}><small>{k}</small><strong>{money(fundamentalScenario[k]?.value)}</strong><span>{current&&num(fundamentalScenario[k]?.value)!=null?`${((Number(fundamentalScenario[k].value)/current-1)*100).toFixed(1)}% vs price`:"Evidence unavailable"}</span></div>)}</div><p>Fundamental scenarios are independent of technical targets. Method: {pretty(valuationMethod)}.</p></>:<div className="researchEmpty">Insufficient source-backed inputs to publish fundamental scenarios.</div>}</article><article className="researchCard"><header><div><small>Canonical execution plan</small><h2>Decision map</h2></div><span>{executionLevelsAllowed?"Timing clock":"Execution levels unavailable"}</span></header><div className="researchDecisionMap">{clusteredMapNodes.map((node:any)=><div key={mapLabel(node.labels)}><small>{mapLabel(node.labels)}</small><strong>{money(node.value)}</strong></div>)}</div><p>Setup invalidation is a tactical risk level. Business thesis failure requires fundamental evidence.</p></article></div>
  <div className="researchTwoColumns"><article className="researchCard"><header><h2>Evidence supporting the thesis</h2><button onClick={onOpenCatalysts}>Catalysts →</button></header>{catalysts.length?catalysts.map((x,i)=><p className="researchEvidence" key={i}>{x}</p>):<p>No verified catalysts loaded.</p>}</article><article className="researchCard"><header><h2>Counter-evidence & risks</h2><button onClick={onOpenRisks}>Risk review →</button></header>{risks.length?risks.map((x,i)=><p className="researchEvidence" key={i}>{x}</p>):<p>No canonical counter-evidence loaded. This does not establish an absence of risk.</p>}</article></div>
  <details className="researchCard researchRoadmap"><summary>Weekly structure & supporting evidence</summary>{!executionLevelsAllowed?<p>Execution levels unavailable until price and canonical trust are verified.</p>:!structuralTruthValid?<p>{regimeTruth.reason}</p>:<><p>{waveInvestorExplanation}</p><div className="researchDecisionMap">{confluenceZones.map((z:any)=><div key={z.key}><small>{z.label}</small><strong>{typeof z.value==="string"?z.value:money(z.value)}</strong><span>{z.detail}</span></div>)}</div><p>{waveEvidenceParts.join(" · ")}</p></>}<p>Weekly structure informs timing; technical weakness alone does not invalidate the business thesis.</p></details>
  <footer className="researchProvenance">Research snapshot: {marketTruth?.decisionPriceAsOf?new Date(marketTruth.decisionPriceAsOf).toLocaleString():"Timestamp unavailable"} · Confidence {decision.confidenceScore}/100 · Missing evidence lowers confidence.</footer>
 </section>;
}
