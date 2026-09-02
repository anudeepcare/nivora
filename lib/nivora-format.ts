
export function formatMoney(value:number|null|undefined,opts:{confidence?:"High"|"Medium"|"Low";compact?:boolean}={}){
 if(value==null||!Number.isFinite(value))return"—";
 const abs=Math.abs(value);
 if(opts.compact&&abs>=1_000_000_000)return`${value<0?"-":""}$${(abs/1_000_000_000).toFixed(abs>=10_000_000_000?1:2)}B`;
 if(opts.compact&&abs>=1_000_000)return`${value<0?"-":""}$${(abs/1_000_000).toFixed(abs>=10_000_000?1:2)}M`;
 const digits=opts.confidence==="Low"?0:2;
 return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
}
export function formatPercent(value:number|null|undefined,digits=2){
 if(value==null||!Number.isFinite(value))return"—";
 return`${value>0?"+":""}${value.toFixed(digits)}%`;
}
export function formatCount(value:number|null|undefined){
 if(value==null||!Number.isFinite(value))return"—";
 return new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(value);
}
export function formatScore(value:number|null|undefined){
 return value==null||!Number.isFinite(value)?"—":String(Math.round(value));
}
