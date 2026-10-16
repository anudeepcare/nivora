"use client";
import {useEffect,useRef,useState} from "react";
import {createChart,CandlestickSeries,HistogramSeries,AreaSeries,LineSeries,LineStyle,PriceScaleMode} from "lightweight-charts";
import {shouldFitChart} from '@/lib/research-first-glance';
import type {IChartApi} from "lightweight-charts";
import type {StructureChartOverlays} from "@/lib/research-structure-presentation";
const finite=(v:any)=>v!==null&&v!==undefined&&v!==""&&Number.isFinite(Number(v));
type Props={compact?:boolean;candles:any[];levels:any|null;showTrend?:boolean;confluence?:{fib382?:number;fib50?:number;fib618?:number;waveTarget?:number;waveInvalidation?:number};overlays?:StructureChartOverlays;forceCandles?:boolean;ariaLabel?:string;rangeKey?:string};
export default function PriceChart({candles,levels,showTrend=false,confluence,overlays,forceCandles=false,ariaLabel,rangeKey,compact=false}:Props){
 const el=useRef<HTMLDivElement>(null),chartRef=useRef<IChartApi|null>(null),dataRef=useRef<any>({series:null,volume:null,studies:new Map(),lines:[],style:null,signature:null,range:null}),[appearance,setAppearance]=useState(0),[zoom,setZoom]=useState(1);
 const changeZoom=(factor:number)=>{const chart=chartRef.current,range=chart?.timeScale().getVisibleLogicalRange();if(!chart||!range)return;const center=(range.from+range.to)/2,width=Math.max(8,(range.to-range.from)*factor);dataRef.current.userAdjusted=true;chart.timeScale().setVisibleLogicalRange({from:center-width/2,to:center+width/2});setZoom(previous=>Math.max(.1,previous/factor));};
 const resetZoom=()=>{dataRef.current.userAdjusted=false;chartRef.current?.timeScale().fitContent();setZoom(1);};
 // Mount once. Quotes, theme changes and freshly allocated props do not remount the canvas.
 useEffect(()=>{
  if(!el.current)return;
  const chart=createChart(el.current,{width:el.current.clientWidth,height:Math.max(120,el.current.clientHeight),localization:{locale:"en-US"},layout:{fontSize:11},rightPriceScale:{minimumWidth:54},handleScroll:{mouseWheel:false,pressedMouseMove:true,horzTouchDrag:false,vertTouchDrag:false},handleScale:{mouseWheel:false,pinch:false,axisPressedMouseMove:false,axisDoubleClickReset:false},timeScale:{secondsVisible:false,rightOffset:3,barSpacing:6}});
  chartRef.current=chart;
  const resize=new ResizeObserver(()=>{if(el.current)chart.applyOptions({width:el.current.clientWidth,height:Math.max(120,el.current.clientHeight)})});resize.observe(el.current);
  const change=()=>setAppearance(x=>x+1),storage=(e:StorageEvent)=>{if(e.key?.startsWith('auryn-')&&/theme|accent|chart-style/.test(e.key))change();};
  window.addEventListener('auryn-appearance',change);window.addEventListener('storage',storage);
  return()=>{resize.disconnect();window.removeEventListener('auryn-appearance',change);window.removeEventListener('storage',storage);chartRef.current=null;dataRef.current={series:null,volume:null,studies:new Map(),lines:[],style:null,signature:null,range:null};chart.remove();};
 },[]);
 useEffect(()=>{
  const chart=chartRef.current;if(!chart||!el.current)return;
  const bars=Array.from(new Map((candles||[]).filter(x=>x.time!=null&&[x.open,x.high,x.low,x.close].every(finite)).map(x=>[String(x.time),{...x,open:Number(x.open),high:Number(x.high),low:Number(x.low),close:Number(x.close)}])).values()).sort((a,b)=>typeof a.time==='number'&&typeof b.time==='number'?a.time-b.time:String(a.time).localeCompare(String(b.time)));
  const css=getComputedStyle(el.current),color=(key:string,fallback:string)=>css.getPropertyValue(key).trim()||fallback;
  const background=color('--auryn-card-bg','#ffffff'),ink=color('--auryn-page-muted','#697586'),border=color('--auryn-border','#e9edf3'),accent=color('--auryn-accent','#4267ce'),positive=color('--auryn-positive','#218777'),negative=color('--auryn-negative','#ce5961');
  let style='line';try{style=localStorage.getItem('auryn-chart-style')||style}catch{}if(forceCandles)style='candlestick';
  chart.applyOptions({layout:{background:{color:background},textColor:ink},grid:{vertLines:{visible:false},horzLines:{color:border}},rightPriceScale:{borderVisible:false},timeScale:{borderVisible:false,timeVisible:typeof bars[0]?.time==='number'}});
  const current=dataRef.current,visible=chart.timeScale().getVisibleLogicalRange();
  if(!current.series||current.style!==style){if(current.series)chart.removeSeries(current.series);current.series=style==='line'?chart.addSeries(AreaSeries,{lineWidth:2,lineColor:accent,topColor:accent+'30',bottomColor:accent+'00',priceLineVisible:false}):chart.addSeries(CandlestickSeries,{borderVisible:false,priceLineVisible:false});current.style=style;current.signature=null;current.lines=[];}
  current.series.applyOptions(style==='line'?{lineColor:accent,topColor:accent+'30',bottomColor:accent+'00'}:{upColor:positive,downColor:negative,wickUpColor:positive,wickDownColor:negative});
  const signature=JSON.stringify(bars),nextRange=rangeKey??`${typeof bars[0]?.time}:${bars.length>1?Math.round((Date.parse(String(bars.at(-1)?.time))-Date.parse(String(bars[0]?.time)))/Math.max(1,bars.length-1)/3600000):0}`;
  const changedRange=current.range!==nextRange,dataChanged=signature!==current.signature;
  if(signature!==current.signature){
   let haOpen=0,haClose=0;
   const rendered=bars.map((x,i)=>{if(style==='line')return{time:x.time,value:x.close};if(style!=='heikin')return{time:x.time,open:x.open,high:x.high,low:x.low,close:x.close};const close=(x.open+x.high+x.low+x.close)/4,open=i?(haOpen+haClose)/2:(x.open+x.close)/2;haOpen=open;haClose=close;return{time:x.time,open,close,high:Math.max(x.high,open,close),low:Math.min(x.low,open,close)}});
   current.series.setData(rendered);current.signature=signature;
  }
  if(compact&&!forceCandles&&current.volume){chart.removeSeries(current.volume);current.volume=null;}
  if((!compact||forceCandles)&&!current.volume){current.volume=chart.addSeries(HistogramSeries,{priceFormat:{type:'volume'},priceScaleId:'',priceLineVisible:false,lastValueVisible:false});current.volume.priceScale().applyOptions({scaleMargins:{top:.87,bottom:0}});}
  current.volume?.setData(bars.filter(x=>finite(x.volume)&&Number(x.volume)>0).map(x=>({time:x.time,value:Number(x.volume),color:x.close>=x.open?positive+'35':negative+'35'})));
  const studies=new Map<string,{points:any[];color:string}>();
  if(showTrend)for(const [period,lineColor] of [[20,accent],[50,'#8893b4']] as const)studies.set(`MA${period}`,{color:lineColor,points:bars.flatMap((x,i)=>i<period-1?[]:[{time:x.time,value:bars.slice(i-period+1,i+1).reduce((sum,b)=>sum+b.close,0)/period}])});
  for(const study of overlays?.series??[])studies.set(study.label,{color:study.color,points:study.points});
  for(const [key,series] of current.studies)if(!studies.has(key)){chart.removeSeries(series);current.studies.delete(key);}
  for(const [key,study] of studies){let series=current.studies.get(key);if(!series){series=chart.addSeries(LineSeries,{color:study.color,lineWidth:1,priceLineVisible:false,lastValueVisible:false,title:key});current.studies.set(key,series);}series.setData(study.points);}
  chart.priceScale('right').applyOptions({mode:overlays?.scale==='log'?PriceScaleMode.Logarithmic:PriceScaleMode.Normal});
  for(const line of current.lines)current.series.removePriceLine(line);current.lines=[];
  const lines:any[]=!levels?[]:[[levels.entryLabel||'Support',levels.entryLow??levels.preferredEntry,positive],['Resistance',levels.confirmation??levels.confirm??levels.breakout,accent],['Target',levels.target1??levels.t1,accent],['Invalidation',levels.invalidation??levels.stop,negative]];
  if(confluence)lines.push(['.382',confluence.fib382,ink],['.500',confluence.fib50,ink],['.618',confluence.fib618,ink],['Wave target',confluence.waveTarget,accent],['Wave invalidation',confluence.waveInvalidation,negative]);
  lines.push(...(overlays?.lines??[]).map(line=>[line.label,line.price,line.color]));
  for(const [title,price,lineColor] of lines)if(finite(price)&&Number(price)>0)current.lines.push(current.series.createPriceLine({price:Number(price),color:lineColor,lineWidth:1,lineStyle:LineStyle.Dashed,axisLabelVisible:false,title}));
  if(bars.length&&shouldFitChart({rangeChanged:changedRange,dataChanged,userAdjusted:!!current.userAdjusted,hasRange:!!visible})){chart.timeScale().fitContent();current.userAdjusted=false;setZoom(1);}else if(visible)chart.timeScale().setVisibleLogicalRange(visible);
  current.range=nextRange;
 },[candles,levels,showTrend,confluence,overlays,forceCandles,appearance,rangeKey,compact]);
 return <div className="priceChartFrame"><div ref={el} onPointerDown={e=>{if(e.pointerType==='mouse')dataRef.current.userAdjusted=true}} className="chartCanvas" role="img" aria-label={ariaLabel||'Historical price and volume chart'}/>{!compact&&<div className="priceChartNavigation" aria-label="Chart zoom controls"><span aria-live="polite">{zoom===1?'Full range':`Zoom ${zoom.toFixed(1)}×`}</span><button type="button" aria-label="Zoom out chart" onClick={()=>changeZoom(4/3)} disabled={!candles.length}>−</button><button type="button" aria-label="Zoom in chart" onClick={()=>changeZoom(.75)} disabled={!candles.length}>+</button><button type="button" aria-label="Reset chart zoom" onClick={resetZoom} disabled={!candles.length}>Reset</button></div>}</div>;
}
