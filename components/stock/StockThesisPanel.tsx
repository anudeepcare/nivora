"use client";
import MetricInfo from "@/components/v65/MetricInfo";
import type {CanonicalAnalysisSnapshot,ProfessionalMetric} from "@/lib/auryn/v5/domain";
import {formatRiskBand,formatScoreBand} from "@/lib/auryn/v5/format";

const factorOrder=["businessQuality","growth","moat","fundamentals","valuation","entryQuality","catalysts","sector","riskPressure"];
const factorLabel:Record<string,string>={businessQuality:"Business",growth:"Growth",moat:"Moat",fundamentals:"Fundamentals",valuation:"Valuation",entryQuality:"Timing / entry",catalysts:"Catalysts",sector:"Sector",riskPressure:"Risk pressure"};
const fmtMetric=(m:ProfessionalMetric)=>m.available&&Number.isFinite(Number(m.value))?`${Math.round(Number(m.value))}/100 · ${m.id==="riskPressure"?formatRiskBand(Number(m.value)):formatScoreBand(Number(m.value))}`:"N/A";

const humanize=(s:string)=>String(s||"").replaceAll("_"," ").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
const humanModel=(s:string)=>({DIGITAL_HEALTH_PLATFORM:"Digital Health Platform",BIOTECH_PHARMA:"Biotech / Pharma",SPACE_SATELLITE:"Space / Satellite",AI_DATA_CENTER_INFRA:"AI / Data Center Infrastructure",POWER_UTILITY_INFRA:"Power / Utility Infrastructure",SEMICONDUCTOR_MEMORY_CYCLICAL:"Memory Semiconductors",SEMICONDUCTOR_DESIGNER:"Semiconductor Designer",NETWORKING_COMPUTE_INFRA:"Networking / Compute Infrastructure",MARKETPLACE_ADTECH:"Marketplace / AdTech",SAAS_SOFTWARE:"Software / SaaS",FINTECH_PAYMENTS:"Fintech / Payments",MINER_COMMODITY:"Mining / Commodities",GENERAL_COMPOUNDER:"General Compounder"} as Record<string,string>)[s]||humanize(s);

export default function StockThesisPanel({decision,v5,marketTruth}:{decision:any;metricDefinitions?:any;v5:CanonicalAnalysisSnapshot;marketTruth?:any}){
 const v4=v5.v4;
 const canonicalMetrics=v5.metrics;
 const metric=(id:string)=>canonicalMetrics.find(m=>m.id===id);
 const thesisMetric=metric("thesisStrength"),moatMetric=metric("moat");
 const thesisScore=thesisMetric?.available&&Number.isFinite(Number(thesisMetric.value))?Number(thesisMetric.value):null;
 const moatScore=moatMetric?.available&&Number.isFinite(Number(moatMetric.value))?Number(moatMetric.value):null;
 const canonicalFactors=factorOrder.map(id=>metric(id)).filter((x):x is ProfessionalMetric=>Boolean(x));
 const positive=[...v4.thesis.strengtheningEvidence,...v4.thesis.whyItCanWin].map(x=>x.text).filter(Boolean);
 const negative=[...v4.thesis.weakeningEvidence.map(x=>x.text),...v5.decision.watch].filter(Boolean);
 const missing=v4.narrative.aurynThesis.map(x=>x.text).filter(Boolean);
 const marketBlocked=v5.executionPlan.state==="BLOCKED"||marketTruth?.priceSensitiveAllowed===false;
 return <div className="aurynStockTabPage aurynThesis">
  <section className="aurynThesisVerdict">
   <div className="aurynThesisLead"><div className="aurynEyebrow">Canonical long-term thesis</div><div className="aurynThesisHeadline"><h2>{thesisScore==null?humanize(v4.thesis.direction):formatScoreBand(thesisScore).toUpperCase()}</h2><span>{thesisScore==null?"Strength N/A":`Strength ${Math.round(thesisScore)}/100`}</span></div><p><b>Thesis trend: {humanize(v4.thesis.direction)}</b> · {humanModel(v4.classification.businessModel)} · {humanize(v4.classification.lifecycle)}. This tab explains the same canonical AURYN decision shown above; it does not calculate a second verdict.</p></div>
   <div className="aurynThesisScoreRail">
    <article><div><span>Thesis strength <MetricInfo title="Thesis strength">Slow-moving business, growth, moat and fundamental evidence from the canonical snapshot.</MetricInfo></span><b>{thesisScore==null?"N/A":`${Math.round(thesisScore)}/100 · ${formatScoreBand(thesisScore)}`}</b></div>{thesisScore!=null&&<i><em style={{width:`${Math.max(3,Math.min(100,thesisScore))}%`}}/></i>}<small>Thesis trend: {humanize(v4.thesis.direction)} · structural evidence.</small></article>
    <article><div><span>Moat strength / durability <MetricInfo title="Moat strength / durability">Competitive durability is shown only when evidence exists. Heuristic evidence remains clearly labeled in the full evidence trace.</MetricInfo></span><b>{moatScore==null?"N/A":`${Math.round(moatScore)}/100 · ${formatScoreBand(moatScore)}`}</b></div>{moatScore!=null&&<i><em style={{width:`${Math.max(3,Math.min(100,moatScore))}%`}}/></i>}<small>Moat trend: {humanize(v4.moat.direction)}. {moatMetric?.interpretation||"Competitive durability evidence unavailable."}</small></article>
    <article><div><span>Evidence confidence <MetricInfo title="Evidence confidence">Coverage, freshness, source quality and evidence agreement. This is not a probability of profit.</MetricInfo></span><b>{v5.decision.confidenceScore}/100 · {v5.decision.confidenceLabel}</b></div><i><em style={{width:`${v5.decision.confidenceScore}%`}}/></i><small>Evidence quality and agreement across this canonical AURYN snapshot.</small></article>
   </div>
  </section>
  <div className="aurynThesisScoreGuide"><b>One canonical brain</b><span>{marketBlocked?"Market price is unverified. Thesis and business evidence remain visible while price-sensitive actions are blocked.":"Every tab explains evidence feeding the same canonical decision. Missing evidence shows N/A and never becomes a bearish zero."}</span></div>
  <section className="aurynThesisFactors" aria-label="Canonical AURYN thesis factors">
   {canonicalFactors.map(m=>{const isRisk=m.id==="riskPressure";const n=m.available&&Number.isFinite(Number(m.value))?Number(m.value):null;return <article key={m.id} className={isRisk&&n!=null&&n>=70?"risk":""}><div><span>{factorLabel[m.id]||m.label}</span><b>{fmtMetric(m)}</b></div>{n!=null?<i><em style={{width:`${Math.max(3,Math.min(100,n))}%`}}/></i>:null}<small>{m.interpretation}</small></article>})}
  </section>
  <section className="aurynThesisEvidence">
   <article><span>Why it can work</span>{positive.length?positive.slice(0,5).map((x,i)=><p key={i}>✓ {x}</p>):v5.decision.why.slice(0,5).map((x,i)=><p key={i}>✓ {x}</p>)}</article>
   <article><span>What must be watched</span>{negative.length?negative.slice(0,5).map((x,i)=><p key={i}>• {x}</p>):<p>• No material canonical watch item is established yet.</p>}</article>
   <article><span>What would break it</span>{v4.thesis.invalidationConditions.length?v4.thesis.invalidationConditions.map((x,i)=><p key={i}>• {x}</p>):<p>No source-backed structural breaker is established yet.</p>}{missing.slice(0,2).map((x,i)=><p key={`m-${i}`}>• {x}</p>)}</article>
  </section>
 </div>;
}
