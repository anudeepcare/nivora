
export type IntegrityBar={datetime:string;open:number;high:number;low:number;close:number;volume:number};
export type BarIntegrityState="VERIFIED"|"SINGLE_SOURCE"|"DISAGREEMENT"|"INVALID_SERIES"|"INSUFFICIENT";
const median=(xs:number[])=>{if(!xs.length)return 0;const s=[...xs].sort((a,b)=>a-b),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2};
const validBar=(b:IntegrityBar)=>Number.isFinite(b.open)&&Number.isFinite(b.high)&&Number.isFinite(b.low)&&Number.isFinite(b.close)&&b.high>=Math.max(b.open,b.close,b.low)&&b.low<=Math.min(b.open,b.close,b.high)&&b.close>0;
export function assessBarSeriesIntegrity(primary:IntegrityBar[]|null|undefined,secondary:IntegrityBar[]|null|undefined){
 const p=Array.isArray(primary)?primary:[],s=Array.isArray(secondary)?secondary:[];
 if(!p.length)return{state:"INSUFFICIENT" as BarIntegrityState,decisionGrade:false,compared:0,medianCloseGapPct:null,reason:"Primary historical series is unavailable."};
 const malformed=p.filter(x=>!validBar(x)).length;
 if(malformed)return{state:"INVALID_SERIES" as BarIntegrityState,decisionGrade:false,compared:0,medianCloseGapPct:null,reason:`Primary historical series contains ${malformed} malformed OHLC bars.`};
 if(!s.length)return{state:"SINGLE_SOURCE" as BarIntegrityState,decisionGrade:true,compared:0,medianCloseGapPct:null,reason:"Historical series passed structural checks but no independent bar provider was available for cross-checking."};
 const sm=new Map(s.filter(validBar).map(x=>[x.datetime,x]));
 const gaps:number[]=[];
 for(const b of p.slice(-40)){const o=sm.get(b.datetime);if(!o||o.close<=0)continue;const mid=(Math.abs(b.close)+Math.abs(o.close))/2;if(mid>0)gaps.push(Math.abs(b.close-o.close)/mid*100)}
 if(gaps.length<5)return{state:"INSUFFICIENT" as BarIntegrityState,decisionGrade:false,compared:gaps.length,medianCloseGapPct:gaps.length?+median(gaps).toFixed(4):null,reason:"Too few overlapping provider bars to establish historical-series integrity."};
 const med=median(gaps),large=gaps.filter(x=>x>.75).length/gaps.length;
 if(med>.35||large>.20)return{state:"DISAGREEMENT" as BarIntegrityState,decisionGrade:false,compared:gaps.length,medianCloseGapPct:+med.toFixed(4),reason:`Historical providers disagree materially (median close gap ${med.toFixed(2)}%; ${(large*100).toFixed(0)}% of compared bars above 0.75%).`};
 return{state:"VERIFIED" as BarIntegrityState,decisionGrade:true,compared:gaps.length,medianCloseGapPct:+med.toFixed(4),reason:"Independent historical providers agree within the V64 bar-integrity tolerance."};
}
