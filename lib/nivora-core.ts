export type EvidenceStatus="fresh"|"cached"|"stale"|"missing"|"error";
export type Evidence={name:string;status:EvidenceStatus;ageSeconds?:number;provider?:string;weight:number;detail?:string};

export const clamp=(n:number,a=0,b=100)=>Math.max(a,Math.min(b,n));
export const score100=(n:any,f=50)=>Number.isFinite(Number(n))?clamp(Number(n)):f;

export function evidenceQuality(items:Evidence[]){
  const factor={fresh:1,cached:.92,stale:.55,missing:0,error:0};
  const den=items.reduce((a,x)=>a+x.weight,0)||1;
  const score=Math.round(items.reduce((a,x)=>a+x.weight*factor[x.status],0)/den*100);
  return {
    score,
    current:items.filter(x=>x.status==="fresh"||x.status==="cached").length,
    stale:items.filter(x=>x.status==="stale").length,
    unavailable:items.filter(x=>x.status==="missing"||x.status==="error").length,
    items
  };
}

export function marketRegime(market:any){
  const trend=score100(market?.scores?.trend);
  const momentum=score100(market?.scores?.momentum);
  const risk=score100(market?.scores?.risk,60);
  const structure=score100(market?.scores?.structure);
  const rel=String(market?.market?.relativeStrength||"").toLowerCase();
  let score=trend*.38+momentum*.22+structure*.18+(100-risk)*.17+(rel.includes("strong")?5:rel.includes("weak")?-5:0);
  score=clamp(score);
  const label=score>=70?"Risk-on / constructive":score>=56?"Constructive":score>=44?"Mixed":score>=30?"Defensive":"Risk-off";
  return {score:Math.round(score),label};
}

export function confidenceCalibration(raw:number,quality:number,contradictions:number){
  // Confidence cannot outrun evidence quality; disagreement reduces certainty.
  return Math.round(clamp(Math.min(raw,quality+6)-contradictions*3));
}

export function decisionFingerprint(payload:any){
  // Deterministic lightweight browser/server-safe fingerprint; not cryptographic security.
  const s=JSON.stringify(payload,Object.keys(payload).sort());
  let h=2166136261;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
  return `nv-${(h>>>0).toString(16).padStart(8,"0")}`;
}
