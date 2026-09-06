import{EvidencePoint,sourceRank}from"./evidence";
export function resolveEvidence(points:EvidencePoint[]){
 const usable=points.filter(x=>x.value!=null);
 if(!usable.length)return{point:null,conflict:false,warnings:["Evidence unavailable."]};
 const ordered=[...usable].sort((a,b)=>sourceRank(b.source)-sourceRank(a.source)||String(b.filedAt||"").localeCompare(String(a.filedAt||"")));
 const best=ordered[0],same=ordered.filter(x=>x.scope===best.scope&&x.periodEnd===best.periodEnd);
 const conflict=same.some(x=>String(x.value)!==String(best.value));
 return{point:best,conflict,warnings:conflict?["Conflicting same-period evidence detected; higher-authority source selected."]:[]};
}
