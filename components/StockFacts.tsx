"use client";
import {useMemo} from "react";
import type {Research} from "@/lib/types";
import {advancedStudies} from "@/lib/advanced-research";
import {amount,percent,dateLabel} from "@/lib/format";
export default function StockFacts({research:r}:{research:Research}) {
  const s=useMemo(()=>advancedStudies(r.history,r.retrievedAt),[r.history,r.retrievedAt]);
  const pe=r.company.assetType!=="crypto"?r.evidence?.multiples?.ForwardPE:null;
  const rows=[
    {label:"20-session move",tone:s.roc20!=null&&s.roc20<0?"risk":"positive",value:s.roc20==null?null:percent(s.roc20,true),date:s.asOf},
    {label:"60-session move",tone:s.roc60!=null&&s.roc60<0?"risk":"positive",value:s.roc60==null?null:percent(s.roc60,true),date:s.asOf},
    {label:"Daily traded value · 20",tone:"neutral",value:s.averageDollarVolume==null?null:amount(s.averageDollarVolume,r.quote.currency,true),date:s.asOf},
    {label:"Forward P/E",tone:"neutral",value:pe!=null&&Number.isFinite(pe)&&pe>0?`${pe.toFixed(1)}×`:null,date:r.evidence?.updatedAt},
  ].filter(x=>x.value!=null);
  if(!rows.length)return null;
  return <section className="stock-context-region" aria-label="Stock price and market context"><dl className="stock-context-strip">{rows.map(x=><div key={x.label} data-tone={x.tone} title={`${x.label} · ${x.date?dateLabel(x.date):"Date not supplied"}`}><dt>{x.label}</dt><dd>{x.value}</dd></div>)}</dl><p>Price history through {dateLabel(s.asOf)}{rows.some(x=>x.label==="Forward P/E")?` · P/E reported ${dateLabel(r.evidence?.updatedAt)}`:""}</p></section>;
}
