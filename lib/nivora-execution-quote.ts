import {marketSessionAt,quoteFreshness,type MarketSession,type QuoteFreshness} from "./nivora-market-session";
export type ExecutionQuote={symbol:string;price:number;bid:number|null;ask:number|null;spreadPct:number|null;providerTimestamp:string|null;ageSeconds:number|null;session:MarketSession;freshness:QuoteFreshness;provider:"alpaca"|"twelvedata";isRealTime:boolean};
const n=(v:any)=>{const x=Number(v);return Number.isFinite(x)?x:null};
export function normalizeAlpacaQuote(symbol:string,quoteRaw:any,tradeRaw:any,asOf=new Date()):ExecutionQuote{
 const q=quoteRaw?.quote||quoteRaw||{},t=tradeRaw?.trade||tradeRaw||{},bid=n(q.bp??q.bid_price),ask=n(q.ap??q.ask_price),trade=n(t.p??t.price);
 const price=trade??(bid!=null&&ask!=null?(bid+ask)/2:ask??bid??0),stamp=String(t.t??q.t??t.timestamp??q.timestamp??"")||null;
 const d=stamp?new Date(stamp):null,ageSeconds=d&&Number.isFinite(d.getTime())?Math.max(0,Math.round((asOf.getTime()-d.getTime())/1000)):null;
 const session=marketSessionAt(asOf),freshness=quoteFreshness(ageSeconds??Infinity,session),mid=bid!=null&&ask!=null?(bid+ask)/2:null,spreadPct=mid&&mid>0?+(((ask!-bid!)/mid)*100).toFixed(4):null;
 return{symbol:symbol.toUpperCase(),price,bid,ask,spreadPct,providerTimestamp:d&&Number.isFinite(d.getTime())?d.toISOString():null,ageSeconds,session,freshness,provider:"alpaca",isRealTime:freshness==="LIVE"};
}
