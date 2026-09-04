"use client";
import {useState} from "react";import PortfolioPerformanceChart from "./PortfolioPerformanceChart";
const MODES=["Performance","Drivers","Allocation","Risk"] as const;
export default function PortfolioVisualAnalytics({pulse,periodResult}:{pulse:any;periodResult:any}){
 const[mode,setMode]=useState<(typeof MODES)[number]>("Performance");
 const invested=(pulse?.drivers||[]).slice(0,8),total=Math.max(1,...invested.map((x:any)=>Math.abs(Number(x.contributionPct||0))));
 const alloc=[["Stocks",pulse?.allocations?.equityPct||0],["Crypto",pulse?.allocations?.cryptoPct||0],["Cash",pulse?.allocations?.cashPct||0]];
 return <section className="portfolioVisuals portfolioGlass"><div className="pulseSectionHead"><div><small>VISUAL INTELLIGENCE</small><h2>See what is driving the portfolio</h2></div><span>Graph → insight → decision</span></div><nav className="visualModes">{MODES.map(x=><button key={x} className={mode===x?"on":""} onClick={()=>setMode(x)}>{x}</button>)}</nav>
 {mode==="Performance"&&(periodResult?.status==="ACTUAL"?<PortfolioPerformanceChart points={periodResult.points}/>:<div className="compactUnavailable"><b>Exact comparison is building.</b><span>Use Drivers, Allocation and Risk now; this chart activates when the selected period has exact endpoints.</span></div>)}
 {mode==="Drivers"&&<div className="driverBars">{invested.map((x:any)=><div key={x.symbol}><b>{x.symbol}</b><i><em className={x.contributionPct<0?"neg":""} style={{width:`${Math.max(4,Math.abs(x.contributionPct)/total*100)}%`}}/></i><span>{x.contributionPct>=0?"+":""}{x.contributionPct}% · {x.pnl>=0?"+":"-"}${Math.abs(x.pnl).toLocaleString(undefined,{maximumFractionDigits:0})}</span></div>)}</div>}
 {mode==="Allocation"&&<div className="allocationTreemap">{alloc.filter((x:any)=>x[1]>0).map(([name,pct]:any)=><article key={name} style={{flexGrow:Math.max(8,pct)}}><small>{name}</small><b>{pct}%</b></article>)}</div>}
 {mode==="Risk"&&<div className="riskBars"><article><small>TOP 3 DEPENDENCY</small><b>{pulse?.concentration?.top3Pct||0}%</b><i><em style={{width:`${Math.min(100,pulse?.concentration?.top3Pct||0)}%`}}/></i></article><article><small>TOP 5 DEPENDENCY</small><b>{pulse?.concentration?.top5Pct||0}%</b><i><em style={{width:`${Math.min(100,pulse?.concentration?.top5Pct||0)}%`}}/></i></article><article><small>LARGEST POSITION</small><b>{pulse?.concentration?.largestPositionPct||0}%</b><i><em style={{width:`${Math.min(100,pulse?.concentration?.largestPositionPct||0)}%`}}/></i></article></div>}
 </section>
}