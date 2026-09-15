"use client";
import PriceChart from "@/components/PriceChart";
import {formatMoney} from "@/lib/nivora-format";
import type {InstitutionalDecision} from "@/lib/auryn/v931/domain";

const num=(x:any)=>x==null||x===""?null:Number.isFinite(Number(x))?Number(x):null;
const money=(x:any)=>num(x)==null?"—":formatMoney(Number(x));
const pretty=(x:any)=>String(x||"—").replaceAll("_"," ");
const band=(x:number|null)=>x==null?"BUILDING":x>=75?"STRONG":x>=60?"CONSTRUCTIVE":x>=45?"MIXED":"WEAK";
const companyBand=(x:number|null)=>x==null?"BUILDING":x>=85?"ELITE COMPOUNDER":x>=72?"HIGH QUALITY":x>=58?"SOLID":x>=43?"MIXED":"CHALLENGED";
const valueBand=(x:number|null)=>x==null?"BUILDING":x>=75?"ATTRACTIVE":x>=60?"REASONABLE":x>=45?"FAIR / RICH":"EXPENSIVE";
const pos=(value:number|null,all:Array<number|null>)=>{if(value==null)return 50;const a=all.filter((v):v is number=>v!=null&&Number.isFinite(v));if(a.length<2)return 50;const lo=Math.min(...a),hi=Math.max(...a);return hi===lo?50:5+(value-lo)/(hi-lo)*90};

