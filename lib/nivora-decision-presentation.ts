
import type {PriceZone} from "./nivora-investor";
import {formatMoney} from "./nivora-format";

const actionable=new Set(["BUY","ADD","STRONG BUY","ACCUMULATE"]);
const avoid=new Set(["AVOID","SELL","TRIM","REDUCE","EXIT / REASSESS"]);
export function presentPriceZone(zone:PriceZone,action:string){
 const a=String(action||"").toUpperCase();
 const heading=actionable.has(a)?"ACTIONABLE ENTRY":avoid.has(a)?"REFERENCE ONLY":"POTENTIAL ENTRY";
 const low=zone.low,high=zone.high;
 let value="—";
 if(low!=null&&high!=null&&Number(low)>Number(high))return{heading,value:"Not established",label:zone.label,confidence:zone.confidence,basis:zone.basis,authorized:false};
 if(low!=null&&high!=null){
  const tolerance=Math.max(.005,Math.max(Math.abs(low),Math.abs(high))*.001);
  if(Math.abs(high-low)<=tolerance)value=`~${formatMoney((low+high)/2,{confidence:zone.confidence})}`;
  else value=`${formatMoney(low,{confidence:zone.confidence})}–${formatMoney(high,{confidence:zone.confidence})}`;
 }else if(low!=null)value=`~${formatMoney(low,{confidence:zone.confidence})}`;
 else if(high!=null)value=`~${formatMoney(high,{confidence:zone.confidence})}`;
 return{heading,value,label:zone.label,confidence:zone.confidence,basis:zone.basis,authorized:actionable.has(a)};
}

export function formatScenario(range:{bear:number;base:number;bull:number;method:string;confidence:"High"|"Medium"|"Low"},spot:number){
 const delta=(value:number)=>spot>0?(value/spot-1)*100:0;
 return[
  {label:"BEAR" as const,title:"BEAR CASE",value:formatMoney(range.bear,{confidence:range.confidence}),delta:`${delta(range.bear)>=0?"+":""}${delta(range.bear).toFixed(1)}%`,raw:range.bear},
  {label:"BASE" as const,title:"BASE CASE",value:formatMoney(range.base,{confidence:range.confidence}),delta:`${delta(range.base)>=0?"+":""}${delta(range.base).toFixed(1)}%`,raw:range.base},
  {label:"BULL" as const,title:"BULL CASE",value:formatMoney(range.bull,{confidence:range.confidence}),delta:`${delta(range.bull)>=0?"+":""}${delta(range.bull).toFixed(1)}%`,raw:range.bull},
 ];
}
