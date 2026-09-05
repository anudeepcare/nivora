"use client";
import MetricInfo from "@/components/v65/MetricInfo";

export default function PortfolioCompositionGraph({pulse}:{pulse:any}){
 const eq=Number(pulse?.allocations?.equityPct||0),crypto=Number(pulse?.allocations?.cryptoPct||0),cash=Number(pulse?.allocations?.cashPct||0);
 const largest=Number(pulse?.concentration?.largestPositionPct||0),top3=Number(pulse?.concentration?.top3Pct||0),top5=Number(pulse?.concentration?.top5Pct||0);
 const concentration=largest>=20?"High":largest>=12?"Moderate":"Controlled";
 const riskTone=largest>=20||crypto>=25?"Watch":largest>=12||crypto>=15?"Balanced":"Controlled";
 const a=Math.max(0,Math.min(100,eq)),b=Math.max(a,Math.min(100,a+crypto));
 return <section id="portfolio-allocation" className="aurynPortfolioComposition">
  <header><div><small>PORTFOLIO MAP</small><h2>Allocation & concentration</h2></div><MetricInfo title="Portfolio map">Shows where capital is allocated and how dependent the portfolio is on its largest positions. This is concentration context, not a probability of loss.</MetricInfo></header>
  <div className="aurynCompositionBody">
   <div className="aurynDonut" style={{background:`conic-gradient(#2f6b56 0 ${a}%, #b88b49 ${a}% ${b}%, #d8d1c4 ${b}% 100%)`}}><div><b>{riskTone}</b><span>structure</span></div></div>
   <div className="aurynAllocationLegend">
    <span><i className="equity"/><b>Stocks</b><em>{eq.toFixed(1)}%</em></span>
    <span><i className="crypto"/><b>Crypto</b><em>{crypto.toFixed(1)}%</em></span>
    <span><i className="cash"/><b>Cash</b><em>{cash.toFixed(1)}%</em></span>
   </div>
   <div className="aurynConcentrationBars">
    <article><div><span>Largest position</span><b>{largest.toFixed(1)}%</b></div><i><em style={{width:`${Math.min(100,largest)}%`}}/></i></article>
    <article><div><span>Top 3 positions</span><b>{top3.toFixed(1)}%</b></div><i><em style={{width:`${Math.min(100,top3)}%`}}/></i></article>
    <article><div><span>Top 5 positions</span><b>{top5.toFixed(1)}%</b></div><i><em style={{width:`${Math.min(100,top5)}%`}}/></i></article>
    <p><strong>{concentration} concentration.</strong> {largest>=20?`The largest holding is ${largest.toFixed(1)}% of the portfolio, so a single position can materially move results.`:crypto>=25?`Crypto is ${crypto.toFixed(1)}% of the portfolio, which can increase volatility.`:`No single position is above 20% of total portfolio value.`}</p>
   </div>
  </div>
 </section>
}