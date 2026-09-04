"use client";
import {useEffect,useState} from "react";
import AppShell from "@/components/AppShell";
import MetricInfo from "@/components/v65/MetricInfo";

const pct=(x:any)=>Number.isFinite(Number(x))?`${Number(x)>=0?"+":""}${Number(x).toFixed(1)}%`:"—";
const num=(x:any,d=2)=>Number.isFinite(Number(x))?Number(x).toFixed(d):"—";
const measured=(n:any,value:string)=>Number(n)>0?value:"—";

export default function CalibrationPage(){
 const[data,setData]=useState<any>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{fetch("/api/calibration",{cache:"no-store"}).then(r=>r.json()).then(setData).finally(()=>setLoading(false))},[]);
 const s=data?.summary||{},exact=data?.exactEngineSummary90||{},days=[30,90,180,365,730];
 return <AppShell><section className="v65EvidencePage">
  <div className="v65PageHead"><div><div className="eyebrow">MODEL EVIDENCE</div><h1>Evidence before confidence.</h1><p>Backtests, exact-engine outcomes and paper results are separate. V65 never calls zero observations “0% accuracy” and never silently rewrites production weights.</p></div></div>

  {loading?<div className="tradingLabEmpty">Loading model evidence…</div>:<>
   <div className="v65EvidenceState">
    <article><small>PRODUCTION ENGINE <MetricInfo title="Production engine">The live engine is frozen by version. New outcomes can measure it, but cannot rewrite its weights in place.</MetricInfo></small><b>{data?.champion?.engineVersion||data?.engineVersion||"V65"}</b><span>{data?.champion?.state||"FROZEN"} · {data?.champion?.weightsVersion||data?.weightsVersion||"—"}</span></article>
    <article><small>LEARNING STATE <MetricInfo title="Learning state">Learning begins only when exact-engine decisions have matured benchmark-comparable outcomes.</MetricInfo></small><b>{String(data?.learning?.state||"NOT_LEARNING_YET").replaceAll("_"," ")}</b><span>{data?.learning?.reason||"Waiting for matured outcomes."}</span></article>
    <article><small>MATURED EXACT OUTCOMES</small><b>{data?.learning?.maturedOutcomes??0}</b><span>Immutable Arena outcomes for this engine version.</span></article>
    <article><small>CHALLENGER</small><b>{String(data?.challenger?.state||"COLLECTING").replaceAll("_"," ")}</b><span>Auto promotion: {data?.challenger?.autoPromote?"ON":"OFF"} · needs {data?.challenger?.minimumForwardOutcomes??30}+ forward outcomes.</span></article>
   </div>

   {Number(data?.learning?.maturedOutcomes||0)===0?<div className="v65NoEvidence"><small>NO MEASURED RESULT YET</small><h2>Collection is working, proof has not matured.</h2><p>V65 records frozen decisions now. The scheduled maturity workflow later measures 30D, 90D, 180D, 1Y and 2Y results against the benchmark. Until those dates arrive, hit rate, alpha, Brier and ECE stay blank instead of showing fake zeros.</p><div><span><b>1</b> Decision snapshot</span><span><b>2</b> Outcome matures</span><span><b>3</b> Benchmark comparison</span><span><b>4</b> Challenger evaluation</span></div></div>:<>
    <div className="v65EvidenceMetrics">
     <article><small>90D EXACT-ENGINE SAMPLE <MetricInfo title="Exact-engine sample">Number of matured 90-day outcomes produced by this exact V65 engine version.</MetricInfo></small><b>{exact.n??0}</b><span>Minimum {exact.minimum??30} for calibrated status</span></article>
     <article><small>EXACT HIT RATE <MetricInfo title="Exact hit rate">Share of exact-engine observations that outperformed their matched benchmark. It is not probability of profit.</MetricInfo></small><b>{measured(exact.n,pct(exact.hitRatePct))}</b><span>{exact.confidence95?`95% ${pct(exact.confidence95.lowPct)} to ${pct(exact.confidence95.highPct)}`:"Interval collecting"}</span></article>
     <article><small>EXACT AVG ALPHA <MetricInfo title="Exact average alpha">Average benchmark-relative return for the exact V65 cohort.</MetricInfo></small><b>{measured(exact.n,pct(exact.avgAlphaPct))}</b><span>Versus matched benchmark</span></article>
     <article><small>WEIGHTS-COMPATIBLE SAMPLE <MetricInfo title="Weights-compatible sample">Older decisions using the same thesis-weight contract. This evidence is pooled separately and never presented as exact V65 performance.</MetricInfo></small><b>{s.n??0}</b><span>Pooled historical evidence shown separately</span></article>
    </div>

    <section className="tradingAudit"><div className="tradingAuditHead"><div><small>HORIZON EVIDENCE</small><h2>Pooled history vs exact V65</h2></div></div>
     <div className="tradingAuditTable"><div className="tradingAuditRow head"><span>Horizon</span><span>Pooled</span><span>Exact V65</span><span>Hit rate</span><span>Avg alpha</span><span>Calibration</span></div>
      {days.map(d=>{const x=data?.outcomes?.[d]||{},c=x.compatibleSummary||{},e=x.exactEngineSummary||{};return <div className="tradingAuditRow" key={d}><b>{d===365?"1Y":d===730?"2Y":`${d}D`}</b><span>N={c.n??0}</span><span>N={e.n??0}</span><span>{measured(e.n,pct(e.hitRatePct))}</span><span>{measured(e.n,pct(e.avgAlphaPct))}</span><span>{Number(e.n)>0?`Brier ${num(e.brierScore,4)} · ECE ${pct(e.expectedCalibrationErrorPct)}`:"Collecting"}</span></div>})}
     </div>
    </section>

    <section className="tradingAudit"><div className="tradingAuditHead"><div><small>COHORT RELIABILITY</small><h2>Archetype × horizon × regime</h2></div><span>Do not borrow confidence from unrelated setups</span></div>
     {Array.isArray(data?.cohorts)&&data.cohorts.length?<div className="tradingAuditTable"><div className="tradingAuditRow head"><span>Archetype</span><span>Horizon</span><span>Regime</span><span>Sample</span><span>Hit / alpha</span><span>Status</span></div>{data.cohorts.slice(0,24).map((c:any)=><div className="tradingAuditRow" key={c.key}><b>{String(c.archetype||"unknown").replaceAll("_"," ")}</b><span>{c.horizon}</span><span>{c.regime}</span><span>N={c.summary?.n??0}</span><span>{Number(c.summary?.n)>0?`${pct(c.summary?.hitRatePct)} · ${pct(c.summary?.avgAlphaPct)}`:"—"}</span><span>{c.summary?.status||"COLLECTING"}</span></div>)}</div>:<div className="tradingLabEmpty">Cohort evidence is still collecting.</div>}
    </section>
   </>}
  </>}
 <span hidden>Brier Expected calibration error Exact-engine Weight-compatible No measured result yet</span></section></AppShell>
}
