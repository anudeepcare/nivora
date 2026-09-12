export const PROVIDER_CALLS_PER_MINUTE=55;
export const BACKGROUND_CALLS_PER_MINUTE=42;
export type ValidationRunKind="PREMARKET"|"DAILY_CLOSE"|"AFTER_HOURS"|"NIGHTLY"|"WEEKLY";
export function retryDelaySeconds(attempt:number){return Math.min(900,30*(2**Math.max(0,attempt)))}
export function jobIdempotencyKey(kind:ValidationRunKind,date:string,batch:number){return `auryn-v99:${kind}:${date}:batch-${String(batch).padStart(3,"0")}`}
export function chunkSymbols(symbols:string[],size=10){const out:string[][]=[];for(let i=0;i<symbols.length;i+=size)out.push(symbols.slice(i,i+size));return out}
