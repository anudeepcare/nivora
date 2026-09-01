import {NextResponse} from "next/server";
import {sharedJson} from "@/lib/shared-cache";
import {normalizeTwelveQuote} from "@/lib/nivora-live-quote";
import {rateLimitDistributed,requestKey} from "@/lib/rate-limit";

export const dynamic="force-dynamic";
export async function GET(req:Request,{params}:{params:Promise<{symbol:string}>}){
  const rl=await rateLimitDistributed(`quote:${requestKey(req)}`,180,60_000);
  if(!rl.ok)return NextResponse.json({error:"Too many quote requests."},{status:429,headers:{"Retry-After":"30"}});
  const {symbol:raw}=await params;const symbol=decodeURIComponent(raw).toUpperCase();const key=process.env.TWELVE_DATA_API_KEY;
  if(!key)return NextResponse.json({error:"Live quote provider is not configured."},{status:503});
  try{
    const url=`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&prepost=true&apikey=${key}`;
    const rawQuote=await sharedJson(url,["twelve","quote",symbol],5,1800);
    if(rawQuote?.status==="error"||(!rawQuote?.close&&!rawQuote?.price))throw new Error(rawQuote?.message||"No live quote returned.");
    const quote=normalizeTwelveQuote(rawQuote,new Date());
    return NextResponse.json(quote,{headers:{"Cache-Control":"public, s-maxage=5, stale-while-revalidate=10"}});
  }catch(e:any){return NextResponse.json({error:e?.name==="AbortError"?"Live quote timed out.":e?.message||"Live quote unavailable."},{status:502})}
}
