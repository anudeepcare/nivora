import {NextResponse} from "next/server";
import {AlpacaPaperBroker} from "@/lib/alpaca-paper";
import {loadTradingMarketData} from "@/lib/nivora-trading-market-data";
import {marketSessionAt} from "@/lib/nivora-market-session";
import {ENGINE_VERSION,TRADING_LAB_VERSION} from "@/lib/nivora-version";

import {authorizePaperCron} from "@/lib/server/paper-operations";

export const dynamic="force-dynamic";
const unauthorized=()=>NextResponse.json({error:"Unauthorized."},{status:401});

function auth(req:Request){
 return authorizePaperCron(req);
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
   selfTest:{orderEnabled:false,note:"GET is read-only. Use the audited manual paper ticket for a controlled order lifecycle."}
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error:any){
  return NextResponse.json({status:"error",mode:"paper",error:error?.message||"Paper diagnostics failed."},{status:500});
 }
}

export async function POST(req:Request){
 if(!auth(req))return unauthorized();
 return NextResponse.json({status:"disabled",code:"USE_AUDITED_PAPER_TICKET",reason:"Use the administrator's reviewed manual paper ticket for a controlled, audited lifecycle. Diagnostic GET remains read-only."},{status:409});
}
