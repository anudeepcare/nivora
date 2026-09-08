import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {rateLimitDistributed,requestKey} from "@/lib/rate-limit";

function db(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
}

export async function GET(req:Request){
  const rl=await rateLimitDistributed(`audit-universe:${requestKey(req)}`,12,60_000);
  if(!rl.ok)return NextResponse.json({error:"Too many audit-universe requests."},{status:429,headers:{"Retry-After":"30"}});
  const client=db();
  if(!client)return NextResponse.json({error:"Market universe is not configured."},{status:503});
  const url=new URL(req.url);
  const limit=Math.max(1,Math.min(500,Number(url.searchParams.get("limit")||100)));

  // Prefer the persisted investment scan because it gives us a broad, liquid live-validation set.
  const {data:scanned,error:scanError}=await client.from("nivora_investment_scan")
    .select("symbol,market_cap_m")
    .not("symbol","is",null)
    .order("market_cap_m",{ascending:false,nullsFirst:false})
    .limit(limit);
  if(!scanError&&scanned?.length){
    const symbols=[...new Set(scanned.map((x:any)=>String(x.symbol||"").trim().toUpperCase()).filter(Boolean))].slice(0,limit);
    return NextResponse.json({symbols,count:symbols.length,source:"nivora_investment_scan",limit},{headers:{"Cache-Control":"private, no-store"}});
  }

  const {data:universe,error}=await client.from("nivora_market_universe")
    .select("symbol")
    .eq("active",true)
    .order("symbol",{ascending:true})
    .limit(limit);
  if(error)return NextResponse.json({error:error.message},{status:500});
  const symbols=[...new Set((universe||[]).map((x:any)=>String(x.symbol||"").trim().toUpperCase()).filter(Boolean))].slice(0,limit);
  return NextResponse.json({symbols,count:symbols.length,source:"nivora_market_universe",limit},{headers:{"Cache-Control":"private, no-store"}});
}
