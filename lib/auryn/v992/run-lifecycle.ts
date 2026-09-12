export type RunStatus="PENDING"|"RUNNING"|"PASS"|"FAIL"|"FAILED"|"CANCELLED"|string;
export function canResumeRun(status:RunStatus){return status==="PENDING"||status==="RUNNING"}
export function nextRunAttempt(rows:Array<{attempt?:number|null}>){return Math.max(0,...rows.map(x=>Number(x.attempt||0)))+1}
export function runIdentityKey(kind:string,date:string,modelVersion:string,attempt:number){return `auryn-v992:${kind}:${date}:${modelVersion}:attempt-${String(attempt).padStart(3,"0")}`}
export function jobAttemptIdempotencyKey(kind:string,date:string,modelVersion:string,attempt:number,batch:number){return `${runIdentityKey(kind,date,modelVersion,attempt)}:batch-${String(batch).padStart(3,"0")}`}
