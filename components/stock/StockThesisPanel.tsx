"use client";
import MetricInfo from "@/components/v65/MetricInfo";
import type {AurynV4CoreAnalysis,CanonicalFactorKey} from "@/lib/auryn/v4/domain";
import {formatInvestmentAction,newMoneyGuidance} from "@/lib/auryn/v4/presentation";

const scoreWord=(v:number,isRisk=false)=>isRisk?(v<=35?"Low":v<=55?"Moderate":v<=74?"Elevated":"High"):(v>=85?"Exceptional":v>=75?"Strong":v>=65?"Good":v>=50?"Mixed":v>=40?"Weak":"Poor");
const tone=(s:string)=>{const x=String(s||"").toUpperCase();if(/BUY|ADD|ACCUMULATE|CONSTRUCTIVE|HOLD|STRONG|ATTRACTIVE|STRENGTHEN/.test(x))return"good";if(/AVOID|REDUCE|EXIT|SELL|WEAK|POOR|BROKEN|EROD/.test(x))return"bad";return"mid"};
const factorNames:Partial<Record<CanonicalFactorKey,string>>={BUSINESS_QUALITY:"Business",GROWTH_INFLECTION:"Growth",MOAT:"Moat",NARRATIVE_EXPECTATIONS:"Narrative",FUNDAMENTALS_EARNINGS:"Fundamentals",VALUATION:"Valuation",TECHNICALS:"Technicals",POSITIONING:"Positioning",CATALYSTS:"Catalysts",SECTOR_INDUSTRY:"Sector",MACRO_REGIME:"Macro",RISK:"Risk pressure"};

export default function StockThesisPanel({decision,metricDefinitions,v4}:{decision:any;metricDefinitions:any;v4?:AurynV4CoreAnalysis|null}){
 if(v4){
  const thesisScore=v4.thesis.strength;
  const factorRows=(Object.entries(v4.factors) as [CanonicalFactorKey,any][]).filter(([,x])=>x?.available);
  const positive=[...v4.thesis.strengtheningEvidence,...v4.thesis.whyItCanWin].map(x=>x.text).filter(Boolean);
  const negative=v4.thesis.weakeningEvidence.map(x=>x.text).filter(Boolean);
  const missing=v4.narrative.aurynThesis.map(x=>x.text).filter(Boolean);
  const action=formatInvestmentAction(v4.primaryAction);
  return <div className="aurynStockTabPage aurynThesis">
   <section className="aurynThesisVerdict">
    <div className="aurynThesisLead"><div className="aurynEyebrow">Canonical long-term thesis</div><div className="aurynThesisHeadline"><h2>{v4.thesis.direction.replaceAll("_"," ")}</h2><span>{thesisScore==null?"N/A":`${Math.round(thesisScore)}/100 · ${scoreWord(thesisScore)}`}</span></div><p>{v4.thesis.companyState}. This tab explains the same V4 decision shown above; it does not calculate a second verdict.</p></div>
    <aside className="aurynThesisAction"><div className="aurynEyebrow">AURYN decision</div><b className={tone(action)}>{action}</b><span>{newMoneyGuidance(v4.primaryAction)} for new capital</span><p>Technical weakness can change timing. Only structural thesis deterioration can turn an intact long-term case into a SELL.</p></aside>
    <div className="aurynThesisScoreRail">
     <article><div><span>Thesis strength <MetricInfo title="Thesis strength">Slow-moving business, growth, moat and fundamental evidence.</MetricInfo></span><b>{thesisScore==null?"N/A":`${Math.round(thesisScore)}/100 · ${scoreWord(thesisScore)}`}</b></div>{thesisScore!=null&&<i><em style={{width:`${Math.max(3,Math.min(100,thesisScore))}%`}}/></i>}<small>{v4.thesis.direction.replaceAll("_"," ")} · derived from canonical V4 evidence.</small></article>
     <article><div><span>Moat <MetricInfo title="Moat">Competitive durability is scored only when evidence exists; heuristic migration evidence is labeled.</MetricInfo></span><b>{v4.moat.score==null?"N/A":`${Math.round(v4.moat.score)}/100 · ${v4.moat.direction}`}</b></div>{v4.moat.score!=null&&<i><em style={{width:`${Math.max(3,Math.min(100,v4.moat.score))}%`}}/></i>}<small>{v4.moat.direction.replaceAll("_"," ")}</small></article>
     <article><div><span>Decision confidence <MetricInfo title="Decision confidence">Coverage, freshness, source quality, model fit and evidence agreement. This is not a probability of profit.</MetricInfo></span><b>{v4.confidence.score}/100 · {v4.confidence.label}</b></div><i><em style={{width:`${v4.confidence.score}%`}}/></i><small>{v4.analystModel.id} · {Math.round(v4.analystModel.suitability*100)}/100 model fit</small></article>
    </div>
   </section>
   <div className="aurynThesisScoreGuide"><b>One canonical brain</b><span>Every tab below explains a factor feeding the V4 decision. Missing evidence shows N/A and never becomes a bearish zero.</span></div>
   <section className="aurynThesisFactors" aria-label="Canonical thesis factors">
    {factorRows.map(([k,v])=>{const isRisk=k==="RISK";return <article key={k} className={isRisk&&Number(v.score)>=70?"risk":""}><div><span>{factorNames[k]||k.replaceAll("_"," ")}</span><b>{v.score==null?"N/A":`${Math.round(v.score)}/100 · ${scoreWord(Number(v.score),isRisk)}`}</b></div>{v.score!=null&&<i><em style={{width:`${Math.max(3,Math.min(100,Number(v.score)))}%`}}/></i>}<small>{v.reason}</small></article>})}
   </section>
   <section className="aurynThesisEvidence">
    <article><span>Why it can work</span>{positive.length?positive.slice(0,5).map((x,i)=><p key={i}>✓ {x}</p>):(decision?.drivers||[]).slice(0,4).map((x:string,i:number)=><p key={i}>✓ {x}</p>)}</article>
    <article><span>What must be watched</span>{negative.length?negative.slice(0,5).map((x,i)=><p key={i}>• {x}</p>):(decision?.risks||[]).slice(0,4).map((x:string,i:number)=><p key={i}>• {x}</p>)}</article>
    <article><span>What would break it</span>{v4.thesis.invalidationConditions.length?v4.thesis.invalidationConditions.map((x,i)=><p key={i}>• {x}</p>):<p>No source-backed structural breaker is established yet.</p>}{missing.slice(0,2).map((x,i)=><p key={`m-${i}`}>• {x}</p>)}</article>
   </section>
  </div>;
 }
 const factors=Object.entries(decision?.factors||{}),canonical=decision.canonical,strat=decision.strategicContext;
 const longTerm=canonical?.longTerm||decision.longTermThesis||{label:decision.thesisLabel,score:decision.thesisScore,reason:decision.oneLine};
 const action=canonical?.newMoney||{action:decision.today?.action||decision.action,reason:decision.today?.reason||decision.actionReason};
 return <div className="aurynStockTabPage aurynThesis">
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
 </div>;
}
