"use client";
import {useMemo,useState} from "react";
import {calculatePortfolioPeriod,type PortfolioPeriod} from "@/lib/v65/portfolio";
import MetricInfo from "@/components/v65/MetricInfo";
import PortfolioPerformanceChart from "./PortfolioPerformanceChart";
import PortfolioVisualAnalytics from "./PortfolioVisualAnalytics";
import PortfolioHealth from "./PortfolioHealth";

const PERIODS=["1D","1W","1M","3M","6M","YTD","1Y","ALL"] as const;
const fmt=(n:number)=>`$${Math.abs(n).toLocaleString(undefined,{maximumFractionDigits:0})}`;
export default function PortfolioPulse({pulse,risk}:{pulse:any;risk?:any}){
 const[period,setPeriod]=useState<(typeof PERIODS)[number]>("1M");
 const requested=useMemo(()=>calculatePortfolioPeriod(pulse?.history?.points||[],period as PortfolioPeriod),[pulse,period]);
 const available=useMemo(()=>calculatePortfolioPeriod(pulse?.history?.points||[],"ALL" as PortfolioPeriod),[pulse]);
 const r=requested?.status==="ACTUAL"?requested:available?.status==="ACTUAL"?{...available,period,partial:true}:requested;
 const total=Number(pulse?.totalValue||0),cash=Number(pulse?.cashValue||0),drivers=[...(pulse?.drivers||[])],totalPnl=drivers.reduce((a:number,x:any)=>a+Number(x.pnl||0),0),cost=Math.max(0,total-totalPnl);
 const health=Number(pulse?.health?.score||0),largest=Number(pulse?.concentration?.largestPositionPct||0),top3=Number(pulse?.concentration?.top3Pct||0),top5=Number(pulse?.concentration?.top5Pct||0);
 const actions=[...(pulse?.actions||[])].filter((x:any)=>x.portfolioAction&&x.portfolioAction!=="HOLD");
 const attention=actions.filter((x:any)=>/AVOID|TRIM|WATCH/i.test(x.portfolioAction)).sort((a:any,b:any)=>Number(b.weightPct||0)-Number(a.weightPct||0));
 const opportunities=actions.filter((x:any)=>/ADD/i.test(x.portfolioAction));
 const gainers=[...drivers].filter((x:any)=>Number(x.pnl)>0).sort((a:any,b:any)=>Number(b.pnl)-Number(a.pnl)).slice(0,5);
 const losers=[...drivers].filter((x:any)=>Number(x.pnl)<0).sort((a:any,b:any)=>Number(a.pnl)-Number(b.pnl)).slice(0,5);
 const points=Array.isArray(r?.points)?r.points:[];
 const actual=r?.status==="ACTUAL",ret=actual?Number(r.portfolioReturnPct):null,alphaSpy=actual?Number(r.alphaVsSpyPct):null,alphaQqq=actual?Number(r.alphaVsQqqPct):null;
 const tracked=(pulse?.history?.points||[])[0]?.asOf;
 return <section className="aurynPortfolioCockpit">
  <section className="aurynCockpitHero">
   <div><small>PORTFOLIO</small><h1>{fmt(total)}</h1><b className={totalPnl<0?"bad":"good"}>{totalPnl>=0?"+":"-"}{fmt(totalPnl)} total P/L</b><span>Your capital, interpreted.</span></div>
   <div className="aurynCockpitMetrics">
    <article><small>TOTAL P/L</small><b className={totalPnl<0?"bad":"good"}>{totalPnl>=0?"+":"-"}{fmt(totalPnl)}</b></article>
    <article><small>INVESTED</small><b>{fmt(cost)}</b></article>
    <article><small>CASH</small><b>{fmt(cash)}</b><span>{Number(pulse?.allocations?.cashPct||0).toFixed(1)}%</span></article>
    <article><small>HEALTH</small><b>{health}/100</b><span>{pulse?.health?.label||"Current"}</span></article>
   </div>
  </section>

  <section id="portfolio-performance" className="aurynCockpitCard aurynPerformanceHero">
   <header><div><small>PERFORMANCE</small><h2>Portfolio Performance</h2></div><span>{tracked?`Tracked since ${new Date(tracked).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}`:"Tracking starts with your first exact snapshot"}</span></header>
   <nav className="aurynPortfolioPeriods">{PERIODS.map(x=><button key={x} className={period===x?"on":""} onClick={()=>setPeriod(x)}>{x}</button>)}</nav>
   {actual&&points.length>=2?<><PortfolioPerformanceChart points={points}/>{(r as any)?.partial?<div className="aurynHistoryNotice"><b>{period} requested · showing all available tracked history.</b><span>AURYN will expand this range automatically as real daily snapshots accumulate.</span></div>:null}</>:<div className="aurynHistoryNotice"><b>Performance history is still building.</b><span>AURYN shows only actual stored portfolio snapshots and never invents earlier performance.</span></div>}
   <div className="aurynPerformanceStats"><span><small>PORTFOLIO RETURN</small><b>{ret==null?"N/A":`${ret>=0?"+":""}${ret.toFixed(2)}%`}</b></span><span><small>VS SPY</small><b>{alphaSpy==null?"N/A":`${alphaSpy>=0?"+":""}${alphaSpy.toFixed(2)}%`}</b></span><span><small>VS QQQ</small><b>{alphaQqq==null?"N/A":`${alphaQqq>=0?"+":""}${alphaQqq.toFixed(2)}%`}</b></span><span><small>LARGEST POSITION</small><b>{largest.toFixed(1)}%</b></span></div>
  </section>

  <section className="aurynCockpitGrid">
   <article className="aurynCockpitCard aurynAttention"><header><div><small>DECISIONS</small><h2>What needs attention?</h2></div><span>{attention.length} positions</span></header>{attention.length?attention.slice(0,5).map((x:any,i:number)=><div key={x.symbol}><b>{x.symbol}</b><em>{String(x.portfolioAction).replaceAll("_"," ")}</em><span>{Number(x.weightPct||0).toFixed(1)}% of portfolio</span><small>{x.nextTrigger||x.reason}</small><i>{i+1}</i></div>):<p>No holding currently requires an immediate portfolio action.</p>}</article>
   <article className="aurynCockpitCard aurynOpportunityMap"><header><div><small>CAPITAL</small><h2>Portfolio Opportunity Map</h2></div><span>Opportunity × portfolio weight</span></header><div className="aurynOpportunityAxes"><span>Higher opportunity</span><span>Higher weight →</span></div><div className="aurynOpportunityPlot">{drivers.slice(0,12).map((x:any,i:number)=>{const weight=Math.min(95,Math.max(5,Number(x.weightPct||0)*4)),opp=Math.min(92,Math.max(8,Number(x.opportunityScore??50)));return <i key={x.symbol} style={{left:`${weight}%`,bottom:`${opp}%`}} title={`${x.symbol} · ${Number(x.weightPct||0).toFixed(1)}% weight`}><b>{x.symbol}</b></i>})}</div></article>
  </section>

  <section className="aurynCockpitGrid">
   <article className="aurynCockpitCard aurynDrivers"><header><div><small>CONTRIBUTION</small><h2>Portfolio Drivers</h2></div><span>What is moving your capital</span></header><div className="aurynDriverColumns"><div><b>Top gainers</b>{gainers.map((x:any)=><span key={x.symbol}><strong>{x.symbol}</strong><em className="good">+{fmt(Number(x.pnl))}</em></span>)}</div><div><b>Top drags</b>{losers.map((x:any)=><span key={x.symbol}><strong>{x.symbol}</strong><em className="bad">-{fmt(Number(x.pnl))}</em></span>)}</div></div></article>
   <article className="aurynCockpitCard aurynAllocationRisk"><header><div><small>STRUCTURE</small><h2>Allocation & Risk</h2></div></header><div className="aurynRiskMetric"><span>Largest position</span><b>{largest.toFixed(1)}%</b></div><div className="aurynRiskMetric"><span>Top 3 positions</span><b>{top3.toFixed(1)}%</b></div><div className="aurynRiskMetric"><span>Top 5 positions</span><b>{top5.toFixed(1)}%</b></div><div className="aurynRiskMetric"><span>Cash buffer</span><b>{Number(pulse?.allocations?.cashPct||0).toFixed(1)}%</b></div><div className="aurynRiskMetric"><span>Crypto exposure</span><b>{Number(pulse?.allocations?.cryptoPct||0).toFixed(1)}%</b></div></article>
  </section>

  <section id="portfolio-decisions" className="aurynCockpitCard aurynCapitalQueue"><header><div><small>CAPITAL PRIORITIES</small><h2>Capital Queue</h2></div><span>Needs attention · Opportunities · Monitor</span></header><div className="aurynQueueTabs"><b>Needs Attention</b><span>{attention.length}</span><b>Opportunities</b><span>{opportunities.length}</span></div>{[...attention,...opportunities].slice(0,6).map((x:any)=><article key={`${x.symbol}-${x.portfolioAction}`}><b>{x.symbol}</b><em>{String(x.portfolioAction).replaceAll("_"," ")}</em><span>{x.reason}</span><small>{x.nextTrigger||"Wait for decision-grade evidence"}</small></article>)}</section>

  <div id="portfolio-risk"><PortfolioVisualAnalytics pulse={pulse} periodResult={r}/></div>
  <details className="aurynPortfolioHealthDetail"><summary>Portfolio health methodology</summary><PortfolioHealth pulse={pulse}/></details>
 </section>
}