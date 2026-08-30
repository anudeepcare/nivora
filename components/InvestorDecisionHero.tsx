"use client";
import Link from "next/link";
import type {InvestorDecision} from "@/lib/nivora-investor";

export default function InvestorDecisionHero({decision,price,changePct,owns,onEvidence}:{decision:InvestorDecision;price:number;changePct:number;owns:boolean;onEvidence:()=>void}){
  const thesisTone=decision.thesisLabel==="BULLISH"?"good":decision.thesisLabel==="BEARISH"?"bad":"mid";
  const actionTone=decision.action.includes("BUY")||decision.action==="ACCUMULATE"?"good":decision.action.includes("EXIT")||decision.action==="REDUCE"?"bad":"mid";
  return <section className={`v48Hero ${thesisTone}`} aria-label="NIVORA long-term investment decision">
    <div className="v48HeroMain">
      <div className="v48Eyebrow"><span>NIVORA INVESTMENT VIEW</span><em>{decision.horizon}</em><em>{owns?"EXISTING OWNER":"NEW CAPITAL"}</em></div>
      <div className="v48Headline"><div><h2>{decision.thesisLabel}</h2><p>{decision.thesisState} thesis · {decision.thesisScore}/100 conviction</p></div><div className={`v48Action ${actionTone}`}><small>ACTION</small><b>{decision.action}</b></div></div>
      <p className="v48OneLine">{decision.oneLine}</p>
      <div className="v48CoreScores">
        <span><small>COMPANY</small><b>{decision.companyScore}</b><em>{decision.companyLabel}</em></span>
        <span><small>THESIS</small><b>{decision.thesisScore}</b><em>{decision.thesisState}</em></span>
        <span><small>OPPORTUNITY</small><b>{decision.opportunityScore}</b><em>Price + valuation</em></span>
        <span><small>VALUATION</small><b>{decision.valuationLabel}</b><em>{decision.streetTarget?`${decision.streetTarget.upsidePct>=0?"+":""}${decision.streetTarget.upsidePct}% to Street mean`:`No verified independent target`}</em></span>
      </div>
    </div>
    <aside className="v48HeroAside">
      <div className="v48PriceContext"><small>PRICE TODAY</small><b>${Number(price).toFixed(2)}</b><span className={changePct>=0?"good":"bad"}>{changePct>=0?"+":""}{Number(changePct).toFixed(2)}%</span><p>A daily move changes opportunity/timing. It does not automatically rewrite the business thesis.</p></div>
      <button type="button" onClick={onEvidence}>Why does NIVORA believe this? →</button>
    </aside>
    <div className="v48EvidenceRow">
      <div><small>WHY OWN / WATCH</small>{decision.drivers.length?decision.drivers.map((x,i)=><p key={i}>✓ {x}</p>):<p>No dominant positive evidence yet.</p>}</div>
      <div><small>MAIN RISKS</small>{decision.risks.length?decision.risks.map((x,i)=><p key={i}>• {x}</p>):<p>No single material risk dominates the evidence.</p>}</div>
      <div><small>WHAT BREAKS THE THESIS</small>{decision.breakers.slice(0,2).map((x,i)=><p key={i}>• {x}</p>)}</div>
    </div>
    <div className="v48Trust"><span><b>Decision-support research.</b> Thesis and valuation can be wrong; no outcome is guaranteed.</span><div><Link href="/about">Methodology</Link><Link href="/disclaimer">Risk disclosure</Link></div></div>
  </section>;
}
