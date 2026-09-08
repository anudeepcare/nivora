"use client";
import type {CanonicalAnalysisSnapshot} from "@/lib/auryn/v5/domain";
import type {AurynV6Analysis} from "@/lib/auryn/v6/domain";
import {formatInvestmentAction,newMoneyGuidance,ownerGuidance} from "@/lib/auryn/v4/presentation";
import {formatProfessionalMetricValue} from "@/lib/auryn/v5/format";

type Depth="simple"|"investor"|"pro";
const tone=(x:string)=>/BUY|STRONG|ADD/.test(x)?"good":/SELL|REDUCE|AVOID/.test(x)?"bad":"mid";
const hLabel=(h:string)=>h==="NOW"?"NOW":h==="SWING"?"SWING":h==="SIX_TO_TWELVE_MONTHS"?"6–12M":"3–5Y";
export default function StockV5Decision({snapshot,v6,owns,depth,onDepthChange}:{snapshot:CanonicalAnalysisSnapshot;v6?:AurynV6Analysis|null;owns:boolean;depth:Depth;onDepthChange?:(x:Depth)=>void}){
 const d=snapshot.decision,marketBlocked=snapshot.executionPlan.state==="BLOCKED",action=formatInvestmentAction(d.primaryAction);
 const keyMetrics=snapshot.metrics.filter(x=>["thesisStrength","businessQuality","valuation","riskPressure","entryQuality","rsi14"].includes(x.id));
 return <section className="aurynDecisionSummary aurynV5DecisionSummary">
  <div className="aurynDecisionMain">
   <div className="aurynDecisionTopline"><div className="aurynEyebrow">AURYN V6 · PROOF OS</div>{onDepthChange&&<div className="aurynDecisionDepth" aria-label="Analysis depth"><button type="button" className={depth==="simple"?"on":""} onClick={()=>onDepthChange("simple")}>Beginner</button><button type="button" className={depth==="investor"?"on":""} onClick={()=>onDepthChange("investor")}>Pro</button><button type="button" className={depth==="pro"?"on":""} onClick={()=>onDepthChange("pro")}>Extreme Pro</button></div>}</div>
   <div className="aurynDecisionTitle"><h2 className={tone(action)}>{action}</h2><span><small>EVIDENCE CONFIDENCE</small> {v6?.evidenceConfidence.score??d.confidenceScore}/100 · {v6?.evidenceConfidence.label??d.confidenceLabel}</span></div>
   <p>{d.summary}</p>
   {marketBlocked&&<div className="aurynMarketTruthGate"><b>EXECUTION BLOCKED</b><span>{snapshot.marketTruth.reason} Structural research remains available; AURYN will not publish or route price-sensitive actions from an unverified snapshot.</span></div>}
   <div className="aurynV4Horizons" aria-label="Decision by horizon">{d.horizonDecisions.map(h=><span key={h.horizon}><small>{hLabel(h.horizon)}</small><b className={tone(formatInvestmentAction(h.action))}>{formatInvestmentAction(h.action)}</b></span>)}</div>
   {depth!=="simple"&&<div className="aurynMemoSignals">{keyMetrics.slice(0,depth==="pro"?6:4).map(m=><span key={m.id}><small>{m.label.toUpperCase()}</small><b>{formatProfessionalMetricValue(m)}</b><em>{m.state}</em></span>)}</div>}
   {depth!=="simple"&&v6&&<div className="aurynMemoSignals aurynProofSignals"><span><small>MODEL PROOF</small><b>{v6.modelProof.grade}</b><em>N={v6.modelProof.exactSampleN}</em></span><span><small>WEEKLY STRUCTURE</small><b>{v6.multiTimeframe.weekly?.state??"COLLECTING"}</b><em>{v6.multiTimeframe.alignment.replaceAll("_"," ")}</em></span><span><small>VALUATION METHOD</small><b>{v6.valuation.state}</b><em>{v6.valuation.method.replaceAll("_"," ")}</em></span></div>}
   <div className="aurynMemoReasons">{d.why.map((x,i)=><span key={i}>✓ {x}</span>)}{d.watch.map((x,i)=><span key={`w-${i}`} className="risk">Watch · {x}</span>)}</div>
  </div>
  <aside className="aurynDecisionSide">
   <div className="aurynDecisionActionBlock"><div className="aurynEyebrow">NEW MONEY</div><b className={tone(marketBlocked?"HOLD":action)}>{marketBlocked?"VERIFY PRICE FIRST":newMoneyGuidance(d.primaryAction)}</b><span>{marketBlocked?"No new capital until Market Truth verifies the price and snapshot.":"Use the single execution plan below for entry, DCA, confirmation and invalidation."}</span></div>
   {owns&&<div className="aurynDecisionActionBlock owner"><div className="aurynEyebrow">IF YOU OWN IT</div><strong className={tone(ownerGuidance(d.ownerAction))}>{ownerGuidance(d.ownerAction)}</strong><span>{d.ownerAction==="SELL"?"Structural evidence supports exit.":"Manage from thesis, risk and the canonical plan—not from isolated price noise."}</span></div>}
  </aside>
 </section>;
}
