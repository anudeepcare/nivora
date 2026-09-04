"use client";
import {useEffect,useId,useRef,useState} from "react";
import type{MetricProof}from "@/lib/nivora-metric-proof";
import {metricDefinitions}from "@/lib/nivora-metrics";

export default function MetricInfo({metric,title,description,proof,children}:{metric?:keyof typeof metricDefinitions;title?:string;description?:string;proof?:MetricProof;children?:React.ReactNode}){
 const[open,setOpen]=useState(false),ref=useRef<HTMLSpanElement>(null),id=useId();
 const def=metric?metricDefinitions[metric]:null,label=title||def?.title||"Why this matters",body=description||def?.short||"Supporting evidence for this reading.";
 useEffect(()=>{if(!open)return;const outside=(e:PointerEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)},key=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)};document.addEventListener("pointerdown",outside);document.addEventListener("keydown",key);return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",key)}},[open]);
 return <span className="v65MetricInfo" ref={ref}>
  <button type="button" aria-label={`Explain ${label}`} aria-expanded={open} aria-controls={id} onClick={e=>{e.stopPropagation();setOpen(v=>!v)}}>?</button>
  {open?<span id={id} className="v65MetricSheet" role="tooltip"><b>{label}</b><p>{body}</p>{children?<div className="v65MetricCustom">{children}</div>:null}{def?.uses?<span className="v652Why"><strong>Why it matters</strong>{def.uses}</span>:null}{proof?.warning?<em>{proof.warning}</em>:null}</span>:null}
 </span>;
}
