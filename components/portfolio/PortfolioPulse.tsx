"use client";
import {useMemo,useState} from "react";
import {calculatePortfolioPeriod,type PortfolioPeriod} from "@/lib/v65/portfolio";
import {ChevronDown,Layers3} from "lucide-react";
import MetricInfo from "@/components/v65/MetricInfo";
import PortfolioVisualAnalytics from "./PortfolioVisualAnalytics";
import PortfolioBrief from "./PortfolioBrief";
import PortfolioXRay from "./PortfolioXRay";
import PortfolioHealth from "./PortfolioHealth";
import PortfolioCompositionGraph from "./PortfolioCompositionGraph";

const PERIODS=["1D","1W","1M","3M","6M","YTD","1Y","2Y","3Y","4Y","ALL"] as const;
const fmtDate=(s?:string|null)=>s?new Date(s).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"}):"—";
const actionRank:Record<string,number>={AVOID:0,TRIM_RISK:1,WATCH:2,ADD:3,HOLD:4};

export default function PortfolioPulse({pulse,risk}:{pulse:any;risk?:any}){
 const[period,setPeriod]=useState<(typeof PERIODS)[number]>("1M"),[deepOpen,setDeepOpen]=useState(false);
 const r=useMemo(()=>calculatePortfolioPeriod(pulse?.history?.points||[],period as PortfolioPeriod),[pulse,period]);
 const actions=useMemo(()=>[...(pulse?.actions||[])].filter((x:any)=>x.portfolioAction).sort((a:any,b:any)=>(actionRank[a.portfolioAction]??9)-(actionRank[b.portfolioAction]??9)||Number(b.weightPct||0)-Number(a.weightPct||0)),[pulse]);
 const cash=Number(pulse?.allocations?.cashPct||0),health=Number(pulse?.health?.score||0),largest=Number(pulse?.concentration?.largestPositionPct||0);
 const actual=r?.status==="ACTUAL",portfolioReturn=actual&&Number.isFinite(Number(r?.portfolioReturnPct))?Number(r.portfolioReturnPct):null,spy=actual&&Number.isFinite(Number(r?.spyReturnPct))?Number(r.spyReturnPct):null,qqq=actual&&Number.isFinite(Number(r?.qqqReturnPct))?Number(r.qqqReturnPct):null,alpha=actual&&Number.isFinite(Number(r?.alphaVsSpyPct))?Number(r.alphaVsSpyPct):null;
 const totalPnl=(pulse?.drivers||[]).reduce((a:number,x:any)=>a+Number(x.pnl||0),0),cost=Number(pulse?.totalValue||0)-totalPnl;
 const actionable=actions.filter((x:any)=>x.portfolioAction!=="HOLD");
 const brief=alpha!=null?`${alpha>=0?"Outperforming":"Lagging"} SPY by ${Math.abs(alpha).toFixed(2)}% over ${period}. ${largest>18?"Concentration is the portfolio's clearest risk.":"Sizing is reasonably controlled."}`:`Portfolio performance is available from ${fmtDate(r?.availableFrom)}. AURYN will not manufacture history before that date.`;
 return <section className="aurynPortfolioPulse">
  <section className="aurynPortfolioSummary"><div className="aurynPortfolioLead"><small>PORTFOLIO INTELLIGENCE</small><h1>${Number(pulse?.totalValue||0).toLocaleString(undefined,{maximumFractionDigits:0})}</h1><div className={`aurynPnl ${totalPnl<0?"bad":"good"}`}>{totalPnl>=0?"+":"-"}${Math.abs(totalPnl).toLocaleString(undefined,{maximumFractionDigits:0})}<span> unrealized vs cost basis</span></div><p>{brief}</p></div><div className="aurynPortfolioCondition"><small>PORTFOLIO CONDITION <MetricInfo title="Portfolio condition" description="A construction score based on concentration, diversification, liquidity and holding evidence. It is not a forecast of return." score={health}/></small><strong>{health}</strong><span>/100 · {pulse?.health?.label||"Current"}</span><i style={{"--score":`${health}%`} as any}/><em>{largest>20?"Concentration needs attention":cash>30?"Cash is a major allocation":"No critical structural warning"}</em></div></section>
  <PortfolioCompositionGraph pulse={pulse}/>
  <nav className="aurynPortfolioPeriods" aria-label="Portfolio performance period">{PERIODS.map(x=><button key={x} className={period===x?"on":""} onClick={()=>setPeriod(x)}>{x}</button>)}</nav>
  {r?.status!=="ACTUAL"?<div className="aurynHistoryNotice">{r?.availableFrom?<>Exact tracked history starts <b>{fmtDate(r.availableFrom)}</b>. {period} remains selectable, but AURYN will not fabricate performance before that date.</>:<>Portfolio history is still being established.</>}</div>:null}
  <section id="portfolio-performance" className="aurynPortfolioMetrics">
   <article><small>YOUR RETURN <MetricInfo title="Portfolio return" description="Time-weighted change between actual stored portfolio snapshots for the selected period. It is never backfilled from today's holdings."/></small><b className={portfolioReturn!=null&&portfolioReturn<0?"bad":"good"}>{portfolioReturn==null?"N/A":`${portfolioReturn>=0?"+":""}${portfolioReturn.toFixed(2)}%`}</b><span>{period} performance</span></article>
   <article><small>SPY</small><b>{spy==null?"N/A":`${spy>=0?"+":""}${spy.toFixed(2)}%`}</b><span>{alpha==null?"Benchmark history unavailable":`${alpha>=0?"+":""}${alpha.toFixed(2)}% relative`}</span></article>
   <article><small>QQQ</small><b>{qqq==null?"N/A":`${qqq>=0?"+":""}${qqq.toFixed(2)}%`}</b><span>Growth benchmark</span></article>
   <article><small>CASH</small><b>{cash.toFixed(1)}%</b><span>${Number(pulse?.cashValue||0).toLocaleString(undefined,{maximumFractionDigits:0})} flexibility</span></article>
   <article><small>LARGEST POSITION</small><b>{largest.toFixed(1)}%</b><span>{largest>20?"High dependency":"Sizing controlled"}</span></article>
   <article><small>COST BASIS</small><b>${Math.max(0,cost).toLocaleString(undefined,{maximumFractionDigits:0})}</b><span>Tracked invested cost</span></article>
  </section>
  <section id="portfolio-decisions" className="aurynCapitalPriorities"><header><div><small>CAPITAL PRIORITIES</small><h2>Capital Queue</h2></div><span>Ranked by urgency + portfolio impact + company evidence</span></header>
   <div className="aurynCapitalQueue">{actionable.length?actionable.slice(0,8).map((x:any)=><article key={x.symbol} className="aurynCapitalQueueRow"><span><small>ACTION</small><b>{x.symbol} · {String(x.portfolioAction).replaceAll("_"," ")}</b></span><span><small>WHY</small><em>{x.reason}</em></span><span><small>URGENCY</small><b>{x.urgency||"LOW"}</b></span><span><small>PORTFOLIO IMPACT</small><b>{x.portfolioImpact||`${Number(x.weightPct||0).toFixed(1)}% weight`}</b></span><span><small>NEXT TRIGGER</small><em>{x.nextTrigger||"Wait for new decision-grade evidence"}</em></span></article>):<div className="aurynCapitalQueueEmpty">No position currently clears AURYN's threshold for an immediate portfolio action. Existing holdings can remain monitored without forcing activity.</div>}</div>
  </section>
  <div id="portfolio-risk"><PortfolioVisualAnalytics pulse={pulse} periodResult={r}/></div>
  <button className="aurynPortfolioEvidenceToggle" onClick={()=>setDeepOpen(v=>!v)}><span><Layers3/><b>Open portfolio evidence</b><small>Health model · analyst brief · allocation · risk</small></span><ChevronDown className={deepOpen?"open":""}/></button>
  {deepOpen?<div className="aurynPortfolioEvidenceDeep"><PortfolioHealth pulse={pulse}/><PortfolioBrief pulse={pulse} periodResult={r} period={period}/><PortfolioXRay pulse={pulse} risk={risk}/></div>:null}
 </section>;
}
