
type Range={bear:number;base:number;bull:number;confidence?:string};
type Zone={label:string;low:number|null;high:number|null;kind:string;confidence:"High"|"Medium"|"Low";basis:string};
const pct=(a:number,b:number)=>a>0?(b/a-1)*100:0;
export function checkValuationSanity(price:number,range:Range|null|undefined){
 const warnings:string[]=[];if(!range||!Number.isFinite(price)||price<=0)return{status:"UNAVAILABLE" as const,warnings:["Decision-grade valuation range is unavailable."],bearUpsidePct:null,baseUpsidePct:null,bullUpsidePct:null};
 const bear=pct(price,range.bear),base=pct(price,range.base),bull=pct(price,range.bull),spread=(range.bull-range.bear)/Math.max(.01,range.base);
 if(bear>15)warnings.push(`Bear case is still ${bear.toFixed(1)}% above spot; assumptions may be too optimistic or the market may be pricing material risk not captured by the model.`);
 if(base>65)warnings.push(`Base case implies ${base.toFixed(1)}% upside; require stronger evidence before treating this as decision-grade expected return.`);
 if(spread<.12)warnings.push("Bear/base/bull scenarios are unusually tight and may understate uncertainty.");
 if(spread>.65)warnings.push("Scenario dispersion is very wide and reduces valuation precision.");
 if(range.bear>=range.base||range.base>=range.bull)warnings.push("Valuation scenarios are not strictly ordered bear < base < bull.");
 const status=warnings.some(w=>w.includes("not strictly"))?"FAIL" as const:warnings.length?"WARN" as const:"PASS" as const;
 return{status,warnings,bearUpsidePct:+bear.toFixed(1),baseUpsidePct:+base.toFixed(1),bullUpsidePct:+bull.toFixed(1)};
}
function overlap(a:Zone,b:Zone){if(a.low==null||a.high==null||b.low==null||b.high==null)return 0;const lo=Math.max(a.low,b.low),hi=Math.min(a.high,b.high),inter=Math.max(0,hi-lo),small=Math.min(a.high-a.low,b.high-b.low);return small>0?inter/small:0}
export function consolidateEntryZones<T extends Zone>(zones:T[]):T[]{
 const entries=zones.filter(z=>["starter","accumulate","strong"].includes(z.kind)&&(z.label.toLowerCase().includes("fundamental")||z.label.toLowerCase().startsWith("strong accumulate / thesis intact")));
 const unionLow=entries.length?Math.min(...entries.map(z=>Number(z.low))):0,unionHigh=entries.length?Math.max(...entries.map(z=>Number(z.high))):0;
 const unionSpan=Math.max(.01,unionHigh-unionLow),covered=entries.length?entries.reduce((sum,z)=>sum+Math.max(0,Number(z.high)-Number(z.low)),0)/unionSpan:0;
 if(entries.length>=2&&(covered>=1.8||entries.every((z,i)=>i===0||overlap(entries[0],z)>=.55))){
  const low=unionLow,high=unionHigh,first=entries[0];
  const merged={...first,label:"Accumulation zone",low:+low.toFixed(2),high:+high.toFixed(2),kind:"accumulate",confidence:"Medium",basis:"Starter/accumulate valuation bands materially overlap, so NIVORA consolidates them to avoid false precision."} as T;
  const ids=new Set(entries);return [merged,...zones.filter(z=>!ids.has(z))];
 }
 return zones;
}
