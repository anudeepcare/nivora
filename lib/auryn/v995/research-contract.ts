export type ResearchState="RESEARCH_READY"|"TEMPORARY_PROVIDER_FAILURE"|"INSUFFICIENT_EVIDENCE";
export function classifyResearchFailure(x:any):Exclude<ResearchState,"RESEARCH_READY">{const s=Number(x?.status||0),c=String(x?.code||"").toUpperCase();return s===429||s>=500||c.includes("RATE_LIMIT")||c.includes("TEMPORARY")||c.includes("TIMEOUT")?"TEMPORARY_PROVIDER_FAILURE":"INSUFFICIENT_EVIDENCE"}
export function validateResearchDecision(d:any){
 const score=typeof d?.decisionScore==='number'&&Number.isFinite(d.decisionScore)&&d.decisionScore>=0&&d.decisionScore<=100;
 const abstention=d?.decisionScore===null&&d?.newMoneyAction==='WAIT'&&d?.longTermAction==='UNASSESSED'&&d?.evidenceCompleteness===0;
 const coverage=typeof d?.evidenceCompleteness==='number'&&Number.isFinite(d.evidenceCompleteness)&&d.evidenceCompleteness>=0&&d.evidenceCompleteness<=100;
 return Boolean(d?.snapshotId&&['STRONG_BUY','BUY','START_SMALL','WAIT','AVOID'].includes(d.newMoneyAction)&&['ADD','HOLD','WATCH','REDUCE','EXIT'].includes(d.ownerAction)&&['ATTRACTIVE','SELECTIVE','UNATTRACTIVE','UNASSESSED'].includes(d.longTermAction)&&(score||abstention)&&coverage&&d?.setupState);
}
