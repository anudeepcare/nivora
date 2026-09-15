"use client";
import {useMemo,useRef,useState} from "react";
type Point={asOf:string;totalValue:number;spy?:number|null;qqq?:number|null};
export default function PortfolioPerformanceChart({points}:{points:Point[]}){
 const box=useRef<HTMLDivElement>(null),[hover,setHover]=useState<number|null>(null),[shown,setShown]=useState({PORTFOLIO:true,SPY:true,QQQ:true});
 const series=useMemo(()=>{if(points.length<2)return null;const first=points[0];const norm=(v:number|undefined|null,b:number|undefined|null)=>v!=null&&b!=null&&b!==0?((v/b)-1)*100:null;return points.map(p=>({x:p.asOf,PORTFOLIO:norm(p.totalValue,first.totalValue),SPY:norm(p.spy,first.spy),QQQ:norm(p.qqq,first.qqq)}))},[points]);
 if(points.length<2||!series)return <div className="aurynPortfolioChartEmpty">Not enough exact history to draw a performance chart yet.</div>;
 const keys=["PORTFOLIO","SPY","QQQ"] as const,vals=series.flatMap(p=>keys.map(k=>p[k]).filter((v):v is number=>v!=null)),min=Math.min(...vals,0),max=Math.max(...vals,0),span=Math.max(1,max-min);
 const xy=(v:number,i:number)=>({x:4+i/(series.length-1)*92,y:90-((v-min)/span)*80});
 const path=(k:typeof keys[number])=>series.map((p,i)=>p[k]==null?"":`${i?"L":"M"}${xy(p[k]!,i).x.toFixed(2)} ${xy(p[k]!,i).y.toFixed(2)}`).join(" ");
 const portfolioPath=path("PORTFOLIO"),areaPath=`${portfolioPath} L96 90 L4 90 Z`;
 const active=hover==null?series.length-1:hover,pt=series[active],date=new Date(pt.x);
 const move=(e:React.MouseEvent)=>{const r=box.current?.getBoundingClientRect();if(!r)return;setHover(Math.max(0,Math.min(series.length-1,Math.round((e.clientX-r.left)/r.width*(series.length-1)))))};
 return <div ref={box} className="aurynPortfolioChart aurynPremiumPerformanceChart" onMouseMove={move} onMouseLeave={()=>setHover(null)}>
  <div className="aurynChartLegend">{keys.map(k=><button key={k} className={`${shown[k]?"on":""} ${k.toLowerCase()}`} onClick={()=>setShown(v=>({...v,[k]:!v[k]}))}><i/>{k==="PORTFOLIO"?"Portfolio":k}</button>)}</div>
  <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Portfolio performance chart">
   <defs><linearGradient id="aurynPortfolioFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopOpacity=".24"/><stop offset="100%" stopOpacity=".015"/></linearGradient></defs>
   {[25,50,75].map(y=><line key={y} className="grid" x1="4" y1={y} x2="96" y2={y}/>)}
   <line className="zero" x1="4" y1={90-((0-min)/span)*80} x2="96" y2={90-((0-min)/span)*80}/>
   {shown.PORTFOLIO?<><path className="portfolioArea" d={areaPath}/><path className="series portfolio" d={portfolioPath} fill="none" strokeWidth={4.6} vectorEffect="non-scaling-stroke"/></>:null}
   {shown.SPY?<path className="series spy benchmark" d={path("SPY")} fill="none" strokeWidth={2.2} vectorEffect="non-scaling-stroke"/>:null}
   {shown.QQQ?<path className="series qqq benchmark" d={path("QQQ")} fill="none" strokeWidth={2.2} strokeDasharray="5 3" vectorEffect="non-scaling-stroke"/>:null}
   {hover!=null?<line className="hoverLine" x1={xy(0,active).x} y1="8" x2={xy(0,active).x} y2="90"/>:null}
  </svg>
  <div className="aurynChartTooltip"><b>{date.toLocaleDateString(undefined,{month:"short",day:"numeric"})}</b>{keys.filter(k=>shown[k]&&pt[k]!=null).map(k=><span key={k}><i className={k.toLowerCase()}/>{k==="PORTFOLIO"?"Portfolio":k}<strong>{pt[k]!>=0?"+":""}{pt[k]!.toFixed(2)}%</strong></span>)}</div>
  <div className="aurynPortfolioChartAxis"><span>{new Date(points[0].asOf).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span><span>{new Date(points[points.length-1].asOf).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span></div>
 </div>
}