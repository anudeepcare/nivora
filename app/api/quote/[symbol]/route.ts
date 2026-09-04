import {NextResponse} from "next/server";
import {normalizeTwelveQuote} from "@/lib/nivora-live-quote";
import {AlpacaPaperBroker} from "@/lib/alpaca-paper";
import {loadTradingMarketData} from "@/lib/nivora-trading-market-data";
import {rateLimitDistributed,requestKey} from "@/lib/rate-limit";

export const dynamic="force-dynamic";

export async function GET(req:Request,{params}:{params:Promise<{symbol:string}>}){
  const rl=await rateLimitDistributed(`quote:${requestKey(req)}`,180,60_000);
  if(!rl.ok)return NextResponse.json({error:"Too many quote requests."},{status:429,headers:{"Retry-After":"30"}});

  const {symbol:raw}=await params;
  const symbol=decodeURIComponent(raw).toUpperCase();
  const twelveKey=process.env.TWELVE_DATA_API_KEY||"";
  const alpacaKey=process.env.ALPACA_PAPER_API_KEY||"";
  const alpacaSecret=process.env.ALPACA_PAPER_API_SECRET||"";
  if(!twelveKey&&!alpacaKey)return NextResponse.json({error:"No live quote provider is configured."},{status:503});

  const broker=alpacaKey&&alpacaSecret?new AlpacaPaperBroker(alpacaKey,alpacaSecret):null;
  const asOf=new Date();
  const market=await loadTradingMarketData(symbol,broker,twelveKey,asOf);
  const {integrity}=market,chosen=integrity.chosen;
  if(!chosen)return NextResponse.json({error:integrity.state==="DISAGREEMENT"?"Price unverified — providers disagree.":"Live quote providers returned no usable price.",integrityState:integrity.state,integrityReason:integrity.reason,disagreementPct:integrity.disagreementPct,integrityTradable:false},{status:502,headers:{"Cache-Control":"private, no-store, max-age=0"}});

  const twelveDisplay=market.twelveRaw?normalizeTwelveQuote(market.twelveRaw,asOf):null;
  return NextResponse.json({
    symbol,
    price:chosen.price,
    regularClose:twelveDisplay?.regularClose??null,
    change:twelveDisplay?.change??null,
    changePct:chosen.changePct??twelveDisplay?.changePct??null,
    session:chosen.session,
    isExtendedHours:chosen.session==="PRE_MARKET"||chosen.session==="AFTER_HOURS",
    providerTimestamp:chosen.providerTimestamp,
    ageSeconds:chosen.ageSeconds,
    freshness:chosen.freshness,
    provider:chosen.provider,
    isRealTime:chosen.freshness==="LIVE",
    bid:chosen.bid,
    ask:chosen.ask,
    spreadPct:chosen.spreadPct,
    integrityState:integrity.state,
    integrityReason:integrity.reason,
    integrityTradable:integrity.tradable,
    disagreementPct:integrity.disagreementPct,
    sources:[market.alpaca,market.twelve].filter(Boolean).map(q=>({provider:q!.provider,price:q!.price,ageSeconds:q!.ageSeconds,freshness:q!.freshness}))
  },{headers:{"Cache-Control":"private, no-store, max-age=0"}});
}
