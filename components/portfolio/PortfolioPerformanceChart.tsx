"use client";
import {useMemo,useState} from "react";
type Point={asOf:string;totalValue:number;spy?:number|null;qqq?:number|null};
export default function PortfolioPerformanceChart({points}:{points:Point[]}){
 const[shown,setShown]=useState({PORTFOLIO:true,SPY:true,QQQ:true});
 const series=useMemo(()=>{if(points.length<2)return null;const first=points[0];const norm=(v:number|undefined|null,b:number|undefined|null)=>v&&b?((v/b)-1)*100:null;return points.map(p=>({x:p.asOf,PORTFOLIO:norm(p.totalValue,first.totalValue),SPY:norm(p.spy,first.spy),QQQ:norm(p.qqq,first.qqq)}))},[points]);
 if(points.length<2||!series)return <div className="pulseChartEmpty">Not enough exact history to draw a performance chart yet.</div>;
 const keys=["PORTFOLIO","SPY","QQQ"] as const,vals=series.flatMap(p=>keys.map(k=>p[k]).filter((v):v is number=>v!=null)),min=Math.min(...vals,0),max=Math.max(...vals,0),span=Math.max(1,max-min);
 const path=(k:typeof keys[number])=>series.map((p,i)=>{const v=p[k];if(v==null)return"";const x=4+i/(series.length-1)*92,y=90-((v-min)/span)*80;return`${i?"L":"M"}${x.toFixed(2)} ${y.toFixed(2)}`}).join(" ");
 return <div className="pulseChart"><div className="pulseChartToggles">{keys.map(k=><button key={k} className={shown[k]?"on":""} onClick={()=>setShown(v=>({...v,[k]:!v[k]}))}>{k==="PORTFOLIO"?"You":k}</button>)}</div><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Portfolio performance chart"><line x1="4" y1={90-((0-min)/span)*80} x2="96" y2={90-((0-min)/span)*80}/>{keys.map((k,i)=>shown[k]?<path key={k} className={`series s${i}`} d={path(k)} fill="none" vectorEffect="non-scaling-stroke"/>:null)}</svg><div className="pulseChartAxis"><span>{points[0].asOf.slice(0,10)}</span><span>{points[points.length-1].asOf.slice(0,10)}</span></div></div>
}