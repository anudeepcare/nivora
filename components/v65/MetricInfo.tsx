"use client";
import {useEffect,useId,useLayoutEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import type{MetricProof}from "@/lib/nivora-metric-proof";
import {metricDefinitions}from "@/lib/nivora-metrics";

type Pos={left:number;top:number;above:boolean};
const WIDTH=320,ESTIMATED_HEIGHT=220,GAP=8,MARGIN=12;

function locate(anchor:DOMRect):Pos{
 const vw=window.innerWidth,vh=window.innerHeight;
 const left=Math.max(MARGIN,Math.min(anchor.left+anchor.width/2-WIDTH/2,vw-WIDTH-MARGIN));
 const roomBelow=vh-anchor.bottom-MARGIN;
 const above=roomBelow<ESTIMATED_HEIGHT&&anchor.top>ESTIMATED_HEIGHT+MARGIN;
 const top=above?Math.max(MARGIN,anchor.top-ESTIMATED_HEIGHT-GAP):Math.min(vh-MARGIN-80,anchor.bottom+GAP);
 return{left,top,above};
}

export default function MetricInfo({metric,title,description,children}:{metric?:keyof typeof metricDefinitions;title?:string;description?:string;proof?:MetricProof;children?:React.ReactNode}){
 const[open,setOpen]=useState(false),[pos,setPos]=useState<Pos|null>(null),ref=useRef<HTMLSpanElement>(null),buttonRef=useRef<HTMLButtonElement>(null),id=useId();
 const def=metric?metricDefinitions[metric]:null,label=title||def?.title||"Why this matters",body=description||def?.short||"Supporting evidence for this reading.";
 const reposition=()=>{const r=buttonRef.current?.getBoundingClientRect();if(r)setPos(locate(r))};
 useLayoutEffect(()=>{if(open)reposition()},[open]);
 useEffect(()=>{if(!open)return;const outside=(e:PointerEvent)=>{const target=e.target as Node;if(!ref.current?.contains(target)&&!(document.getElementById(id)?.contains(target)))setOpen(false)},key=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)},move=()=>reposition();document.addEventListener("pointerdown",outside);document.addEventListener("keydown",key);window.addEventListener("resize",move);window.addEventListener("scroll",move,true);return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",key);window.removeEventListener("resize",move);window.removeEventListener("scroll",move,true)}},[open,id]);
 const sheet=open&&pos&&typeof document!=="undefined"?createPortal(<div id={id} className={`v657MetricSheet ${pos.above?"above":"below"}`} role="dialog" aria-label={label} style={{position:"fixed",left:pos.left,top:pos.top}}><b>{label}</b><p>{body}</p>{def?.range?<div className="v657MetricRange"><strong>How to read it</strong><span>{def.range}</span></div>:null}{def?.uses?<div className="v657MetricWhy"><strong>Why it matters</strong><span>{def.uses}</span></div>:null}{children?<div className="v657MetricCustom">{children}</div>:null}</div>,document.body):null;
 return <span className="v65MetricInfo v657MetricInfo" ref={ref}><button ref={buttonRef} className="v657InfoButton" type="button" aria-label={`About ${label}`} aria-expanded={open} aria-controls={id} onClick={e=>{e.stopPropagation();setOpen(v=>!v)}}>i</button>{sheet}</span>;
}
