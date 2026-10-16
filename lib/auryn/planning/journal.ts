import {PLANNING_POLICY_VERSION, type AllocationPlan, type PlanningEvidence} from './policy';
function freeze<T>(value:T):Readonly<T>{if(value&&typeof value==='object'){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;}
export type DecisionRecordInput={id:string;symbol:string;createdAt:string;thesis:string;horizon:string;evidence:PlanningEvidence;plan:AllocationPlan;preview:Record<string,unknown>;processChecklist:{evidenceReviewed:boolean;risksRecorded:boolean;budgetChecked:boolean}};
export function createDecisionRecord(input:DecisionRecordInput){
  if(!input.id||!input.symbol||!input.thesis.trim()||!input.horizon||!Number.isFinite(Date.parse(input.createdAt)))throw new Error('A decision needs an identity, original thesis, horizon and timestamp.');
  if(Number.isFinite(Date.parse(input.evidence.knownAt))&&Date.parse(input.evidence.knownAt)>Date.parse(input.createdAt))throw new Error('Original evidence cannot postdate the decision.');
  const copy=JSON.parse(JSON.stringify(input)) as DecisionRecordInput;
  return freeze({...copy,kind:'DECISION' as const,policyVersion:PLANNING_POLICY_VERSION,processScore:Object.values(copy.processChecklist).filter(Boolean).length/3*100,processScoreMeaning:'Checklist completeness, not investment outcome probability',immutable:true as const});
}
export type DecisionRecord=ReturnType<typeof createDecisionRecord>;
export function createReviewRecord(input:{id:string;decisionId:string;createdAt:string;outcome:'gain'|'loss'|'flat'|'pending';notes:string}){
  if(!input.id||!input.decisionId||!Number.isFinite(Date.parse(input.createdAt))||!input.notes.trim())throw new Error('A review needs its original decision, timestamp and notes.');
  return freeze({...input,kind:'REVIEW' as const});
}
export type ReviewRecord=ReturnType<typeof createReviewRecord>;
/** Server implementations must bind owner identity from auth, enforce append-only rows and RLS, and never accept an owner supplied by the browser. */
export interface PlanningJournalStore {scope:'authenticated';list(symbol:string):Promise<{decisions:DecisionRecord[];reviews:ReviewRecord[]}>;appendDecision(record:DecisionRecord):Promise<void>;appendReview(record:ReviewRecord):Promise<void>}
