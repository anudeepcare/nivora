"use client";
import {useMemo} from "react";
import type {Research} from "@/lib/types";
import {valueDesk,type DeskMetric} from "@/lib/research-desks";
import {percent,dateLabel} from "@/lib/format";
import ScenarioCompass from "./ScenarioCompass";
import {modelAssessment} from "@/lib/model-assessment";
const display=(m:DeskMetric)=>m.value==null?"Not available":m.unit==="ratio"?`${m.value.toFixed(1)}×`:percent(m.value);
export default function ValueStudio({research:r,onWorkbench}:{research:Research;onWorkbench:()=>void}) {
  const d=useMemo(()=>valueDesk(r),[r]);
  const methods=useMemo(()=>modelAssessment(r),[r]);
  const available=d.metrics.filter(m=>m.value!=null);
  const missing=d.metrics.filter(m=>m.value==null);
  const yields=d.metrics.filter(m=>["earningsYield","forwardYield"].includes(m.key));
  const maximum=Math.max(10,...yields.flatMap(m=>m.value==null?[]:[m.value]));
  return <div className="value-studio">
    <header className="desk-heading"><div><span className="eyebrow">Value · what the price implies</span><h2>Price in context.</h2><p>Read the scenario, the multiple and the assumptions together.</p></div><button type="button" className="button" onClick={onWorkbench}>Test assumptions →</button></header>
    <ScenarioCompass research={r}/>
    {d.metrics.length>0 && <section className="valuation-board" aria-labelledby="market-pricing-title">
      <header className="section-head"><div><span className="eyebrow">Reported market pricing</span><h3 id="market-pricing-title">What you are paying for</h3></div><small>{d.asOf?`Reported ${dateLabel(d.asOf)}`:"Observation date not supplied"}</small></header>
      {!available.length && <p className="desk-footnote">Market multiples were not supplied for this report. Available scenarios and their assumptions remain above.</p>}
      <div className="valuation-board-grid">{available.map((m,i)=><article key={m.key} data-tone={i<4?"blue":"teal"}><span>{m.label}</span><strong>{display(m)}</strong><p>{m.note}</p></article>)}</div>
      {!!missing.length && <p className="desk-footnote">Not supplied or not meaningful: {missing.map(m=>m.label).join(" · ")}. These measures are not treated as zero.</p>}
    </section>}
    {yields.some(m=>m.value!=null)&&<section className="earnings-yield-view" aria-label="Earnings represented per 100 units of equity price"><div><span className="eyebrow">A different lens</span><h3>For every 100 you pay.</h3><p>Reported or estimated annual earnings represented by the multiple. These amounts are neither cash distributions nor expected investment returns.</p></div><div className="yield-bars">{yields.map(m=><div key={m.key}><span>{m.label}</span><strong>{m.value==null?"Not available":m.value.toFixed(2)}</strong><i><b style={{width:`${m.value==null?0:m.value/maximum*100}%`}}/></i></div>)}</div></section>}
    <section className="value-model-fit"><header className="section-head"><h3>The right lens for this business.</h3><span className="eyebrow">Model fit</span></header>{methods.methods.map(method=><div key={method.key}><i data-state={method.status}/><div><strong>{method.name}</strong><p>{method.reason}</p></div><span>{method.status==="available"?"Available":method.status==="unsuitable"?"Different model":"More evidence needed"}</span></div>)}</section>
    <p className="desk-footnote">Multiples are reported observations and can use different dates from the quote. A low multiple alone does not establish value. Corporate multiples do not apply to crypto; unsupported inputs remain unavailable.</p>
  </div>;
}
