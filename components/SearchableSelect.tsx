"use client";
import { useId } from "react";
import s from "./SearchableSelect.module.css";
/** One native control on every device: no nested popup, search focus or second picker. */
export default function SearchableSelect({label,value,options,onChange,disabled=false,placeholder="Choose an option"}:{label:string;value:string;options:{value:string;label:string}[];onChange:(value:string)=>void;disabled?:boolean;placeholder?:string}) {
 const id=useId();
 return <label className={s.root} htmlFor={id}><span className={s.label}>{label}</span><select id={id} className={s.select} value={value} disabled={disabled} onChange={event=>onChange(event.target.value)}>{!options.some(option=>option.value===value)&&<option value="" disabled>{placeholder}</option>}{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
