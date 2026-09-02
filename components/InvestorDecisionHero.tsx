"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {Info} from "lucide-react";
import type{InvestorDecision,HorizonOutlook,PriceZone}from"@/lib/nivora-investor";
import type{MetricProof}from"@/lib/nivora-metric-proof";
import {metricDefinitions} from "@/lib/nivora-metrics";
import {formatMoney,formatPercent,formatScore} from "@/lib/nivora-format";
import {presentPriceZone,formatScenario} from "@/lib/nivora-decision-presentation";

type Levels={entryLow:number;entryHigh:number;support:number;majorSupport:number;resistance:number;breakout:number;assetType?:string};
type Timing={label:string;reason:string;tone:"good"|"mid"|"bad"};

const tone=(x:string)=>{
 const s=(x||"").toUpperCase();
 return s.includes("BULLISH")||s.includes("CONSTRUCTIVE")||s.includes("BUY")||s.includes("ACCUMULATE")||s==="ADD"||s==="HOLD"?"good":
   s.includes("BEARISH")||s.includes("CAUTIOUS")||s.includes("AVOID")||s.includes("REDUCE")||s.includes("EXIT")||s.includes("TRIM")?"bad":"mid";
};

function MetricInfo({metric,proof}:{metric:keyof typeof metricDefinitions;proof?:MetricProof}){
 const [open,setOpen]=useState(false);
 const ref=useRef<HTMLSpanElement>(null);
 const d=metricDefinitions[metric];
 useEffect(()=>{
  if(!open)return;
  const outside=(e:PointerEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};
  const esc=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)};
  document.addEventListener("pointerdown",outside);
  document.addEventListener("keydown",esc);
  return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",esc)};
 },[open]);
 return <span className="v641MetricInfo" ref={ref}>
  <button type="button" aria-label={`Explain ${d.title}`} aria-expanded={open} onClick={(e)=>{e.stopPropagation();setOpen(v=>!v)}}><Info size={13}/></button>
  {open?<span className="v641MetricPopover" role="dialog" aria-label={`${d.title} details`}>
   <b>{d.title}</b>
   <p>{d.short}</p>
   <dl>
    <div><dt>Uses</dt><dd>{d.uses}</dd></div>
    <div><dt>Freshness</dt><dd>{proof?.freshness||d.freshness}</dd></div>
    <div><dt>Source</dt><dd>{proof?.sources?.join(" · ")||d.source}</dd></div>
    <div><dt>Formula</dt><dd>{proof?.formulaVersion||"NIVORA metric contract"}</dd></div>
    <div><dt>Validation</dt><dd>{proof?.validationStatus||"UNVALIDATED"}</dd></div>
   </dl>
   {proof?.warning?<em>{proof.warning}</em>:null}
  </span>:null}
 </span>;
}

function HorizonBadge({h,best}:{h:HorizonOutlook;best:string}){if(h.key!==best||h.score<60)return null;return <em>{h.score>=75?"BEST HORIZON":"STRONGEST"}</em>}

