"use client";
import type {Research,Metric} from '@/lib/types';
import {metricEvidence} from '@/lib/research-integrity';
import {dateLabel} from '@/lib/format';
export default function MetricProvenance({research:r,metrics,calculated=false,estimated=false}:{research:Research;metrics:Metric[];calculated?:boolean;estimated?:boolean}){
 const e=metricEvidence(r,metrics,calculated),status=estimated?(r.evidence?.multiples.ForwardPE!=null?'Estimated':'Unavailable'):e.status;
 return <details className="metric-provenance" data-quality={status}><summary>{status} · source & basis</summary><p>{estimated?'Forward-looking provider estimate, not a reported result.':e.explanation}</p><small>Period {dateLabel(e.period)} · {e.currency??'currency unavailable'} · retrieved {dateLabel(e.observedAt)}</small>{e.urls.map((url,i)=><a key={url} href={url} target="_blank" rel="noopener noreferrer">Source {i+1} ↗</a>)}</details>;
}
