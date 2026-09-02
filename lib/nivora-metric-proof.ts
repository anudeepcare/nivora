
export type MetricProofInput={
 metric:string;value:number|null;status:"AVAILABLE"|"UNAVAILABLE"|"COLLECTING";
 formulaVersion:string;sources:string[];freshness:string;sampleSize:number;
 validationStatus:"UNVALIDATED"|"BACKTESTED"|"OUT_OF_SAMPLE_VERIFIED"|"FORWARD_VALIDATING"|"VALIDATED";
 contributors?:Array<{label:string;impact:number}>;
};
export type MetricProof=MetricProofInput&{numericValue:number|null;displayValue:string;warning:string|null};
export function buildMetricProof(x:MetricProofInput):MetricProof{
 if(x.status==="UNAVAILABLE"||x.value==null){
  return{...x,numericValue:null,displayValue:"Not established",warning:"Unavailable evidence is not a zero score; NIVORA withholds the number instead of inventing precision."};
 }
 const scoreLike=["thesis","business","opportunity","timing","valuation","risk","growth","financial"].includes(x.metric.toLowerCase());
 const displayValue=scoreLike?`${Math.round(x.value)}/100`:String(x.value);
 const warning=x.validationStatus==="UNVALIDATED"?"This is a versioned heuristic score, not a measured probability or proven forecast.":x.validationStatus==="FORWARD_VALIDATING"?"Historical validation exists, but forward-live evidence is still accumulating.":null;
 return{...x,numericValue:x.value,displayValue,warning};
}
