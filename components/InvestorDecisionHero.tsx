"use client";
import type{InvestorDecision,HorizonOutlook}from"@/lib/nivora-investor";

type Levels={entryLow:number;entryHigh:number;support:number;majorSupport:number;resistance:number;breakout:number;assetType?:string};
type Timing={label:string;reason:string;tone:"good"|"mid"|"bad"};
const tone=(x:string)=>x.includes("BULLISH")||x.includes("CONSTRUCTIVE")||x.includes("BUY")||x.includes("ACCUMULATE")?"good":x.includes("BEARISH")||x.includes("CAUTIOUS")||x.includes("AVOID")||x.includes("REDUCE")||x.includes("EXIT")?"bad":"mid";
const money=(x:number)=>Number.isFinite(x)&&x>0?`$${x.toFixed(2)}`:"—";

export default function InvestorDecisionHero({decision,price,changePct,owns,levels,onEvidence,timing}:{decision:InvestorDecision;price:number;changePct:number;owns:boolean;levels:Levels;onEvidence:()=>void;timing?:Timing}){
 const zoneWidth=price>0?(levels.entryHigh-levels.entryLow)/price:1;
 const validZone=levels.entryLow>0&&levels.entryHigh>=levels.entryLow&&zoneWidth<=(levels.assetType==="crypto"?.10:.07);
 const actionTone=tone(decision.action);
 const topDrivers=decision.drivers.slice(0,3), topRisks=decision.risks.slice(0,3);
 const entryText=validZone?`$${levels.entryLow.toFixed(2)}–$${levels.entryHigh.toFixed(2)}`:"No tight entry zone";
 const entryNote=validZone?"Best current technical confluence. It is timing guidance, not fair value.":"Current support is too broad to pretend there is a precise buy price.";
 return <section className="v52Cockpit">
   <div className="v52DecisionRow">
    <div className="v52DecisionMain">
      <small>NIVORA DECISION</small>
      <div className="v52TitleLine"><h2 className={tone(decision.thesisLabel)}>{decision.thesisLabel}</h2><span>{decision.thesisScore}/100 conviction</span><span>{decision.thesisState}</span></div>
      <p>{decision.oneLine}</p>
    </div>
    <div className={`v52Action ${actionTone}`}><small>{owns?"WHAT TO DO WITH YOUR POSITION":"WHAT TO DO WITH NEW MONEY"}</small><b>{decision.action}</b><span>{timing?.reason||"Thesis and timing are evaluated separately."}</span></div>
   </div>

   <div className="v52AnswerGrid">
    <div className="v52PrimaryAnswer"><small>BEST ENTRY NOW</small><b>{entryText}</b><span>{entryNote}</span></div>
    <div><small>PRICE NOW</small><b>{money(price)}</b><span className={changePct>=0?"good":"bad"}>{changePct>=0?"+":""}{changePct.toFixed(2)}% today</span></div>
    <div><small>BREAKOUT / PROOF</small><b>{money(levels.breakout||levels.resistance)}</b><span>Strength above this area improves timing.</span></div>
    <div><small>REASSESS AREA</small><b>{money(levels.majorSupport||levels.support)}</b><span>Technical warning only; business evidence decides thesis failure.</span></div>
   </div>

   <div className="v52HorizonWrap">
    <div className="v52HorizonIntro"><small>FORWARD OUTLOOK</small><b>One thesis, five time horizons</b><span>Price can change timing without rewriting the long-run business view.</span></div>
    <div className="v52HorizonRail">{decision.horizons.map((h:HorizonOutlook)=><div key={h.key} className={`${tone(h.label)} ${h.key===decision.bestHorizon?"best":""}`} title={h.reason}><small>{h.key}</small><b>{h.label}</b><span>{h.score}</span>{h.key===decision.bestHorizon&&<em>BEST</em>}</div>)}</div>
   </div>

   <div className="v52ThesisGrid">
    <div><small>WHY OWN / WATCH</small>{topDrivers.length?topDrivers.map((x,i)=><p key={i}>✓ {x}</p>):<p>No dominant positive evidence yet.</p>}</div>
    <div><small>WHAT CAN GO WRONG</small>{topRisks.length?topRisks.map((x,i)=><p key={i}>• {x}</p>):<p>No single risk currently dominates.</p>}</div>
    <div><small>WHAT BREAKS THE THESIS</small>{decision.breakers.slice(0,3).map((x,i)=><p key={i}>• {x}</p>)}</div>
   </div>

   <div className="v52FooterRow">
    <div><small>WHAT CHANGED</small><b>{decision.changed[0]||"No material thesis change detected."}</b><span>Daily price noise alone does not change conviction.</span></div>
    <div className="v52MiniScores"><span><small>BUSINESS</small><b>{decision.companyScore}</b></span><span><small>OPPORTUNITY</small><b>{decision.opportunityScore}</b></span><span><small>DATA COMPLETENESS</small><b>{decision.confidence}%</b></span></div>
    <button type="button" onClick={onEvidence}>Open full research →</button>
   </div>
 </section>
}
