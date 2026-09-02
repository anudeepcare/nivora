
export type ConsistencyIssueCode=
 |"BEARISH_BUY"|"VETO_BUY"|"VALUATION_ORDER"|"LEVEL_ORDER"|"MALFORMED_ZONE"
 |"VALUATION_ZERO_WHEN_UNAVAILABLE"|"MISSING_HEADLINE_PROOF";
export type ConsistencyIssue={code:ConsistencyIssueCode;severity:"ERROR"|"WARN";message:string};
export type DecisionConsistencyInput={
 thesisLabel:string;todayAction:string;vetoes?:string[];
 zones?:Array<{kind?:string;low:number|null;high:number|null}>;
 valuationRange?:{bear:number;base:number;bull:number}|null;
 valuationAvailable?:boolean;
 valuationScore?:number|null;
 support?:number|null;resistance?:number|null;
 metricProofs?:Record<string,unknown>|null;
};
const finite=(x:any)=>Number.isFinite(Number(x));

export function validateDecisionConsistency(x:DecisionConsistencyInput){
 const errors:ConsistencyIssue[]=[],warnings:ConsistencyIssue[]=[];
 const add=(severity:"ERROR"|"WARN",code:ConsistencyIssueCode,message:string)=>(severity==="ERROR"?errors:warnings).push({severity,code,message});
 const action=String(x.todayAction||"").toUpperCase(),thesis=String(x.thesisLabel||"").toUpperCase();
 if(thesis==="BEARISH"&&(action==="BUY"||action==="ADD"))add("ERROR","BEARISH_BUY","A bearish thesis cannot authorize new capital.");
 if((x.vetoes?.length||0)>0&&(action==="BUY"||action==="ADD"))add("ERROR","VETO_BUY","A hard veto cannot coexist with BUY/ADD.");
 if(x.valuationRange){
  const {bear,base,bull}=x.valuationRange;
  if(!finite(bear)||!finite(base)||!finite(bull)||bear>base||base>bull)add("ERROR","VALUATION_ORDER","Valuation scenarios must satisfy Bear ≤ Base ≤ Bull.");
 }
 if(finite(x.support)&&finite(x.resistance)&&Number(x.support)>Number(x.resistance))add("ERROR","LEVEL_ORDER","Support cannot be above resistance.");
 for(const z of x.zones||[]){
  if(z.low!=null&&z.high!=null&&(!finite(z.low)||!finite(z.high)||Number(z.low)>Number(z.high)))add("ERROR","MALFORMED_ZONE","Price zone low/high values are malformed.");
 }
 if(x.valuationAvailable===false&&x.valuationScore===0)add("ERROR","VALUATION_ZERO_WHEN_UNAVAILABLE","Unavailable valuation must not be represented as a numeric zero.");
 if(!x.metricProofs?.thesis)add("WARN","MISSING_HEADLINE_PROOF","Headline thesis score has no metric-proof record.");
 return{ok:errors.length===0,errors,warnings,notes:[...errors,...warnings].map(i=>i.message)};
}
