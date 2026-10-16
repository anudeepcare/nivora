"use client";
import {useEffect,useRef,useState} from "react";
import {createChart,CandlestickSeries,HistogramSeries,LineSeries,LineStyle,PriceScaleMode} from "lightweight-charts";
import type {StructureChartOverlays} from "@/lib/research-structure-presentation";
import type {AutoscaleInfo} from "lightweight-charts";
const finite=(value:any)=>value!==null&&value!==undefined&&value!==""&&Number.isFinite(Number(value));
export default function PriceChart({candles,levels,showTrend=false,confluence,overlays,forceCandles=false,ariaLabel}:{candles:any[],levels:any|null,showTrend?:boolean,confluence?:{fib382?:number;fib50?:number;fib618?:number;waveTarget?:number;waveInvalidation?:number},overlays?:StructureChartOverlays,forceCandles?:boolean,ariaLabel?:string}){
 const el=useRef<HTMLDivElement>(null),[appearance,setAppearance]=useState(0);
 useEffect(()=>{const change=()=>setAppearance(x=>x+1);window.addEventListener("auryn-appearance",change);window.addEventListener("storage",change);const observer=new MutationObserver(change);observer.observe(document.documentElement,{attributes:true,attributeFilter:["class","data-theme","style"]});return()=>{window.removeEventListener("auryn-appearance",change);window.removeEventListener("storage",change);observer.disconnect()}},[]);
 useEffect(()=>{
 if(!el.current)return;
 const bars=Array.from(new Map((candles||[]).filter(x=>x.time!=null&&[x.open,x.high,x.low,x.close].every(finite)).map(x=>[String(x.time),{...x,open:Number(x.open),high:Number(x.high),low:Number(x.low),close:Number(x.close)}])).values()).sort((a,b)=>typeof a.time==="number"&&typeof b.time==="number"?a.time-b.time:String(a.time).localeCompare(String(b.time)));
 if(!bars.length)return;
 const mobile=window.matchMedia("(max-width:760px)").matches,css=getComputedStyle(el.current);
 const color=(name:string,fallback:string)=>css.getPropertyValue(name).trim()||fallback;
 const background=color("--auryn-card-bg","#ffffff"),ink=color("--auryn-page-muted","#71829c"),border=color("--auryn-border","#dfe7f2"),accent=color("--auryn-accent","#246bfd"),positive=color("--auryn-positive","#10b981"),negative=color("--auryn-negative","#ef6070");
 let style="candlestick";try{style=localStorage.getItem("auryn-chart-style")||style}catch{}
 if(forceCandles)style="candlestick";
 const chart=createChart(el.current,{localization:{locale:"en-US"},width:el.current.clientWidth,height:Math.max(220,el.current.clientHeight),layout:{background:{color:background},textColor:ink,fontSize:11},grid:{vertLines:{color:border},horzLines:{color:border}},rightPriceScale:{borderColor:border,minimumWidth:mobile?52:64},timeScale:{borderColor:border,timeVisible:false,rightOffset:3,barSpacing:6}});
 const series=style==="line"?chart.addSeries(LineSeries,{color:accent,lineWidth:2}):chart.addSeries(CandlestickSeries,{upColor:positive,downColor:negative,borderVisible:false,wickUpColor:positive,wickDownColor:negative});
 let haOpen=0,haClose=0;
 const rendered=bars.map((x,i)=>{if(style==="line")return{time:x.time,value:x.close};if(style!=="heikin")return{time:x.time,open:x.open,high:x.high,low:x.low,close:x.close};const close=(x.open+x.high+x.low+x.close)/4,open=i?(haOpen+haClose)/2:(x.open+x.close)/2;haOpen=open;haClose=close;return{time:x.time,open,close,high:Math.max(x.high,open,close),low:Math.min(x.low,open,close)}});
 series.setData(rendered as any);
 if(overlays){
  chart.priceScale('right').applyOptions({mode:overlays.scale==='log'?PriceScaleMode.Logarithmic:PriceScaleMode.Normal});
  if(overlays.lines.length)series.applyOptions({autoscaleInfoProvider:(base:()=>AutoscaleInfo|null)=>{const info=base();if(!info?.priceRange)return info;const prices=overlays.lines.map(x=>x.price).filter(x=>Number.isFinite(x)&&x>0);return{...info,priceRange:{minValue:Math.min(info.priceRange.minValue,...prices),maxValue:Math.max(info.priceRange.maxValue,...prices)}};}});
  for(const study of overlays.series){const line=chart.addSeries(LineSeries,{color:study.color,lineWidth:2,priceLineVisible:false,lastValueVisible:false,title:study.label});line.setData(study.points as any);}
 }
 if(showTrend)for(const [period,lineColor] of [[20,accent],[50,"#9175df"]] as const){const ma=chart.addSeries(LineSeries,{color:lineColor,lineWidth:1,priceLineVisible:false,lastValueVisible:false});ma.setData(bars.flatMap((x,i)=>i<period-1?[]:[{time:x.time,value:bars.slice(i-period+1,i+1).reduce((sum,b)=>sum+b.close,0)/period}]) as any)}
 const volume=chart.addSeries(HistogramSeries,{priceFormat:{type:"volume"},priceScaleId:""});volume.priceScale().applyOptions({scaleMargins:{top:.85,bottom:0}});volume.setData(bars.filter(x=>finite(x.volume)&&Number(x.volume)>=0).map(x=>({time:x.time,value:Number(x.volume),color:x.close>=x.open?positive+"45":negative+"45"})) as any);
 const lines:any[]=!levels?[]:[[levels.entryLabel||"Entry",levels.entryLow??levels.preferredEntry,positive],["Confirm",levels.confirm??levels.breakout,accent],["Target",levels.target1??levels.t1,accent],["Setup invalidation",levels.invalidation??levels.stop,negative]];
 if(confluence)lines.push(["Fib 38.2%",confluence.fib382,ink],["Fib 50%",confluence.fib50,ink],["Fib 61.8%",confluence.fib618,ink],["Wave target",confluence.waveTarget,accent],["Wave invalidation",confluence.waveInvalidation,negative]);
 if(overlays)lines.push(...overlays.lines.map(line=>[line.label,line.price,line.color]));
 for(const [title,price,lineColor] of lines)if(finite(price)&&Number(price)>0)series.createPriceLine({price:Number(price),color:lineColor,lineWidth:1,lineStyle:LineStyle.Dashed,axisLabelVisible:false,title:mobile?"":title});
 chart.timeScale().fitContent();const resize=new ResizeObserver(()=>{if(el.current)chart.applyOptions({width:el.current.clientWidth,height:Math.max(220,el.current.clientHeight)})});resize.observe(el.current);return()=>{resize.disconnect();chart.remove()};
 },[candles,levels,showTrend,confluence,overlays,forceCandles,appearance]);
 return <div ref={el} className="chartCanvas" role="img" aria-label={ariaLabel||"Historical market price chart; selected chart appearance follows your preferences"}/>;
}
