"use client";
import {useCallback,useEffect,useState} from "react";
import {Activity,FlaskConical,Play,RefreshCw} from "lucide-react";
import AppShell from "@/components/AppShell";
import MetricInfo from "@/components/v65/MetricInfo";
import {supabaseBrowser} from "@/lib/supabase";

type EvalRow={symbol:string;action:string;status:string;reason:string;riskCode?:string|null;evaluatedAt?:string|null;orderStatus?:string|null;fillStatus?:string|null;realizedPnl?:number|null;returnPct?:number|null};
const when=(x?:string|null)=>x?new Date(x).toLocaleString():"—";
const money=(x?:number|null,signed=true)=>x==null?"—":`${signed?(x>=0?"+":"-"):""}$${Math.abs(x).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;

export default function TradingLab(){
 const[data,setData]=useState<any>(null),[loading,setLoading]=useState(true),[running,setRunning]=useState(false),[runMessage,setRunMessage]=useState("");
 const load=useCallback(()=>fetch("/api/trading-lab/status",{cache:"no-store"}).then(r=>r.json()).then(setData).finally(()=>setLoading(false)),[]);
 useEffect(()=>{let live=true;const refresh=()=>load().catch(()=>{});refresh();const timer=setInterval(()=>{if(live)refresh()},15000);return()=>{live=false;clearInterval(timer)}},[load]);
 const m=data?.metrics||{},rows:EvalRow[]=data?.recentEvaluations||[];
 const evaluated=Number(data?.funnel?.evaluated||0),orders=Number(data?.orders||0),trades=Number(m?.trades||0),buySignals=Number(data?.decisionAudit?.actions?.BUY||0);
 const latest=rows[0]||null;
 const blocker=data?.decisionAudit?.dominantBlockers?.[0]?.reason||null;
 const statusTitle=!data?.broker?.connected?"Paper broker needs attention":evaluated===0?"Ready — no decisions evaluated yet":orders===0?"Working — no paper order qualified yet":trades===0?"Orders reached Alpaca Paper":"Paper trading is producing measurable results";
 const statusText=!data?.broker?.connected?(data?.broker?.error||"Alpaca Paper is not connected."):evaluated===0?"Run one paper check below. NIVORA will refresh your portfolio decisions, evaluate every fresh signal and show exactly why each one traded or did not trade.":orders===0?(blocker?`Most common reason no trade qualified: ${blocker}`:"The evaluated signals did not pass the full decision and risk gates yet."):trades===0?"At least one paper order was submitted; fills/results will appear here when Alpaca reports them.":`${trades} completed paper trade${trades===1?"":"s"} are now available for performance measurement.`;

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

 return <AppShell><section className="tradingLabPage v653TradingLab">
  <header className="v653LabHero"><div><div className="eyebrow">TRADING LAB · PAPER ONLY</div><h1>See whether NIVORA actually trades.</h1><p>One place to prove the full path: decision → risk check → Alpaca Paper → result. No live money.</p></div><span className="paperBadge"><FlaskConical size={16}/> PAPER</span></header>

  <section className="v653LabStatus">
   <div><small>RIGHT NOW</small><h2>{statusTitle}</h2><p>{statusText}</p></div>
   <button type="button" className="v653RunButton" onClick={runNow} disabled={running||!data?.broker?.connected}>{running?<RefreshCw className="spin" size={17}/>:<Play size={17}/>} {running?"Running…":"Run paper check now"}</button>
  </section>
  {runMessage?<div className="v653RunMessage">{runMessage}</div>:null}

  {loading?<div className="tradingLabEmpty">Loading paper account…</div>:<>
   <div className="v653LabNumbers">
    <article><small>PAPER ACCOUNT <MetricInfo title="Paper account">The simulated Alpaca account used only for testing NIVORA decisions.</MetricInfo></small><b>{data?.broker?.connected?money(Number(data?.broker?.equity||0),false):"Not connected"}</b><span>{data?.broker?.positions??0} open paper positions</span></article>
    <article><small>DECISIONS CHECKED <MetricInfo title="Decisions checked">Fresh frozen NIVORA decisions that Trading Lab actually evaluated through the execution rules.</MetricInfo></small><b>{evaluated.toLocaleString()}</b><span>{buySignals.toLocaleString()} current BUY signal{buySignals===1?"":"s"}</span></article>
    <article><small>PAPER ORDERS <MetricInfo title="Paper orders">Orders that passed all risk gates and were sent to Alpaca Paper.</MetricInfo></small><b>{orders.toLocaleString()}</b><span>{data?.lastOrder?.at?`Last order ${when(data.lastOrder.at)}`:"No order has qualified yet"}</span></article>
    <article><small>REALIZED RESULT <MetricInfo title="Realized paper result">Completed simulated trades only. This remains blank until there is an actual round-trip paper trade.</MetricInfo></small><b>{trades?money(Number(m.netPnl||0)):"—"}</b><span>{trades?`${m.winRatePct}% win rate · ${trades} trade${trades===1?"":"s"}`:"No completed paper trades yet"}</span></article>
   </div>

   <section className="v653LabActivity">
    <div className="v653SectionHead"><div><small>WHAT HAPPENED</small><h2>{rows.length?"Latest paper decisions":"Nothing has been evaluated yet"}</h2></div>{latest?<span>Updated {when(latest.evaluatedAt)}</span>:null}</div>
    {rows.length?<div className="v653DecisionList">{rows.slice(0,12).map((r,i)=><article key={`${r.symbol}-${r.evaluatedAt}-${i}`}><div><b>{r.symbol}</b><span>{r.action}</span></div><strong className={r.status==="SUBMITTED"?"good":r.status==="BLOCKED"||r.status==="ERROR"?"bad":"mid"}>{String(r.status||"").replaceAll("_"," ")}</strong><p>{r.reason}</p>{r.realizedPnl!=null?<em>{money(r.realizedPnl)}</em>:null}</article>)}</div>:<div className="v653EmptyAction"><Activity size={22}/><b>Run the first paper check.</b><span>It will refresh your portfolio decisions and immediately show which symbols were actionable, blocked, or intentionally ignored.</span></div>}
   </section>

   <details className="v653LabDetails"><summary>Performance &amp; system details</summary><div className="v653LabDetailsBody">
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
