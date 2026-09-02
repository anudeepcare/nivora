
export type PortableTradeTicketInput={
 symbol:string;action:string;entryLow:number;entryHigh:number;invalidation:number;
 target1:number;target2:number;horizon:string;shares:number|null;engineVersion:string;
 evidenceFingerprint:string;
};
export type PortableTradeTicket={
 status:"PLAN"|"NO_ORDER";symbol:string;action:string;side:"BUY"|"SELL"|null;
 quantity:number|null;orderType:"LIMIT"|null;limitPrice:number|null;entryRange:[number,number]|null;
 invalidation:number|null;targets:number[];horizon:string;engineVersion:string;evidenceFingerprint:string;
 disclaimer:string;
};
export function buildPortableTradeTicket(x:PortableTradeTicketInput):PortableTradeTicket{
 const action=String(x.action||"").toUpperCase();
 const buy=action==="BUY"||action==="ADD"||action==="ACCUMULATE"||action==="STRONG BUY";
 const sell=action==="SELL"||action==="TRIM"||action==="REDUCE"||action==="EXIT / REASSESS";
 if(!buy&&!sell)return{status:"NO_ORDER",symbol:x.symbol.toUpperCase(),action,side:null,quantity:null,orderType:null,limitPrice:null,entryRange:null,invalidation:null,targets:[],horizon:x.horizon,engineVersion:x.engineVersion,evidenceFingerprint:x.evidenceFingerprint,disclaimer:"This is not an executed order. NIVORA produced no actionable order state."};
 const low=Math.min(x.entryLow,x.entryHigh),high=Math.max(x.entryLow,x.entryHigh);
 const qty=x.shares!=null&&Number.isFinite(x.shares)&&x.shares>0?Math.floor(x.shares):null;
 return{
  status:"PLAN",symbol:x.symbol.toUpperCase(),action,side:buy?"BUY":"SELL",quantity:qty,orderType:"LIMIT",
  limitPrice:+(buy?high:low).toFixed(2),entryRange:[+low.toFixed(2),+high.toFixed(2)],
  invalidation:Number.isFinite(x.invalidation)&&x.invalidation>0?+x.invalidation.toFixed(2):null,
  targets:[x.target1,x.target2].filter(v=>Number.isFinite(v)&&v>0).map(v=>+v.toFixed(2)),
  horizon:x.horizon,engineVersion:x.engineVersion,evidenceFingerprint:x.evidenceFingerprint,
  disclaimer:"This is a broker-neutral research plan, not an executed order or confirmation of execution."
 };
}
