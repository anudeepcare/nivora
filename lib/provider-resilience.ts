type Health={successes:number;failures:number;consecutiveFailures:number;lastSuccessAt:string|null;lastFailureAt:string|null;lastLatencyMs:number|null;totalLatencyMs:number;requests:number;coalescedJoins:number};
const inflight=new Map<string,Promise<any>>();const health=new Map<string,Health>();
const empty=():Health=>({successes:0,failures:0,consecutiveFailures:0,lastSuccessAt:null,lastFailureAt:null,lastLatencyMs:null,totalLatencyMs:0,requests:0,coalescedJoins:0});
function h(provider:string){const current=health.get(provider)||empty();health.set(provider,current);return current}
export async function coalesceRequest<T>(key:string,fn:()=>Promise<T>,provider?:string):Promise<T>{
 if(provider)h(provider).requests++;
 const existing=inflight.get(key);if(existing){if(provider)h(provider).coalescedJoins++;return existing as Promise<T>}
 const p=fn().finally(()=>inflight.delete(key));inflight.set(key,p);return p
}
export function recordProviderResult(provider:string,ok:boolean,latencyMs:number){const x=h(provider),now=new Date().toISOString();if(ok){x.successes++;x.consecutiveFailures=0;x.lastSuccessAt=now}else{x.failures++;x.consecutiveFailures++;x.lastFailureAt=now}x.lastLatencyMs=latencyMs;x.totalLatencyMs+=Math.max(0,latencyMs)}
export function providerHealthSnapshot(provider:string){const x=health.get(provider)||empty(),completed=x.successes+x.failures;return{provider,...x,averageLatencyMs:completed?Math.round(x.totalLatencyMs/completed):null,errorRatePct:completed?Math.round(x.failures/completed*1000)/10:0,status:x.consecutiveFailures>=3?"DEGRADED" as const:x.successes===0&&x.failures===0?"UNKNOWN" as const:"OPERATIONAL" as const}}
export function resetProviderResilienceForTests(){inflight.clear();health.clear()}
