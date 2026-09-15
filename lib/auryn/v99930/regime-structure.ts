const n=(x:any)=>Number.isFinite(Number(x))?Number(x):null;
export const MAX_ACTIVE_DISTANCE=.65; // actionable structural level may not be >65% away from current
export const MAX_ANCHOR_RANGE_MULTIPLE=4.0; // active swing range relative to current


const wmaLocal=(a:number[],p:number)=>{if(a.length<p)return null;const x=a.slice(-p),d=p*(p+1)/2;return x.reduce((s,v,i)=>s+v*(i+1),0)/d};
export function rebuildRecentRegime(r:any,current:number,recentWeeks=52){
 const weekly=Array.isArray(r?.weeklyBars)?r.weeklyBars.slice(-recentWeeks):[];
 if(weekly.length<20)return null;
 const highs:number[]=weekly.map((b:any)=>n(b.high)).filter((x:number|null):x is number=>x!=null);
 const lows:number[]=weekly.map((b:any)=>n(b.low)).filter((x:number|null):x is number=>x!=null);
 const closes:number[]=weekly.map((b:any)=>n(b.close)).filter((x:number|null):x is number=>x!=null);
 if(!highs.length||!lows.length||closes.length<20)return null;
 const swingHigh=Math.max(...highs),swingLow=Math.min(...lows),range=swingHigh-swingLow;
 if(range<=0||range/current>1.5)return null;
 const fib50=swingHigh-range*.5,fib618=swingHigh-range*.618,fib786=swingHigh-range*.786;
 const wma20=wmaLocal(closes,20),wma50=wmaLocal(closes,Math.min(50,closes.length));
 const entryLow=Math.min(fib618,fib50),entryHigh=Math.max(fib618,fib50);
 const invalidation=Math.min(swingLow,fib786),confirm=Math.max(entryHigh,wma50??entryHigh);
 const score=Math.round(Math.max(0,Math.min(100,50+(current>(wma20??current)?8:-8)+(current>(wma50??current)?10:-10)+(current>=entryLow&&current<=entryHigh?8:0))));
 return{...r,state:score>=62?"ACCUMULATION":score>=45?"NEUTRAL":"DEFENSIVE",score,swingHigh,swingLow,fib50,fib618,fib786,entryLow,entryHigh,support:fib786,invalidation,confirm,priorHigh:swingHigh,wma20,wma50,regimeSource:"RECENT_REGIME",anchorWeeks:weekly.length};
}

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
 if(!anchorValidated){
  const rebuilt=rebuildRecentRegime(r,current,52);
  if(rebuilt&&n(rebuilt.invalidation)!=null&&Number(rebuilt.invalidation)<current){
   return{state:"VALID",activeRegime:rebuilt,historicalContext,contextOnly:true,anchorValidated:true,extensionsAllowed:false,thesisBreakBelowCurrent:true,reclaimAboveCurrent:n(rebuilt.confirm)!=null&&Number(rebuilt.confirm)>current,reason:"Active structure rebuilt from the most recent comparable weekly regime."};
  }
  return{state:"REGIME_REBUILDING",activeRegime:null,historicalContext,contextOnly:true,anchorValidated:false,extensionsAllowed:false,thesisBreakBelowCurrent,reclaimAboveCurrent,reason:"Historical price regime is not comparable with the current structure. AURYN is selecting a valid weekly anchor."};
 }
 const activeRegime={...r,invalidation:n(r.invalidation),confirm:n(r.confirm),support:n(r.support),entryLow:n(r.entryLow),entryHigh:n(r.entryHigh)};
 const extensionsAllowed=Boolean(anchorValidated&&reclaimAboveCurrent&&dist(r.priorHigh)<=1.5);
 return{state:"VALID",activeRegime,historicalContext,contextOnly:false,anchorValidated:true,extensionsAllowed,thesisBreakBelowCurrent,reclaimAboveCurrent,reason:null};
}
