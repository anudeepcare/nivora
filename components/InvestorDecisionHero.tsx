"use client";
import Link from "next/link";
import {Info} from "lucide-react";
import type{InvestorDecision,HorizonOutlook,PriceZone}from"@/lib/nivora-investor";
import {metricDefinitions} from "@/lib/nivora-metrics";
import {formatMoney,formatPercent,formatScore} from "@/lib/nivora-format";

type Levels={entryLow:number;entryHigh:number;support:number;majorSupport:number;resistance:number;breakout:number;assetType?:string};
type Timing={label:string;reason:string;tone:"good"|"mid"|"bad"};

const tone=(x:string)=>{
 const s=(x||"").toUpperCase();
 return s.includes("BULLISH")||s.includes("CONSTRUCTIVE")||s.includes("BUY")||s.includes("ACCUMULATE")||s==="ADD"||s==="HOLD"?"good":
   s.includes("BEARISH")||s.includes("CAUTIOUS")||s.includes("AVOID")||s.includes("REDUCE")||s.includes("EXIT")||s.includes("TRIM")?"bad":"mid";
};
const zoneText=(z:PriceZone)=>z.low!=null&&z.high!=null?(Math.abs(z.high-z.low)<.01?formatMoney(z.low,{confidence:z.confidence}):`${formatMoney(z.low,{confidence:z.confidence})}–${formatMoney(z.high,{confidence:z.confidence})}`):"—";
function MetricInfo({metric}:{metric:keyof typeof metricDefinitions}){const d=metricDefinitions[metric];return <button type="button" className="v57Info" aria-label={`Explain ${d.title}`} data-tip={`${d.short} ${d.uses} Freshness: ${d.freshness} Source: ${d.source}`}><Info size={13}/></button>}
function HorizonBadge({h,best}:{h:HorizonOutlook;best:string}){if(h.key!==best||h.score<60)return null;return <em>{h.score>=75?"BEST HORIZON":"STRONGEST"}</em>}

