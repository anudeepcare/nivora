const n=(v:any)=>{const x=Number(v);return Number.isFinite(x)?x:null};
export function extractShadowDecision(snap:any){
 const r=snap?.research||{};
 return {newMoney:r.action??null,owner:r.ownerAction??null,longTerm:r.longTermAction??null,decisionScore:n(r.decisionScore),evidenceCompleteness:n(r.evidenceCompleteness),setupState:r.setupState??null,evidenceFingerprint:String(r.fingerprint||snap?.snapshotId||"")};
}
export function assertShadowDecisionReady(snap:any){
 const d=extractShadowDecision(snap),state=String(snap?.research?.state||"");
 if(state!=="READY"||!d.newMoney||!d.owner||!d.longTerm||d.decisionScore==null||d.evidenceCompleteness==null||!d.setupState)
   throw new Error(`CANONICAL_DECISION_NOT_READY:${state||"UNKNOWN"}`);
 return d;
}
