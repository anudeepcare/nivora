"use client";
import {useState} from 'react';
import type {ProfessionalMetric} from '@/lib/auryn/v5/domain';
import MetricHelp from '@/components/MetricHelp';
const groups:Record<string,string[]>={All:[],Essentials:['rsi14','macdHistogram','distance50','distance200','volumeRatio20','atrPct'],Trend:['TREND','STRUCTURE'],Momentum:['MOMENTUM'],Volume:['VOLUME_FLOW'],Risk:['VOLATILITY','RELATIVE_STRENGTH']};
export default function TechnicalReadings({metrics=[]}:{metrics:ProfessionalMetric[]}){
 const [group,setGroup]=useState('Essentials');
 const technical=metrics.filter(m=>['TREND','MOMENTUM','VOLUME_FLOW','VOLATILITY','STRUCTURE','RELATIVE_STRENGTH'].includes(m.family));
 const chosen=technical.filter(m=>group==='All'||(group==='Essentials'?groups.Essentials.includes(m.id):groups[group].includes(m.family)));
 const rows=chosen;
 return <section className="technicalReadings" aria-label="Technical indicator readings"><div className="au-chiprow" aria-label="Indicator group">{Object.keys(groups).map(g=><button className="au-chip" key={g} aria-pressed={g===group} onClick={()=>setGroup(g)}>{g}</button>)}</div><div className="indicatorGrid">{rows.map(m=><article className="indicatorReading" key={m.id}><div className="au-row"><h3>{m.label}</h3><MetricHelp term={m.label} body={`${m.interpretation} Source: ${m.source}. ${m.timeframe||''}`}/></div><div className="au-row"><div className="au-metric">{m.available&&m.value!==null?(typeof m.value==='number'?m.value.toLocaleString('en-US',{maximumFractionDigits:2}):m.value):'—'}{m.available&&m.unit&&m.unit!=='/100'?m.unit:''}</div><span className={`au-pill ${m.available&&['BULLISH','STRONG'].includes(m.state)?'au-good':m.available&&['BEARISH','WEAK'].includes(m.state)?'au-bad':''}`}>{!m.available?'Unavailable':m.state==='N/A'?'Context':m.state.toLowerCase()}</span></div></article>)}</div>{!rows.length&&<div className="au-panel au-empty">No readings are available for this group in the current history.</div>}</section>;
}
