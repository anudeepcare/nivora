export const V935_CANONICAL_CONTRACT="AURYN_V9_3_5_CANONICAL_SNAPSHOT" as const;
export const V935_CANONICAL_VERSION="auryn-v9.3.5" as const;
function hashText(s:string){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h.toString(36)}
export function buildV935Provenance(input:{symbol:string;marketSnapshotId?:string|null;researchSnapshotId?:string|null;fingerprint?:string|null;generatedAt?:string}){
 const symbol=String(input.symbol||"").trim().toUpperCase();
 const basis=JSON.stringify({symbol,market:input.marketSnapshotId??null,research:input.researchSnapshotId??input.fingerprint??null});
 return{contract:V935_CANONICAL_CONTRACT,version:V935_CANONICAL_VERSION,snapshotId:`${symbol}-v935-${hashText(basis)}`,generatedAt:input.generatedAt||new Date().toISOString(),marketSnapshotId:input.marketSnapshotId??null,researchSnapshotId:input.researchSnapshotId??null};
}
