import {ARENA_SCHEMA_VERSION,ENGINE_VERSION,SNAPSHOT_SCHEMA_VERSION,TODAY_POLICY_VERSION,VALUATION_VERSION,WEIGHTS_VERSION} from "./nivora-version";

const canonical=(x:any):string=>{
  if(x===null||typeof x!=="object")return JSON.stringify(x);
  if(Array.isArray(x))return `[${x.map(canonical).join(",")}]`;
  return `{${Object.keys(x).sort().map(k=>`${JSON.stringify(k)}:${canonical(x[k])}`).join(",")}}`;
};
const fnv1a=(s:string)=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)}return(h>>>0).toString(16).padStart(8,"0")};

export function freezeDecision(input:{symbol:string;observedAt:string;price:number;decision:any;evidence:any;benchmarkSymbol?:string;sectorBenchmarkSymbol?:string|null}){
  const normalizedEvidence=canonical(input.evidence??{});
  return{snapshotSchemaVersion:SNAPSHOT_SCHEMA_VERSION,arenaSchemaVersion:ARENA_SCHEMA_VERSION,engineVersion:ENGINE_VERSION,weightsVersion:WEIGHTS_VERSION,valuationVersion:VALUATION_VERSION,todayPolicyVersion:TODAY_POLICY_VERSION,symbol:String(input.symbol||"").toUpperCase(),observedAt:input.observedAt,price:Number(input.price),benchmarkSymbol:input.benchmarkSymbol||"SPY",sectorBenchmarkSymbol:input.sectorBenchmarkSymbol||null,evidenceFingerprint:fnv1a(normalizedEvidence),decision:input.decision,evidence:input.evidence};
}
