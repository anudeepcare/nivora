"use client";
import {useState} from "react";
import MetricInfo from "@/components/v65/MetricInfo";

type Focus="stocks"|"crypto"|"cash"|"largest"|"top3"|"top5";
export default function PortfolioCompositionGraph({pulse}:{pulse:any}){
 const[focus,setFocus]=useState<Focus>("largest");
 const eq=Number(pulse?.allocations?.equityPct||0),crypto=Number(pulse?.allocations?.cryptoPct||0),cash=Number(pulse?.allocations?.cashPct||0);
 const largest=Number(pulse?.concentration?.largestPositionPct||0),top3=Number(pulse?.concentration?.top3Pct||0),top5=Number(pulse?.concentration?.top5Pct||0);
 const concentration=largest>=20?"High":largest>=12?"Moderate":"Controlled",riskTone=largest>=20||crypto>=25?"Watch":largest>=12||crypto>=15?"Balanced":"Controlled";
 const a=Math.max(0,Math.min(100,eq)),b=Math.max(a,Math.min(100,a+crypto));
 const explain:Record<Focus,{title:string;value:string;text:string}>={
  stocks:{title:"Stocks",value:`${eq.toFixed(1)}%`,text:"Share of portfolio value invested in equities. Tap Holdings to see the individual positions driving it."},
  crypto:{title:"Crypto",value:`${crypto.toFixed(1)}%`,text:"Share of portfolio value in crypto assets. Higher exposure can increase portfolio volatility."},
  cash:{title:"Cash",value:`${cash.toFixed(1)}%`,text:"Uninvested liquidity that can reduce concentration and preserve flexibility for future opportunities."},
  largest:{title:"Largest position",value:`${largest.toFixed(1)}%`,text:largest>=20?"One holding can materially drive portfolio outcomes. Review whether that concentration is intentional.":"No single position dominates the portfolio, though the largest holding still matters."},
  top3:{title:"Top 3 positions",value:`${top3.toFixed(1)}%`,text:"Shows how much of the portfolio depends on the three largest holdings. This is concentration context, not a loss probability."},
  top5:{title:"Top 5 positions",value:`${top5.toFixed(1)}%`,text:"Shows how much capital is concentrated in the five largest holdings. Use it to judge whether diversification is real or only apparent."}
 };
 const selected=explain[focus];
 return <section id="portfolio-allocation" className="aurynPortfolioComposition">
  <header><div><small>PORTFOLIO MAP</small><h2>Allocation & concentration</h2></div><MetricInfo title="Portfolio map">Tap any segment or concentration measure to see what it means. This is portfolio structure, not a prediction of returns.</MetricInfo></header>
  <div className="aurynCompositionBody">
   <button type="button" className="aurynDonut" aria-label="Explain stock, crypto and cash allocation" style={{background:`conic-gradient(#2f6b56 0 ${a}%, #b88b49 ${a}% ${b}%, #d8d1c4 ${b}% 100%)`}} onClick={()=>setFocus(focus==="stocks"?"crypto":focus==="crypto"?"cash":"stocks")}><div><b>{riskTone}</b><span>structure</span></div></button>
   <div className="aurynAllocationLegend">
    <button type="button" className={focus==="stocks"?"on":""} onClick={()=>setFocus("stocks")}><i className="equity"/><b>Stocks</b><em>{eq.toFixed(1)}%</em></button>
    <button type="button" className={focus==="crypto"?"on":""} onClick={()=>setFocus("crypto")}><i className="crypto"/><b>Crypto</b><em>{crypto.toFixed(1)}%</em></button>
    <button type="button" className={focus==="cash"?"on":""} onClick={()=>setFocus("cash")}><i className="cash"/><b>Cash</b><em>{cash.toFixed(1)}%</em></button>
   </div>
   <div className="aurynConcentrationBars">
    {[['largest','Largest position',largest],['top3','Top 3 positions',top3],['top5','Top 5 positions',top5]].map(([k,label,value]:any)=><button type="button" className={focus===k?"on":""} onClick={()=>setFocus(k)} key={k}><div><span>{label}</span><b>{Number(value).toFixed(1)}%</b></div><i><em style={{width:`${Math.min(100,Number(value))}%`}}/></i></button>)}
   </div>
  </div>
  <div className="aurynCompositionExplain"><div><small>{concentration.toUpperCase()} CONCENTRATION</small><b>{selected.title} · {selected.value}</b><p>{selected.text}</p></div><a href="#portfolio-holdings">View holdings ↓</a></div>
 </section>
}
