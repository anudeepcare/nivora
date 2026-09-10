export const GOLDEN_AUDIT_SYMBOLS=['SPY','QQQ','IWM','AAPL','MSFT','NVDA','IREN','BE','ASTS','SAP','MU','NBIS','SKHY'];
export function finiteNumber(value){
  if(value===null||value===undefined||value==='')return null;
  const n=Number(value);return Number.isFinite(n)?n:null;
}
export function validConsensusScore(value){const n=finiteNumber(value);return n!=null&&n>=-100&&n<=100;}
export function selectAuditSymbols(universe,limit){
  const wanted=Math.max(1,Math.min(500,Number(limit)||30));
  const clean=(Array.isArray(universe)?universe:[]).map(x=>String(x||'').trim().toUpperCase()).filter(Boolean);
  return [...new Set([...GOLDEN_AUDIT_SYMBOLS,...clean])].slice(0,wanted);
}
export function comparablePriceGap(a,b,aSnapshotId,bSnapshotId,aAsOf,bAsOf,maxAgeMs=5000){
  const av=finiteNumber(a),bv=finiteNumber(b);if(av==null||bv==null)return null;
  if(aSnapshotId&&bSnapshotId&&aSnapshotId===bSnapshotId)return Math.abs(av-bv)/Math.max(Math.abs(av),Math.abs(bv),1e-12)*100;
  const at=Date.parse(String(aAsOf||'')),bt=Date.parse(String(bAsOf||''));
  if(Number.isFinite(at)&&Number.isFinite(bt)&&Math.abs(at-bt)<=maxAgeMs)return Math.abs(av-bv)/Math.max(Math.abs(av),Math.abs(bv),1e-12)*100;
  return null;
}
