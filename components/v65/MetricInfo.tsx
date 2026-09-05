"use client";
import {useEffect,useId,useLayoutEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import type{MetricProof}from "@/lib/nivora-metric-proof";
import {metricDefinitions}from "@/lib/nivora-metrics";

type Pos={left:number;top:number;above:boolean};
type ScoreGuide={label:string;tone:"bad"|"mid"|"good";detail:string};
const WIDTH=340,ESTIMATED_HEIGHT=270,GAP=10,MARGIN=14;

function locate(anchor:DOMRect):Pos{
 const vw=window.innerWidth,vh=window.innerHeight;
 const left=Math.max(MARGIN,Math.min(anchor.left+anchor.width/2-WIDTH/2,vw-WIDTH-MARGIN));
 const roomBelow=vh-anchor.bottom-MARGIN;
 const above=roomBelow<ESTIMATED_HEIGHT&&anchor.top>ESTIMATED_HEIGHT+MARGIN;
 const top=above?Math.max(MARGIN,anchor.top-ESTIMATED_HEIGHT-GAP):Math.min(vh-MARGIN-96,anchor.bottom+GAP);
 return{left,top,above};
}
function scoreGuide(score:number,inverse=false):ScoreGuide{
 if(inverse){
  if(score>=75)return{label:"High risk",tone:"bad",detail:"High pressure. Higher is worse for this metric and can block or reduce new capital."};
  if(score>=60)return{label:"Elevated risk",tone:"bad",detail:"Risk pressure is elevated. Position size and entry quality matter more here."};
  if(score>=40)return{label:"Moderate risk",tone:"mid",detail:"Risk pressure is meaningful but not extreme."};
  return{label:"Lower risk",tone:"good",detail:"Lower pressure. This does not mean the investment is risk-free."};
 }
 if(score>=85)return{label:"Exceptional",tone:"good",detail:"Top-tier evidence. This is a major strength, though it never guarantees an outcome."};
 if(score>=75)return{label:"Strong",tone:"good",detail:"Clearly supportive evidence with a meaningful margin above neutral."};
 if(score>=65)return{label:"Attractive",tone:"good",detail:"Supportive enough to matter, but other gates can still block new capital."};
 if(score>=55)return{label:"Selective",tone:"mid",detail:"Mixed-to-positive. Useful, but not strong enough to stand alone."};
 if(score>=45)return{label:"Balanced",tone:"mid",detail:"Neither a clear strength nor a clear weakness. More confirmation is useful."};
 if(score>=35)return{label:"Weak",tone:"bad",detail:"Evidence is below neutral and can hold back the decision."};
 return{label:"Poor",tone:"bad",detail:"Materially weak evidence. Treat this as an important warning or blocker."};
}

export default function MetricInfo({metric,title,description,score,proof,children}:{metric?:keyof typeof metricDefinitions;title?:string;description?:string;score?:number;proof?:MetricProof;children?:React.ReactNode}){
 const[open,setOpen]=useState(false),[pos,setPos]=useState<Pos|null>(null),ref=useRef<HTMLSpanElement>(null),buttonRef=useRef<HTMLButtonElement>(null),id=useId();
 const def=metric?metricDefinitions[metric]:null,label=title||def?.title||"Why this matters",body=description||def?.short||"Supporting evidence for this reading.",guide=Number.isFinite(score)?scoreGuide(Number(score),metric==="risk"):null;
 const reposition=()=>{const r=buttonRef.current?.getBoundingClientRect();if(r)setPos(locate(r))};
 useLayoutEffect(()=>{if(open)reposition()},[open]);
 useEffect(()=>{if(!open)return;const outside=(e:PointerEvent)=>{const target=e.target as Node;if(!ref.current?.contains(target)&&!(document.getElementById(id)?.contains(target)))setOpen(false)},key=(e:KeyboardEvent)=>{if(e.key==="Escape"){setOpen(false);buttonRef.current?.focus()}},move=()=>reposition();document.addEventListener("pointerdown",outside);document.addEventListener("keydown",key);window.addEventListener("resize",move);window.addEventListener("scroll",move,true);return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",key);window.removeEventListener("resize",move);window.removeEventListener("scroll",move,true)}},[open,id]);
 const sheet=open&&pos&&typeof document!=="undefined"?createPortal(<div id={id} className={`v658MetricSheet ${pos.above?"above":"below"}`} role="dialog" aria-modal="false" aria-label={label} style={{position:"fixed",left:pos.left,top:pos.top}}><div className="v658MetricTitle"><b>{label}</b><button type="button" onClick={()=>setOpen(false)} aria-label="Close explanation">×</button></div><p>{body}</p>{guide?<div className={`v658ScoreBand ${guide.tone}`}><span>{Math.round(Number(score))}/100</span><b>{guide.label}</b><small>{guide.detail}</small></div>:null}{def?.range?<div className="v658MetricSection"><strong>Score guide</strong><span>{def.range}</span></div>:null}{def?.uses?<div className="v658MetricSection"><strong>Why it matters</strong><span>{def.uses}</span></div>:null}{proof?.contributors?.length?<div className="v658MetricSection"><strong>Why this score</strong><span>{proof.contributors.slice(0,3).map(x=>`${x.label} ${x.impact>=0?"+":""}${Math.round(x.impact)}`).join(" · ")}</span></div>:null}{children?<div className="v658MetricSection v658MetricCustom">{children}</div>:null}</div>,document.body):null;
 return <span className="v658MetricInfo v65MetricInfo" ref={ref}><button ref={buttonRef} className="v658InfoButton" type="button" aria-label={`About ${label}`} aria-expanded={open} aria-controls={id} onClick={e=>{e.stopPropagation();setOpen(v=>!v)}}><svg className="v6516InfoGlyph" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.25"/><circle className="v6520InfoDot" cx="10" cy="6.7" r="1.05"/><rect className="v6520InfoStem" x="9.15" y="9" width="1.7" height="5.1" rx=".85"/></svg></button>{sheet}</span>;
}
