"use client";
import {useEffect,useId,useRef,useState} from "react";
import {Info} from "lucide-react";
import type{MetricProof}from "@/lib/nivora-metric-proof";
import {metricDefinitions}from "@/lib/nivora-metrics";

export default function MetricInfo({metric,title,description,proof,children}:{metric?:keyof typeof metricDefinitions;title?:string;description?:string;proof?:MetricProof;children?:React.ReactNode}){
 const [open,setOpen]=useState(false),ref=useRef<HTMLSpanElement>(null),id=useId();
 const def=metric?metricDefinitions[metric]:null;
 const label=title||def?.title||"Metric";
 const body=description||def?.short||"NIVORA metric evidence.";
 useEffect(()=>{
  if(!open)return;
  const outside=(e:PointerEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};
  const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)};
  document.addEventListener("pointerdown",outside);document.addEventListener("keydown",key);
  return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",key)};
 },[open]);
 return <span className="v65MetricInfo" ref={ref}>
  <button type="button" aria-label={`Explain ${label}`} aria-expanded={open} aria-controls={id} onClick={e=>{e.stopPropagation();setOpen(v=>!v)}}><Info size={14}/></button>
  {open?<span id={id} className="v65MetricSheet" role="dialog" aria-label={`${label} explanation`}>
   <b>{label}</b><p>{body}</p>{children?<div className="v65MetricCustom">{children}</div>:null}
   <dl>
    {def?.uses?<div><dt>Uses</dt><dd>{def.uses}</dd></div>:null}
    <div><dt>Freshness</dt><dd>{proof?.freshness||def?.freshness||"Depends on source evidence"}</dd></div>
    <div><dt>Source</dt><dd>{proof?.sources?.join(" · ")||def?.source||"NIVORA evidence pipeline"}</dd></div>
    <div><dt>Formula</dt><dd>{proof?.formulaVersion||"V65 metric contract"}</dd></div>
    <div><dt>Validation</dt><dd>{proof?.validationStatus||"UNVALIDATED"}</dd></div>
   </dl>
   {proof?.warning?<em>{proof.warning}</em>:null}
  </span>:null}
 </span>;
}
