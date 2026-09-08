import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {rateLimitDistributed,requestKey} from "@/lib/rate-limit";
import {classifySecuritySymbol,isSupportedEquitySecurity} from "@/lib/auryn/v82/security-master";

function db(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
}

function sanitize(rows:any[],limit:number){
  const seen=new Set<string>(),symbols:string[]=[],excluded:{symbol:string;kind:string}[]=[];
  for(const row of rows||[]){
    const symbol=String(row?.symbol||"").trim().toUpperCase();
    if(!symbol||seen.has(symbol))continue;
    seen.add(symbol);
    const security=classifySecuritySymbol(symbol);
    if(!isSupportedEquitySecurity(security)){
      excluded.push({symbol,kind:security.kind});
      continue;
    }
    symbols.push(symbol);
    if(symbols.length>=limit)break;
  }
  return{symbols,excluded};
}

export async function GET(req:Request){
  const rl=await rateLimitDistributed(`audit-universe:${requestKey(req)}`,12,60_000);
  if(!rl.ok)return NextResponse.json({error:"Too many audit-universe requests."},{status:429,headers:{"Retry-After":"30"}});
  const client=db();
  if(!client)return NextResponse.json({error:"Market universe is not configured."},{status:503});
  const url=new URL(req.url);
  const limit=Math.max(1,Math.min(500,Number(url.searchParams.get("limit")||100)));
  const rawLimit=Math.min(2500,Math.max(limit*4,limit+200));

  const {data:scanned,error:scanError}=await client.from("nivora_investment_scan")
    .select("symbol,market_cap_m")
    .not("symbol","is",null)
    .order("market_cap_m",{ascending:false,nullsFirst:false})
    .limit(rawLimit);
  if(!scanError&&scanned?.length){
    const {symbols,excluded}=sanitize(scanned,limit);
    if(symbols.length>=limit)return NextResponse.json({symbols,count:symbols.length,source:"nivora_investment_scan",limit,excluded:excluded.length,excludedSamples:excluded.slice(0,20)},{headers:{"Cache-Control":"private, no-store"}});
  }

  const {data:universe,error}=await client.from("nivora_market_universe")
    .select("symbol")
    .eq("active",true)
    .order("symbol",{ascending:true})
    .limit(rawLimit);
  if(error)return NextResponse.json({error:error.message},{status:500});
  const {symbols,excluded}=sanitize(universe||[],limit);
  return NextResponse.json({symbols,count:symbols.length,source:"nivora_market_universe",limit,excluded:excluded.length,excludedSamples:excluded.slice(0,20)},{headers:{"Cache-Control":"private, no-store"}});
}
