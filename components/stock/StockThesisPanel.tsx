"use client";
import MetricInfo from "@/components/v65/MetricInfo";

const tone=(s:string)=>{
 const x=String(s||"").toUpperCase();
 if(/BUY|CONSTRUCTIVE|HOLD|STRONG|ATTRACTIVE|BULLISH/.test(x))return"good";
 if(/CHASE|AVOID|REDUCE|NOT YET|WEAK|POOR|BEARISH|SELL/.test(x))return"bad";
 return"mid";
};

export default function StockThesisPanel({decision,metricDefinitions}:{decision:any;metricDefinitions:any}){
 const factors=Object.entries(decision?.factors||{});
 return <div className="aurynThesis">
  <section className="aurynThesisVerdict">
   <div className="aurynThesisLead">
    <div className="aurynEyebrow">Investment verdict</div>
    <div className="aurynThesisHeadline"><h2>{decision.thesisLabel}</h2><span>{decision.thesisScore}/100</span></div>
    <p>{decision.oneLine}</p>
   </div>
   <aside className="aurynThesisAction">
    <div className="aurynEyebrow">Investor action</div>
    <b className={tone(decision.action)}>{decision.action}</b>
    <span>{decision.horizon} decision horizon</span>
    <p>What to do now, separated from the long-term thesis.</p>
   </aside>
   <div className="aurynThesisScoreRail">
    <article><div><span>Thesis <MetricInfo title="Thesis score" score={decision.thesisScore}>Overall alignment of business quality, forward evidence and durability behind the investment case.</MetricInfo></span><b>{decision.thesisScore}/100</b></div><i><em style={{width:`${decision.thesisScore}%`}}/></i><small>{decision.thesisLabel} overall evidence</small></article>
    {decision.longTermThesis&&<article><div><span>Long-term <MetricInfo title="Long-term thesis" score={decision.longTermThesis.score}>Separates 1–3 year business evidence from near-term price action.</MetricInfo></span><b>{decision.longTermThesis.score}/100</b></div><i><em style={{width:`${decision.longTermThesis.score}%`}}/></i><small>{decision.longTermThesis.label} · {decision.longTermThesis.longTerm}</small></article>}
    {decision.expectationGap&&<article><div><span>Expectation gap <MetricInfo title="Expectation gap" score={decision.expectationGap.score??undefined}>Compares forward growth, revisions and catalysts with a neutral baseline. It is not a price target.</MetricInfo></span><b>{decision.expectationGap.score!=null?`${decision.expectationGap.score}/100`:"—"}</b></div>{decision.expectationGap.score!=null&&<i><em style={{width:`${decision.expectationGap.score}%`}}/></i>}<small>{decision.expectationGap.label} · {decision.expectationGap.reason}</small></article>}
   </div>
  </section>

  <section className="aurynThesisFactors" aria-label="Thesis factors">
   {factors.map(([k,v]:any)=>{const available=v!=null&&Number.isFinite(Number(v));const isRisk=k==="risk";const label=(isRisk?"Risk pressure":String(k).replace(/([A-Z])/g," $1")).trim();const def=metricDefinitions?.[k];return <article key={k} className={isRisk&&available&&Number(v)>=70?"risk":""}>
    <div><span>{label} {def&&<MetricInfo title={def.title}>{def.short} {def.uses}</MetricInfo>}</span><b>{available?`${v}/100`:"N/A"}</b></div>
    {available?<i><em style={{width:`${Math.max(3,Math.min(100,Number(v)))}%`}}/></i>:<small>Evidence unavailable</small>}
   </article>})}
  </section>

  <section className="aurynThesisEvidence">
   <article><span>Why it can work</span>{decision.drivers?.length?decision.drivers.map((x:string,i:number)=><p key={i}>✓ {x}</p>):<p>No dominant positive evidence yet.</p>}</article>
   <article><span>What can break it</span>{decision.breakers?.length?decision.breakers.map((x:string,i:number)=><p key={i}>• {x}</p>):<p>No specific breaker identified yet.</p>}</article>
   <article><span>What changed</span>{decision.changed?.length?decision.changed.map((x:string,i:number)=><p key={i}>↔ {x}</p>):<p>No material thesis change detected. Daily price noise is not treated as a new thesis.</p>}</article>
  </section>
 </div>;
}