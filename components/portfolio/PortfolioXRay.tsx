"use client";
import {useMemo,useState} from "react";
const MODES=["Sector","Theme","Asset","Risk","Correlation"] as const;
export default function PortfolioXRay({pulse,risk}:{pulse:any;risk?:any}){
 const[mode,setMode]=useState<(typeof MODES)[number]>("Sector");
 const metrics=useMemo(()=>{
  if(mode==="Sector")return (pulse?.concentration?.sectorRows||[]).slice(0,6).map((x:any)=>[x.label,`${x.pct}%`,"portfolio value"]);
  if(mode==="Theme"){const rows:any[]=[];if(Number(pulse?.allocations?.cryptoPct)>0)rows.push(["Digital assets",`${pulse.allocations.cryptoPct}%`,"direct crypto exposure"]);if(Number(pulse?.concentration?.largestSectorPct)>0)rows.push(["Dominant business cluster",`${pulse.concentration.largestSectorPct}%`,pulse.concentration.largestSector]);return rows}
  if(mode==="Asset")return [["Stocks",`${pulse?.allocations?.equityPct||0}%`,"equity"],["Crypto",`${pulse?.allocations?.cryptoPct||0}%`,"digital assets"],["Cash",`${pulse?.allocations?.cashPct||0}%`,"deployable liquidity"]].filter(x=>x[1]!=="0%");
  if(mode==="Risk")return [["Top 3",`${pulse?.concentration?.top3Pct||0}%`,"portfolio dependency"],["Top 5",`${pulse?.concentration?.top5Pct||0}%`,"portfolio dependency"],["Largest position",`${pulse?.concentration?.largestPositionPct||0}%`,"single-name dependency"]];
  return risk?.correlationEvidence?.length?risk.correlationEvidence.slice(0,6):[];
 },[mode,pulse,risk]);
 return <section className="portfolioXRay portfolioGlass"><div className="pulseSectionHead"><div><small>PORTFOLIO X-RAY</small><h2>Exposure from multiple angles</h2></div></div><nav className="xrayModes">{MODES.map(x=><button key={x} className={mode===x?"on":""} onClick={()=>setMode(x)}>{x}</button>)}</nav>{metrics.length?<div className="xrayRail">{metrics.map(([a,b,c]:any)=><article key={a}><small>{a}</small><b>{b}</b><span>{c}</span></article>)}</div>:<p className="xrayQuiet">This view appears when reliable classification or market evidence exists. NIVORA does not invent exposure data.</p>}</section>
}