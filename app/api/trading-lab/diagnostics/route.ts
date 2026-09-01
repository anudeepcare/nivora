import {NextResponse} from "next/server";
import {AlpacaPaperBroker} from "@/lib/alpaca-paper";
import {loadTradingMarketData} from "@/lib/nivora-trading-market-data";
import {marketSessionAt} from "@/lib/nivora-market-session";
import type {PaperOrderPlan} from "@/lib/nivora-paper-execution";
import {ENGINE_VERSION,TRADING_LAB_VERSION} from "@/lib/nivora-version";

export const dynamic="force-dynamic";
const unauthorized=()=>NextResponse.json({error:"Unauthorized."},{status:401});

function auth(req:Request){
 const secret=process.env.TRADING_LAB_CRON_SECRET||process.env.CRON_SECRET;
 return Boolean(secret&&req.headers.get("authorization")===`Bearer ${secret}`);
}

function broker(){
 const key=process.env.ALPACA_PAPER_API_KEY||"",secret=process.env.ALPACA_PAPER_API_SECRET||"";
 if(!key||!secret)throw new Error("Alpaca Paper credentials are not configured.");
 return new AlpacaPaperBroker(key,secret);
}

async function inspect(){
 const b=broker();
 const symbol=String(process.env.TRADING_LAB_SELF_TEST_SYMBOL||"SPY").toUpperCase();
 const [account,positions,clock,market]=await Promise.all([
  b.getAccount(),
  b.getPositions(),
  b.getClock(),
  loadTradingMarketData(symbol,b,process.env.TWELVE_DATA_API_KEY||"",new Date())
 ]);
 return{b,symbol,account,positions,clock,market,session:marketSessionAt(new Date())};
}

async function submitSelfTestOrder(b:AlpacaPaperBroker,symbol:string,price:number){
 // Deliberately far from market so the paper order proves broker submission/cancel
 // without intentionally creating a position.
 const limitPrice=Math.max(.01,Math.floor(price*.50*100)/100);
 const order:PaperOrderPlan={
  clientOrderId:`niv_diag_${Date.now().toString(36)}`,
  symbol,
  side:"BUY",
  quantity:1,
  type:"limit",
  timeInForce:"day",
  limitPrice,
  referencePrice:price,
  notional:+limitPrice.toFixed(2),
  version:"v63-paper-diagnostic-1"
 };
 const submitted=await b.submitOrder(order);
 await b.cancelOrder(submitted.id);
 let finalStatus="cancel_requested";
 try{finalStatus=(await b.getOrder(submitted.id)).status}catch{}
 return{submitted,finalStatus,limitPrice};
}

export async function GET(req:Request){
 if(!auth(req))return unauthorized();
 try{
  const x=await inspect();
  return NextResponse.json({
   status:"ok",
   mode:"paper",
   engineVersion:ENGINE_VERSION,
   tradingLabVersion:TRADING_LAB_VERSION,
   broker:{connected:true,equity:x.account.equity,cash:x.account.cash,positions:x.positions.length,clock:x.clock},
   quote:{symbol:x.symbol,state:x.market.integrity.state,tradable:x.market.integrity.tradable,reason:x.market.integrity.reason,provider:x.market.integrity.chosen?.provider??null,price:x.market.integrity.chosen?.price??null,ageSeconds:x.market.integrity.chosen?.ageSeconds??null,disagreementPct:x.market.integrity.disagreementPct},
   selfTest:{orderEnabled:process.env.TRADING_LAB_SELF_TEST_ORDER_ENABLED==="true",note:"GET is read-only. POST can submit and immediately cancel a deliberately non-marketable Alpaca Paper limit order only when explicitly enabled."}
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error:any){
  return NextResponse.json({status:"error",mode:"paper",error:error?.message||"Paper diagnostics failed."},{status:500});
 }
}

export async function POST(req:Request){
 if(!auth(req))return unauthorized();
 if(process.env.TRADING_LAB_PAPER_ENABLED!=="true")return NextResponse.json({status:"disabled",reason:"Paper execution is disabled."},{status:409});
 if(process.env.TRADING_LAB_SELF_TEST_ORDER_ENABLED!=="true")return NextResponse.json({status:"disabled",reason:"Set TRADING_LAB_SELF_TEST_ORDER_ENABLED=true to arm the paper-order diagnostic."},{status:409});
 try{
  const x=await inspect();
  if(x.session!=="REGULAR"||!x.clock.isOpen)return NextResponse.json({status:"skipped",code:"MARKET_CLOSED",session:x.session,clock:x.clock});
  const quote=x.market.integrity.chosen;
  if(!quote||!x.market.integrity.tradable||quote.freshness!=="LIVE")return NextResponse.json({status:"blocked",code:"QUOTE_INTEGRITY",quoteIntegrity:x.market.integrity},{status:409});
  const test=await submitSelfTestOrder(x.b,x.symbol,quote.price);
  return NextResponse.json({
   status:"ok",
   mode:"paper",
   proof:"ALPACA_ORDER_SUBMIT_AND_CANCEL",
   symbol:x.symbol,
   brokerOrderId:test.submitted.id,
   brokerInitialStatus:test.submitted.status,
   brokerFinalStatus:test.finalStatus,
   deliberatelyNonMarketableLimit:test.limitPrice,
   referencePrice:quote.price,
   note:"This diagnostic tests the real Alpaca Paper order endpoint and immediately requests cancellation. It is not a NIVORA investment signal."
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error:any){
  return NextResponse.json({status:"error",mode:"paper",error:error?.message||"Paper order self-test failed."},{status:500});
 }
}
