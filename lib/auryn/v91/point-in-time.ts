import type {PointInTimeMetric} from './domain';
const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);

export function latestMetricAsOf(rows:PointInTimeMetric[],symbol:string,metric:string,asOf:string):number|null{
 const eligible=rows.filter(r=>r.symbol===symbol&&r.metric===metric&&finite(r.value)&&r.availableAt<=asOf)
   .sort((a,b)=>a.availableAt.localeCompare(b.availableAt)||(a.periodEnd??'').localeCompare(b.periodEnd??'')||a.metric.localeCompare(b.metric));
 return eligible.length?eligible[eligible.length-1].value:null;
}

export function resolvePointInTimeMetrics(facts:PointInTimeMetric[]=[],events:PointInTimeMetric[]=[],symbol:string,asOf:string):Record<string,number>{
 const rows=[...facts,...events].filter(r=>r.symbol===symbol&&finite(r.value)&&r.availableAt<=asOf)
   .sort((a,b)=>a.availableAt.localeCompare(b.availableAt)||(a.periodEnd??'').localeCompare(b.periodEnd??'')||a.metric.localeCompare(b.metric));
 const out:Record<string,number>={};
 for(const r of rows)out[r.metric]=r.value;
 return Object.fromEntries(Object.entries(out).sort(([a],[b])=>a.localeCompare(b)));
}
