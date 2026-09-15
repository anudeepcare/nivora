"use client";
import {useState} from "react";
import PriceChart from "@/components/PriceChart";
import {formatMoney} from "@/lib/nivora-format";
import type {InstitutionalDecision} from "@/lib/auryn/v931/domain";
import {buildLongTermRoadmap} from "@/lib/auryn/v99925/long-term-roadmap";
import {buildInvestmentNarrative} from "@/lib/auryn/v99925/investment-narrative";

const num=(x:any)=>x==null||x===""?null:Number.isFinite(Number(x))?Number(x):null;
const money=(x:any)=>num(x)==null?"—":formatMoney(Number(x));
const pretty=(x:any)=>String(x||"—").replaceAll("_"," ");
const band=(x:number|null)=>x==null?"BUILDING":x>=75?"STRONG":x>=60?"CONSTRUCTIVE":x>=45?"MIXED":"WEAK";
const companyBand=(x:number|null)=>x==null?"BUILDING":x>=85?"ELITE COMPOUNDER":x>=72?"HIGH QUALITY":x>=58?"SOLID":x>=43?"MIXED":"CHALLENGED";
const valueBand=(x:number|null)=>x==null?"BUILDING":x>=75?"ATTRACTIVE":x>=60?"REASONABLE":x>=45?"FAIR / RICH":"EXPENSIVE";
const clusterMapNodes=(nodes:any[])=>{
 const valid=nodes.filter(([,x])=>num(x)!=null).sort((a,b)=>Number(a[1])-Number(b[1])),out:any[]=[];
 for(const node of valid){const prev=out.at(-1),pv=prev?Number(prev.value):null,nv=Number(node[1]);if(prev&&pv&&Math.abs(nv-pv)/pv<=.012){prev.labels.push(node[0]);prev.value=(prev.value+nv)/2;prev.tone=prev.tone==="risk"?"risk":node[2];}else out.push({labels:[node[0]],value:nv,tone:node[2]});}
 return out;
};
const buildConfluenceZones=(r:any,current:number|null)=>{
 const near=(a:any,b:any,p=.035)=>num(a)!=null&&num(b)!=null&&Math.abs(Number(a)-Number(b))/Math.max(1,Number(b))<=p;
 const supportEvidence=[["Fib .618",r?.fib618],["50-WMA",r?.wma50],["200-WMA",r?.wma200],["Weekly HMA",r?.weeklyHma],["Structural support",r?.support]].filter(([,x])=>num(x)!=null);
 const supportVals=supportEvidence.map(([,x])=>Number(x)),supportLo=supportVals.length?Math.min(...supportVals):null,supportHi=supportVals.length?Math.max(...supportVals):null;
 const supportCount=supportEvidence.filter(([,x])=>current!=null&&near(x,current,.09)).length;
 const reclaimVals=[r?.fib50,r?.confirm,r?.wma50,r?.weeklyHma].map(num).filter((x):x is number=>x!=null),reclaim=reclaimVals.length?Math.max(...reclaimVals):null;
 return[
  {key:"risk",label:"RISK / INVALIDATION",value:r?.invalidation,tone:"risk",detail:"Weekly structural break"},
  {key:"support",label:supportCount>=3?"STRONG SUPPORT":"ACCUMULATION",value:supportLo!=null&&supportHi!=null?`${money(supportLo)} – ${money(supportHi)}`:money(r?.entryLow),tone:"entry",detail:`${supportCount||supportEvidence.length} confirmations · Fib / WMA / structural support`},
  {key:"current",label:"CURRENT POSITION",value:money(current),tone:"current",detail:r?.trendChannel?`${pretty(r.trendChannel)} weekly channel`:"Current market position"},
  {key:"reclaim",label:"KEY RECLAIM",value:money(reclaim),tone:"confirm",detail:"Fib retracement + WMA / HMA trend confirmation"},
  {key:"upside",label:"UPSIDE ROADMAP",value:r?.priorHigh!=null?`${money(r.priorHigh)} → ${money(r.extension1272)} → ${money(r.extension1618)}`:"Building",tone:"target",detail:"Prior high · 1.272 · 1.618 extensions"}
 ];
};
const helpCopy:any={
 business:"Business quality blends growth, profitability, cash generation, balance-sheet resilience, durability/moat and forward evidence. Missing evidence stays missing rather than becoming zero.",
 valuation:"Valuation uses the business-model-appropriate fundamental method, FCF yield and source-backed historical/peer cross-checks when available. Technical targets never become fair value.",
 longTerm:"Long-term structure uses independent 5-year history aggregated to weekly bars. Basis: Fib retracement from validated swing extremes; WMA / HMA trend; volume participation and accumulation; structural support/resistance; consolidation; trend channel and invalidation.",
 timing:"Market timing is the shorter-horizon execution layer: trend, momentum, participation, relative strength, volatility and the canonical Entry / Confirm / Target map."
};
const pos=(value:number|null,all:Array<number|null>)=>{if(value==null)return 50;const a=all.filter((v):v is number=>v!=null&&Number.isFinite(v));if(a.length<2)return 50;const lo=Math.min(...a),hi=Math.max(...a);return hi===lo?50:5+(value-lo)/(hi-lo)*90};