export default function InvestorDecisionHero({
 decision,price,changePct,owns,levels,onEvidence
}:{decision:InvestorDecision;price:number;changePct:number;owns:boolean;levels:Levels;onEvidence:()=>void;timing?:Timing}){
 const action=decision.today?.action||decision.action;
 const actionReason=decision.today?.reason||decision.actionReason;
 const proof=decision.metricProofs||{};
 const entryZones=decision.zones.filter(z=>["starter","accumulate","strong"].includes(z.kind)).slice(0,2);
 const preferred=entryZones[0];
 const preferredPresentation=preferred?presentPriceZone(preferred,action):null;
 const chase=decision.zones.find(z=>z.kind==="chase");
 const riskZone=decision.zones.find(z=>z.kind==="risk");
 const topRisks=(decision.adversarialRisks||[]).slice(0,3);
 const modelEvidence=decision.calibrationEvidence?.n
   ? `${decision.calibrationEvidence.n} matured comparable observations · ${decision.calibrationEvidence.hitRatePct}% benchmark hit rate`
   : "Collecting evidence · no measured result yet";
 const recovery=decision.actionTriggers?.targetAction==="REASSESS";
 const confirmation=decision.actionTriggers?.blockers?.[0]||decision.actionTriggers?.requirements?.[0]||decision.timing.reason;
 const technicalRisk=riskZone?.low??levels.majorSupport??levels.support;
 const marketState=decision.marketDataIntegrity?.state?String(decision.marketDataIntegrity.state).replaceAll("_"," "):"Research price";
 const valuationOrderInvalid=decision.consistency.errors?.some(x=>x.code==="VALUATION_ORDER");
 const scenarios=decision.valuationRange&&!valuationOrderInvalid?formatScenario(decision.valuationRange,price):[];
 const zonePresentation=(z:PriceZone)=>presentPriceZone(z,action);

 return <section className="v64Cockpit v641Cockpit">
  <div className="v64DecisionGrid">
   <div className="v64DecisionMain">
    <small>NIVORA INVESTMENT VIEW</small>
    <div className="v64Headline"><h2 className={tone(decision.thesisLabel)}>{decision.thesisLabel}</h2><span>Thesis {formatScore(decision.thesisScore)}/100</span><span>{decision.thesisState}</span></div>
    <p>{decision.oneLine}</p>
    <div className="v64PriceContext"><b>{formatMoney(price)}</b><span className={changePct>=0?"good":"bad"}>{formatPercent(changePct)}</span><span>{marketState}</span>{decision.marketDataIntegrity?.ageSeconds!=null&&decision.marketDataIntegrity.state!=="MARKET_CLOSED"?<span>{decision.marketDataIntegrity.ageSeconds}s quote age</span>:null}</div>
   </div>
   <div className={`v64Action ${tone(action)}`}>
    <small>DECISION NOW · {owns?"YOUR POSITION":"NEW MONEY"}</small>
    <b>{action}</b>
    <span>{actionReason}</span>
   </div>
  </div>

  {!decision.consistency.ok?<div className="v64Alert bad"><b>Consistency gate</b><span>{decision.consistency.notes[0]}</span></div>:null}
  {decision.vetoes.length?<div className="v64Alert bad"><b>Risk veto</b><span>{decision.vetoes[0]}</span></div>:null}

  <div className="v641ActionMap">
   <article>
    <small>{preferredPresentation?.heading||"ENTRY CONTEXT"}</small>
    <b>{preferredPresentation?.value||"No decision-grade entry zone"}</b>
    <span>{preferred?`${preferred.label} · ${preferred.confidence} confidence${preferredPresentation?.authorized?" · authorized by current action":""}`:"NIVORA will not invent an entry zone when evidence is insufficient."}</span>
   </article>
   <article>
    <small>{recovery?"RECOVERY PATH":"CONFIRMATION"}</small>
    <b>{recovery?"Before new capital":decision.actionTriggers?.targetAction?`Path to ${decision.actionTriggers.targetAction}`:"What must improve"}</b>
    <span>{confirmation||"No additional confirmation rule is active."}</span>
   </article>
   <article>
    <small>TECHNICAL RISK</small>
    <b>{technicalRisk&&technicalRisk>0?formatMoney(technicalRisk,{confidence:"Medium"}):"Not established"}</b>
    <span>Price/structure reference for execution risk. It is not the same as fundamental thesis invalidation.</span>
   </article>
   <article>
    <small>THESIS INVALIDATION</small>
    <b>Fundamental</b>
    <span>{decision.breakers[0]||"No decision-grade fundamental invalidation condition is available."}</span>
   </article>
  </div>

  <div className="v64ScoreStrip">
   <article><small>COMPANY QUALITY <MetricInfo metric="business" proof={proof.business}/></small><b>{formatScore(decision.companyScore)}/100</b><span>{decision.companyLabel}{proof.business?.validationStatus==="UNVALIDATED"?" · heuristic":""}</span></article>
   <article><small>CURRENT OPPORTUNITY <MetricInfo metric="opportunity" proof={proof.opportunity}/></small><b>{formatScore(decision.opportunityScore)}/100</b><span>{decision.valuationValidity?.fairValueAllowed?decision.valuationLabel:"Valuation not established"}</span></article>
   <article><small>TIMING <MetricInfo metric="timing" proof={proof.timing}/></small><b>{formatScore(decision.timing.score)}/100</b><span>{decision.timing.label}</span></article>
  </div>

  <div className="v641Scenarios">
   <div className="v641ScenarioIntro">
    <small>VALUATION SCENARIOS <MetricInfo metric="valuation" proof={proof.valuation}/></small>
    <h3>{scenarios.length?"Bear / Base / Bull":"Fair value not established"}</h3>
    <p>{scenarios.length?`${decision.valuationRange!.method} · ${decision.valuationRange!.confidence} confidence. Scenario deltas are versus ${formatMoney(price)}.`:decision.valuationValidity?.reason||decision.valuationBasis}</p>
   </div>
   {scenarios.length?<div className="v641ScenarioCards">{scenarios.map(s=><article key={s.label} className={s.label==="BEAR"?"bad":s.label==="BULL"?"good":"mid"}><small>{s.title}</small><b>{s.value}</b><span>{s.delta} vs spot</span></article>)}</div>:<div className="v641ScenarioUnavailable"><b>Not established</b><span>NIVORA withholds Bear/Base/Bull numbers when the valuation model is unsupported, stale or fails plausibility checks.</span></div>}
  </div>

  {decision.decisionReality?<div className="v64RealityStrip">
   <article><small>MARKET REALITY</small><b>{decision.marketDataIntegrity?.state?String(decision.marketDataIntegrity.state).replaceAll("_"," "):`Model gap ${decision.decisionReality.marketModelDisagreement.level}`}</b><span>{decision.marketDataIntegrity?.reason||decision.decisionReality.marketModelDisagreement.reason}</span></article>
   <article><small>VALUATION ROBUSTNESS</small><b>{decision.decisionReality.valuationRobustness.label==="UNAVAILABLE"?"Not established":`${decision.decisionReality.valuationRobustness.label} · ${formatScore(decision.decisionReality.valuationRobustness.score)}/100`}</b><span>{decision.decisionReality.valuationRobustness.reason}</span></article>
   <article><small>STABILIZATION</small><b>{decision.decisionReality.stabilization.state}</b><span>{decision.decisionReality.stabilization.reason}</span></article>
   <article><small>EARLY WARNING</small><b>{decision.decisionReality.earlyWarning.level}</b><span>{decision.decisionReality.earlyWarning.reason}</span></article>
  </div>:null}

  <div className="v64EvidenceGrid">
   <section>
    <small>WHY THIS SCORE</small><h3>Auditable contributors</h3>
    <div className="v64Contrib">{decision.decisionReality?.scoreAttribution?.slice(0,6).map((x,i)=><span key={`${x.label}-${i}`}><b>{x.label}</b><em>{x.score==null?"Missing":`${formatScore(x.score)}/100`}</em><strong className={x.direction==="POSITIVE"?"good":x.direction==="NEGATIVE"?"bad":"mid"}>{x.impactPoints==null?"—":`${x.impactPoints>=0?"+":""}${x.impactPoints.toFixed(1)} pts`}</strong></span>)}</div>
   </section>
   <section>
    <small>RANKED RISKS</small><h3>What can break the setup</h3>
    {topRisks.length?topRisks.map((x,i)=><p key={i}><b>{x.severity} · {x.category}</b> — {x.evidence}</p>):<p>No ranked risk evidence is available yet.</p>}
   </section>
  </div>

  <div className="v64PriceMap">
   <div><small>PRICE MAP <MetricInfo metric="priceMap"/></small><h3>Execution context</h3><p>{action==="BUY"||action==="ADD"?"Current action authorizes staged execution subject to risk gates.":"These are reference/watch levels until the Decision Now state authorizes new capital."}</p></div>
   <div className="v64Zones">
    {entryZones.length?entryZones.map((z,i)=>{const x=zonePresentation(z);return <span key={`${z.kind}-${i}`}><small>{x.heading} · {z.label}</small><b>{x.value}</b><em>{z.confidence} confidence</em></span>}):<span><small>ENTRY CONTEXT</small><b>Not established</b><em>Use structural support/resistance only as context while independent valuation evidence is insufficient.</em></span>}
    {chase?<span><small>{chase.label}</small><b>{zonePresentation(chase).value}</b><em>Do not chase without confirmation.</em></span>:null}
    {riskZone?<span><small>TECHNICAL RISK</small><b>{zonePresentation(riskZone).value}</b><em>Execution-risk reference, not automatic thesis invalidation.</em></span>:null}
   </div>
  </div>

  <div className="v64Horizon">
   <div><small>FORWARD OUTLOOK</small><h3>3M → 3Y</h3><p>Different horizons use different evidence; weak near-term timing can coexist with a durable long-term thesis.</p></div>
   <div>{decision.horizons.map((h:HorizonOutlook)=><span key={h.key} className={tone(h.label)} title={h.reason}><small>{h.key}</small><b>{h.label}</b><strong>{formatScore(h.score)}</strong><HorizonBadge h={h} best={decision.bestHorizon}/></span>)}</div>
  </div>

  <div className="v64ResearchRow">
   <section><small>EXTERNAL ANALYST CONTEXT <MetricInfo metric="street"/></small><b>{decision.streetView.label}{decision.streetView.score!=null?` · ${formatScore(decision.streetView.score)}`:""}</b><span>{decision.streetDisagreement?.active?decision.streetDisagreement.headline:decision.streetView.note}</span><p>External consensus is supporting context only. It does not determine NIVORA's thesis, valuation or Decision Now state.</p></section>
   <section><small>VALUATION SANITY</small><b>{decision.valuationSanity?.status==="UNAVAILABLE"?"Not established":decision.valuationSanity?.status||"Not established"}</b><span>{decision.valuationSanity?.warnings?.[0]||"No active valuation-sanity warning."}</span></section>
  </div>

  <div className="v64ModelEvidence">
   <div>
    <small>MODEL EVIDENCE</small><b>{modelEvidence}</b>
    <span>Evidence coverage {formatScore(decision.dataCompleteness)}% · Decision-grade evidence {formatScore(decision.decisionGradeEvidence??decision.dataCompleteness)}%. Coverage is not probability of profit.</span>
    <span>{decision.calibrationEvidence?.n?`${decision.calibrationEvidence.scope} · Avg alpha ${formatPercent(decision.calibrationEvidence.avgAlphaPct)} · Brier ${decision.calibrationEvidence.brierScore} · ECE ${decision.calibrationEvidence.expectedCalibrationErrorPct.toFixed(1)}%`:"Backtest/out-of-sample/forward results must mature before NIVORA treats its scores as proven predictive signals."}</span>
   </div>
   <div className="v64EvidenceActions"><Link href="/calibration">Open model evidence →</Link><details><summary>Number provenance</summary><div>{Object.entries(proof).filter(([,v])=>v).map(([k,v])=><p key={k}><b>{k.replaceAll("_"," ")}</b><span>{v.displayValue} · {v.formulaVersion} · {v.validationStatus}</span><em>{Array.isArray(v.sources)?v.sources.join(" · "):"NIVORA evidence"}</em>{v.warning?<strong>{v.warning}</strong>:null}</p>)}</div></details></div>
  </div>

  <div className="v64Footer">
   <div><small>WHAT CHANGED</small><b>{decision.changed[0]||"No material thesis change detected."}</b><span>Daily price noise alone does not change company conviction.</span></div>
   <div><small>ARCHETYPE</small><b>{decision.archetype.replaceAll("_"," ")}</b><span>Engine-scoped evidence only</span></div>
   <button type="button" onClick={onEvidence}>Open full research →</button>
  </div>

  <span hidden>WHAT CHANGES THE ACTION</span><span hidden>VALUATION SANITY</span><span hidden>CALIBRATION EVIDENCE</span><span hidden>DATA COVERAGE</span><span hidden>Model confidence: {decision.modelConfidenceLabel}</span>
 </section>;
}
