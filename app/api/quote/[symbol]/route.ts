import {NextResponse} from "next/server";
import {loadCanonicalMarketSnapshot} from "@/lib/auryn/market-data-gateway";
import {rateLimitDistributed,requestKey} from "@/lib/rate-limit";

export const dynamic="force-dynamic";

export async function GET(req:Request,{params}:{params:Promise<{symbol:string}>}){
 const rl=await rateLimitDistributed(`quote:${requestKey(req)}`,180,60_000);
 if(!rl.ok)return NextResponse.json({error:"Too many quote requests."},{status:429,headers:{"Retry-After":"30"}});
 const {symbol:raw}=await params;const symbol=decodeURIComponent(raw).toUpperCase();
 const twelveKey=process.env.TWELVE_DATA_API_KEY||"",alpacaKey=process.env.ALPACA_PAPER_API_KEY||"",alpacaSecret=process.env.ALPACA_PAPER_API_SECRET||"";
 if(!twelveKey&&!alpacaKey)return NextResponse.json({error:"No live quote provider is configured."},{status:503});
 const {snapshot,displayQuote}=await loadCanonicalMarketSnapshot({symbol,twelveKey,alpacaKey,alpacaSecret,asOf:new Date()});
 return NextResponse.json({...snapshot,price:snapshot.displayPrice,change:displayQuote.change,changePct:displayQuote.changePct,isExtendedHours:snapshot.session==="PRE_MARKET"||snapshot.session==="AFTER_HOURS",providerTimestamp:displayQuote.providerTimestamp,ageSeconds:displayQuote.ageSeconds,freshness:displayQuote.freshness,provider:displayQuote.provider,isRealTime:snapshot.priceState==="LIVE_VERIFIED"||snapshot.priceState==="LIVE_SINGLE_SOURCE",bid:displayQuote.bid,ask:displayQuote.ask,spreadPct:displayQuote.spreadPct,integrityState:snapshot.priceState,integrityReason:snapshot.reason,integrityTradable:snapshot.executionTradable,executionTradable:snapshot.executionTradable,priceSensitiveAllowed:snapshot.priceSensitiveAllowed,decisionAllowed:snapshot.decisionAllowed,disagreementPct:snapshot.providerAgreementPct},{headers:{"Cache-Control":"private, no-store, max-age=0"}});
}
