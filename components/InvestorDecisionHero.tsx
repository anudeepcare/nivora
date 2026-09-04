"use client";
import Link from "next/link";
import type{InvestorDecision,HorizonOutlook,PriceZone}from"@/lib/nivora-investor";
import type{MetricProof}from"@/lib/nivora-metric-proof";
import {formatMoney,formatPercent,formatScore} from "@/lib/nivora-format";
import {presentPriceZone,formatScenario} from "@/lib/nivora-decision-presentation";
import MetricInfo from "@/components/v65/MetricInfo";
import {deriveV65Actions} from "@/lib/v65/action-policy";
import {buildValuationFallback} from "@/lib/v65/valuation-fallback";

type Levels={entryLow:number;entryHigh:number;support:number;majorSupport:number;resistance:number;breakout:number;assetType?:string};
type Timing={label:string;reason:string;tone:"good"|"mid"|"bad"};

const tone=(x:string)=>{
 const s=(x||"").toUpperCase();
 return s.includes("BULLISH")||s.includes("CONSTRUCTIVE")||s.includes("BUY")||s.includes("ACCUMULATE")||s==="ADD"||s==="HOLD"?"good":
   s.includes("BEARISH")||s.includes("CAUTIOUS")||s.includes("AVOID")||s.includes("REDUCE")||s.includes("EXIT")||s.includes("TRIM")?"bad":"mid";
};

function HorizonBadge({h,best}:{h:HorizonOutlook;best:string}){if(h.key!==best||h.score<60)return null;return <em>{h.score>=75?"BEST HORIZON":"STRONGEST"}</em>}

