/** Presentation boundary: missing quotes and non-USD cash must never become USD market value. */
export function positivePrice(value:unknown):number|null { if(value==null||(typeof value!=='string'&&typeof value!=='number')||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)&&n>0?n:null; }
function nonnegativeNumber(value:unknown):number|null {if(value==null||(typeof value!=='string'&&typeof value!=='number')||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)&&n>=0?n:null;}
export function positionValue(row:any,market:any):number|null {
 const quantity=nonnegativeNumber(row.shares);if(quantity==null)return null;
 if(row.asset_type==='CASH')return String(row.currency||row.symbol).toUpperCase()==='USD'?quantity:null;
 if(market?.currency&&String(market.currency).toUpperCase()!=='USD')return null;
 const price=positivePrice(market?.displayPrice),value=price==null?null:quantity*price;return value!=null&&Number.isFinite(value)?value:null;
}
export function valuationSummary(rows:any[],quotes:Record<string,any>){let knownValue=0,unrealized:number|null=null,missing=0,missingCost=0;for(const row of rows){const value=positionValue(row,quotes[row.symbol]?.market);if(value==null){missing++;continue}knownValue+=value;const cost=nonnegativeNumber(row.avg_cost);if(row.asset_type!=='CASH'&&cost==null)missingCost++;if(row.asset_type!=='CASH'&&cost!=null)unrealized=(unrealized??0)+value-Number(row.shares)*cost;}return{knownValue,unrealized,missing,missingCost,totalValue:missing?null:knownValue};}
export function validPosition(quantity:unknown,cost:unknown){return positivePrice(quantity)!==null&&nonnegativeNumber(cost)!==null;}

/** Retained research may be useful history, but only READY evidence supplies current calls. */
export function currentResearch(research:any){
 const ready=research?.state==='READY';
 return {...research,action:ready?research.action:null,ownerAction:ready?research.ownerAction:null,
  longTermAction:ready?research.longTermAction:null,setupState:ready?research.setupState:null,
  thesisScore:ready?research.thesisScore:null,
  warning:research?.state==='STALE_VERIFIED'?'Research is stale — refresh analysis before using this call.':ready?'':'Current research is unavailable. Open research to refresh the evidence.'};
}
