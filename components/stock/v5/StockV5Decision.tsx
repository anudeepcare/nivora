"use client";
import type {CanonicalAnalysisSnapshot} from "@/lib/auryn/v5/domain";
import type {AurynV6Analysis} from "@/lib/auryn/v6/domain";
import type {AurynV7Analysis} from "@/lib/auryn/v7/domain";
import {formatInvestmentAction,newMoneyGuidance,ownerGuidance} from "@/lib/auryn/v4/presentation";
import {formatProfessionalMetricValue} from "@/lib/auryn/v5/format";

type Depth="simple"|"investor"|"pro";
const tone=(x:string)=>/BUY|STRONG|ADD/.test(x)?"good":/SELL|REDUCE|AVOID/.test(x)?"bad":"mid";
const hLabel=(h:string)=>h==="NOW"?"NOW":h==="SWING"?"SWING":h==="SIX_TO_TWELVE_MONTHS"?"6–12M":"3–5Y";
export default function StockV5Decision({snapshot,v6,v7,owns,depth,onDepthChange}:{snapshot:CanonicalAnalysisSnapshot;v6?:AurynV6Analysis|null;v7?:AurynV7Analysis|null;owns:boolean;depth:Depth;onDepthChange?:(x:Depth)=>void}){
 const d=snapshot.decision,marketBlocked=snapshot.executionPlan.state==="BLOCKED",trustBlocked=v7?.trust.state==="BLOCK",blocked=marketBlocked||trustBlocked,action=formatInvestmentAction(d.primaryAction);
 const coreMetricIds=['thesisStrength','businessQuality','technicalStrength','entryQuality','valuation','riskPressure'] as const;
 const metricById=new Map(snapshot.metrics.map(m=>[m.id,m]));
 const keyMetrics=coreMetricIds.map(id=>metricById.get(id)).filter((m):m is NonNullable<typeof m>=>Boolean(m));
 return <section className="aurynDecisionSummary aurynV5DecisionSummary">
  <div className="aurynDecisionMain">
   <div className="aurynDecisionTopline"><div className="aurynEyebrow">AURYN V8 · REALITY AUDITED</div>{onDepthChange&&<div className="aurynDecisionDepth" aria-label="Analysis depth"><button type="button" className={depth==="simple"?"on":""} onClick={()=>onDepthChange("simple")}>Beginner</button><button type="button" className={depth==="investor"?"on":""} onClick={()=>onDepthChange("investor")}>Pro</button><button type="button" className={depth==="pro"?"on":""} onClick={()=>onDepthChange("pro")}>Extreme Pro</button></div>}</div>
   <div className="aurynDecisionTitle"><h2 className={tone(action)}>{action}</h2><span><small>EVIDENCE CONFIDENCE</small> {v6?.evidenceConfidence.score??d.confidenceScore}/100 · {v6?.evidenceConfidence.label??d.confidenceLabel}</span></div>
   <p>{d.summary}</p>
   {blocked&&<div className="aurynMarketTruthGate"><b>{trustBlocked?"CANONICAL TRUST BLOCK":"EXECUTION BLOCKED"}</b><span>{trustBlocked?(v7?.trust.blockers[0]||"Canonical snapshot consistency failed."):snapshot.marketTruth.reason} Structural research remains available; AURYN will not publish or route price-sensitive actions until trust is restored.</span></div>}
   <div className="aurynV4Horizons" aria-label="Decision by horizon">{d.horizonDecisions.map(h=><span key={h.horizon}><small>{hLabel(h.horizon)}</small><b className={tone(formatInvestmentAction(h.action))}>{formatInvestmentAction(h.action)}</b></span>)}</div>
   {depth!=="simple"&&<div className="aurynCoreFactors">{keyMetrics.slice(0,depth==="pro"?6:4).map(m=><span key={m.id} className={m.id==="riskPressure"?"riskFactor":""}><small>{m.label.toUpperCase()}</small><b>{formatProfessionalMetricValue(m)}</b><em>{m.state}</em></span>)}</div>}
   {depth==="pro"&&v6&&<div className="aurynMemoSignals aurynProofSignals">{v7&&<span><small>SYSTEM TRUST</small><b className={v7.trust.state==="BLOCK"?"bad":v7.trust.state==="WARN"?"mid":"good"}>{v7.trust.state}</b><em>{v7.trust.score}/100 canonical consistency</em></span>}<span><small>MODEL PROOF</small><b>{v6.modelProof.grade}</b><em>N={v6.modelProof.exactSampleN}</em></span><span><small>WEEKLY STRUCTURE</small><b>{v6.multiTimeframe.weekly?.state??"COLLECTING"}</b><em>{v6.multiTimeframe.alignment.replaceAll("_"," ")}</em></span><span><small>VALUATION METHOD</small><b>{v6.valuation.state}</b><em>{v6.valuation.method.replaceAll("_"," ")}</em></span></div>}
   <div className="aurynMemoReasons">{d.why.map((x,i)=><span key={i}>✓ {x}</span>)}{d.watch.map((x,i)=><span key={`w-${i}`} className="risk">Watch · {x}</span>)}</div>
  </div>
  <aside className="aurynDecisionSide">
   <div className="aurynDecisionActionBlock"><div className="aurynEyebrow">NEW MONEY</div><b className={tone(blocked?"HOLD":action)}>{blocked?(trustBlocked?"VERIFY SYSTEM FIRST":"VERIFY PRICE FIRST"):newMoneyGuidance(d.primaryAction)}</b><span>{blocked?(trustBlocked?"No new capital until AURYN restores canonical snapshot consistency.":"No new capital until Market Truth verifies the price and snapshot."):"Use the single execution plan below for entry, DCA, confirmation and invalidation."}</span></div>
   {owns&&<div className="aurynDecisionActionBlock owner"><div className="aurynEyebrow">IF YOU OWN IT</div><strong className={tone(ownerGuidance(d.ownerAction))}>{ownerGuidance(d.ownerAction)}</strong><span>{d.ownerAction==="SELL"?"Structural evidence supports exit.":"Manage from thesis, risk and the canonical plan—not from isolated price noise."}</span></div>}
  </aside>
 </section>;
}
