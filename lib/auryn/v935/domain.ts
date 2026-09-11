export type CanonicalResearchState="READY"|"STALE_VERIFIED"|"ANALYSIS_REQUIRED";
export type CanonicalAction=string|null;
export interface CanonicalSecurityIdentity{
 symbol:string; assetType:"EQUITY"|"CRYPTO"|"UNKNOWN"; exchange:string|null; mic:string|null; currency:string|null;
}
export interface CanonicalResearchProjection{
 state:CanonicalResearchState; observedAt:string|null; decisionSnapshotId:string|null; fingerprint:string|null;
 action:CanonicalAction; ownerAction:CanonicalAction; longTermAction:CanonicalAction; setupState:string|null;
 decisionScore:number|null; evidenceCompleteness:number|null; marketIntelligenceSnapshotId:string|null;
 timeframes:any|null; actionMap:any|null; levels:any|null; thesisScore:number|null; opportunityScore:number|null; archetype:string|null;
}
export interface AurynCanonicalSnapshot{
 contract:"AURYN_V9_3_5_CANONICAL_SNAPSHOT"; version:"auryn-v9.3.5"; snapshotId:string; generatedAt:string;
 security:CanonicalSecurityIdentity; market:any|null; research:CanonicalResearchProjection; degraded:boolean; degradedReason:string|null;
}
