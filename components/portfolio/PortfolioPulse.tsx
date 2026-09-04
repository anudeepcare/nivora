"use client";
import {useMemo,useState} from "react";
import {calculatePortfolioPeriod,type PortfolioPeriod} from "@/lib/v65/portfolio";
import MetricInfo from "@/components/v65/MetricInfo";
import {Activity,ArrowUpRight,ShieldCheck,Sparkles} from "lucide-react";
import PortfolioPerformanceChart from "./PortfolioPerformanceChart";
import PortfolioActionCenter from "./PortfolioActionCenter";
import PortfolioXRay from "./PortfolioXRay";

const PERIODS=["1D","1W","1M","3M","6M","YTD","1Y","2Y","3Y","4Y","ALL"] as const;
export default function PortfolioPulse({pulse,risk}:{pulse:any;risk?:any}){
 const[period,setPeriod]=useState<(typeof PERIODS)[number]>("1M");
 const periodResult=useMemo(()=>calculatePortfolioPeriod(pulse?.history?.points||[],period as PortfolioPeriod),[pulse,period]);
 const fmt=(v:number|null)=>v==null?"—":`${v>=0?"+":""}${v.toFixed(2)}%`;
 const marketVerdict=periodResult.status!=="ACTUAL"?"Not enough actual history for this period yet.":periodResult.alphaVsSpyPct==null?"Actual portfolio history is available; benchmark history is still building.":periodResult.alphaVsSpyPct>0?`You beat SPY by ${periodResult.alphaVsSpyPct.toFixed(2)}% over ${period}.`:`You lagged SPY by ${Math.abs(periodResult.alphaVsSpyPct).toFixed(2)}% over ${period}.`;
 const headline=useMemo(()=>{
  if(!pulse?.totalValue)return "Add investments and NIVORA will analyze the portfolio immediately.";
  const c=pulse.concentration?.largestPositionPct||0,crypto=pulse.allocations?.cryptoPct||0;
  if(c>=30)return `Your portfolio is investable, but one position controls ${c.toFixed(0)}% of capital. Sizing deserves attention.`;
  if(crypto>=30)return `Portfolio health is ${String(pulse.health?.label||"mixed").toLowerCase()}; crypto is ${crypto.toFixed(0)}% of capital and drives meaningful volatility.`;
  return `Portfolio health is ${String(pulse.health?.label||"mixed").toLowerCase()}. NIVORA sees ${pulse.actions?.filter((x:any)=>x.portfolioAction==="ADD").length||0} add candidate${pulse.actions?.filter((x:any)=>x.portfolioAction==="ADD").length===1?"":"s"} without rewriting individual company theses.`;
 },[pulse]);
 const actual=Boolean(pulse?.history?.hasActualPerformance);
 return <section className="portfolioPulse">
  <header className="pulseHero">
   <div className="pulseHeroCopy"><span className="pulseEyebrow"><Sparkles size={14}/> PORTFOLIO PULSE</span><h1>{pulse?.health?.score??"—"} <em>· {pulse?.health?.label||"BUILDING"}</em></h1><div className="pulseValue">${Number(pulse?.totalValue||0).toLocaleString(undefined,{maximumFractionDigits:0})}</div><p>{headline}</p></div>
   <div className="pulseHealth"><small>Portfolio Health <MetricInfo title="Portfolio Health" description="A portfolio-level score using concentration, diversification, liquidity, thesis quality and attention burden. Portfolio sizing never rewrites a company thesis."/></small><b>{pulse?.health?.score??"—"}</b><span>{risk?.riskLabel?`${risk.riskLabel} portfolio risk`:`${pulse?.concentration?.top3Pct||0}% in top 3 positions`}</span></div>
  </header>
  <nav className="pulsePeriods" aria-label="Portfolio analysis period">{PERIODS.map(x=><button key={x} className={period===x?"on":""} onClick={()=>setPeriod(x)}>{x}</button>)}</nav>
  <div className="pulsePerformance">
   <div className="pulseSectionHead"><div><small>{periodResult.status==="ACTUAL"?"Actual Portfolio Performance":"Tracking actual performance"}</small><h2>You vs the market</h2></div><span>{period}</span></div>
   <div className="pulseMarketVerdict"><b>{marketVerdict}</b><span>{periodResult.status==="ACTUAL"?"Performance is based on exact NIVORA portfolio snapshots.":"Not enough actual history for this selected period. Cost-basis P/L is shown separately and is never used as period return."}</span></div>
   {periodResult.status==="ACTUAL"?<><PortfolioPerformanceChart points={periodResult.points}/><div className="pulseCompare pulseCompare4"><article><small>YOUR PORTFOLIO</small><b>{fmt(periodResult.portfolioReturnPct)}</b></article><article><small>SPY · S&amp;P 500</small><b>{fmt(periodResult.spyReturnPct)}</b></article><article><small>QQQ · NASDAQ-100</small><b>{fmt(periodResult.qqqReturnPct)}</b></article><article><small>ALPHA VS SPY</small><b>{fmt(periodResult.alphaVsSpyPct)}</b></article></div></>:<div className="pulseHistoryEmpty"><Activity size={19}/><div><b>Not enough actual history for {period}.</b><span>Snapshots are accumulating automatically. Tracking starts now. Current Holdings Backtest is separate from Actual Portfolio Performance and appears only when reliable historical inputs exist. SPY and QQQ comparison activates when the selected period has reliable endpoints.</span></div></div>}
  </div>
  <div className="pulseNowGrid">
   <article><small>TOP-3 DEPENDENCY <MetricInfo title="Top-3 dependency" description="Share of total portfolio value held by your three largest invested positions. Lower usually means less single-theme dependency."/></small><b>{pulse?.concentration?.top3Pct??0}%</b><span>Largest position {pulse?.concentration?.largestPositionPct??0}%</span></article>
   <article><small>CRYPTO EXPOSURE <MetricInfo title="Crypto exposure" description="Share of total tracked portfolio value currently held in crypto."/></small><b>{pulse?.allocations?.cryptoPct??0}%</b><span>Cash {pulse?.allocations?.cashPct??0}%</span></article>
   <article><small>HIDDEN CONCENTRATION <MetricInfo title="Hidden concentration" description="Largest known sector plus correlation-aware portfolio risk when enough market history is available."/></small><b>{pulse?.concentration?.largestSector||"—"}</b><span>{pulse?.concentration?.largestSectorPct||0}% by current value</span></article>
  </div>
  <div className="pulseInsightGrid">
   <section className="pulseDrivers"><div className="pulseSectionHead"><div><small>CONTRIBUTION VS COST BASIS</small><h2>What drove your money</h2></div><span>Impact on total portfolio, not just stock % move.</span></div><div className="pulseDriverList">{(pulse?.drivers||[]).slice(0,5).map((x:any)=>{const w=Math.min(100,Math.max(4,Math.abs(Number(x.contributionPct||0))*12));return <div className="pulseDriver" key={x.symbol}><b>{x.symbol}</b><div className="pulseDriverTrack"><i className={`pulseDriverBar ${x.pnl<0?"bad":"good"}`} style={{width:`${w}%`}}/></div><span className={x.pnl<0?"bad":"good"}>{x.pnl>=0?"+":""}${Math.abs(Number(x.pnl)).toLocaleString(undefined,{maximumFractionDigits:0})} · {x.contributionPct>=0?"+":""}{x.contributionPct}%</span></div>})}</div></section>
   <section className="pulseRiskCard"><div className="pulseSectionHead"><div><small>PORTFOLIO STRUCTURE</small><h2>Risk &amp; concentration</h2></div></div><div className="pulseRiskRing" style={{"--risk":`${Math.min(100,Number(pulse?.concentration?.top3Pct||0))}%`} as any}><b>{pulse?.concentration?.top3Pct||0}%</b><span>Top 3</span></div><p>{risk?.notes?.[0]||`${pulse?.concentration?.largestSector||"Known positions"} currently represent ${pulse?.concentration?.largestSectorPct||0}% of tracked value. Correlation-aware risk strengthens as market history is available.`}</p></section>
  </div>
  <PortfolioActionCenter actions={pulse?.actions||[]}/>
  <PortfolioXRay pulse={pulse} risk={risk}/>
  <div className="pulseDecisionHead"><div><ShieldCheck size={17}/><div><small>WHAT NIVORA WOULD DO NOW</small><h2>Portfolio-aware decisions</h2></div></div><span>Company truth + portfolio sizing.</span></div>
  <div className="pulseDecisionRail">{(pulse?.actions||[]).slice(0,5).map((x:any)=><article key={x.symbol} className={`pulseAction ${x.portfolioAction.toLowerCase()}`}><small>{x.portfolioAction.replace("_"," ")}</small><b>{x.symbol}</b><span>{x.reason}</span><em>{x.weightPct}% of portfolio <ArrowUpRight size={12}/></em></article>)}</div>
 </section>
}