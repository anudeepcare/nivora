import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {rateLimitDistributed,requestKey} from "@/lib/rate-limit";
import {classifySecuritySymbol,isSupportedEquitySecurity} from "@/lib/auryn/v82/security-master";
import {selectDiversifiedAuditUniverse,type AuditUniverseRow} from "@/lib/auryn/v84/audit-sampling";

function db(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
}

function supportedRows(rows:any[]){
  const seen=new Set<string>(),candidates:AuditUniverseRow[]=[],excluded:{symbol:string;kind:string}[]=[];
  for(const row of rows||[]){
    const symbol=String(row?.symbol||"").trim().toUpperCase();
    if(!symbol||seen.has(symbol))continue;
    seen.add(symbol);
    const security=classifySecuritySymbol(symbol);
    if(!isSupportedEquitySecurity(security)){excluded.push({symbol,kind:security.kind});continue;}
    const cap=Number(row?.market_cap_m);
    candidates.push({symbol,market_cap_m:Number.isFinite(cap)?cap:null});
  }
  return{candidates,excluded};
}

async function loadActiveUniverse(client:ReturnType<typeof db>,maxRows=8000){
  if(!client)return{rows:[] as any[],error:"Market universe is not configured."};
  const rows:any[]=[];const pageSize=1000;
  for(let start=0;start<maxRows;start+=pageSize){
    const {data,error}=await client.from("nivora_market_universe")
      .select("symbol")
      .eq("active",true)
      .order("symbol",{ascending:true})
      .range(start,Math.min(maxRows-1,start+pageSize-1));
    if(error)return{rows,error:error.message};
    const page=data||[];rows.push(...page);
    if(page.length<pageSize)break;
  }
  return{rows,error:null};
}

export async function GET(req:Request){
  const rl=await rateLimitDistributed(`audit-universe:${requestKey(req)}`,12,60_000);
  if(!rl.ok)return NextResponse.json({error:"Too many audit-universe requests."},{status:429,headers:{"Retry-After":"30"}});
  const client=db();
  if(!client)return NextResponse.json({error:"Market universe is not configured."},{status:503});
  const url=new URL(req.url);
  const limit=Math.max(1,Math.min(500,Number(url.searchParams.get("limit")||100)));
  const rawLimit=Math.min(5000,Math.max(limit*8,limit+500));

  const {data:scanned,error:scanError}=await client.from("nivora_investment_scan")
    .select("symbol,market_cap_m")
    .not("symbol","is",null)
    .order("market_cap_m",{ascending:false,nullsFirst:false})
    .limit(rawLimit);
  if(!scanError&&scanned?.length){
    const {candidates,excluded}=supportedRows(scanned);
    if(candidates.length>=limit){
      const symbols=selectDiversifiedAuditUniverse(candidates,limit);
      return NextResponse.json({symbols,count:symbols.length,source:"nivora_investment_scan_diversified",limit,candidates:candidates.length,excluded:excluded.length,excludedSamples:excluded.slice(0,20)},{headers:{"Cache-Control":"private, no-store"}});
    }
  }

  const fallback=await loadActiveUniverse(client,8000);
  if(fallback.error)return NextResponse.json({error:fallback.error},{status:500});
  const {candidates,excluded}=supportedRows(fallback.rows);
  const symbols=selectDiversifiedAuditUniverse(candidates,limit);
  return NextResponse.json({symbols,count:symbols.length,source:"nivora_market_universe_diversified",limit,candidates:candidates.length,excluded:excluded.length,excludedSamples:excluded.slice(0,20)},{headers:{"Cache-Control":"private, no-store"}});
}
