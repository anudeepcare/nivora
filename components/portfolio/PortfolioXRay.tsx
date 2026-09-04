"use client";
import {useMemo,useState} from "react";
const MODES=["Sector","Theme","Risk","Asset"] as const;
export default function PortfolioXRay({pulse,risk}:{pulse:any;risk?:any}){
 const[mode,setMode]=useState<(typeof MODES)[number]>("Sector");
 const sector=String(pulse?.concentration?.largestSector||"").trim();
 const metrics=useMemo(()=>{
  if(mode==="Sector") return sector&&sector.toLowerCase()!=="unknown"?[[sector,`${pulse?.concentration?.largestSectorPct||0}%`,"largest classified sector"]]:[["Classification pending","—","NIVORA will show sectors when verified"]];
  if(mode==="Theme") return [["Growth / innovation",`${Math.max(Number(pulse?.allocations?.cryptoPct||0),Number(pulse?.concentration?.top3Pct||0))}%`,"current proxy until theme evidence is complete"]];
  if(mode==="Risk") return [["Top 3",`${pulse?.concentration?.top3Pct||0}%`,risk?.riskLabel?`${risk.riskLabel} risk overlay`:"position dependency"],["Largest position",`${pulse?.concentration?.largestPositionPct||0}%`,"single-name dependency"]];
  return [["Stocks",`${pulse?.allocations?.equityPct||0}%`,"equity"],["Crypto",`${pulse?.allocations?.cryptoPct||0}%`,"digital assets"],["Cash",`${pulse?.allocations?.cashPct||0}%`,"deployable liquidity"]];
 },[mode,pulse,risk,sector]);
 return <section className="portfolioXRay portfolioGlass"><div className="pulseSectionHead"><div><small>PORTFOLIO X-RAY</small><h2>Where your real exposure sits</h2></div></div><nav className="xrayModes">{MODES.map(x=><button key={x} className={mode===x?"on":""} onClick={()=>setMode(x)}>{x}</button>)}</nav><div className="xrayRail">{metrics.map(([a,b,c])=><article key={a}><small>{a}</small><b>{b}</b><span>{c}</span></article>)}</div></section>
}
