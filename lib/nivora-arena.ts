import {RELIABILITY_MIN_SAMPLE} from "./nivora-version";
export type ArenaHorizon="30D"|"90D"|"180D"|"1Y"|"2Y";
const pct=(a:number,b:number)=>a>0?+(((b/a)-1)*100).toFixed(2):0;
export function gradeArenaOutcome(x:{horizon:ArenaHorizon;startPrice:number;endPrice:number;benchmarkStart:number;benchmarkEnd:number;sectorStart?:number|null;sectorEnd?:number|null;maxDrawdownPct?:number|null}){
 const raw=pct(x.startPrice,x.endPrice),bench=pct(x.benchmarkStart,x.benchmarkEnd),sector=x.sectorStart&&x.sectorEnd?pct(x.sectorStart,x.sectorEnd):null,alpha=+(raw-bench).toFixed(2);
 return{horizon:x.horizon,rawReturnPct:raw,benchmarkReturnPct:bench,sectorReturnPct:sector,alphaPct:alpha,sectorAlphaPct:sector==null?null:+(raw-sector).toFixed(2),maxDrawdownPct:x.maxDrawdownPct??null,hit:alpha>0};
}
export function summarizeReliability(rows:Array<{alphaPct:number;hit:boolean}>,minimum=RELIABILITY_MIN_SAMPLE){
 const n=rows.length,avg=n?+(rows.reduce((s,r)=>s+r.alphaPct,0)/n).toFixed(2):0,hitRate=n?+(rows.filter(r=>r.hit).length/n*100).toFixed(1):0;
 const status=n<minimum?"COLLECTING" as const:"CALIBRATED" as const;
 return{status,label:status==="CALIBRATED"?"Calibrated":"Collecting",n,minimum,averageAlphaPct:avg,hitRatePct:hitRate,reliabilityScore:status==="CALIBRATED"?Math.max(0,Math.min(100,Math.round(50+avg*2+(hitRate-50)*.6))):null};
}
