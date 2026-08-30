"use client";
import type{InvestorDecision,HorizonOutlook}from"@/lib/nivora-investor";

type Levels={entryLow:number;entryHigh:number;support:number;majorSupport:number;resistance:number;breakout:number;assetType?:string};
type Timing={label:string;reason:string;tone:"good"|"mid"|"bad"};
const tone=(x:string)=>x.includes("BULLISH")||x.includes("CONSTRUCTIVE")||x.includes("BUY")||x.includes("ACCUMULATE")||x==="HOLD"?"good":x.includes("BEARISH")||x.includes("CAUTIOUS")||x.includes("AVOID")||x.includes("REDUCE")||x.includes("EXIT")?"bad":"mid";
const money=(x:number)=>Number.isFinite(x)&&x>0?`$${x.toFixed(2)}`:"—";

export default function InvestorDecisionHero({decision,price,changePct,owns,levels,onEvidence,timing}:{decision:InvestorDecision;price:number;changePct:number;owns:boolean;levels:Levels;onEvidence:()=>void;timing?:Timing}){
 const zoneWidth=price>0?(levels.entryHigh-levels.entryLow)/price:1;
 const validZone=levels.entryLow>0&&levels.entryHigh>=levels.entryLow&&zoneWidth<=(levels.assetType==="crypto"?.08:.055);
 const actionTone=tone(decision.action);
 const topDrivers=decision.drivers.slice(0,3), topRisks=decision.risks.slice(0,3);
 const bearish=decision.thesisLabel==="BEARISH";
 const entryTitle=bearish?"TECHNICAL SUPPORT ZONE":decision.valuationLabel==="Unclear"?"TIMING ZONE":"BEST ENTRY NOW";
 const entryText=validZone?`$${levels.entryLow.toFixed(2)}–$${levels.entryHigh.toFixed(2)}`:"No tight confluence zone";
 const entryNote=bearish?"Support is shown for context, not as a recommendation to buy a weak thesis.":validZone?(decision.valuationLabel==="Unclear"?"Technical timing only. Fundamental fair-value entry is not established.":"Technical confluence supporting the valuation view."):"Support is too broad to pretend there is a precise entry.";
 const position=decision.position;
 return <section className="v53Cockpit">
   <div className="v53Top">
    <div className="v53DecisionMain">
      <small>NIVORA INVESTMENT DECISION</small>
      <div className="v53TitleLine"><h2 className={tone(decision.thesisLabel)}>{decision.thesisLabel}</h2><span>{decision.thesisScore}/100 conviction</span><span>{decision.thesisState}</span></div>
      <p>{decision.oneLine}</p>
      {!decision.consistency.ok&&<div className="v53Consistency"><b>Decision held for review</b><span>{decision.consistency.notes[0]}</span></div>}
    </div>
    <div className={`v53Action ${actionTone}`}><small>{owns?"YOUR POSITION":"NEW MONEY"}</small><b>{decision.action}</b><span>{decision.actionReason||timing?.reason||"Thesis and timing are evaluated separately."}</span></div>
   </div>

   {owns&&position&&<div className="v53OwnerBar"><span><small>AVG COST</small><b>{money(position.avgCost)}</b></span><span><small>PRICE NOW</small><b>{money(price)}</b></span><span><small>UNREALIZED</small><b className={position.pnlPct>=0?"good":"bad"}>{position.pnlPct>=0?"+":""}{position.pnlPct.toFixed(1)}%</b></span><div><b>{position.belowCost&&decision.action.includes("HOLD")?"Do not sell solely because you are below cost.":"Cost basis informs position management, not company quality."}</b></div></div>}

   <div className="v53DecisionStrip">
    <div className={bearish?"v53Support":"v53PrimaryAnswer"}><small>{entryTitle}</small><b>{entryText}</b><span>{entryNote}</span></div>
    <div><small>PRICE NOW</small><b>{money(price)}</b><span className={changePct>=0?"good":"bad"}>{changePct>=0?"+":""}{changePct.toFixed(2)}% today</span></div>
    <div><small>PROOF / RESISTANCE</small><b>{money(levels.breakout||levels.resistance)}</b><span>Price strength can improve timing; it does not create the thesis.</span></div>
    <div><small>THESIS / RISK CHECK</small><b>{decision.valuationLabel}</b><span>{decision.streetTarget?`Street target ${money(decision.streetTarget.mean)} (${decision.streetTarget.upsidePct>=0?"+":""}${decision.streetTarget.upsidePct}%).`:`Independent fair value is not established yet.`}</span></div>
   </div>

   <div className="v53HorizonWrap">
    <div className="v53HorizonIntro"><small>FORWARD OUTLOOK</small><b>3M → 3Y, automatically</b><span>Near-term timing can be weak while the long-term investment case remains strong.</span></div>
    <div className="v53HorizonRail">{decision.horizons.map((h:HorizonOutlook)=><div key={h.key} className={`${tone(h.label)} ${h.key===decision.bestHorizon?"best":""}`} title={h.reason}><small>{h.key}</small><b>{h.label}</b><span>{h.score}</span>{h.key===decision.bestHorizon&&<em>BEST</em>}</div>)}</div>
   </div>

   <div className="v53ThesisGrid">
    <div><small>WHY IT CAN WORK</small>{topDrivers.length?topDrivers.map((x,i)=><p key={i}>✓ {x}</p>):<p>No dominant positive evidence yet.</p>}</div>
    <div><small>WHAT CAN GO WRONG</small>{topRisks.length?topRisks.map((x,i)=><p key={i}>• {x}</p>):<p>No single risk currently dominates.</p>}</div>
    <div><small>{owns?"SELL / REASSESS IF":"WHAT BREAKS THE THESIS"}</small>{decision.breakers.slice(0,3).map((x,i)=><p key={i}>• {x}</p>)}</div>
   </div>

   <div className="v53FooterRow">
    <div><small>WHAT CHANGED</small><b>{decision.changed[0]||"No material thesis change detected."}</b><span>Daily price noise alone does not change company conviction.</span></div>
    <div className="v53MiniScores"><span><small>BUSINESS</small><b>{decision.companyScore}</b></span><span><small>OPPORTUNITY</small><b>{decision.opportunityScore}</b></span><span><small>DATA COMPLETENESS</small><b>{decision.confidence}%</b></span></div>
    <button type="button" onClick={onEvidence}>Open full research →</button>
   </div>
 </section>;
}
