import type {Quote} from './types';
export type PriceTick={symbol:string;price:number;asOf:string;session:string;changePct:number|null};
export function streamTicker(symbol:string){return symbol.includes('/')?symbol.replace('/','-'):symbol.replaceAll('.','-');}
export function normalizePriceTick(raw:unknown,market:'us'|'crypto',allowed:ReadonlySet<string>,now=Date.now()):PriceTick|null{
 if(!raw||typeof raw!=='object')return null;
 const r=raw as Record<string,unknown>,wire=String(r.s??''),symbol=market==='crypto'?wire.replace('-','/'):wire;
 // Match subscribed spelling, including US class-share dots versus feed dashes.
 const canonical=[...allowed].find(s=>s===symbol||streamTicker(s)===wire);
 const price=typeof r.p==='string'&&r.p.trim()?Number(r.p):r.p,stamp=Number(r.t);
 if(!canonical||typeof price!=='number'||!Number.isFinite(price)||price<=0||!Number.isFinite(stamp)||stamp>now+10000||now-stamp>120000)return null;
 let session='Live · continuous';
 if(market==='us'){
  if(!['open','extended-hours'].includes(String(r.ms)))return null;
  if(r.ms==='open')session='Live · regular session';
  else{const hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',hourCycle:'h23'}).format(stamp));session=hour<12?'Live · premarket':'Live · after-hours';}
 }
 const change=market==='crypto'&&r.dc!==undefined?Number(r.dc):null;
 return {symbol:canonical,price,asOf:new Date(stamp).toISOString(),session,changePct:change!=null&&Number.isFinite(change)?change:null};
}
export function mergePriceTick(base:Quote|undefined,tick:PriceTick,now=Date.now()):Quote|undefined{
 if(!base||base.currency!=='USD'||Date.parse(tick.asOf)<Date.parse(base.asOf||'')||now-Date.parse(tick.asOf)>120000)return base;
 const day=(s:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(s));
 const previous=base.previousClose;
 const sameDay=base.asOf&&day(base.asOf)===day(tick.asOf);
 return {...base,price:tick.price,asOf:tick.asOf,stale:false,session:tick.session,source:'EODHD · streaming venue trades',changePct:tick.symbol.includes('/')?tick.changePct:sameDay&&previous!=null&&previous>0?(tick.price/previous-1)*100:null};
}
