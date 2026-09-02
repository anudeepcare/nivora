"use client";
import {useEffect,useState} from "react";
import {Activity,ShieldCheck,FlaskConical,TrendingUp} from "lucide-react";
import AppShell from "@/components/AppShell";

type EvalRow={symbol:string;action:string;status:string;reason:string;riskCode?:string|null;evaluatedAt?:string|null;orderStatus?:string|null;fillStatus?:string|null;fillPrice?:number|null;realizedPnl?:number|null;returnPct?:number|null;quoteProvider?:string|null;quoteAgeSeconds?:number|null;marketSession?:string|null;integrityState?:string|null;disagreementPct?:number|null;automatic?:boolean};
const when=(x?:string|null)=>x?new Date(x).toLocaleString():"—";
const money=(x?:number|null)=>x==null?"—":`${x>=0?"+":"-"}$${Math.abs(x).toLocaleString(undefined,{maximumFractionDigits:2})}`;

export default function TradingLab(){
 const[data,setData]=useState<any>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{let live=true;const load=()=>fetch("/api/trading-lab/status",{cache:"no-store"}).then(r=>r.json()).then(x=>{if(live)setData(x)}).finally(()=>{if(live)setLoading(false)});load();const timer=setInterval(load,15000);return()=>{live=false;clearInterval(timer)}},[]);
 const m=data?.metrics||{},rows:EvalRow[]=data?.recentEvaluations||[];
 return <AppShell><section className="tradingLabPage">
  <div className="tradingLabHead"><div><div className="eyebrow">NIVORA TRADING LAB · PAPER</div><h1>Prove the edge before risking capital.</h1><p>Trading Lab converts frozen NIVORA decisions into risk-gated paper orders, records every outcome, and measures whether the strategy actually adds value.</p></div><div className="paperBadge"><FlaskConical size={17}/> PAPER ONLY</div></div>
  <div className="tradingLabSafety"><ShieldCheck size={18}/><div><b>Automatic paper execution — no manual BUY/SELL buttons</b><span>NIVORA itself must produce BUY/ADD/TRIM/SELL. Trading Lab then validates quote integrity and risk before sending an Alpaca Paper order. HOLD/WAIT correctly produce no order. Live-money auto execution remains disabled.</span></div></div>
  <div className="tradingLabMethod"><Activity size={18}/><div><b>AUTOMATIC RUNNER</b><p>{data?.runner?.automatic?"ON":"OFF"} · {data?.runner?.scheduler||"Scheduler"} · {data?.runner?.schedule||"—"} · Market: {data?.runner?.marketSession||"—"} · Last run: {when(data?.runner?.lastAutomaticRun)} · {data?.runner?.lastRunOk===true?"HEALTHY":data?.runner?.lastRunOk===false?"ERROR":"WAITING"}</p></div><TrendingUp size={18}/></div>
  <div className="v63SignalLegend"><span><b>BUY / ADD</b> opens or increases paper risk only after all gates pass.</span><span><b>SELL / TRIM</b> only reduces an existing paper position; it cannot open a short.</span><span><b>HOLD / WAIT</b> intentionally creates no order.</span></div>
  {loading?<div className="tradingLabEmpty">Loading Trading Lab…</div>:<><div className="tradingLabGrid">
   <article><small>PAPER BROKER</small><b>{data?.broker?.connected?"CONNECTED":data?.broker?.configured?"UNREACHABLE":"NOT CONFIGURED"}</b><span>{data?.broker?.connected?`Alpaca Paper · equity ${money(Number(data?.broker?.equity||0))} · ${data?.broker?.positions??0} positions`:data?.broker?.error||"Paper broker credentials not configured"}</span></article>
   <article><small>PAPER ORDERS</small><b>{data?.orders??0}</b><span>{data?.lastOrder?.at?`Last ${data.lastOrder.symbol||""} · ${data.lastOrder.status||""} · ${when(data.lastOrder.at)}`:"No broker orders recorded yet"}</span></article>
   <article><small>WIN RATE</small><b>{m.trades?`${m.winRatePct}%`:"Collecting"}</b><span>{m.wins??0} wins · {m.losses??0} losses</span></article>
   <article><small>PROFIT FACTOR</small><b>{m.profitFactor??"Collecting"}</b><span>Gross wins ÷ gross losses</span></article>
  </div><div className="tradingLabGrid secondary">
   <article><small>NET PAPER P&L</small><b>{m.trades?money(Number(m.netPnl||0)):"—"}</b><span>Realized paper results only</span></article>
   <article><small>EXPECTANCY / TRADE</small><b>{m.trades?money(Number(m.expectancy||0)):"—"}</b><span>Average realized paper P&L</span></article>
   <article><small>AVG ALPHA</small><b>{m.trades?`${m.averageAlphaPct}%`:"—"}</b><span>Trade return minus benchmark return</span></article>
   <article><small>MAX DRAWDOWN</small><b>{m.trades?`$${Math.abs(Number(m.maxDrawdownDollars||0)).toLocaleString()}`:"—"}</b><span>Observed realized-trade curve</span></article>
  </div>
  <section className="v642DecisionAudit"><div className="tradingAuditHead"><div><small>REAL-MARKET DECISION AUDIT</small><h2>Is NIVORA actually finding BUYs?</h2></div><span>Latest V64.2 snapshot per analyzed ticker</span></div>
   <div className="v642AuditGrid">
    <article><small>ANALYZED</small><b>{data?.decisionAudit?.total??0}</b><span>Unique tickers on the current engine</span></article>
    <article><small>BUY SIGNALS</small><b>{data?.decisionAudit?.actions?.BUY??0}</b><span>{data?.decisionAudit?.total?`${(((data?.decisionAudit?.actions?.BUY??0)/data.decisionAudit.total)*100).toFixed(1)}% of analyzed tickers`:"No V64.2 snapshots yet"}</span></article>
    <article><small>DOMINANT BLOCKER</small><b>{data?.decisionAudit?.dominantBlockers?.[0]?.count??0}</b><span>{data?.decisionAudit?.dominantBlockers?.[0]?.reason||"Waiting for real decisions"}</span></article>
    <article><small>CLOSEST TO BUY</small><b>{data?.decisionAudit?.closestToBuy?.[0]?.symbol||"—"}</b><span>{data?.decisionAudit?.closestToBuy?.[0]?`${String(data.decisionAudit.closestToBuy[0].closestPath||"").replaceAll("_"," ")} · ${data.decisionAudit.closestToBuy[0].primaryBlocker||"one gate remains"}`:"No near-BUY candidate yet"}</span></article>
   </div>
   {data?.decisionAudit?.closestToBuy?.length?<div className="v642ClosestList">{data.decisionAudit.closestToBuy.slice(0,5).map((x:any)=><span key={x.symbol}><b>{x.symbol}</b><em>{String(x.closestPath||"").replaceAll("_"," ")}</em><small>{x.primaryBlocker||"—"}</small></span>)}</div>:null}
  </section>
  <div className="tradingLabMethod"><Activity size={18}/><div><b>DECISION FUNNEL</b><p>{data?.funnel?.snapshots??0} snapshots → {data?.funnel?.evaluated??0} evaluated → {data?.funnel?.intents??0} intents → {data?.funnel?.authorized??0} authorized → {data?.funnel?.submitted??0} submitted · {data?.funnel?.blocked??0} blocked.</p></div><TrendingUp size={18}/></div>
  {data?.auditStatus&&data.auditStatus!=="ready"&&<div className="tradingLabSafety"><ShieldCheck size={18}/><div><b>Trading audit migration required</b><span>Run supabase/20260901_nivora_v61_trading_lab_console.sql in Supabase, then refresh this page.</span></div></div>}
  <section className="tradingAudit"><div className="tradingAuditHead"><div><small>RECENT DECISIONS</small><h2>What Trading Lab actually did</h2></div><span>Auto-refreshes every 15s</span></div>{rows.length?<div className="tradingAuditTable"><div className="tradingAuditRow head"><span>Symbol</span><span>Today</span><span>Result</span><span>Risk / Order</span><span>Reason</span><span>Time</span></div>{rows.map((r,i)=><div className="tradingAuditRow" key={`${r.symbol}-${r.evaluatedAt}-${i}`}><b>{r.symbol}</b><span className={`auditAction ${String(r.action||"").toLowerCase().replaceAll(" ","-")}`}>{r.action}</span><span className={`auditStatus ${String(r.status||"").toLowerCase()}`}>{r.status}</span><span title={r.quoteProvider?`${r.quoteProvider} · ${r.quoteAgeSeconds??"?"}s · ${r.marketSession||""} · ${r.integrityState||"integrity unknown"}${r.disagreementPct!=null?` · gap ${r.disagreementPct}%`:""}`:""}>{r.fillStatus?`${r.fillStatus}${r.realizedPnl!=null?` · ${money(r.realizedPnl)}`:""}`:r.orderStatus||r.riskCode||r.integrityState||"—"}</span><span>{r.reason}</span><span>{when(r.evaluatedAt)}</span></div>)}</div>:<div className="tradingLabEmpty">No evaluated paper decisions yet. Run the paper cycle after fresh NIVORA snapshots are available.</div>}</section>
  <div className="tradingLabMethod"><ShieldCheck size={18}/><div><b>PAPER BROKER PROOF</b><p>Read-only Alpaca connectivity is checked on this page. For a one-time order-path proof, enable TRADING_LAB_SELF_TEST_ORDER_ENABLED and run the GitHub workflow “NIVORA Paper Broker Self Test”. It submits a deliberately non-marketable PAPER limit order and immediately cancels it. This diagnostic is never treated as a NIVORA signal.</p></div><span>{data?.selfTest?.orderEnabled?"ARMED":"DISARMED"}</span></div>
  <div className="tradingLabMethod"><Activity size={18}/><div><b>How a paper order reaches the broker</b><p>NIVORA decision → Trade Intent → fresh quote → portfolio/daily-loss/spread/gap/duplicate gates → protected limit order → Alpaca Paper → fill reconciliation → P&L and alpha.</p></div><TrendingUp size={18}/></div></>}
 </section></AppShell>
}
