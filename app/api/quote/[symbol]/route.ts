import {NextResponse} from "next/server";
import {loadFastResearchQuote} from "@/lib/auryn/fast-quote";
import {rateLimitDistributed,requestKey} from "@/lib/rate-limit";

export const dynamic="force-dynamic";

export async function GET(req:Request,{params}:{params:Promise<{symbol:string}>}){
  const rl=await rateLimitDistributed(`fast-quote:${requestKey(req)}`,240,60_000);
  if(!rl.ok)return NextResponse.json({error:"Too many quote requests."},{status:429,headers:{"Retry-After":"10"}});
  const {symbol:raw}=await params;
  const symbol=decodeURIComponent(raw).toUpperCase();
  const started=Date.now();
  try{
    const quote=await loadFastResearchQuote({
      symbol,
      twelveKey:process.env.TWELVE_DATA_API_KEY||"",
      alpacaKey:process.env.ALPACA_PAPER_API_KEY||"",
      alpacaSecret:process.env.ALPACA_PAPER_API_SECRET||"",
      asOf:new Date()
    });
    return NextResponse.json(quote,{headers:{
      "Cache-Control":"private, max-age=2, stale-while-revalidate=6",
      "Server-Timing":`fastquote;dur=${Date.now()-started}`
    }});
  }catch(error){
    return NextResponse.json({symbol,status:"UNAVAILABLE",reason:String(error),researchOnly:true,executionVerified:false},{status:503,headers:{
      "Cache-Control":"private, max-age=1, stale-while-revalidate=3",
      "Server-Timing":`fastquote;dur=${Date.now()-started}`
    }});
  }
}
