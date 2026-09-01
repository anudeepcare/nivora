import type {TodayDecision} from "./nivora-today";
import type {NivoraLiveQuote} from "./nivora-live-quote";
import {TODAY_POLICY_VERSION} from "./nivora-version";

export function applyLiveQuoteToToday(today:TodayDecision|undefined,quote:NivoraLiveQuote|null,owns:boolean):TodayDecision|undefined{
 if(!today)return undefined;
 if(!quote)return today;

 if(quote.integrityTradable===false&&(today.action==="BUY"||today.action==="ADD")){
  return{...today,action:owns?"HOLD":"WAIT",blocked:false,reason:`Market-data integrity is ${quote.integrityState||"not verified"}. NIVORA will not add risk until a fresh trustworthy quote is available.`,policyVersion:TODAY_POLICY_VERSION};
 }

 if(quote.freshness!=="LIVE"&&(today.action==="BUY"||today.action==="ADD")){
  return{...today,action:owns?"HOLD":"WAIT",blocked:false,reason:"The current quote is stale or last-trade context. NIVORA requires a fresh quote before adding risk.",policyVersion:TODAY_POLICY_VERSION};
 }

 if(quote.freshness!=="LIVE")return{...today,policyVersion:TODAY_POLICY_VERSION};

 const extended=quote.session==="PRE_MARKET"||quote.session==="AFTER_HOURS";
 const gap=Math.abs(Number(quote.changePct||0));
 if(extended&&gap>=8&&(today.action==="BUY"||today.action==="ADD")){
  return{...today,action:owns?"HOLD":"WAIT",blocked:false,reason:`Extended-hours move is ${quote.changePct!>=0?"+":""}${quote.changePct?.toFixed(1)}%. NIVORA will not chase a large gap before regular-session liquidity confirms the price.`,policyVersion:TODAY_POLICY_VERSION};
 }
 return{...today,policyVersion:TODAY_POLICY_VERSION};
}
