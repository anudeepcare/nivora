export type PaperInvalidationSource="decision-risk-zone"|"evidence-invalidation"|"evidence-major-support"|"none";
export type PaperInvalidationResult={value:number|null;source:PaperInvalidationSource};

const validBelow=(x:unknown,entry:number)=>{
 const n=Number(x);
 return Number.isFinite(n)&&n>0&&n<entry?n:null;
};

/**
 * Resolve a reproducible downside reference for PAPER position sizing.
 * This never invents a percentage stop: it only consumes technical levels
 * that were already frozen with the NIVORA decision/evidence.
 */
export function resolvePaperInvalidation({entry,decision,evidence}:{entry:number;decision:any;evidence?:any}):PaperInvalidationResult{
 if(!Number.isFinite(entry)||entry<=0)return{value:null,source:"none"};
 const risk=Array.isArray(decision?.zones)?decision.zones.find((z:any)=>z?.kind==="risk"):null;
 const fromDecision=validBelow(risk?.low,entry);
 if(fromDecision!=null)return{value:fromDecision,source:"decision-risk-zone"};
 const fromEvidence=validBelow(evidence?.levels?.invalidation,entry);
 if(fromEvidence!=null)return{value:fromEvidence,source:"evidence-invalidation"};
 const majorSupport=validBelow(evidence?.levels?.majorSupport,entry);
 if(majorSupport!=null)return{value:majorSupport,source:"evidence-major-support"};
 return{value:null,source:"none"};
}
