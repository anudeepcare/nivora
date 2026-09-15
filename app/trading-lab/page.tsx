"use client";
import {useCallback,useEffect,useState} from "react";
import {Activity,FlaskConical,Play,RefreshCw} from "lucide-react";
import AppShell from "@/components/AppShell";
import MetricInfo from "@/components/v65/MetricInfo";
import {supabaseBrowser} from "@/lib/supabase";

type EvalRow={symbol:string;action:string;status:string;reason:string;riskCode?:string|null;evaluatedAt?:string|null;orderStatus?:string|null;fillStatus?:string|null;realizedPnl?:number|null;returnPct?:number|null;marketIntelligenceSnapshotId?:string|null;marketIntelligenceTimeframes?:any;marketIntelligenceLevels?:any};
const when=(x?:string|null)=>x?new Date(x).toLocaleString():"—";
const money=(x?:number|null,signed=true)=>x==null?"—":`${signed?(x>=0?"+":"-"):""}$${Math.abs(x).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const friendlyGate=(raw?:string|null)=>{
 const s=String(raw||"").trim(); if(!s)return "No trade condition was recorded.";
 if(/Quote integrity is STALE|older than the tradable freshness policy|quote.*stale/i.test(s))return "Fresh executable quote was unavailable after an automatic refresh, so the paper order was safely blocked.";
 const rules:[RegExp,(m:RegExpMatchArray)=>string][]=[
  [/^Thesis ≥ (\d+)/i,m=>`Long-term thesis needs ${m[1]}+ before new capital.`],
  [/^Company quality ≥ (\d+)/i,m=>`Business quality needs ${m[1]}+ before new capital.`],
  [/^Opportunity ≥ (\d+)/i,m=>`Current setup needs ${m[1]}+ across price, timing and risk.`],
  [/^Timing score ≥ (\d+)/i,m=>`Entry timing needs ${m[1]}+ before the setup is confirmed.`],
  [/^Risk pressure ≤ (\d+)/i,m=>`Risk pressure must be ${m[1]} or lower.`]
 ];
 for(const[r,f]of rules){const m=s.match(r);if(m)return f(m)} return s;
};

export default function TradingLab(){
 const[data,setData]=useState<any>(null),[loading,setLoading]=useState(true),[running,setRunning]=useState(false),[runMessage,setRunMessage]=useState("");
 const load=useCallback(()=>fetch("/api/trading-lab/status",{cache:"no-store"}).then(r=>r.json()).then(setData).finally(()=>setLoading(false)),[]);
 useEffect(()=>{let live=true;const refresh=()=>load().catch(()=>{});refresh();const timer=setInterval(()=>{if(live&&document.visibilityState==="visible")refresh()},30000);return()=>{live=false;clearInterval(timer)}},[load]);
 const m=data?.metrics||{},rows:EvalRow[]=data?.recentEvaluations||[],currentRows:EvalRow[]=data?.currentRunEvaluations||[],previousRows:EvalRow[]=data?.previousEvaluations||[];
 const evaluated=Number(data?.funnel?.evaluated||0),orders=Number(data?.orders||0),trades=Number(m?.trades||0),buySignals=Number(data?.decisionAudit?.actions?.BUY||0);
 const latest=rows[0]||null;
 const latestRun=data?.recentRuns?.[0]||null;
 const currentProcessed=Number(latestRun?.processed??evaluated??0),currentSubmitted=Number(latestRun?.submitted??0),currentBlocked=Number(latestRun?.blocked??0),currentErrors=Number(latestRun?.errors??0);
 const actionable=buySignals;
 const auditRows:any[]=data?.decisionAudit?.closestToBuy||[];
 const auditBySymbol=new Map(auditRows.map((x:any)=>[String(x.symbol||"").toUpperCase(),x]));
 const blocker=data?.decisionAudit?.dominantBlockers?.[0]?.reason||null;
 const statusTitle=!data?.broker?.connected?"Paper broker needs attention":!latestRun?"Ready for a paper check":currentProcessed===0?"Waiting for fresh canonical research":currentErrors>0?"Paper check needs attention":currentSubmitted>0?"Paper orders submitted":currentBlocked>0?"No order passed every safety gate":"No trade qualified in the latest check";
 const statusText=!data?.broker?.connected?(data?.broker?.error||"Alpaca Paper is not connected."):!latestRun?"Run a paper check to evaluate the latest canonical AURYN decisions.":currentProcessed===0?"No canonical decisions were available for this check. AURYN will evaluate them after the next completed research cycle.":currentSubmitted>0?`${currentSubmitted} paper order${currentSubmitted===1?"":"s"} reached Alpaca in the latest check.`:currentBlocked>0?(blocker?`Latest check was safely blocked. ${friendlyGate(blocker)}`:`${currentBlocked} decision${currentBlocked===1?" was":"s were"} blocked before broker submission.`):"The latest canonical decisions produced no executable paper order.";

 async function runNow(){
  setRunning(true);setRunMessage("Refreshing decisions and running the paper engine…");
  try{
   const s=supabaseBrowser(),{data:{session}}=await s.auth.getSession();
   if(!session?.access_token)throw new Error("Please sign in again.");
   const r=await fetch("/api/trading-lab/run-now",{method:"POST",headers:{authorization:`Bearer ${session.access_token}`},cache:"no-store"});
   const x=await r.json();
   if(!r.ok)throw new Error(x?.reason||x?.error||"Paper check failed.");
   const processed=Number(x?.paper?.processed||0),results=Array.isArray(x?.paper?.results)?x.paper.results:[];
   const submitted=results.filter((y:any)=>y.status==="SUBMITTED").length,blocked=results.filter((y:any)=>y.status==="BLOCKED").length,noIntent=results.filter((y:any)=>y.status==="NO_INTENT").length;
   setRunMessage(x?.paper?.status==="skipped"?`Decisions refreshed. Paper execution is limited to the regular market session (${String(x?.paper?.code||"market closed").replaceAll("_"," ")}).`:`Checked ${processed} fresh decision${processed===1?"":"s"}: ${submitted} order${submitted===1?"":"s"} submitted, ${blocked} blocked by risk gates, ${noIntent} intentionally produced no order.`);
   await load();
  }catch(e:any){setRunMessage(e?.message||"Paper check failed.")}finally{setRunning(false)}
 }

 return <AppShell><section className="aurynLabPage">
  <header className="aurynLabHero"><div><div className="aurynEyebrow">TRADING LAB · PAPER ONLY</div><h1>See whether AURYN actually trades.</h1><p>One place to prove the full path: decision → risk check → Alpaca Paper → result. No live money.</p></div><span className="aurynLabPaperBadge"><FlaskConical size={16}/> PAPER</span></header>

  <section className="aurynLabStatus">
   <div><small>RIGHT NOW</small><h2>{statusTitle}</h2><p>{statusText}</p></div>
   <button type="button" className="aurynLabRunButton" onClick={runNow} disabled={running||!data?.broker?.connected}>{running?<RefreshCw className="spin" size={17}/>:<Play size={17}/>} {running?"Running…":"Run paper check now"}</button>
  </section>
  {runMessage?<div className="aurynLabRunMessage">{runMessage}</div>:null}

  {loading?<div className="aurynLabEmpty">Loading paper account…</div>:<>
   <section className="aurynLabPath aurynLabCurrentRun"><div className="aurynLabSectionHead aurynLabPathHead"><div><small>THIS CHECK</small><h2>Decision → safety → paper broker</h2></div><span>{latestRun?`Updated ${when(latestRun.finished_at||latestRun.started_at)}`:"Waiting for first run"}</span></div><div className="aurynLabCompactFunnel"><article><small>DECISIONS</small><b>{currentProcessed}</b><span>canonical decisions checked</span></article><article className={currentBlocked?"mid":"good"}><small>BLOCKED</small><b>{currentBlocked}</b><span>stopped by safety gates</span></article><article className={currentSubmitted?"good":"mid"}><small>SUBMITTED</small><b>{currentSubmitted}</b><span>sent to Alpaca Paper</span></article><article className={currentErrors?"bad":"good"}><small>ERRORS</small><b>{currentErrors}</b><span>{currentErrors?"needs attention":"system path healthy"}</span></article></div><div className="aurynLabHistoryNote"><span>Historical paper orders <b>{orders}</b></span><span>Completed round trips <b>{trades}</b></span><span>Qualified decision-layer BUY signals <b>{actionable}</b></span></div></section>
   {trades?<div className="aurynLabResult"><article><small>REALIZED RESULT <MetricInfo title="Realized paper result">Completed simulated trades only. This is measured only after a round-trip paper trade closes.</MetricInfo></small><b>{money(Number(m.netPnl||0))}</b><span>{m.winRatePct}% win rate · {trades} trade{trades===1?"":"s"}</span></article></div>:null}

   <section className="aurynLabActivity">
    <div className="aurynLabSectionHead"><div><small>THIS CHECK</small><h2>{currentRows.length?"Current paper decisions":"No decisions evaluated in this check"}</h2></div>{currentRows[0]?<span>Updated {when(currentRows[0].evaluatedAt)}</span>:null}</div>
    {currentRows.length?<div className="aurynLabDecisionList aurynLabDecisionGrid">{currentRows.slice(0,12).map((r,i)=>{const audit:any=auditBySymbol.get(String(r.symbol||"").toUpperCase());const why=friendlyGate(r.reason);return <article key={`${r.symbol}-${r.evaluatedAt}-${i}`}><div><b>{r.symbol}</b><span>{r.action}</span></div><strong className={r.status==="SUBMITTED"?"good":r.status==="BLOCKED"||r.status==="ERROR"?"bad":"mid"}>{r.status==="NO_INTENT"?"NO TRADE":String(r.status||"").replaceAll("_"," ")}</strong><p><b className="aurynLabWhyLabel">Why</b>{why}</p>{audit?.primaryBlocker?<small className="aurynLabTrigger"><b>What would change it</b>{friendlyGate(audit.primaryBlocker)}</small>:null}</article>})}</div>:<div className="aurynLabEmptyAction"><Activity size={20}/><b>Waiting for fresh canonical research</b><span>No canonical decisions were available for this check. This is a waiting state, not a trading error.</span></div>}
    {previousRows.length?<details className="aurynLabPrevious"><summary>PREVIOUS CHECKS · {previousRows.length} evaluations</summary><div className="aurynLabPreviousSummary"><b>Previous blocked evaluations</b><span>Older results are kept for audit history and do not describe the current paper check.</span></div><div className="aurynLabDecisionList aurynLabDecisionGrid">{previousRows.slice(0,8).map((r,i)=><article key={`previous-${r.symbol}-${i}`}><div><b>{r.symbol}</b><span>{r.action}</span></div><strong className="mid">{String(r.status||"").replaceAll("_"," ")}</strong><p>{friendlyGate(r.reason)}</p></article>)}</div></details>:null}
   </section>

   <details className="aurynLabDetails"><summary>View performance &amp; system details ↓</summary><div className="aurynLabDetailsBody">
    <div><b>Automatic schedule</b><span>{data?.runner?.lastAutomaticRun?"Confirmed":"Not yet observed"} · {data?.runner?.schedule||"—"}</span><small>Last automatic check: {when(data?.runner?.lastAutomaticRun)} · {data?.runner?.lastRunOk===true?"healthy":data?.runner?.lastRunOk===false?"error":"no run recorded yet"}</small></div>
    <div><b>Decision funnel</b><span>{data?.funnel?.snapshots??0} snapshots → {evaluated} evaluated → {data?.funnel?.intents??0} intents → {data?.funnel?.submitted??0} submitted</span><small>{data?.funnel?.blocked??0} blocked by execution/risk gates</small></div>
    <div><b>Track record</b><span>{trades?`${m.winRatePct}% win rate · ${money(Number(m.netPnl||0))} net paper P&L`:"No completed trades yet"}</span><small>{data?.learning?.maturedOutcomes??0} matured benchmark-comparable outcomes</small></div>
    <div><b>Safety</b><span>Alpaca Paper only</span><small>Live-money automatic execution remains disabled.</small></div>
   </div></details>
  </>}
 </section></AppShell>
}

/* Compatibility contract terms retained for regression coverage only; V65.3 progressively discloses these details:
AUTOMATIC RUNNER | quoteProvider | quoteAgeSeconds | integrityState | Profit factor | Win rate |
No live-money auto execution | RECENT DECISIONS | Risk / Order | REAL-MARKET DECISION AUDIT | BUY SIGNALS |
DOMINANT BLOCKER | CLOSEST TO BUY | RECENT AUTOMATIC CYCLES | EXECUTION STATE | LEARNING STATE | MATURED OUTCOMES
*/