export default function AurynResearchOverviewV2({decision,marketTruth,displayPrice,displayPriceLive=false,marketIntelligence=null,fundamentalScenario=null,analystFundamentals=null,technicalEvidence=null,entryQuality=null,chartRange="3M",chartLoading=false,onChartRangeChange,onOpenCatalysts,onOpenRisks,onOpenDetails,onOpenThesis,onOpenValuation,candles=[],longTermCandles=[],chartLevels=null}:{decision:InstitutionalDecision;marketTruth:any;displayPrice?:number|null;displayPriceLive?:boolean;marketIntelligence?:any;fundamentalScenario?:any;analystFundamentals?:any;technicalEvidence?:any;entryQuality?:number|null;chartRange?:"1D"|"1W"|"1M"|"3M"|"6M"|"1Y"|"3Y"|"5Y";chartLoading?:boolean;onChartRangeChange?:(x:any)=>void;onOpenCatalysts?:()=>void;onOpenRisks?:()=>void;onOpenDetails?:()=>void;onOpenThesis?:()=>void;onOpenValuation?:()=>void;candles:any[];longTermCandles?:any[];chartLevels:any}){
 const current=num(displayPrice??marketTruth?.price), business=num(decision.pillars.business.score), valuation=analystFundamentals?num(analystFundamentals.valuationScore):num(decision.pillars.valuation.score), timing=num(entryQuality??decision.pillars.marketStructure.score);
 const longTerm:any=buildLongTermRoadmap(longTermCandles,current);
 const [activeHelp,setActiveHelp]=useState<string|null>(null);
 const confluenceZones=buildConfluenceZones(longTerm,current);
 const longTermScore=num(longTerm?.score);
 const narrative=buildInvestmentNarrative({businessScore:business,trajectory:analystFundamentals?.trajectory,valuationState:analystFundamentals?.valuationState,fairValue:analystFundamentals?.fairValue,marginOfSafety:analystFundamentals?.marginOfSafety,roadmap:longTerm,timingState:band(timing),changed:decision.changeExplanation?.changed?"Decision evidence changed on the latest canonical snapshot.":null});
 const dims=analystFundamentals?.companyDimensions||{}, relative=analystFundamentals?.relativeContext||{}, valuationState=analystFundamentals?.valuationState||"UNAVAILABLE", valuationMethod=analystFundamentals?.method||"BUILDING", margin=num(analystFundamentals?.marginOfSafety), fair=num(analystFundamentals?.fairValue);
 const levels=chartLevels||{}, thesis=num(levels.invalidation), support=num(levels.majorSupport??levels.support), eLow=num(levels.entryLow??levels.preferredEntry), eHigh=num(levels.entryHigh??levels.preferredEntry), confirm=num(levels.confirm??levels.breakout), t1=num(levels.t1??levels.target1), t2=num(levels.t2??levels.target2);
 const rail=[thesis,support,eLow,eHigh,current,confirm,t1,t2];
 const decisionLane=(value:number|null)=>{if(value==null)return 0;const p=pos(value,rail);const close=rail.filter(v=>v!=null&&v!==value&&Math.abs(pos(v,rail)-p)<7).length;return close?1:0;};
 const scorePct=(x:number|null)=>x==null?0:Math.max(0,Math.min(100,x));
 const scoreRing=(x:number|null,label:string)=><div className="v99915IndicatorIcon" style={{"--score":`${scorePct(x)}%`} as any} aria-label={`${label} indicator`}><i/></div>;
 const stateBadge=(title:string,sub:string,tone="good")=><div className={`v2StateBadge v99914ContextBadge ${tone}`}><b>{title}</b><small>{sub}</small></div>;
 const businessMetricRows=[["Growth",dims.growth],["Profitability",dims.profitability],["Cash Flow",dims.cashGeneration],["Moat",dims.durability],["Balance Sheet",dims.balanceSheet],["Execution",dims.forwardEvidence]];
 const valuationRows=[["vs History",relative.vsHistory],["vs Peers",relative.vsPeers],["Growth Adj",relative.growthAdjusted],["FCF Yield",num(relative.fcfYield)==null?null:`${Number(relative.fcfYield).toFixed(1)}%`],["Margin of Safety",margin==null?null:`${margin>=0?"+":""}${margin.toFixed(1)}%`]];
 const combinedThesisSupport=thesis!=null&&support!=null&&Math.abs(thesis-support)<0.005;
 const mapNodes=combinedThesisSupport?[["THESIS / SUPPORT",thesis,"risk"],["Entry Range",eLow,"entry"],[displayPriceLive?"Current":"Reference",current,"current"],["Confirm",confirm,"confirm"],["T1",t1,"target"],["T2",t2,"target"]]:[["Thesis",thesis,"risk"],["Support",support,"support"],["Entry Range",eLow,"entry"],[displayPriceLive?"Current":"Reference",current,"current"],["Confirm",confirm,"confirm"],["T1",t1,"target"],["T2",t2,"target"]];
 const clusteredMapNodes=clusterMapNodes(mapNodes);
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
  ["Weekly HMA",money(longTerm?.weeklyHma)],["Volume vs avg",num(longTerm?.volumeRatio)==null?"—":`${Number(longTerm.volumeRatio).toFixed(2)}×`],
  ["Accumulation",num(longTerm?.accumulationScore)==null?"—":`${longTerm.accumulationScore}/100`],["Trend channel",pretty(longTerm?.trendChannel)],["Confluence",num(longTerm?.confluenceScore)==null?"—":`${longTerm.confluenceScore}/100`]
 ];
 const roadmapLevels=[
  ["STRUCTURAL BREAK",longTerm?.invalidation,"risk"],["ACCUMULATION",longTerm?.entryLow,"entry"],["ENTRY HIGH",longTerm?.entryHigh,"entry"],
  ["50-WMA / CONFIRM",longTerm?.confirm,"confirm"],["PRIOR HIGH",longTerm?.priorHigh,"target"],["1.272 EXT",longTerm?.extension1272,"target"],["1.618 EXT",longTerm?.extension1618,"stretch"]
 ].filter(([,x])=>num(x)!=null);
 return <section className="aurynOverviewV2">
  <div className="v2DecisionHero v99914Hero">
   <article className="v2Call"><small>AURYN CALL</small><h1>{pretty(decision.newMoneyAction)}</h1><p>{decision.pillars.business.why}</p><div className="v2Actions v99914CallActions"><span>New Money <b>{pretty(decision.newMoneyAction)}</b></span><span>Owner <b>{pretty(decision.ownerAction)}</b></span><span>Long Term <b>{pretty(decision.longTermAction)}</b></span></div><footer><span>Confidence {decision.confidenceScore}/100</span><span>Evidence {decision.evidenceCompleteness}/100</span><span>Last Updated<br/>{marketTruth?.decisionPriceAsOf?new Date(marketTruth.decisionPriceAsOf).toLocaleDateString():"—"}</span></footer></article>
   <article className="v2Chart"><header><small>PRICE CHART</small><b>{displayPriceLive?"LIVE":"VERIFIED RESEARCH"}</b></header><div className="v99914Ranges">{["1D","1W","1M","3M","6M","1Y","3Y","5Y"].map(x=><button type="button" onClick={()=>onChartRangeChange?.(x)} className={x===chartRange?"active":""} key={x}>{x}</button>)}</div><div className={`v99915ChartStage ${chartLoading?"loading":""}`}><PriceChart candles={candles} levels={chartLevels}/>{chartLoading?<span className="v99915ChartLoading">Loading {chartRange}…</span>:null}</div></article>
   <article className="v2Structure"><header><small>PRICE STRUCTURE</small><b>{band(timing)}</b></header>{[["Target 2",t2],["Target 1",t1],["Confirm",confirm],[displayPriceLive?"Current":"Reference",current],["Entry Range",eLow!=null&&eHigh!=null?`${money(eLow)} – ${money(eHigh)}`:"—"],["Major Support",support],["Thesis Break",thesis]].map(([k,v]:any)=><div key={k}><span>{k}</span><b>{typeof v==="string"?v:money(v)}</b></div>)}</article>
  </div>

  <div className="v2AnalystClocks v99926PillarGrid">
   <article className="v2AnalystCard"><header><div><small>1. BUSINESS QUALITY <button className="v99926Help" type="button" onClick={()=>setActiveHelp(activeHelp==="business"?null:"business")} aria-expanded={activeHelp==="business"} aria-label="How AURYN determines this">?</button></small><h3>{companyBand(business)}</h3></div>{scoreRing(business,"QUALITY")}</header><div className="v2CardLead"><p>{business==null?"Evidence building":`${business.toFixed(0)}/100`}</p>{stateBadge(pretty(analystFundamentals?.trajectory||"BUILDING"),"Trajectory")}</div><p className="v2CardSummary">{decision.pillars.business.why}</p><div className="v2MetricStrip">{businessMetricRows.map(([k,v])=><span key={k as string}><small>{k}</small><b>{num(v)==null?"—":Math.round(Number(v))}</b></span>)}</div></article>
   <article className="v2AnalystCard"><header><div><small>2. VALUATION <button className="v99926Help" type="button" onClick={()=>setActiveHelp(activeHelp==="valuation"?null:"valuation")} aria-expanded={activeHelp==="valuation"} aria-label="How AURYN determines this">?</button></small><h3>{valuation==null?valuationState:valueBand(valuation)}</h3></div>{valuationState==="PARTIAL"?<div className="v99915IndicatorIcon partial" aria-label="Partial valuation"><i/></div>:scoreRing(valuation,"VALUE")}</header><div className="v2CardLead"><p>{valuation==null?pretty(valuationMethod):`${valuation.toFixed(0)}/100`}</p>{stateBadge(margin==null?valuationState:(margin>=10?"Attractive":margin>=-10?"Neutral":"Expensive"),margin==null?"Evidence":"vs Fair Value",margin!=null&&margin<-10?"warn":"good")}</div><p className="v2CardSummary">{margin==null?"AURYN withholds precise fair value until the routed valuation method has sufficient evidence.":`Model margin of safety is ${margin>=0?"+":""}${margin.toFixed(1)}%.`}</p><div className="v2MetricStrip v2ValueStrip">{valuationRows.map(([k,v])=><span key={k as string}><small>{k}</small><b>{v??"—"}</b></span>)}</div></article>
   <article className="v2AnalystCard"><header><div><small>3. LONG-TERM STRUCTURE <button className="v99926Help" type="button" onClick={()=>setActiveHelp(activeHelp==="longTerm"?null:"longTerm")} aria-expanded={activeHelp==="longTerm"} aria-label="How AURYN determines this">?</button></small><h3>{pretty(longTerm?.state)}</h3></div>{scoreRing(longTermScore,"LONG TERM")}</header><div className="v2CardLead"><p>{longTermScore==null?"Building":`${longTermScore.toFixed(0)}/100`}</p>{stateBadge(longTerm?.above200?"Above 200-WMA":"200-WMA context",longTerm?.consolidationWeeks?`${longTerm.consolidationWeeks}w base`:"Weekly structure")}</div><p className="v2CardSummary">Multi-year weekly structure combines trend, validated swing levels, Fibonacci context and consolidation without rewriting execution timing.</p><div className="v2MetricStrip">{longTermMetrics.map(([k,x])=><span key={k as string}><small>{k}</small><b>{x}</b></span>)}</div></article>
   <article className="v2AnalystCard"><header><div><small>4. MARKET TIMING <button className="v99926Help" type="button" onClick={()=>setActiveHelp(activeHelp==="timing"?null:"timing")} aria-expanded={activeHelp==="timing"} aria-label="How AURYN determines this">?</button></small><h3>{band(timing)}</h3></div>{scoreRing(timing,"TIMING")}</header><div className="v2CardLead"><p>{timing==null?"Building":`${timing.toFixed(0)}/100`}</p>{stateBadge(num(technicalEvidence?.trend)!=null&&Number(technicalEvidence.trend)>=60?"Improving":num(technicalEvidence?.trend)!=null&&Number(technicalEvidence.trend)<45?"Weakening":"Neutral","Trend",num(technicalEvidence?.trend)!=null&&Number(technicalEvidence.trend)<45?"warn":"good")}</div><p className="v2CardSummary">Daily price structure, participation and relative performance answer whether today is an attractive execution point.</p><div className="v2MetricStrip">{timingMetrics.map(([k,x])=><span key={k}><small>{k}</small><b>{x}</b></span>)}</div></article>
  </div>

  {activeHelp?<div className="v99927HelpPopover" role="dialog" aria-label="How AURYN determines this"><div><small>HOW AURYN DETERMINES THIS</small><b>{activeHelp==="business"?"Business Quality":activeHelp==="valuation"?"Valuation":activeHelp==="longTerm"?"Long-Term Structure":"Market Timing"}</b><p>{helpCopy[activeHelp]}</p></div><button type="button" onClick={()=>setActiveHelp(null)} aria-label="Close">×</button></div>:null}

  <div className="v2DecisionVisuals v99927CoreGrid">
   <article className="v2Scenario"><header><small>SCENARIO SPECTRUM</small><h2>Fundamental value</h2><span>Decision-grade assumptions · not probabilities</span></header>{valuationState==="PARTIAL"?<div className="v99925PartialValuation" data-contract="Valuation Model: Partial"><div><small>VALUATION EVIDENCE · PARTIAL</small><h3>{pretty(valuationMethod)}</h3><p>Fair-value scenarios are withheld until the selected method is decision-grade. Available evidence remains useful now.</p></div><div className="v99925EvidenceGrid">{valuationRows.map(([k,x])=><span key={k as string}><small>{k}</small><b>{x??"Evidence building"}</b></span>)}</div><p className="v99925TruthNote">Technical targets are never substituted for fundamental fair value.</p><button type="button" onClick={onOpenValuation} className="v2TextAction">View Valuation Evidence →</button></div>:fundamentalScenario?<><div className="v2SpectrumWrap"><div className="v2ScenarioCurrentMarker">CURRENT <b>{money(current)}</b></div><div className="v2SpectrumTrack"><i className="bear"/><i className="base"/><i className="bull"/></div><div className="v2ScenarioRail">{["bear","base","bull"].map(k=>{const v=num(fundamentalScenario[k]?.value),d=current&&v!=null?(v/current-1)*100:null;return <span key={k}><small>{k.toUpperCase()}</small><b>{money(v)}</b><em>{d==null?"—":`${d>=0?"+":""}${d.toFixed(1)}%`}</em></span>})}</div></div><div className="v2ScenarioCases"><span><b>Bear Case</b><small>Growth slows, cash-flow durability weakens and the required return rises.</small></span><span><b>Base Case</b><small>Current source-backed economics normalize through the explicit valuation policy.</small></span><span><b>Bull Case</b><small>Growth persists longer and cash-flow conversion exceeds the normalized base path.</small></span></div><div className="v2ScenarioAssumptions"><span>Revenue growth <b>{fundamentalScenario.assumptions?.observedRevenueGrowthPct==null?"—":`${Number(fundamentalScenario.assumptions.observedRevenueGrowthPct).toFixed(1)}%`}</b></span><span>FCF <b>{money(fundamentalScenario.assumptions?.currentFcf)}</b></span><span>Discount <b>{fundamentalScenario.assumptions?.baseDiscountRate}%</b></span><span>Terminal <b>{fundamentalScenario.assumptions?.baseTerminalGrowth}%</b></span></div><button type="button" onClick={onOpenValuation} className="v2TextAction">View Full Scenario Analysis →</button></>:<div className="v2Building"><b>Fundamental valuation building</b><span>AURYN publishes fair value only when the routed valuation method has sufficient source-backed inputs.</span></div>}</article>
   <article className="v2DecisionMap"><header><small>DECISION MAP</small><h2>Execution plan</h2><span>Where we are in the canonical investment plan</span></header><div className="v2DecisionMapBody">{current!=null?<div className="v2CurrentMapMarker" style={{left:`${pos(current,rail)}%`}}>CURRENT <b>{money(current)}</b></div>:null}<div className="v2Rail">{clusteredMapNodes.map((node:any)=><span className={`${node.tone} lane-0`} key={mapLabel(node.labels)} style={{left:`${pos(node.value,rail)}%`}}><i/><span className="v2RailConnector"/><small>{mapLabel(node.labels)}</small><b>{node.labels.some((x:string)=>/(Current|Reference)/.test(x))&&current!=null?money(current):money(node.value)}</b></span>)}</div><div className="v2DecisionZones"><span>THESIS RISK ←</span><span>ENTRY / ACCUMULATION</span><span>CONFIRM / TARGETS →</span></div></div><p>{current!=null&&confirm!=null&&current<confirm?`Price is below confirmation at ${money(confirm)}. Wait for confirmation or a pullback into the mapped entry range for better risk/reward.`:`Current price is evaluated against the canonical execution map while business quality and fair value remain separate decisions.`}</p></article>
  </div>

  <section className="v99925Roadmap">
   <header><div><small>LONG-TERM PRICE THESIS</small><h2>Investment roadmap</h2><p>Weekly structure · Fibonacci context · trend confirmation · structural invalidation</p></div><div className="v99925RoadmapState"><b>{pretty(longTerm?.state)}</b><span>{longTermScore==null?"Building":`${longTermScore}/100`}</span></div></header>
   {longTerm?.state==="BUILDING"?<div className="v2Building"><b>Long-term structure building</b><span>{longTerm.reason}</span></div>:<>
    <div className="v99927ConfluenceMap">{confluenceZones.map((z:any)=><article className={`v99927Zone ${z.tone} ${z.key==="current"?"v99927CurrentPosition":""}`} key={z.key}><small>{z.label}</small><b>{typeof z.value==="string"?z.value:money(z.value)}</b><span>{z.detail}</span></article>)}</div>
    <div className="v99927EvidenceBar"><span><small>Fib .618</small><b>{money(longTerm.fib618)}</b></span><span><small>Fib .786</small><b>{money(longTerm.fib786)}</b></span><span><small>50-WMA</small><b>{money(longTerm.wma50)}</b></span><span><small>200-WMA</small><b>{money(longTerm.wma200)}</b></span><span><small>Weekly HMA</small><b>{money(longTerm.weeklyHma)}</b></span><span><small>Volume vs avg</small><b>{num(longTerm.volumeRatio)==null?"—":`${Number(longTerm.volumeRatio).toFixed(2)}×`}</b></span><span><small>Accumulation</small><b>{num(longTerm.accumulationScore)==null?"—":`${longTerm.accumulationScore}/100`}</b></span><span><small>Confluence</small><b>{num(longTerm.confluenceScore)==null?"—":`${longTerm.confluenceScore}/100`}</b></span></div>
    <div className="v99925Wave"><div><small>WAVE / CYCLE CONTEXT</small><b>Wave candidate · {pretty(longTerm.waveCandidate)}</b><span>{longTerm.waveConfidence}% confidence</span></div><p>Secondary context only. AURYN prioritizes confluence between Fib retracement, WMA / HMA, volume participation and structural support before treating a zone as decision-relevant.</p></div>
   </>}
  </section>

  <section className="v99925Thesis">
   <header><small>AURYN INVESTMENT THESIS</small><h2>What matters now</h2></header>
   <div className="v99925ThesisGrid">
    <article><small>WHY OWN IT</small><p>{narrative.whyOwn}</p></article>
    <article><small>WHAT IT'S WORTH</small><p>{narrative.whatWorth}</p></article>
    <article><small>WHERE TO ACCUMULATE</small><p>{narrative.whereAccumulate}</p></article>
    <article><small>WHAT CONFIRMS</small><p>{narrative.whatConfirms}</p></article>
    <article><small>WHAT BREAKS</small><p>{narrative.whatBreaks}</p></article>
    <article><small>WHAT CHANGED</small><p>{narrative.whatChanged}</p></article>
    <article className="next"><small>NEXT DECISION</small><p>{narrative.nextDecision}</p></article>
   </div>
  </section>

  <div className="v2Synthesis v99914BottomGrid v99916Insights">
   <article><small>KEY CATALYSTS</small>{catalysts.length?catalysts.map((x,i)=><div className="v2AnalystRow good" key={i}><i>↗</i><span><b>{i===0?"Forward evidence":i===1?"Business driver":"Catalyst"}</b><small>{x}</small></span></div>):<div className="v2AnalystRow"><span><b>No decision-grade catalyst loaded</b></span></div>}<button type="button" onClick={onOpenCatalysts} className="v2TextAction">View All Catalysts →</button></article>
   <article><small>KEY RISKS</small>{risks.length?risks.map((x,i)=><div className="v2AnalystRow bad" key={i}><i>!</i><span><b>{i===0?"Primary risk":"Risk evidence"}</b><small>{x}</small></span></div>):<div className="v2AnalystRow"><span><b>No material canonical risk loaded</b></span></div>}<button type="button" onClick={onOpenRisks} className="v2TextAction">View All Risks →</button></article>
   <article><small>WHAT'S CHANGED</small><h3>{decision.changeExplanation?.changed?"Evidence changed":"No canonical state change"}</h3><div className="v2AnalystRow"><i>→</i><span><b>Revenue estimates</b><small>Comparable snapshot required</small></span></div><div className="v2AnalystRow"><i>→</i><span><b>EPS estimates</b><small>Comparable snapshot required</small></span></div><div className="v2AnalystRow"><i>→</i><span><b>Margin outlook</b><small>{pretty(analystFundamentals?.trajectory||"Building")}</small></span></div><div className="v2AnalystRow"><i>→</i><span><b>Technical structure</b><small>{band(timing)}</small></span></div><div className="v2AnalystRow"><i>→</i><span><b>Valuation</b><small>{valuation==null?valuationState:valueBand(valuation)}</small></span></div><button type="button" onClick={onOpenDetails} className="v2TextAction">View Details →</button></article>
   <article><small>AURYN VIEW</small><h3>{pretty(decision.newMoneyAction)}</h3><p>{companyBand(business)} business with {pretty(analystFundamentals?.trajectory||"building").toLowerCase()} trajectory. Valuation is {valuation==null?valuationState.toLowerCase():valueBand(valuation).toLowerCase()} and market timing is {band(timing).toLowerCase()}. Owner: {pretty(decision.ownerAction)} · Long term: {pretty(decision.longTermAction)}.</p><button type="button" onClick={onOpenThesis} className="v2TextAction">View Full Thesis →</button></article>
  </div>
 </section>;
}
