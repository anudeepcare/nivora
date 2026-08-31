"use client";
import Link from "next/link";
import {Info} from "lucide-react";
import type{InvestorDecision,HorizonOutlook,PriceZone}from"@/lib/nivora-investor";
import {metricDefinitions} from "@/lib/nivora-metrics";

type Levels={entryLow:number;entryHigh:number;support:number;majorSupport:number;resistance:number;breakout:number;assetType?:string};
type Timing={label:string;reason:string;tone:"good"|"mid"|"bad"};
const tone=(x:string)=>x.includes("BULLISH")||x.includes("CONSTRUCTIVE")||x.includes("BUY")||x.includes("ACCUMULATE")||x==="ADD"||x==="HOLD"?"good":x.includes("BEARISH")||x.includes("CAUTIOUS")||x.includes("AVOID")||x.includes("REDUCE")||x.includes("EXIT")||x.includes("TRIM")?"bad":"mid";
const money=(x:number|null|undefined)=>typeof x==="number"&&Number.isFinite(x)&&x>0?`$${x.toFixed(2)}`:"—";
const zoneText=(z:PriceZone)=>z.low!=null&&z.high!=null?(Math.abs(z.high-z.low)<.01?money(z.low):`${money(z.low)}–${money(z.high)}`):"—";
function MetricInfo({metric}:{metric:keyof typeof metricDefinitions}){const d=metricDefinitions[metric];return <button type="button" className="v57Info" aria-label={`Explain ${d.title}`} data-tip={`${d.short} ${d.uses} Freshness: ${d.freshness} Source: ${d.source}`}><Info size={13}/></button>}
function HorizonBadge({h,best}:{h:HorizonOutlook;best:string}){if(h.key!==best||h.score<60)return null;return <em>{h.score>=75?"BEST HORIZON":"STRONGEST"}</em>}

