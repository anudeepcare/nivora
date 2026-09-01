"use client";
import {useEffect,useState} from "react";
import {Activity,ShieldCheck,FlaskConical,TrendingUp} from "lucide-react";
import AppShell from "@/components/AppShell";
export default function TradingLab(){const[data,setData]=useState<any>(null),[loading,setLoading]=useState(true);useEffect(()=>{fetch("/api/trading-lab/status").then(r=>r.json()).then(setData).finally(()=>setLoading(false))},[]);const m=data?.metrics||{};return <AppShell><section className="tradingLabPage">
 <div className="tradingLabHead"><div><div className="eyebrow">NIVORA TRADING LAB · PAPER</div><h1>Prove the edge before risking capital.</h1><p>Trading Lab converts frozen NIVORA decisions into risk-gated paper orders, records every outcome, and measures whether the strategy actually adds value.</p></div><div className="paperBadge"><FlaskConical size={17}/> PAPER ONLY</div></div>
 <div className="tradingLabSafety"><ShieldCheck size={18}/><div><b>No live-money auto execution</b><span>Autonomous execution is restricted to the configured paper account. Any live broker path remains approval-required.</span></div></div>
 {loading?<div className="tradingLabEmpty">Loading Trading Lab…</div>:<><div className="tradingLabGrid">
  <article><small>STATUS</small><b>{String(data?.status||"unknown").replaceAll("-"," ").toUpperCase()}</b><span>{data?.broker?.configured?"Alpaca Paper connected":"Paper broker credentials not configured"}</span></article>
  <article><small>PAPER TRADES</small><b>{m.trades??0}</b><span>{data?.orders??0} submitted orders</span></article>
  <article><small>WIN RATE</small><b>{m.trades?`${m.winRatePct}%`:"Collecting"}</b><span>{m.wins??0} wins · {m.losses??0} losses</span></article>
  <article><small>PROFIT FACTOR</small><b>{m.profitFactor??"Collecting"}</b><span>Gross wins ÷ gross losses</span></article>
 </div><div className="tradingLabGrid secondary">
  <article><small>NET PAPER P&L</small><b>{m.trades?`$${Number(m.netPnl||0).toLocaleString()}`:"—"}</b><span>Realized paper results only</span></article>
  <article><small>EXPECTANCY / TRADE</small><b>{m.trades?`$${m.expectancy}`:"—"}</b><span>Average realized paper P&L</span></article>
  <article><small>AVG ALPHA</small><b>{m.trades?`${m.averageAlphaPct}%`:"—"}</b><span>Trade return minus benchmark return</span></article>
  <article><small>MAX DRAWDOWN</small><b>{m.trades?`$${Math.abs(Number(m.maxDrawdownDollars||0)).toLocaleString()}`:"—"}</b><span>Observed realized-trade curve</span></article>
 </div><div className="tradingLabMethod"><Activity size={18}/><div><b>DECISION FUNNEL</b><p>{data?.funnel?.snapshots??0} snapshots → {data?.funnel?.evaluated??0} evaluated → {data?.funnel?.intents??0} intents → {data?.funnel?.authorized??0} authorized → {data?.funnel?.submitted??0} submitted. Every skipped or blocked decision remains visible in the audit trail.</p></div><TrendingUp size={18}/></div><div className="tradingLabMethod"><Activity size={18}/><div><b>How a paper order reaches the broker</b><p>NIVORA decision → Trade Intent → fresh quote → portfolio/daily-loss/spread/gap/duplicate gates → protected limit order → Alpaca Paper → audit log → Trading Lab metrics.</p></div><TrendingUp size={18}/></div></>}
 </section></AppShell>}
