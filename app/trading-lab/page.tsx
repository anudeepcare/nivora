"use client";
import {useEffect,useState} from "react";
import {Activity,ShieldCheck,FlaskConical,TrendingUp} from "lucide-react";
import AppShell from "@/components/AppShell";

type EvalRow={symbol:string;action:string;status:string;reason:string;riskCode?:string|null;evaluatedAt?:string|null;orderStatus?:string|null;fillStatus?:string|null;fillPrice?:number|null;realizedPnl?:number|null;returnPct?:number|null};
const when=(x?:string|null)=>x?new Date(x).toLocaleString():"—";
const money=(x?:number|null)=>x==null?"—":`${x>=0?"+":"-"}$${Math.abs(x).toLocaleString(undefined,{maximumFractionDigits:2})}`;

export default function TradingLab(){
 const[data,setData]=useState<any>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{let live=true;const load=()=>fetch("/api/trading-lab/status",{cache:"no-store"}).then(r=>r.json()).then(x=>{if(live)setData(x)}).finally(()=>{if(live)setLoading(false)});load();const timer=setInterval(load,15000);return()=>{live=false;clearInterval(timer)}},[]);
 const m=data?.metrics||{},rows:EvalRow[]=data?.recentEvaluations||[];
 return <AppShell><section className="tradingLabPage">
  <div className="tradingLabHead"><div><div className="eyebrow">NIVORA TRADING LAB · PAPER</div><h1>Prove the edge before risking capital.</h1><p>Trading Lab converts frozen NIVORA decisions into risk-gated paper orders, records every outcome, and measures whether the strategy actually adds value.</p></div><div className="paperBadge"><FlaskConical size={17}/> PAPER ONLY</div></div>
  <div className="tradingLabSafety"><ShieldCheck size={18}/><div><b>No live-money auto execution</b><span>Autonomous execution is restricted to the configured paper account. Any live broker path remains approval-required.</span></div></div>
  {loading?<div className="tradingLabEmpty">Loading Trading Lab…</div>:<><div className="tradingLabGrid">
   <article><small>STATUS</small><b>{String(data?.status||"unknown").replaceAll("-"," ").toUpperCase()}</b><span>{data?.broker?.configured?"Alpaca Paper connected":"Paper broker credentials not configured"}</span></article>
   <article><small>PAPER TRADES</small><b>{m.trades??0}</b><span>{data?.orders??0} submitted orders</span></article>
   <article><small>WIN RATE</small><b>{m.trades?`${m.winRatePct}%`:"Collecting"}</b><span>{m.wins??0} wins · {m.losses??0} losses</span></article>
   <article><small>PROFIT FACTOR</small><b>{m.profitFactor??"Collecting"}</b><span>Gross wins ÷ gross losses</span></article>
  </div><div className="tradingLabGrid secondary">
   <article><small>NET PAPER P&L</small><b>{m.trades?money(Number(m.netPnl||0)):"—"}</b><span>Realized paper results only</span></article>
   <article><small>EXPECTANCY / TRADE</small><b>{m.trades?money(Number(m.expectancy||0)):"—"}</b><span>Average realized paper P&L</span></article>
   <article><small>AVG ALPHA</small><b>{m.trades?`${m.averageAlphaPct}%`:"—"}</b><span>Trade return minus benchmark return</span></article>
   <article><small>MAX DRAWDOWN</small><b>{m.trades?`$${Math.abs(Number(m.maxDrawdownDollars||0)).toLocaleString()}`:"—"}</b><span>Observed realized-trade curve</span></article>
  </div>
  <div className="tradingLabMethod"><Activity size={18}/><div><b>DECISION FUNNEL</b><p>{data?.funnel?.snapshots??0} snapshots → {data?.funnel?.evaluated??0} evaluated → {data?.funnel?.intents??0} intents → {data?.funnel?.authorized??0} authorized → {data?.funnel?.submitted??0} submitted · {data?.funnel?.blocked??0} blocked.</p></div><TrendingUp size={18}/></div>
  {data?.auditStatus&&data.auditStatus!=="ready"&&<div className="tradingLabSafety"><ShieldCheck size={18}/><div><b>Trading audit migration required</b><span>Run supabase/20260901_nivora_v61_trading_lab_console.sql in Supabase, then refresh this page.</span></div></div>}
  <section className="tradingAudit"><div className="tradingAuditHead"><div><small>RECENT DECISIONS</small><h2>What Trading Lab actually did</h2></div><span>Auto-refreshes every 15s</span></div>{rows.length?<div className="tradingAuditTable"><div className="tradingAuditRow head"><span>Symbol</span><span>Today</span><span>Result</span><span>Risk / Order</span><span>Reason</span><span>Time</span></div>{rows.map((r,i)=><div className="tradingAuditRow" key={`${r.symbol}-${r.evaluatedAt}-${i}`}><b>{r.symbol}</b><span>{r.action}</span><span className={`auditStatus ${String(r.status||"").toLowerCase()}`}>{r.status}</span><span>{r.fillStatus?`${r.fillStatus}${r.realizedPnl!=null?` · ${money(r.realizedPnl)}`:""}`:r.orderStatus||r.riskCode||"—"}</span><span>{r.reason}</span><span>{when(r.evaluatedAt)}</span></div>)}</div>:<div className="tradingLabEmpty">No evaluated paper decisions yet. Run the paper cycle after fresh NIVORA snapshots are available.</div>}</section>
  <div className="tradingLabMethod"><Activity size={18}/><div><b>How a paper order reaches the broker</b><p>NIVORA decision → Trade Intent → fresh quote → portfolio/daily-loss/spread/gap/duplicate gates → protected limit order → Alpaca Paper → fill reconciliation → P&L and alpha.</p></div><TrendingUp size={18}/></div></>}
 </section></AppShell>
}
