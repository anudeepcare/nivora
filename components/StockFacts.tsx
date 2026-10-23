"use client";
import {useMemo} from "react";
import type {Research} from "@/lib/types";
import {advancedStudies} from "@/lib/advanced-research";
import {amount,percent,dateLabel} from "@/lib/format";
export default function StockFacts({research:r}:{research:Research}) {
  const s=useMemo(()=>advancedStudies(r.history,r.retrievedAt),[r.history,r.retrievedAt]);
  const pe=r.company.assetType!=="crypto"?r.evidence?.multiples?.ForwardPE:null;
  const rows=[
    {label:"20-session move",value:s.roc20==null?null:percent(s.roc20,true),date:s.asOf},
    {label:"60-session move",value:s.roc60==null?null:percent(s.roc60,true),date:s.asOf},
    {label:"Daily traded value · 20",value:s.averageDollarVolume==null?null:amount(s.averageDollarVolume,r.quote.currency,true),date:s.asOf},
    {label:"Forward P/E",value:pe!=null&&Number.isFinite(pe)&&pe>0?`${pe.toFixed(1)}×`:null,date:r.evidence?.updatedAt},
  ].filter(x=>x.value!=null);
  if(!rows.length)return null;
  return <dl className="stock-context-strip" aria-label="Stock price and market context">{rows.map(x=><div key={x.label}><dt>{x.label}</dt><dd>{x.value}</dd><small>{x.date?dateLabel(x.date):"Date not supplied"}</small></div>)}</dl>;
}