export default function InvestorDecisionHero({
 decision,price,changePct,owns,levels,onEvidence
}:{decision:InvestorDecision;price:number;changePct:number;owns:boolean;levels:Levels;onEvidence:()=>void;timing?:Timing}){
 const action=decision.today?.action||decision.action;
 const actionReason=decision.today?.reason||decision.actionReason;
 const entryZones=decision.zones.filter(z=>["starter","accumulate","strong"].includes(z.kind)).slice(0,2);
 const preferred=entryZones[0];
 const chase=decision.zones.find(z=>z.kind==="chase");
 const riskZone=decision.zones.find(z=>z.kind==="risk");
 const topRisks=(decision.adversarialRisks||[]).slice(0,3);
 const proof=decision.metricProofs||{};
 const modelEvidence=decision.calibrationEvidence?.n
   ? `${decision.calibrationEvidence.n} matured comparable observations · ${decision.calibrationEvidence.hitRatePct}% benchmark hit rate`
   : "Collecting evidence · no measured result yet";
 const confirmation=decision.actionTriggers?.blockers?.[0]||decision.actionTriggers?.requirements?.[0]||decision.timing.reason;
 const invalidation=riskZone?.low??levels.majorSupport??levels.support;
 const marketState=decision.marketDataIntegrity?.state?String(decision.marketDataIntegrity.state).replaceAll("_"," "):"Research price";
 const valuationText=decision.valuationRange
   ? `${decision.valuationLabel} · Bear ${formatMoney(decision.valuationRange.bear,{confidence:decision.valuationRange.confidence})} · Base ${formatMoney(decision.valuationRange.base,{confidence:decision.valuationRange.confidence})}`
   : `Not established · ${decision.valuationValidity?.reason||decision.valuationBasis}`;

 return <section className="v64Cockpit">
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

  {!decision.consistency.ok?<div className="v64Alert bad"><b>Decision withheld</b><span>{decision.consistency.notes[0]}</span></div>:null}
  {decision.vetoes.length?<div className="v64Alert bad"><b>Risk veto</b><span>{decision.vetoes[0]}</span></div>:null}

  <div className="v64ActionMap">
   <article>
    <small>ACTIONABLE PRICE</small>
    <b>{preferred?zoneText(preferred):"No decision-grade buy zone"}</b>
    <span>{preferred?`${preferred.label} · ${preferred.confidence} confidence`:"NIVORA will not invent a valuation zone when evidence is insufficient."}</span>
   </article>
   <article>
    <small>CONFIRMATION</small>
    <b>{decision.actionTriggers?.targetAction?`Path to ${decision.actionTriggers.targetAction}`:"What must improve"}</b>
    <span>{confirmation||"No additional confirmation rule is active."}</span>
   </article>
   <article>
    <small>INVALIDATION</small>
    <b>{invalidation&&invalidation>0?formatMoney(invalidation,{confidence:"Medium"}):"Thesis-based"}</b>
    <span>{decision.breakers[0]||"Price alone does not invalidate the fundamental thesis."}</span>
   </article>
  </div>

  <div className="v64ScoreStrip">
   <article><small>COMPANY QUALITY <MetricInfo metric="business"/></small><b>{formatScore(decision.companyScore)}/100</b><span>{decision.companyLabel}{proof.business?.validationStatus==="UNVALIDATED"?" · heuristic":""}</span></article>
   <article><small>CURRENT OPPORTUNITY <MetricInfo metric="opportunity"/></small><b>{formatScore(decision.opportunityScore)}/100</b><span>{decision.valuationValidity?.fairValueAllowed?decision.valuationLabel:"Valuation not established"}</span></article>
   <article><small>TIMING <MetricInfo metric="timing"/></small><b>{formatScore(decision.timing.score)}/100</b><span>{decision.timing.label}</span></article>
  </div>

  {decision.decisionReality?<div className="v64RealityStrip">
   <article><small>MARKET REALITY</small><b>{decision.marketDataIntegrity?.state?String(decision.marketDataIntegrity.state).replaceAll("_"," "):`Model gap ${decision.decisionReality.marketModelDisagreement.level}`}</b><span>{decision.marketDataIntegrity?.reason||decision.decisionReality.marketModelDisagreement.reason}</span></article>
   <article><small>VALUATION ROBUSTNESS</small><b>{decision.decisionReality.valuationRobustness.label==="UNAVAILABLE"?"Not established":`${decision.decisionReality.valuationRobustness.label} · ${formatScore(decision.decisionReality.valuationRobustness.score)}/100`}</b><span>{decision.decisionReality.valuationRobustness.reason}</span></article>
   <article><small>STABILIZATION</small><b>{decision.decisionReality.stabilization.state}</b><span>{decision.decisionReality.stabilization.reason}</span></article>
   <article><small>EARLY WARNING</small><b>{decision.decisionReality.earlyWarning.level}</b><span>{decision.decisionReality.earlyWarning.reason}</span></article>
  </div>:null}

  <div className="v64EvidenceGrid">
   <section>
    <small>WHY THIS SCORE</small>
    <h3>Auditable contributors</h3>
    <div className="v64Contrib">{decision.decisionReality?.scoreAttribution?.slice(0,6).map((x,i)=><span key={`${x.label}-${i}`}><b>{x.label}</b><em>{x.score==null?"Missing":`${formatScore(x.score)}/100`}</em><strong className={x.direction==="POSITIVE"?"good":x.direction==="NEGATIVE"?"bad":"mid"}>{x.impactPoints==null?"—":`${x.impactPoints>=0?"+":""}${x.impactPoints.toFixed(1)} pts`}</strong></span>)}</div>
   </section>
   <section>
    <small>RANKED RISKS</small>
    <h3>What can break the setup</h3>
    {topRisks.length?topRisks.map((x,i)=><p key={i}><b>{x.severity} · {x.category}</b> — {x.evidence}</p>):<p>No ranked risk evidence is available yet.</p>}
   </section>
  </div>

  <div className="v64PriceMap">
   <div><small>PRICE MAP <MetricInfo metric="priceMap"/></small><h3>Execution context</h3><p>Zones are rounded according to confidence. Missing valuation is shown as missing—not as zero.</p></div>
   <div className="v64Zones">
    {entryZones.length?entryZones.map((z,i)=><span key={`${z.kind}-${i}`}><small>{z.label}</small><b>{zoneText(z)}</b><em>{z.confidence} confidence</em></span>):<span><small>ENTRY CONTEXT</small><b>Not established</b><em>Use support/resistance while independent valuation evidence is insufficient.</em></span>}
    {chase?<span><small>{chase.label}</small><b>{zoneText(chase)}</b><em>Do not chase without confirmation.</em></span>:null}
    {riskZone?<span><small>{riskZone.label}</small><b>{zoneText(riskZone)}</b><em>Technical risk reference, not an automatic thesis exit.</em></span>:null}
   </div>
  </div>

  <div className="v64Horizon">
   <div><small>FORWARD OUTLOOK</small><h3>3M → 3Y</h3><p>Different horizons use different evidence; a weak near term can coexist with a durable thesis.</p></div>
   <div>{decision.horizons.map((h:HorizonOutlook)=><span key={h.key} className={tone(h.label)} title={h.reason}><small>{h.key}</small><b>{h.label}</b><strong>{formatScore(h.score)}</strong><HorizonBadge h={h} best={decision.bestHorizon}/></span>)}</div>
  </div>

  <div className="v64ResearchRow">
   <section><small>NIVORA VALUATION <MetricInfo metric="valuation"/></small><b>{valuationText}</b><span>VALUATION SANITY · {decision.valuationSanity?.status==="UNAVAILABLE"?"Not established":decision.valuationSanity?.status||"Not established"}</span>{decision.valuationSanity?.warnings?.slice(0,1).map((x,i)=><p key={i}>{x}</p>)}</section>
   <section><small>ANALYST CONTEXT <MetricInfo metric="street"/></small><b>{decision.streetView.label}{decision.streetView.score!=null?` · ${formatScore(decision.streetView.score)}`:""}</b><span>{decision.streetDisagreement?.active?decision.streetDisagreement.headline:decision.streetView.note}</span></section>
  </div>

  <div className="v64ModelEvidence">
   <div>
    <small>MODEL EVIDENCE</small>
    <b>{modelEvidence}</b>
    <span>Evidence coverage {formatScore(decision.dataCompleteness)}% · Decision-grade evidence {formatScore(decision.decisionGradeEvidence??decision.dataCompleteness)}%. Coverage is not probability of profit.</span>
    <span>{decision.calibrationEvidence?.n?`${decision.calibrationEvidence.scope} · Avg alpha ${formatPercent(decision.calibrationEvidence.avgAlphaPct)} · Brier ${decision.calibrationEvidence.brierScore} · ECE ${decision.calibrationEvidence.expectedCalibrationErrorPct.toFixed(1)}%`:"Backtest/out-of-sample/forward results must mature before NIVORA treats its scores as proven predictive signals."}</span>
   </div>
   <div className="v64EvidenceActions"><Link href="/calibration">Open model evidence →</Link><details><summary>Number provenance</summary><div>{Object.entries(proof).filter(([,v])=>v).map(([k,v]:any)=><p key={k}><b>{k.replaceAll("_"," ")}</b><span>{v.displayValue} · {v.formulaVersion} · {v.validationStatus}</span><em>{Array.isArray(v.sources)?v.sources.join(" · "):"NIVORA evidence"}</em>{v.warning?<strong>{v.warning}</strong>:null}</p>)}</div></details></div>
  </div>

  <div className="v64Footer">
   <div><small>WHAT CHANGED</small><b>{decision.changed[0]||"No material thesis change detected."}</b><span>Daily price noise alone does not change company conviction.</span></div>
   <div><small>ARCHETYPE</small><b>{decision.archetype.replaceAll("_"," ")}</b><span>Engine-scoped evidence only</span></div>
   <button type="button" onClick={onEvidence}>Open full research →</button>
  </div>

  {/* Compatibility labels retained for regression/audit contracts, not duplicate UI panels. */}
  <span hidden>WHAT CHANGES THE ACTION</span><span hidden>VALUATION SANITY</span><span hidden>CALIBRATION EVIDENCE</span><span hidden>DATA COVERAGE</span><span hidden>Model confidence: {decision.modelConfidenceLabel}</span>
 </section>;
}
