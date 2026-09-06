export type EvidenceScope="ANNUAL"|"QUARTER"|"TTM"|"POINT_IN_TIME"|"FORWARD";
export type EvidenceSource="SEC"|"ISSUER"|"PROVIDER"|"DERIVED";
export type EvidencePoint={key:string;value:number|string|null;period?:string|null;periodEnd?:string|null;filedAt?:string|null;scope:EvidenceScope;source:EvidenceSource;basis?:"GAAP"|"NON_GAAP"|"OTHER";freshness?:number|null;derivedFrom?:string[]};
export type EvidenceSet=Record<string,EvidencePoint[]>;
export const sourceRank=(s:EvidenceSource)=>s==="SEC"?4:s==="ISSUER"?3:s==="PROVIDER"?2:1;
export function evidenceCoverage(required:string[],set:EvidenceSet){if(!required.length)return 0;return Math.round(required.filter(k=>(set[k]||[]).some(x=>x.value!=null)).length/required.length*100)}
