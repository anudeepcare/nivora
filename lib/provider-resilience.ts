type Health={successes:number;failures:number;consecutiveFailures:number;lastSuccessAt:string|null;lastFailureAt:string|null;lastLatencyMs:number|null};
const inflight=new Map<string,Promise<any>>();const health=new Map<string,Health>();
const empty=():Health=>({successes:0,failures:0,consecutiveFailures:0,lastSuccessAt:null,lastFailureAt:null,lastLatencyMs:null});
export async function coalesceRequest<T>(key:string,fn:()=>Promise<T>):Promise<T>{const existing=inflight.get(key);if(existing)return existing as Promise<T>;const p=fn().finally(()=>inflight.delete(key));inflight.set(key,p);return p}
export function recordProviderResult(provider:string,ok:boolean,latencyMs:number){const h=health.get(provider)||empty(),now=new Date().toISOString();if(ok){h.successes++;h.consecutiveFailures=0;h.lastSuccessAt=now}else{h.failures++;h.consecutiveFailures++;h.lastFailureAt=now}h.lastLatencyMs=latencyMs;health.set(provider,h)}
export function providerHealthSnapshot(provider:string){const h=health.get(provider)||empty();return{provider,...h,status:h.consecutiveFailures>=3?"DEGRADED" as const:h.successes===0&&h.failures===0?"UNKNOWN" as const:"OPERATIONAL" as const}}
export function resetProviderResilienceForTests(){inflight.clear();health.clear()}
