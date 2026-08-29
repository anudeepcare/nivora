"use client";
import {useEffect,useRef} from "react";
import {createChart,CandlestickSeries,HistogramSeries,LineSeries,LineStyle} from "lightweight-charts";
export default function PriceChart({candles,levels,showTrend=false}:{candles:any[],levels:any,showTrend?:boolean}){
 const el=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!el.current||!candles?.length)return;
 const mobile=window.matchMedia("(max-width: 760px)").matches;
 const chart=createChart(el.current,{width:el.current.clientWidth,height:mobile?280:430,layout:{background:{color:"#ffffff"},textColor:"#667085",fontSize:mobile?11:12},grid:{vertLines:{color:"#f2f4f7"},horzLines:{color:"#f2f4f7"}},rightPriceScale:{borderColor:"#eaecf0",minimumWidth:mobile?52:70},timeScale:{borderColor:"#eaecf0",timeVisible:false,rightOffset:mobile?2:5,barSpacing:mobile?5:7}});
 const cs=chart.addSeries(CandlestickSeries,{upColor:"#16a34a",downColor:"#dc2626",borderVisible:false,wickUpColor:"#16a34a",wickDownColor:"#dc2626",priceLineVisible:true,lastValueVisible:true});
 cs.setData(candles.map((x:any)=>({time:x.time,open:x.open,high:x.high,low:x.low,close:x.close})));
 if(showTrend){
   const sma=(n:number)=>candles.map((x:any,i:number)=>i<n-1?null:{time:x.time,value:candles.slice(i-n+1,i+1).reduce((a:number,b:any)=>a+Number(b.close||0),0)/n}).filter(Boolean) as any[];
   const ma20=chart.addSeries(LineSeries,{color:"#2563eb",lineWidth:2,priceLineVisible:false,lastValueVisible:false});
   const ma50=chart.addSeries(LineSeries,{color:"#7c3aed",lineWidth:2,priceLineVisible:false,lastValueVisible:false});
   ma20.setData(sma(20));ma50.setData(sma(50));
 }
 const vs=chart.addSeries(HistogramSeries,{priceFormat:{type:"volume"},priceScaleId:""});vs.priceScale().applyOptions({scaleMargins:{top:.84,bottom:0}});vs.setData(candles.map((x:any)=>({time:x.time,value:x.volume,color:x.close>=x.open?"rgba(22,163,74,.20)":"rgba(220,38,38,.18)"})));
 const lines=[["Preferred entry",levels.preferredEntry,"#16a34a"],["Nearest support",levels.support,"#16a34a"],["Major support",levels.majorSupport,"#65a30d"],["Resistance",levels.resistance,"#dc2626"],["Breakout",levels.breakout,"#b45309"],["Invalidation",levels.invalidation,"#7f1d1d"]] as const;
 lines.forEach(([title,price,color])=>cs.createPriceLine({price,color,lineWidth:1,lineStyle:LineStyle.Dashed,axisLabelVisible:!mobile,title:mobile?"":title}));
 chart.timeScale().fitContent();
 const resize=()=>{if(!el.current)return;const m=window.innerWidth<=760;chart.applyOptions({width:el.current.clientWidth,height:m?280:430,rightPriceScale:{minimumWidth:m?52:70},timeScale:{rightOffset:m?2:5,barSpacing:m?5:7}})};
 const ro=new ResizeObserver(resize);ro.observe(el.current);window.addEventListener("orientationchange",resize);return()=>{ro.disconnect();window.removeEventListener("orientationchange",resize);chart.remove()}
 },[candles,levels,showTrend]);
 return <div ref={el} className="chartCanvas"/>;
}
