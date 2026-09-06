"use client";
import MetricInfo from "@/components/v65/MetricInfo";

const scoreWord=(v:number,isRisk=false)=>isRisk?(v<=35?"Low":v<=55?"Moderate":v<=74?"Elevated":"High"):(v>=85?"Exceptional":v>=75?"Strong":v>=65?"Good":v>=50?"Mixed":v>=40?"Weak":"Poor");
const tone=(s:string)=>{const x=String(s||"").toUpperCase();if(/BUY|ADD|ACCUMULATE|CONSTRUCTIVE|HOLD|STRONG|ATTRACTIVE/.test(x))return"good";if(/AVOID|REDUCE|EXIT|WEAK|POOR/.test(x))return"bad";return"mid"};

export default function StockThesisPanel({decision,metricDefinitions}:{decision:any;metricDefinitions:any}){
 const factors=Object.entries(decision?.factors||{}),canonical=decision.canonical,strat=decision.strategicContext;
 const longTerm=canonical?.longTerm||decision.longTermThesis||{label:decision.thesisLabel,score:decision.thesisScore,reason:decision.oneLine};
 const action=canonical?.newMoney||{action:decision.today?.action||decision.action,reason:decision.today?.reason||decision.actionReason};
 return <div className="aurynThesis">
  <section className="aurynThesisVerdict">
   <div className="aurynThesisLead"><div className="aurynEyebrow">Long-term thesis</div><div className="aurynThesisHeadline"><h2>{longTerm.label}</h2><span>{longTerm.score}/100 · {scoreWord(longTerm.score)}</span></div><p>{decision.oneLine}</p></div>
   <aside className="aurynThesisAction"><div className="aurynEyebrow">New money today</div><b className={tone(action.action)}>{action.action}</b><span>{decision.horizon} decision horizon</span><p>{action.reason}</p></aside>
   <div className="aurynThesisScoreRail">
    <article><div><span>Conviction <MetricInfo title="Conviction score" score={decision.thesisScore}>Overall alignment of business quality, forward evidence and durability. Higher is better.</MetricInfo></span><b>{decision.thesisScore}/100 · {scoreWord(decision.thesisScore)}</b></div><i><em style={{width:`${decision.thesisScore}%`}}/></i><small>Overall evidence, independent of today’s technical setup.</small></article>
    <article><div><span>Future & execution <MetricInfo title="Future & execution" score={strat?.score}>Combines multi-year runway, current execution, theme/company demand evidence and a low-weight market-regime context. Higher is better.</MetricInfo></span><b>{strat?.score??longTerm.score}/100 · {strat?.label||scoreWord(longTerm.score)}</b></div><i><em style={{width:`${strat?.score??longTerm.score}%`}}/></i><small>{strat?.theme||"Business trajectory"} · runway {strat?.runwayScore??"—"} · execution {strat?.executionScore??"—"} · macro/regime {strat?.macroScore??"—"}</small></article>
    {decision.expectationGap&&<article><div><span>Expectation gap <MetricInfo title="Expectation gap" score={decision.expectationGap.score??undefined}>Compares forward growth, revisions and catalysts with a neutral baseline. It is not a price target.</MetricInfo></span><b>{decision.expectationGap.score!=null?`${decision.expectationGap.score}/100 · ${scoreWord(decision.expectationGap.score)}`:"—"}</b></div>{decision.expectationGap.score!=null&&<i><em style={{width:`${decision.expectationGap.score}%`}}/></i>}<small>{decision.expectationGap.label} · {decision.expectationGap.reason}</small></article>}
   </div>
  </section>
  <div className="aurynThesisScoreGuide"><b>How to read scores</b><span>Higher is better for every score except Risk Pressure, where lower is better. Weak timing can make AURYN wait without changing a strong long-term business thesis.</span></div>
  <section className="aurynThesisFactors" aria-label="Thesis factors">
   {factors.map(([k,v]:any)=>{const available=v!=null&&Number.isFinite(Number(v));const isRisk=k==="risk";const label=(isRisk?"Risk pressure":String(k).replace(/([A-Z])/g," $1")).trim();const def=metricDefinitions?.[k];return <article key={k} className={isRisk&&available&&Number(v)>=70?"risk":""}><div><span>{label} {def&&<MetricInfo title={def.title}>{def.short} {def.uses}</MetricInfo>}</span><b>{available?`${v}/100 · ${scoreWord(Number(v),isRisk)}`:"N/A"}</b></div>{available?<i><em style={{width:`${Math.max(3,Math.min(100,Number(v)))}%`}}/></i>:<small>Evidence unavailable</small>}</article>})}
  </section>
  <section className="aurynThesisEvidence">
   <article><span>Why it can work</span>{[...(strat?.drivers||[]),...(decision.drivers||[])].filter(Boolean).slice(0,5).map((x:string,i:number)=><p key={i}>✓ {x}</p>)}</article>
   <article><span>What must be watched</span>{[...(strat?.risks||[]),...(decision.risks||[])].filter(Boolean).slice(0,5).map((x:string,i:number)=><p key={i}>• {x}</p>)}</article>
   <article><span>What would break it</span>{decision.breakers?.length?decision.breakers.map((x:string,i:number)=><p key={i}>• {x}</p>):<p>No specific structural breaker identified yet.</p>}</article>
  </section>
 </div>
}
