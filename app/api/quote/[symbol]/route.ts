import {NextResponse} from "next/server";
import {normalizeTwelveQuote,resolveTwelveRegularClose} from "@/lib/nivora-live-quote";
import {AlpacaPaperBroker} from "@/lib/alpaca-paper";
import {loadTradingMarketData} from "@/lib/nivora-trading-market-data";
import {buildCanonicalMarketSnapshot} from "@/lib/auryn/market-truth";
import {rateLimitDistributed,requestKey} from "@/lib/rate-limit";
import {lastCompletedRegularSessionDate,lastCompletedRegularSessionCloseTimestamp} from "@/lib/nivora-market-session";

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
  const twelveDisplay=market.twelve&&market.twelveRaw?normalizeTwelveQuote(market.twelveRaw,asOf):null;
  const regularClose=market.twelveRaw?resolveTwelveRegularClose(market.twelveRaw,asOf):(twelveDisplay?.regularClose??null);
  const regularCloseTimestamp=regularClose!=null?(lastCompletedRegularSessionCloseTimestamp(asOf)??lastCompletedRegularSessionDate(asOf)):null;
  const snapshot=buildCanonicalMarketSnapshot({symbol,asOf,primary:market.alpaca,secondary:market.twelve,regularClose,regularCloseTimestamp});
  const chosen=snapshot.priceSensitiveAllowed?market.integrity.chosen:null;

  return NextResponse.json({
    ...snapshot,
    snapshotId:snapshot.snapshotId,
    priceSensitiveAllowed:snapshot.priceSensitiveAllowed,
    decisionAllowed:snapshot.decisionAllowed,
    executionTradable:snapshot.executionTradable,
    priceUse:snapshot.priceUse,
    // Compatibility fields are populated only from canonical/verified market truth.
    price:snapshot.displayPrice,
    regularClose:snapshot.regularClose,
    change:snapshot.priceState==="OFFICIAL_CLOSE"?null:twelveDisplay?.change??null,
    changePct:snapshot.priceState==="OFFICIAL_CLOSE"?null:chosen?.changePct??twelveDisplay?.changePct??null,
    isExtendedHours:snapshot.session==="PRE_MARKET"||snapshot.session==="AFTER_HOURS",
    providerTimestamp:chosen?.providerTimestamp??null,
    ageSeconds:chosen?.ageSeconds??null,
    freshness:chosen?.freshness??(snapshot.priceState==="OFFICIAL_CLOSE"?"LAST_TRADE":"STALE"),
    provider:chosen?.provider??(snapshot.priceState==="OFFICIAL_CLOSE"?"official-close":null),
    isRealTime:snapshot.priceState==="LIVE_VERIFIED"||snapshot.priceState==="LIVE_SINGLE_SOURCE",
    bid:chosen?.bid??null,
    ask:chosen?.ask??null,
    spreadPct:chosen?.spreadPct??null,
    integrityState:snapshot.priceState,
    integrityReason:snapshot.reason,
    integrityTradable:snapshot.executionTradable,
    disagreementPct:snapshot.providerAgreementPct,
    contextProviderGapPct:snapshot.contextProviderGapPct,
    sources:snapshot.sources
  },{headers:{"Cache-Control":"private, no-store, max-age=0"}});
}
