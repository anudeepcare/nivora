const n=(x:any)=>Number.isFinite(Number(x))?Number(x):null;
export const MAX_ACTIVE_DISTANCE=.65; // actionable structural level may not be >65% away from current
export const MAX_ANCHOR_RANGE_MULTIPLE=4.0; // active swing range relative to current

export function validateRegimeStructure(r:any,currentInput:any){
 const current=n(currentInput);
 if(current==null||!r||r.state==="BUILDING")return{state:"REGIME_REBUILDING",activeRegime:null,historicalContext:null,contextOnly:true,anchorValidated:false,extensionsAllowed:false,reason:"Current comparable price regime is still building."};
 const histHigh=n(r.swingHigh),histLow=n(r.swingLow),range=histHigh!=null&&histLow!=null?histHigh-histLow:null;
 const anchorRangeOk=range!=null&&range>0&&range/current<=MAX_ANCHOR_RANGE_MULTIPLE;
 const dist=(x:any)=>{const z=n(x);return z==null?Infinity:Math.abs(z-current)/current};
 const thesisBreakBelowCurrent=n(r.invalidation)!=null&&Number(r.invalidation)<current;
 const reclaimAboveCurrent=n(r.confirm)!=null&&Number(r.confirm)>current;
 const coreNear=[r.fib618,r.fib786,r.wma50,r.weeklyHma,r.support].filter((x:any)=>n(x)!=null&&dist(x)<=MAX_ACTIVE_DISTANCE);
 const anchorValidated=Boolean(anchorRangeOk&&coreNear.length>=2&&thesisBreakBelowCurrent);
 const historicalContext={swingHigh:histHigh,swingLow:histLow,priorHigh:n(r.priorHigh),contextOnly:!anchorValidated};
 if(!anchorValidated)return{state:"REGIME_REBUILDING",activeRegime:null,historicalContext,contextOnly:true,anchorValidated:false,extensionsAllowed:false,thesisBreakBelowCurrent,reclaimAboveCurrent,reason:"Historical price regime is not comparable with the current structure. AURYN is selecting a valid weekly anchor."};
 const activeRegime={...r,invalidation:n(r.invalidation),confirm:n(r.confirm),support:n(r.support),entryLow:n(r.entryLow),entryHigh:n(r.entryHigh)};
 const extensionsAllowed=Boolean(anchorValidated&&reclaimAboveCurrent&&dist(r.priorHigh)<=1.5);
 return{state:"VALID",activeRegime,historicalContext,contextOnly:false,anchorValidated:true,extensionsAllowed,thesisBreakBelowCurrent,reclaimAboveCurrent,reason:null};
}
