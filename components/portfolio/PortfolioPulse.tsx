"use client";
import {useMemo,useState} from "react";
import {calculatePortfolioPeriod,type PortfolioPeriod} from "@/lib/v65/portfolio";
import MetricInfo from "@/components/v65/MetricInfo";
import {Sparkles} from "lucide-react";
import PortfolioPerformanceChart from "./PortfolioPerformanceChart";
import PortfolioXRay from "./PortfolioXRay";
const PERIODS=["1D","1W","1M","3M","6M","YTD","1Y","2Y","3Y","4Y","ALL"] as const;
export default function PortfolioPulse({pulse,risk}:{pulse:any;risk?:any}){
 const[period,setPeriod]=useState<(typeof PERIODS)[number]>("1M");
 const r=useMemo(()=>calculatePortfolioPeriod(pulse?.history?.points||[],period as PortfolioPeriod),[pulse,period]);
 const fmt=(v:number|null)=>v==null?"—":`${v>=0?"+":""}${v.toFixed(2)}%`;
 const actions=(pulse?.actions||[]).filter((x:any)=>x.portfolioAction&&x.portfolioAction!=="LEAVE_ALONE").slice(0,4);
 const analyst=actions.length?`${actions.length} holding${actions.length===1?"":"s"} deserve review. ${actions[0].symbol} is the first place to look because NIVORA currently says ${String(actions[0].portfolioAction).replaceAll("_"," ").toLowerCase()}.`:`No portfolio change is urgent right now. Keep monitoring concentration and deploy new cash only where company evidence and portfolio fit agree.`;
 return <section className="portfolioPulse">
  <header className="pulseHero portfolioGlass"><div className="pulseHeroCopy"><span className="pulseEyebrow"><Sparkles size={14}/> PORTFOLIO PULSE</span><h1>${Number(pulse?.totalValue||0).toLocaleString(undefined,{maximumFractionDigits:0})}</h1><p>{r.status==="ACTUAL"&&r.alphaVsSpyPct!=null?`You are ${r.alphaVsSpyPct>=0?"beating":"lagging"} SPY by ${Math.abs(r.alphaVsSpyPct).toFixed(2)}% over ${period}.`:"NIVORA is tracking your portfolio now. Decisions below use current holdings, concentration and company evidence without inventing historical returns."}</p></div><div className="pulseHealth"><small>PORTFOLIO HEALTH <MetricInfo title="Portfolio Health" description="Concentration, diversification, liquidity and holding-level evidence combined into one portfolio view."/></small><b>{pulse?.health?.score??"—"}</b><span>{pulse?.health?.label||"Current portfolio"}</span></div></header>
  <nav className="pulsePeriods portfolioGlass" aria-label="Portfolio analysis period">{PERIODS.map(x=><button key={x} className={period===x?"on":""} onClick={()=>setPeriod(x)}>{x}</button>)}</nav>
  {r.status==="ACTUAL"&&<section className="pulsePerformance"><div className="pulseSectionHead"><div><small>MARKET RELATIVE</small><h2>You vs SPY &amp; QQQ</h2></div><span>{period}</span></div><PortfolioPerformanceChart points={r.points}/><div className="pulseCompare pulseCompare4"><article><small>YOU</small><b>{fmt(r.portfolioReturnPct)}</b></article><article><small>SPY</small><b>{fmt(r.spyReturnPct)}</b></article><article><small>QQQ</small><b>{fmt(r.qqqReturnPct)}</b></article><article><small>ALPHA VS SPY</small><b>{fmt(r.alphaVsSpyPct)}</b></article></div></section>}
  <section className="portfolioAnalyst portfolioGlass"><div><small>NIVORA PORTFOLIO ANALYST</small><h2>What matters now</h2></div><p>{analyst}</p><div className="analystChips"><button>Where should new cash go?</button><button>What should I trim?</button><button>What is my biggest risk?</button></div></section>
  <PortfolioXRay pulse={pulse} risk={risk}/>
  <section className="portfolioPriorities"><div className="pulseSectionHead"><div><small>DECISION QUEUE</small><h2>Only what needs attention</h2></div></div>{actions.length?<div className="priorityRail">{actions.map((x:any)=><article key={x.symbol}><b>{x.symbol}</b><strong>{String(x.portfolioAction).replaceAll("_"," ")}</strong><span>{x.reason}</span></article>)}</div>:<p className="quietPortfolio">No portfolio changes need attention today.</p>}</section>
 </section>
}
