
export type DisplaySession="PRE_MARKET"|"REGULAR"|"AFTER_HOURS"|"OVERNIGHT"|"CLOSED"|"CRYPTO_24X7";
export type DisplayLabel="PRE-MARKET PRICE"|"LIVE MARKET PRICE"|"AFTER-HOURS PRICE"|"LAST OFFICIAL CLOSE"|"PRICE VERIFYING";
export type DisplayFreshness="LIVE"|"RECENT"|"STALE"|"VERIFYING";
export type DisplayConfidence="VERIFIED"|"SINGLE_SOURCE"|"CONTESTED";
export type MarketPriceCandidate={
 symbol:string;price:number;provider:string;providerTimestamp:string|null;retrievedAt:string;
 session:DisplaySession;freshness:string;kind?:"TRADE"|"QUOTE_MID"|"CLOSE";
};
export type MarketDisplayQuote={
 symbol:string;price:number|null;session:DisplaySession;label:DisplayLabel;asOf:string|null;source:string|null;
 freshness:DisplayFreshness;confidence:DisplayConfidence;providerAgreementPct:number|null;reason:string;
};
const n=(v:unknown)=>{const x=Number(v);return Number.isFinite(x)&&x>0?x:null};
const ms=(v:string|null|undefined)=>{if(!v)return NaN;const x=new Date(v).getTime();return Number.isFinite(x)?x:NaN};
const maxAgeSeconds=(session:DisplaySession)=>session==="REGULAR"?180:(session==="PRE_MARKET"||session==="AFTER_HOURS"||session==="CRYPTO_24X7"?300:900);
const labelFor=(session:DisplaySession):DisplayLabel=>session==="REGULAR"?"LIVE MARKET PRICE":session==="PRE_MARKET"?"PRE-MARKET PRICE":session==="AFTER_HOURS"?"AFTER-HOURS PRICE":session==="CRYPTO_24X7"?"LIVE MARKET PRICE":"LAST OFFICIAL CLOSE";

export function selectMarketDisplayQuote(input:{
 symbol:string;session:DisplaySession;asOf:string;candidates?:MarketPriceCandidate[];
 officialClose?:{price:number;asOf:string;source:string}|null;maxDisagreementPct?:number
}):MarketDisplayQuote{
 const symbol=String(input.symbol||"").toUpperCase(),now=ms(input.asOf),limit=input.maxDisagreementPct??1.5;
 if(input.session==="OVERNIGHT"||input.session==="CLOSED"){
   const p=n(input.officialClose?.price);
   if(p!=null&&Number.isFinite(ms(input.officialClose?.asOf)))return{symbol,price:p,session:input.session,label:"LAST OFFICIAL CLOSE",asOf:input.officialClose!.asOf,source:input.officialClose!.source,freshness:"RECENT",confidence:"VERIFIED",providerAgreementPct:null,reason:"Market closed; displaying the last official close."};
 }
 const valid=(input.candidates||[]).filter(c=>{
   if(String(c.symbol||"").toUpperCase()!==symbol||n(c.price)==null||c.session!==input.session)return false;
   const t=ms(c.providerTimestamp);if(!Number.isFinite(t)||!Number.isFinite(now)||t>now+5000)return false;
   const age=(now-t)/1000;return age>=0&&age<=maxAgeSeconds(input.session)&&c.freshness!=="STALE";
 }).sort((a,b)=>ms(b.providerTimestamp)-ms(a.providerTimestamp));
 if(!valid.length)return{symbol,price:null,session:input.session,label:"PRICE VERIFYING",asOf:null,source:null,freshness:"VERIFYING",confidence:"CONTESTED",providerAgreementPct:null,reason:"No sufficiently fresh session-appropriate market price is available."};
 if(valid.length===1){const q=valid[0];return{symbol,price:Number(q.price),session:input.session,label:labelFor(input.session),asOf:q.providerTimestamp,source:q.provider,freshness:"LIVE",confidence:"SINGLE_SOURCE",providerAgreementPct:null,reason:"One fresh provider is available."};}
 const a=valid[0],b=valid[1],mid=(Number(a.price)+Number(b.price))/2,gap=mid>0?Math.abs(Number(a.price)-Number(b.price))/mid*100:null;
 if(gap!=null&&gap>limit)return{symbol,price:null,session:input.session,label:"PRICE VERIFYING",asOf:null,source:null,freshness:"VERIFYING",confidence:"CONTESTED",providerAgreementPct:gap,reason:`Fresh providers disagree by ${gap.toFixed(2)}%.`};
 return{symbol,price:Number(a.price),session:input.session,label:labelFor(input.session),asOf:a.providerTimestamp,source:a.provider,freshness:"LIVE",confidence:"VERIFIED",providerAgreementPct:gap,reason:"Fresh providers agree; newest timestamp selected."};
}
