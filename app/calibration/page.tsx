"use client";
import {useEffect,useState} from "react";
import AppShell from "@/components/AppShell";

const pct=(x:any)=>Number.isFinite(Number(x))?`${Number(x).toFixed(1)}%`:"—";
const num=(x:any,d=2)=>Number.isFinite(Number(x))?Number(x).toFixed(d):"—";
const measured=(n:any,value:string)=>Number(n)>0?value:"—";

export default function CalibrationPage(){
 const[data,setData]=useState<any>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{fetch("/api/calibration",{cache:"no-store"}).then(r=>r.json()).then(setData).finally(()=>setLoading(false))},[]);
 const s=data?.summary||{},days=[30,90,180,365,730];
 return <AppShell><section className="tradingLabPage">
  <div className="tradingLabHead"><div><div className="eyebrow">NIVORA MODEL EVIDENCE</div><h1>Calibration before confidence.</h1><p>NIVORA separates score coverage from proven predictive reliability. Historical evidence is reused only when the thesis-weight contract is compatible.</p></div></div>
  {loading?<div className="tradingLabEmpty">Loading calibration evidence…</div>:<>
   <div className="tradingLabGrid">
    <article><small>STATUS</small><b>{String(data?.status||"unknown").toUpperCase()}</b><span>{s.n??0} Weight-compatible matured observations</span></article>
    <article><small>BENCHMARK HIT RATE</small><b>{measured(s.n,pct(s.hitRatePct))}</b><span>{s.confidence95?`95% interval ${pct(s.confidence95.lowPct)}–${pct(s.confidence95.highPct)}`:"Collecting interval"}</span></article>
    <article><small>AVG / MEDIAN ALPHA</small><b>{measured(s.n,pct(s.avgAlphaPct))}</b><span>Median {measured(s.n,pct(s.medianAlphaPct))}</span></article>
    <article><small>INFORMATION RATIO</small><b>{measured(s.n,num(s.informationRatio,3))}</b><span>Alpha mean ÷ alpha dispersion</span></article>
   </div>
   <div className="tradingLabGrid secondary">
    <article><small>BRIER</small><b>{measured(s.n,num(s.brierScore,4))}</b><span>Score-to-outperformance calibration error; lower is better.</span></article>
    <article><small>Expected calibration error</small><b>{measured(s.n,pct(s.expectedCalibrationErrorPct))}</b><span>Gap between score-implied confidence and realized hit frequency.</span></article>
    <article><small>SCORE ↔ ALPHA</small><b>{measured(s.n,num(s.scoreAlphaCorrelation,3))}</b><span>Positive is desirable; near zero means weak discrimination.</span></article>
    <article><small>ALPHA DISPERSION</small><b>{measured(s.n,pct(s.alphaStdDevPct))}</b><span>Higher dispersion means less stable excess returns.</span></article>
   </div>
   <section className="tradingAudit"><div className="tradingAuditHead"><div><small>HORIZON EVIDENCE</small><h2>Weight-compatible vs Exact-engine</h2></div></div>
    <div className="tradingAuditTable"><div className="tradingAuditRow head"><span>Horizon</span><span>Weight-compatible</span><span>Exact-engine</span><span>Hit rate</span><span>Avg alpha</span><span>Calibration</span></div>
    {days.map(d=>{const x=data?.outcomes?.[d]||{},c=x.compatibleSummary||{},e=x.exactEngineSummary||{};return <div className="tradingAuditRow" key={d}><b>{d===365?"1Y":d===730?"2Y":`${d}D`}</b><span>N={c.n??0}</span><span>N={e.n??0}</span><span>{measured(c.n,pct(c.hitRatePct))}</span><span>{measured(c.n,pct(c.avgAlphaPct))}</span><span>{Number(c.n)>0?`Brier ${num(c.brierScore,4)} · ECE ${pct(c.expectedCalibrationErrorPct)}`:"Collecting"}</span></div>})}
    </div>
   </section>
   <section className="tradingAudit"><div className="tradingAuditHead"><div><small>COHORT RELIABILITY</small><h2>Archetype × horizon × market regime</h2></div><span>Only matured benchmark-comparable outcomes</span></div>
    {Array.isArray(data?.cohorts)&&data.cohorts.length?<div className="tradingAuditTable"><div className="tradingAuditRow head"><span>Archetype</span><span>Horizon</span><span>Regime</span><span>Sample</span><span>Hit / alpha</span><span>Status</span></div>{data.cohorts.slice(0,24).map((c:any)=><div className="tradingAuditRow" key={c.key}><b>{String(c.archetype||"unknown").replaceAll("_"," ")}</b><span>{c.horizon}</span><span>{c.regime}</span><span>N={c.summary?.n??0}</span><span>{Number(c.summary?.n)>0?`${pct(c.summary?.hitRatePct)} · ${pct(c.summary?.avgAlphaPct)}`:"—"}</span><span>{c.summary?.status||"COLLECTING"}</span></div>)}</div>:<div className="tradingLabEmpty">Cohort calibration is collecting. NIVORA will not borrow reliability from unrelated archetypes or market regimes.</div>}
   </section>
   <div className="tradingLabMethod"><div><b>How to read this</b><p>Coverage tells us how much data NIVORA had. Calibration tells us whether high scores actually corresponded to better benchmark-relative outcomes. Until sample sizes mature, reliability remains Collecting.</p></div></div>
  </>}
 </section></AppShell>
}
