/** Presentation boundary: missing quotes and non-USD cash must never become USD market value. */
export function positivePrice(value:unknown):number|null { if(value==null||value==='')return null;const n=Number(value);return Number.isFinite(n)&&n>0?n:null; }
export function positionValue(row:any,market:any):number|null {if(row.asset_type==='CASH')return String(row.currency||row.symbol).toUpperCase()==='USD'?Number(row.shares):null;const price=positivePrice(market?.displayPrice);return price==null?null:Number(row.shares)*price;}
export function valuationSummary(rows:any[],quotes:Record<string,any>){let knownValue=0,unrealized=0,missing=0;for(const row of rows){const value=positionValue(row,quotes[row.symbol]?.market);if(value==null){missing++;continue}knownValue+=value;if(row.asset_type!=='CASH')unrealized+=value-Number(row.shares)*Number(row.avg_cost);}return{knownValue,unrealized,missing,totalValue:missing?null:knownValue};}
export function validPosition(quantity:unknown,cost:unknown){return String(quantity).trim()!==''&&String(cost).trim()!==''&&Number.isFinite(Number(quantity))&&Number(quantity)>0&&Number.isFinite(Number(cost))&&Number(cost)>=0;}

/** Retained research may be useful history, but only READY evidence supplies current calls. */
export function currentResearch(research:any){
 const ready=research?.state==='READY';
 return {...research,action:ready?research.action:null,ownerAction:ready?research.ownerAction:null,
  longTermAction:ready?research.longTermAction:null,setupState:ready?research.setupState:null,
  thesisScore:ready?research.thesisScore:null,
  warning:research?.state==='STALE_VERIFIED'?'Research is stale — refresh analysis before using this call.':ready?'':'Current research is unavailable. Open research to refresh the evidence.'};
}
