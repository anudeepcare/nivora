import type {TodayDecision} from "./nivora-today";import type {NivoraLiveQuote} from "./nivora-live-quote";
export function applyLiveQuoteToToday(today:TodayDecision|undefined,quote:NivoraLiveQuote|null,owns:boolean):TodayDecision|undefined{
 if(!today)return undefined;
 if(!quote||quote.freshness!=="LIVE")return today;
 const extended=quote.session==="PRE_MARKET"||quote.session==="AFTER_HOURS";
 const gap=Math.abs(Number(quote.changePct||0));
 if(extended&&gap>=8&&(today.action==="BUY"||today.action==="ADD"))return{...today,action:owns?"HOLD":"WAIT",blocked:false,reason:`Extended-hours move is ${quote.changePct!>=0?"+":""}${quote.changePct?.toFixed(1)}%. NIVORA will not chase a large gap before regular-session liquidity confirms the price.`,policyVersion:"v60-live-today-1"};
 return{...today,policyVersion:"v60-live-today-1"};
}
