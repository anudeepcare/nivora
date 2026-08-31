"use client";
import type{InvestorDecision,HorizonOutlook,PriceZone}from"@/lib/nivora-investor";

type Levels={entryLow:number;entryHigh:number;support:number;majorSupport:number;resistance:number;breakout:number;assetType?:string};
type Timing={label:string;reason:string;tone:"good"|"mid"|"bad"};
const tone=(x:string)=>x.includes("BULLISH")||x.includes("CONSTRUCTIVE")||x.includes("BUY")||x.includes("ACCUMULATE")||x==="ADD"||x==="HOLD"?"good":x.includes("BEARISH")||x.includes("CAUTIOUS")||x.includes("AVOID")||x.includes("REDUCE")||x.includes("EXIT")||x.includes("TRIM")?"bad":"mid";
const money=(x:number|null|undefined)=>typeof x==="number"&&Number.isFinite(x)&&x>0?`$${x.toFixed(2)}`:"—";
const zoneText=(z:PriceZone)=>z.low!=null&&z.high!=null?(Math.abs(z.high-z.low)<.01?money(z.low):`${money(z.low)}–${money(z.high)}`):"—";

export default function InvestorDecisionHero({decision,price,changePct,owns,onEvidence}:{decision:InvestorDecision;price:number;changePct:number;owns:boolean;levels:Levels;onEvidence:()=>void;timing?:Timing}){
 const topDrivers=decision.drivers.slice(0,3),topRisks=decision.risks.slice(0,3);
 const entryZones=decision.zones.filter(z=>["starter","accumulate","strong"].includes(z.kind)).slice(0,3);
 const chase=decision.zones.find(z=>z.kind==="chase");
 const riskZone=decision.zones.find(z=>z.kind==="risk");
 const streetDisagrees=(decision.streetView.label==="Positive"&&decision.thesisLabel==="BEARISH")||(decision.streetView.label==="Cautious"&&decision.thesisLabel==="BULLISH");
 return <section className="v53Cockpit v54Cockpit">
   <div className="v53Top v54Top">
    <div className="v53DecisionMain">
      <small>NIVORA INVESTMENT VIEW</small>
      <div className="v53TitleLine"><h2 className={tone(decision.thesisLabel)}>{decision.thesisLabel}</h2><span>Thesis {decision.thesisScore}/100</span><span>{decision.thesisState}</span></div>
      <p>{decision.oneLine}</p>
      {!decision.consistency.ok&&<div className="v53Consistency"><b>Decision withheld</b><span>{decision.consistency.notes[0]}</span></div>}
      {decision.vetoes.length>0&&<div className="v54Veto"><b>Risk veto</b><span>{decision.vetoes[0]}</span></div>}
    </div>
    <div className={`v53Action ${tone(decision.action)}`}><small>{owns?"YOUR POSITION":"NEW MONEY"}</small><b>{decision.action}</b><span>{decision.actionReason}</span></div>
   </div>

   {owns&&decision.position&&<div className="v53OwnerBar"><span><small>AVG COST</small><b>{money(decision.position.avgCost)}</b></span><span><small>PRICE NOW</small><b>{money(price)}</b></span><span><small>UNREALIZED</small><b className={decision.position.pnlPct>=0?"good":"bad"}>{decision.position.pnlPct>=0?"+":""}{decision.position.pnlPct.toFixed(1)}%</b></span><div><b>Cost basis changes position management only. It never changes NIVORA's independent company thesis.</b></div></div>}

   <div className="v54CoreStrip">
    <div><small>BUSINESS</small><b>{decision.companyScore}</b><span>{decision.companyLabel}</span></div>
    <div><small>OPPORTUNITY</small><b>{decision.opportunityScore}</b><span>{decision.valuationLabel}</span></div>
    <div><small>TIMING</small><b>{decision.timing.score}</b><span>{decision.timing.label}</span></div>
    <div><small>DATA COVERAGE</small><b>{decision.dataCompleteness}%</b><span>Model confidence: {decision.modelConfidenceLabel}</span></div>
   </div>

   <div className="v54EntryMap">
    <div className="v54EntryHead"><div><small>PRICE MAP</small><h3>Where NIVORA would act</h3><p>Technical levels refine execution. They do not manufacture fair value or change the company thesis.</p></div><div className="v54Now"><small>NOW</small><b>{money(price)}</b><span className={changePct>=0?"good":"bad"}>{changePct>=0?"+":""}{changePct.toFixed(2)}%</span></div></div>
    <div className="v54ZoneGrid">
      {entryZones.length?entryZones.map((z,i)=><div key={`${z.kind}-${i}`} className={`zone-${z.kind}`}><small>{z.label}</small><b>{zoneText(z)}</b><span>{z.confidence} confidence · {z.basis}</span></div>):<div><small>ENTRY ZONE</small><b>Not established</b><span>NIVORA does not have enough independent evidence to fabricate a precise buy range.</span></div>}
      {chase&&<div className="zone-chase"><small>{chase.label}</small><b>{zoneText(chase)}</b><span>{chase.basis}</span></div>}
      {riskZone&&<div className="zone-risk"><small>{riskZone.label}</small><b>{zoneText(riskZone)}</b><span>{riskZone.basis}</span></div>}
    </div>
   </div>

   <div className="v53HorizonWrap">
    <div className="v53HorizonIntro"><small>FORWARD OUTLOOK</small><b>3M → 3Y</b><span>Each horizon uses different evidence. Near-term weakness can coexist with a durable long-term thesis.</span></div>
    <div className="v53HorizonRail">{decision.horizons.map((h:HorizonOutlook)=><div key={h.key} className={`${tone(h.label)} ${h.key===decision.bestHorizon?"best":""}`} title={h.reason}><small>{h.key}</small><b>{h.label}</b><span>{h.score}</span>{h.key===decision.bestHorizon&&<em>BEST</em>}</div>)}</div>
   </div>

   <div className="v54StreetRow">
    <div><small>NIVORA VALUATION</small><b>{decision.valuationLabel}</b><span>{decision.valuationBasis}</span></div>
    <div className={streetDisagrees?"disagree":""}><small>WALL STREET</small><b>{decision.streetView.label}{decision.streetView.score!=null?` · ${decision.streetView.score}`:""}</b><span>{streetDisagrees?`NIVORA disagrees with the Street. ${decision.streetView.note}`:decision.streetView.note}</span></div>
    <div><small>STREET TARGET</small><b>{decision.streetTarget?money(decision.streetTarget.mean):"Unavailable"}</b><span>{decision.streetTarget?`Reference only · ${decision.streetTarget.upsidePct>=0?"+":""}${decision.streetTarget.upsidePct}% vs now. Not NIVORA fair value.`:"Not used as a substitute for NIVORA fair value."}</span></div>
   </div>

   <div className="v53ThesisGrid">
    <div><small>WHY IT CAN WORK</small>{topDrivers.length?topDrivers.map((x,i)=><p key={i}>✓ {x}</p>):<p>No dominant positive evidence yet.</p>}</div>
    <div><small>WHAT CAN GO WRONG</small>{topRisks.length?topRisks.map((x,i)=><p key={i}>• {x}</p>):<p>No single risk currently dominates.</p>}</div>
    <div><small>{owns?"SELL / REASSESS IF":"WHAT BREAKS THE THESIS"}</small>{decision.breakers.slice(0,3).map((x,i)=><p key={i}>• {x}</p>)}</div>
   </div>

   <div className="v53FooterRow">
    <div><small>WHAT CHANGED</small><b>{decision.changed[0]||"No material thesis change detected."}</b><span>Daily price noise alone does not change company conviction.</span></div>
    <div className="v53MiniScores"><span><small>ARCHETYPE</small><b>{decision.archetype}</b></span><span><small>MODEL CONFIDENCE</small><b>—</b></span><span><small>CALIBRATION</small><b>Collecting</b></span></div>
    <button type="button" onClick={onEvidence}>Open full research →</button>
   </div>
 </section>;
}