export default function InvestorDecisionHero({decision,price,changePct,owns,onEvidence}:{decision:InvestorDecision;price:number;changePct:number;owns:boolean;levels:Levels;onEvidence:()=>void;timing?:Timing}){
 const topDrivers=decision.drivers.slice(0,3),topRisks=decision.risks.slice(0,3);
 const entryZones=decision.zones.filter(z=>["starter","accumulate","strong"].includes(z.kind)).slice(0,3);
 const chase=decision.zones.find(z=>z.kind==="chase");
 const riskZone=decision.zones.find(z=>z.kind==="risk");
 const streetDisagrees=!!decision.streetDisagreement?.active;
 return <section className="v53Cockpit v54Cockpit v57Cockpit">
   <div className="v53Top v54Top">
    <div className="v53DecisionMain">
      <small>NIVORA INVESTMENT VIEW</small>
      <div className="v53TitleLine"><h2 className={tone(decision.thesisLabel)}>{decision.thesisLabel}</h2><span>Thesis {decision.thesisScore}/100 <MetricInfo metric="forward"/></span><span>{decision.thesisState}</span></div>
      <p>{decision.oneLine}</p>
      {!decision.consistency.ok&&<div className="v53Consistency"><b>Decision withheld</b><span>{decision.consistency.notes[0]}</span></div>}
      {decision.vetoes.length>0&&<div className="v54Veto"><b>Risk veto</b><span>{decision.vetoes[0]}</span></div>}
    </div>
    <div className={`v53Action ${tone(decision.action)}`}><small>{owns?"YOUR POSITION":"NEW MONEY"}</small><b>{decision.action}</b><span>{decision.actionReason}</span></div>
   </div>

   {owns&&decision.position&&<div className="v53OwnerBar"><span><small>AVG COST</small><b>{money(decision.position.avgCost)}</b></span><span><small>PRICE NOW</small><b>{money(price)}</b></span><span><small>UNREALIZED</small><b className={decision.position.pnlPct>=0?"good":"bad"}>{decision.position.pnlPct>=0?"+":""}{decision.position.pnlPct.toFixed(1)}%</b></span><div><b>Cost basis changes position management only. It never changes NIVORA's independent company thesis.</b></div></div>}

   <div className="v54CoreStrip">
    <div><small>BUSINESS <MetricInfo metric="business"/></small><b>{decision.companyScore}</b><span>{decision.companyLabel}</span></div>
    <div><small>OPPORTUNITY <MetricInfo metric="opportunity"/></small><b>{decision.opportunityScore}</b><span>{decision.valuationLabel==="Unclear"?"Valuation pending":decision.valuationLabel}</span></div>
    <div><small>TIMING <MetricInfo metric="timing"/></small><b>{decision.timing.score}</b><span>{decision.timing.label}</span></div>
    <div><small>DATA COVERAGE <MetricInfo metric="dataCoverage"/></small><b>{decision.dataCompleteness}%</b><span>Reliability: {decision.modelConfidenceLabel} <MetricInfo metric="modelReliability"/></span></div>
   </div>

   <div className="v54EntryMap">
    <div className="v54EntryHead"><div><small>PRICE MAP <MetricInfo metric="priceMap"/></small><h3>Where NIVORA would act</h3><p>Fundamental valuation defines expected-return zones when available; technical structure refines execution. Missing valuation reduces certainty — it does not count as bearish evidence.</p></div><div className="v54Now"><small>NOW</small><b>{money(price)}</b><span className={changePct>=0?"good":"bad"}>{changePct>=0?"+":""}{changePct.toFixed(2)}%</span></div></div>
    <div className="v54ZoneGrid">
      {entryZones.length?entryZones.map((z,i)=><div key={`${z.kind}-${i}`} className={`zone-${z.kind}`}><small>{z.label}</small><b>{zoneText(z)}</b><span>{z.confidence} confidence · {z.basis}</span></div>):<div><small>ENTRY CONTEXT</small><b>Valuation zone not established</b><span>Use visible support/resistance as execution context while NIVORA waits for enough independent valuation evidence.</span></div>}
      {chase&&<div className="zone-chase"><small>{chase.label}</small><b>{zoneText(chase)}</b><span>{chase.basis}</span></div>}
      {riskZone&&<div className="zone-risk"><small>{riskZone.label}</small><b>{zoneText(riskZone)}</b><span>{riskZone.basis}</span></div>}
    </div>
   </div>

   <div className="v53HorizonWrap">
    <div className="v53HorizonIntro"><small>FORWARD OUTLOOK</small><b>3M → 3Y</b><span>Each horizon uses different evidence. Near-term weakness can coexist with a durable long-term thesis.</span></div>
    <div className="v53HorizonRail">{decision.horizons.map((h:HorizonOutlook)=><div key={h.key} className={`${tone(h.label)} ${h.key===decision.bestHorizon&&h.score>=60?"best":""}`} title={h.reason}><small>{h.key} <Info size={11}/></small><b>{h.label}</b><span>{h.score}</span><HorizonBadge h={h} best={decision.bestHorizon}/></div>)}</div>
   </div>

   <div className={`v54StreetRow ${decision.streetTarget?"":"noTarget"}`}>
    <div><small>NIVORA VALUATION <MetricInfo metric="valuation"/></small><b>{decision.valuationLabel==="Unclear"?"N/A · insufficient evidence":decision.valuationLabel}</b><span>{decision.valuationRange?`Bear ${money(decision.valuationRange.bear)} · Base ${money(decision.valuationRange.base)} · Bull ${money(decision.valuationRange.bull)} · ${decision.valuationRange.confidence} estimate confidence. ${decision.valuationRange.method}`:`${decision.valuationBasis} Missing valuation is excluded from opportunity/horizon weighting rather than scored as zero.`}</span></div>
    <div className={streetDisagrees?"disagree":""}><small>WALL STREET <MetricInfo metric="street"/></small><b>{decision.streetView.label}{decision.streetView.score!=null?` · ${decision.streetView.score}`:""}</b><span>{streetDisagrees?decision.streetDisagreement?.headline:decision.streetView.note}</span>{streetDisagrees&&decision.streetDisagreement?.reasons?.length?<ul>{decision.streetDisagreement.reasons.map((x,i)=><li key={i}>{x}</li>)}</ul>:null}</div>
    {decision.streetTarget&&<div><small>STREET TARGET <MetricInfo metric="street"/></small><b>{money(decision.streetTarget.mean)}</b><span>External consensus · {decision.streetTarget.upsidePct>=0?"+":""}{decision.streetTarget.upsidePct}% vs now. Kept separate from NIVORA valuation.</span></div>}
   </div>

   <div className="v53ThesisGrid">
    <div><small>WHY IT CAN WORK</small>{topDrivers.length?topDrivers.map((x,i)=><p key={i}>✓ {x}</p>):<p>No dominant positive evidence yet.</p>}</div>
    <div><small>WHAT CAN GO WRONG</small>{topRisks.length?topRisks.map((x,i)=><p key={i}>• {x}</p>):<p>No single risk currently dominates.</p>}</div>
    <div><small>{owns?"SELL / REASSESS IF":"WHAT BREAKS THE THESIS"}</small>{decision.breakers.slice(0,3).map((x,i)=><p key={i}>• {x}</p>)}</div>
   </div>

   <div className="v53FooterRow">
    <div><small>WHAT CHANGED</small><b>{decision.changed[0]||"No material thesis change detected."}</b><span>Daily price noise alone does not change company conviction.</span></div>
    <div className="v53MiniScores"><span><small>ARCHETYPE</small><b>{decision.archetype}</b></span><span><small>MODEL RELIABILITY <MetricInfo metric="modelReliability"/></small><b>{decision.modelConfidenceLabel}</b></span><span><small>CALIBRATION</small><b>{decision.modelConfidenceLabel==="Calibrated"?"Active":"Collecting"}</b></span><Link href="/methodology">Metric guide →</Link></div>
    <button type="button" onClick={onEvidence}>Open full research →</button>
   </div>
 </section>;
}