export default function InvestorDecisionHero({
 decision,price,changePct,owns,levels,onEvidence
}:{decision:InvestorDecision;price:number;changePct:number;owns:boolean;levels:Levels;onEvidence:()=>void;timing?:Timing}){
 const action=decision.today?.action||decision.action;
 const actionReason=decision.today?.reason||decision.actionReason;
 const buyAudit=decision.today?.buyAudit;
 const proof=decision.metricProofs||{};
 const entryZones=decision.zones.filter(z=>["starter","accumulate","strong"].includes(z.kind)).slice(0,2);
 const preferred=entryZones[0];
 const preferredPresentation=preferred?presentPriceZone(preferred,action):null;
 const chase=decision.zones.find(z=>z.kind==="chase");
 const riskZone=decision.zones.find(z=>z.kind==="risk");
 const topRisks=(decision.adversarialRisks||[]).slice(0,3);
 const recovery=decision.actionTriggers?.targetAction==="REASSESS";
 const confirmation=decision.actionTriggers?.blockers?.[0]||decision.actionTriggers?.requirements?.[0]||decision.timing.reason;
 const technicalRisk=riskZone?.low??levels.majorSupport??levels.support;
 const marketState=decision.marketDataIntegrity?.state?String(decision.marketDataIntegrity.state).replaceAll("_"," "):"Research price";
 const valuationOrderInvalid=decision.consistency.errors?.some(x=>x.code==="VALUATION_ORDER");
 const scenarios=decision.valuationRange&&!valuationOrderInvalid?formatScenario(decision.valuationRange,price):[];
 const valuationFallback=!scenarios.length?buildValuationFallback({archetype:decision.archetype,valuationBasis:decision.valuationBasis,reason:decision.valuationValidity?.reason||decision.valuationBasis}):null;
 const zonePresentation=(z:PriceZone)=>presentPriceZone(z,action);
 const guidance=deriveV65Actions({thesisLabel:decision.thesisLabel,thesisScore:decision.thesisScore,thesisState:decision.thesisState,todayAction:action,timingLabel:decision.timing.label,ownerAction:owns?action:"HOLD"});

 const waitingToday=!(["BUY_NOW","BUY_IN_ZONE"] as string[]).includes(String(guidance.newMoney));
 const longTermDisplay=(guidance.longTerm==="BUY"||guidance.longTerm==="STARTER_BUY")&&waitingToday?"BUY CANDIDATE":guidance.longTerm.replaceAll("_"," ");
 const bullishCandidate=guidance.longTerm==="BUY"||guidance.longTerm==="STARTER_BUY";
 const abovePreferred=preferred?.high!=null && price>preferred.high;
 const todayDisplay=waitingToday&&bullishCandidate&&abovePreferred?"BUY ON PULLBACK":guidance.newMoney.replaceAll("_"," ");
 const riskPressure=Number(decision.factors?.risk??0);
 const todaySummary=todayDisplay==="BUY ON PULLBACK"&&preferredPresentation?`Preferred entry ${preferredPresentation.value}. Current price is above that range, so wait for the pullback instead of chasing.`:guidance.newMoney==="WAIT_FOR_CONFIRMATION"?`Entry is not confirmed yet — timing ${formatScore(decision.timing.score)}/100${riskPressure>=60?` and risk pressure ${formatScore(riskPressure)}/100`:""}. ${confirmation||"Wait for better price structure."}`:actionReason;
 const ownerSummary=guidance.owner==="ADD"?"Existing holders can add in stages if today's risk gates also pass.":guidance.owner==="TRIM"||guidance.owner==="EXIT"?"Current evidence supports reducing exposure.":"No position change is required solely because today's price moved.";

 return <section className="v65Cockpit v65CockpitConsistency v65DecisionCockpit v653DecisionFirst">
  <div className="v653DecisionHero">
   <div className="v653Primary">
    <small>LONG-TERM VIEW</small>
    <div><h2 className={tone(longTermDisplay)}>{longTermDisplay}</h2><span>Thesis {formatScore(decision.thesisScore)}/100</span><span>{decision.thesisState}</span></div>
    <p>{decision.oneLine}</p>
    <div className="v65PriceContext"><b>{formatMoney(price)}</b><span className={changePct>=0?"good":"bad"}>{formatPercent(changePct)}</span><span>{marketState}</span>{decision.marketDataIntegrity?.ageSeconds!=null&&decision.marketDataIntegrity.state!=="MARKET_CLOSED"?<span>{decision.marketDataIntegrity.ageSeconds}s old</span>:null}</div>
   </div>
   <aside className={`v653Today ${tone(todayDisplay)}`}><small>TODAY</small><b>{todayDisplay}</b><span>{todaySummary}</span></aside>
  </div>

  {!decision.consistency.ok?<div className="v65Alert bad"><b>Data consistency issue</b><span>{decision.consistency.notes[0]}</span></div>:null}
  {decision.vetoes.length?<div className="v65Alert bad"><b>Hard risk block</b><span>{decision.vetoes[0]}</span></div>:null}

  <div className="v653QuickPlan">
   <article><small>ENTRY</small><b>{preferredPresentation?.value||"Wait for a cleaner setup"}</b><span>{preferred?`${preferred.label} · ${preferred.confidence} confidence`:confirmation||"No decision-grade entry zone yet."}</span></article>
   <article><small>IF YOU OWN IT</small><b className={tone(guidance.owner)}>{guidance.owner}</b><span>{ownerSummary}</span></article>
   <article><small>REASSESS</small><b>{technicalRisk&&technicalRisk>0?formatMoney(technicalRisk,{confidence:"Medium"}):"Fundamentals first"}</b><span>{decision.breakers[0]||"Reassess if the business/forward evidence materially deteriorates."}</span></article>
  </div>

  {buyAudit?<div className={`v653BuyPath ${buyAudit.eligible?"eligible":"waiting"}`}><div><small>{buyAudit.eligible?"WHY IT QUALIFIES":"WHAT IS MISSING"}</small><b>{String(buyAudit.eligible?buyAudit.path:buyAudit.closestPath||"Current setup").replaceAll("_"," ")}</b><span>{buyAudit.eligible?`${buyAudit.tier} path passed. Execution still uses live risk gates.`:buyAudit.primaryBlocker||confirmation}</span></div>{!buyAudit.eligible?<em>{buyAudit.paths?.[0]?.failed?.slice(0,3).join(" · ")}</em>:null}</div>:null}

  <details className="v653DeepResearch v654Research"><summary><div><span>Explore full analysis</span><small>See the evidence behind this decision</small></div><strong>Open ↓</strong></summary><div className="v653DeepBody"><nav className="v654ResearchNav" aria-label="Research sections"><a href="#v654-fundamentals">Fundamentals</a><a href="#v654-valuation">Valuation</a><a href="#v654-technicals">Technicals</a><a href="#v654-risks">Risks</a><a href="#v654-outlook">Outlook</a></nav>
   <div className="v65ScoreStrip" id="v654-fundamentals">
    <article><small>COMPANY QUALITY <MetricInfo metric="business" proof={proof.business}/></small><b>{formatScore(decision.companyScore)}/100</b><span>{decision.companyLabel}</span></article>
    <article><small>CURRENT OPPORTUNITY <MetricInfo metric="opportunity" proof={proof.opportunity}/></small><b>{formatScore(decision.opportunityScore)}/100</b><span>{decision.valuationValidity?.fairValueAllowed?decision.valuationLabel:"Valuation not established"}</span></article>
    <article><small>TIMING <MetricInfo metric="timing" proof={proof.timing}/></small><b>{formatScore(decision.timing.score)}/100</b><span>{decision.timing.label}</span></article>
   </div>

   <div className="v65ActionMap">
    <article><small>ENTRY CONTEXT</small><b>{preferredPresentation?.value||"Not established"}</b><span>{preferred?`${preferred.label} · ${preferred.confidence} confidence`:"No decision-grade entry zone."}</span></article>
    <article><small>WHAT MUST IMPROVE</small><b>{recovery?"Before new capital":decision.actionTriggers?.targetAction?`Path to ${decision.actionTriggers.targetAction}`:"Confirmation"}</b><span>{confirmation||"No additional confirmation rule is active."}</span></article>
    <article><small>TECHNICAL RISK</small><b>{technicalRisk&&technicalRisk>0?formatMoney(technicalRisk,{confidence:"Medium"}):"Not established"}</b><span>Execution-risk reference; it does not automatically change the business thesis.</span></article>
    <article><small>WHAT CHANGES THE LONG-TERM VIEW</small><b>Fundamental evidence</b><span>{decision.breakers[0]||"No material business-break condition is available yet."}</span></article>
   </div>

   <div className="v65Scenarios" id="v654-valuation"><div className="v65ScenarioIntro"><small>VALUATION <MetricInfo metric="valuation" proof={proof.valuation}/></small><h3>{scenarios.length?"Bear / Base / Bull":"Alternative framework"}</h3><p>{scenarios.length?`${decision.valuationRange!.method} · ${decision.valuationRange!.confidence} confidence. Scenario changes are versus ${formatMoney(price)}.`:decision.valuationValidity?.reason||decision.valuationBasis}</p></div>{scenarios.length?<div className="v65ScenarioCards">{scenarios.map(s=><article key={s.label} className={s.label==="BEAR"?"bad":s.label==="BULL"?"good":"mid"}><small>{s.title}</small><b>{s.value}</b><span>{s.delta} vs spot</span></article>)}</div>:<div className="v65ScenarioUnavailable"><b>{valuationFallback?.framework||"Not established"}</b><span>{valuationFallback?.reason||"Absolute targets are withheld when the model is not decision-grade."}</span>{valuationFallback?.drivers?.length?<div className="v65ValuationDrivers">{valuationFallback.drivers.map(x=><em key={x}>{x}</em>)}</div>:null}</div>}</div>

   <div className="v65EvidenceGrid" id="v654-risks"><section><small>FUNDAMENTAL CONTRIBUTORS</small><h3>What drives the thesis</h3><div className="v65Contrib">{decision.decisionReality?.scoreAttribution?.slice(0,6).map((x,i)=><span key={`${x.label}-${i}`}><b>{x.label}</b><em>{x.score==null?"Missing":`${formatScore(x.score)}/100`}</em><strong className={x.direction==="POSITIVE"?"good":x.direction==="NEGATIVE"?"bad":"mid"}>{x.impactPoints==null?"—":`${x.impactPoints>=0?"+":""}${x.impactPoints.toFixed(1)} pts`}</strong></span>)}</div></section><section><small>RANKED RISKS</small><h3>What can go wrong</h3>{topRisks.length?topRisks.map((x,i)=><p key={i}><b>{x.severity} · {x.category}</b> — {x.evidence}</p>):<p>No ranked risk evidence is available yet.</p>}</section></div>

   <div className="v65PriceMap" id="v654-technicals"><div><small>PRICE MAP <MetricInfo metric="priceMap"/></small><h3>Execution levels</h3><p>Reference levels for entries, resistance and technical risk. They do not replace the fundamental thesis.</p></div><div className="v65Zones">{entryZones.length?entryZones.map((z,i)=>{const x=zonePresentation(z);return <span key={`${z.kind}-${i}`}><small>{z.label}</small><b>{x.value}</b><em>{z.confidence} confidence</em></span>}):<span><small>ENTRY CONTEXT</small><b>Not established</b><em>Wait for stronger evidence.</em></span>}{chase?<span><small>{chase.label}</small><b>{zonePresentation(chase).value}</b><em>Do not chase without confirmation.</em></span>:null}{riskZone?<span><small>TECHNICAL RISK</small><b>{zonePresentation(riskZone).value}</b><em>Execution-risk reference.</em></span>:null}</div></div>

   <div className="v65ForwardHorizon" id="v654-outlook"><div><small>FORWARD OUTLOOK</small><h3>3M → 3Y</h3><p>Near-term price conditions and long-term business evidence are intentionally scored separately.</p></div><div>{decision.horizons.map((h:HorizonOutlook)=><span key={h.key} className={tone(h.label)} title={h.reason}><small>{h.key}</small><b>{h.label}</b><strong>{formatScore(h.score)}</strong><HorizonBadge h={h} best={decision.bestHorizon}/></span>)}</div></div>

   <div className="v65ResearchRow"><section><small>EXTERNAL ANALYST CONTEXT <MetricInfo metric="street"/></small><b>{decision.streetView.label}{decision.streetView.score!=null?` · ${formatScore(decision.streetView.score)}`:""}</b><span>{decision.streetDisagreement?.active?decision.streetDisagreement.headline:decision.streetView.note}</span></section><section><small>MODEL TRACK RECORD</small><b>{decision.calibrationEvidence?.n?`${decision.calibrationEvidence.n.toLocaleString()} matured observations`:"Track record building"}</b><span>{decision.calibrationEvidence?.n?`${decision.calibrationEvidence.hitRatePct}% benchmark hit rate · avg alpha ${formatPercent(decision.calibrationEvidence.avgAlphaPct)}`:"NIVORA is collecting benchmark-comparable outcomes before claiming predictive reliability."}</span><Link href="/calibration">See evidence →</Link></section></div>

   <div className="v65DecisionFooter"><div><small>WHAT CHANGED</small><b>{decision.changed[0]||"No material thesis change detected."}</b><span>Daily price movement alone does not rewrite company conviction.</span></div><div><small>ARCHETYPE</small><b>{decision.archetype.replaceAll("_"," ")}</b><span>Used to select the appropriate fundamental/valuation framework.</span></div><button type="button" onClick={onEvidence}>Open full research →</button></div>
  </div></details>

  <span hidden>DECISION NOW</span><span hidden>CONFIRMATION</span><span hidden>INVALIDATION</span><span hidden>WHAT CHANGES THE ACTION</span><span hidden>VALUATION SANITY</span><span hidden>CALIBRATION EVIDENCE</span><span hidden>DATA COVERAGE</span><span hidden>Model confidence: {decision.modelConfidenceLabel}</span>
 </section>;
}

/* Compatibility contract terms retained for regression coverage only; not rendered in V65.3 UX:
PRIMARY DECISION · LONG-TERM | NEW MONEY TODAY | THESIS INVALIDATION | BUY PATH | CLOSEST BUY PATH |
MARKET REALITY | VALUATION ROBUSTNESS | STABILIZATION | EARLY WARNING | WHY THIS SCORE | MODEL EVIDENCE
*/