export default function AurynResearchOverviewV2({decision,marketTruth,displayPrice,displayPriceLive=false,marketIntelligence=null,fundamentalScenario=null,analystFundamentals=null,technicalEvidence=null,entryQuality=null,candles=[],chartLevels=null}:{decision:InstitutionalDecision;marketTruth:any;displayPrice?:number|null;displayPriceLive?:boolean;marketIntelligence?:any;fundamentalScenario?:any;analystFundamentals?:any;technicalEvidence?:any;entryQuality?:number|null;candles:any[];chartLevels:any}){
 const current=num(displayPrice??marketTruth?.price), business=num(decision.pillars.business.score), valuation=analystFundamentals?num(analystFundamentals.valuationScore):num(decision.pillars.valuation.score), timing=num(entryQuality??decision.pillars.marketStructure.score);
 const dims=analystFundamentals?.companyDimensions||{}, relative=analystFundamentals?.relativeContext||{}, valuationState=analystFundamentals?.valuationState||"UNAVAILABLE", valuationMethod=analystFundamentals?.method||"BUILDING", margin=num(analystFundamentals?.marginOfSafety), fair=num(analystFundamentals?.fairValue);
 const levels=chartLevels||{}, thesis=num(levels.invalidation), support=num(levels.majorSupport??levels.support), eLow=num(levels.entryLow??levels.preferredEntry), eHigh=num(levels.entryHigh??levels.preferredEntry), confirm=num(levels.confirm??levels.breakout), t1=num(levels.t1??levels.target1), t2=num(levels.t2??levels.target2);
 const rail=[thesis,support,eLow,eHigh,current,confirm,t1,t2];
 const decisionLane=(value:number|null)=>{if(value==null)return 0;const p=pos(value,rail);const close=rail.filter(v=>v!=null&&v!==value&&Math.abs(pos(v,rail)-p)<7).length;return close?1:0;};
 const catalysts=[decision.pillars.catalystsRegime.why,...(decision.drivers||[])].filter(Boolean).slice(0,3);
 const risks=[...(decision.counterEvidence||[]),...(decision.hardVetoReasons||[])].filter(Boolean).slice(0,3);
 const timingMetrics=[
  ["Trend",num(technicalEvidence?.trend)?.toFixed(0)||"—"],
  ["Momentum",num(technicalEvidence?.momentum)?.toFixed(0)||"—"],
  ["Participation",num(technicalEvidence?.participation)?.toFixed(0)||"—"],
  ["Relative strength",num(technicalEvidence?.relativeStrengthPct)!=null?`${Number(technicalEvidence.relativeStrengthPct)>=0?"+":""}${Number(technicalEvidence.relativeStrengthPct).toFixed(1)}%`:"—"],
  ["Volatility",num(technicalEvidence?.volatilityRisk)!=null?`${Math.round(Number(technicalEvidence.volatilityRisk))}/100`:"—"]
 ];
 return <section className="aurynOverviewV2">
  <div className="v2DecisionHero">
   <article className="v2Call"><small>AURYN CALL</small><h1>{pretty(decision.newMoneyAction)}</h1><p>{decision.pillars.business.why}</p><div className="v2Actions"><span>New Money <b>{pretty(decision.newMoneyAction)}</b></span><span>Owner <b>{pretty(decision.ownerAction)}</b></span><span>Long Term <b>{pretty(decision.longTermAction)}</b></span></div><footer><span>Confidence {decision.confidenceScore}/100</span><span>Evidence {decision.evidenceCompleteness}/100</span></footer></article>
   <article className="v2Chart"><header><small>PRICE CHART</small><b>{displayPriceLive?"LIVE":"VERIFIED RESEARCH"}</b></header><PriceChart candles={candles} levels={chartLevels}/></article>
   <article className="v2Structure"><header><small>PRICE STRUCTURE</small><b>{band(timing)}</b></header>{[["T2",t2],["T1",t1],["Confirm",confirm],["Current",current],["Entry high",eHigh],["Entry low",eLow],["Support",support],["Thesis",thesis]].map(([k,v]:any)=><div key={k}><span>{k}</span><b>{money(v)}</b></div>)}</article>
  </div>

  <div className="v2AnalystClocks">
   <article><header><small>1. BUSINESS QUALITY</small><b>{business==null?"BUILDING":`${business.toFixed(0)}/100`}</b></header><h3>{companyBand(business)}</h3><p>Trajectory · {pretty(analystFundamentals?.trajectory||"BUILDING")}</p><div className="v2MetricStrip">{[["Growth",dims.growth],["Profitability",dims.profitability],["Cash flow",dims.cashGeneration],["Balance sheet",dims.balanceSheet],["Durability",dims.durability],["Forward",dims.forwardEvidence]].map(([k,v])=><span key={k as string}><small>{k}</small><b>{num(v)==null?"—":Math.round(Number(v))}</b></span>)}</div></article>
   <article><header><small>2. VALUATION</small><b>{valuation==null?valuationState:`${valuation.toFixed(0)}/100`}</b></header><h3>{valuation==null?valuationState:valueBand(valuation)}</h3><p>{margin==null?`${pretty(valuationMethod)} · ${valuationState}`:`Margin of safety · ${margin>=0?"+":""}${margin.toFixed(1)}%`}</p><div className="v2MetricStrip v2ValueStrip"><span><small>vs History</small><b>{relative.vsHistory??"—"}</b></span><span><small>vs Peers</small><b>{relative.vsPeers??"—"}</b></span><span><small>Growth adjusted</small><b>{relative.growthAdjusted??"—"}</b></span><span><small>FCF yield</small><b>{num(relative.fcfYield)==null?"—":`${Number(relative.fcfYield).toFixed(1)}%`}</b></span><span><small>Fair value</small><b>{money(fair)}</b></span><span><small>Confidence</small><b>{fundamentalScenario?.confidence!=null?`${fundamentalScenario.confidence}/100`:"—"}</b></span></div></article>
   <article><header><small>3. MARKET TIMING</small><b>{timing==null?"BUILDING":`${timing.toFixed(0)}/100`}</b></header><h3>{band(timing)}</h3><p>Confirm {money(confirm)}</p><div className="v2MetricStrip">{timingMetrics.map(([k,v])=><span key={k}><small>{k}</small><b>{v}</b></span>)}</div></article>
  </div>

  <div className="v2DecisionVisuals">
   <article className="v2Scenario"><header><small>SCENARIO SPECTRUM</small><h2>Fundamental value</h2><span>Assumptions · not probabilities</span></header>{fundamentalScenario?<><div className="v2ScenarioCurrent">Current <b>{money(current)}</b></div><div className="v2ScenarioRail">{["bear","base","bull"].map(k=>{const v=num(fundamentalScenario[k]?.value),d=current&&v!=null?(v/current-1)*100:null;return <span key={k}><small>{k.toUpperCase()}</small><b>{money(v)}</b><em>{d==null?"—":`${d>=0?"+":""}${d.toFixed(1)}%`}</em></span>})}</div><div className="v2ScenarioCases"><span><b>Bear case</b><small>Growth and cash-flow durability disappoint; valuation policy uses a higher discount rate.</small></span><span><b>Base case</b><small>Current source-backed economics fade toward normalized long-term assumptions.</small></span><span><b>Bull case</b><small>Growth persists longer with stronger cash-flow conversion under the same policy guardrails.</small></span></div><div className="v2ScenarioAssumptions"><span>Revenue growth <b>{fundamentalScenario.assumptions?.observedRevenueGrowthPct==null?"—":`${Number(fundamentalScenario.assumptions.observedRevenueGrowthPct).toFixed(1)}%`}</b></span><span>FCF <b>{money(fundamentalScenario.assumptions?.currentFcf)}</b></span><span>Discount <b>{fundamentalScenario.assumptions?.baseDiscountRate}%</b></span><span>Terminal <b>{fundamentalScenario.assumptions?.baseTerminalGrowth}%</b></span></div></>:<div className="v2Building"><b>Fundamental valuation building</b><span>AURYN publishes fair value only when the selected valuation method has sufficient source-backed inputs.</span></div>}</article>
   <article className="v2DecisionMap"><header><small>DECISION MAP</small><h2>Execution plan</h2><span>Canonical price structure</span></header><div className="v2Rail">{[["Thesis",thesis,"risk"],["Support",support,"support"],["Entry",eLow,"entry"],["Current",current,"current"],["Confirm",confirm,"confirm"],["T1",t1,"target"],["T2",t2,"target"]].filter(([,v])=>v!=null).map(([k,v,c]:any)=><span className={`${c} lane-${decisionLane(v)}`} key={k} style={{left:`${pos(v,rail)}%`}}><i/><small>{k}</small><b>{money(v)}</b></span>)}</div><p>{current!=null&&confirm!=null&&current<confirm?`Price remains below confirmation at ${money(confirm)}. AURYN separates this execution level from long-term business quality.`:`Current price is being evaluated against the canonical execution map; business quality and fair value remain separate decisions.`}</p></article>
  </div>

  <div className="v2Synthesis">
   <article><small>KEY CATALYSTS</small>{catalysts.length?catalysts.map((x,i)=><p key={i}>↗ {x}</p>):<p>No decision-grade catalyst loaded.</p>}</article>
   <article><small>KEY RISKS</small>{risks.length?risks.map((x,i)=><p key={i}>⚠ {x}</p>):<p>No material canonical risk loaded.</p>}</article>
   <article><small>WHAT'S CHANGED</small><h3>{decision.changeExplanation?.changed?"Evidence changed":"No canonical state change"}</h3><p>{decision.changeExplanation?.changed?decision.changeExplanation.trigger:"AURYN waits for comparable evidence before calling a fundamental change."}</p></article>
   <article><small>AURYN VIEW</small><h3>{pretty(decision.newMoneyAction)}</h3><p>{companyBand(business)} business · {valueBand(valuation).toLowerCase()} valuation · {band(timing).toLowerCase()} timing. Owner: {pretty(decision.ownerAction)} · Long term: {pretty(decision.longTermAction)}.</p></article>
  </div>
 </section>;
}
