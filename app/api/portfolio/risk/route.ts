import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {analyzePortfolioRisk} from "@/lib/nivora-portfolio-risk";
import {sharedJson} from "@/lib/shared-cache";

async function trailingReturns(symbol:string,key:string){
  const u=`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=90&apikey=${key}`;
  const j=await sharedJson(u,["portfolio-risk-series",symbol],3600,3200);
  const rows=Array.isArray(j?.values)?j.values.slice().reverse():[];
  const closes=rows.map((x:any)=>Number(x.close)).filter((x:number)=>Number.isFinite(x)&&x>0);
  const out:number[]=[];for(let i=1;i<closes.length;i++)out.push(closes[i-1]?closes[i]/closes[i-1]-1:0);
  return out;
}

export async function POST(req:Request){
 const body=await req.json().catch(()=>({}));
 const supplied=Array.isArray(body?.holdings)?body.holdings.map((h:any)=>({symbol:String(h?.symbol||"").toUpperCase(),marketValue:Number(h?.marketValue||0),sector:h?.sector||null,archetype:h?.archetype||null})).filter((h:any)=>h.symbol&&Number.isFinite(h.marketValue)&&h.marketValue>0):[];
 let base:any[]=supplied;
 if(!base.length){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,userId=String(body?.userId||"");
  if(!url||!key)return NextResponse.json({status:"unavailable"},{status:503});
  if(!userId)return NextResponse.json({error:"userId required"},{status:400});
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const{data:positions,error}=await db.from("portfolio_positions").select("symbol,shares,avg_cost,asset_type").eq("user_id",userId);
  if(error)return NextResponse.json({status:"error",error:error.message},{status:500});
  const invested=(positions||[]).filter((x:any)=>String(x.asset_type||"EQUITY")!=="CASH"),syms=invested.map((x:any)=>x.symbol);
  if(!syms.length)return NextResponse.json({status:"ok",risk:analyzePortfolioRisk([])});
  const{data:scan}=await db.from("nivora_investment_scan").select("symbol,price,sector,archetype").in("symbol",syms);const sm=new Map((scan||[]).map((x:any)=>[x.symbol,x]));
  base=invested.map((p:any)=>{const x:any=sm.get(p.symbol),price=Number(x?.price||p.avg_cost||0);return{symbol:String(p.symbol),marketValue:Number(p.shares||0)*price,sector:x?.sector||null,archetype:x?.archetype||null}}).filter((x:any)=>x.marketValue>0);
 }
 const td=process.env.TWELVE_DATA_API_KEY,leaders=[...base].sort((a,b)=>b.marketValue-a.marketValue).slice(0,12),returns=new Map<string,number[]>();
 if(td){const settled=await Promise.allSettled(leaders.map(async h=>[h.symbol,await trailingReturns(h.symbol,td)] as const));for(const r of settled)if(r.status==="fulfilled")returns.set(r.value[0],r.value[1]);}
 const holdings=base.map(h=>({...h,returns:returns.get(h.symbol)||[]})),risk=analyzePortfolioRisk(holdings),correlationCoverage=leaders.length?leaders.filter(h=>(returns.get(h.symbol)||[]).length>=20).length/leaders.length:0;
 return NextResponse.json({status:"ok",risk,correlationCoveragePct:+(correlationCoverage*100).toFixed(0),correlationUniverse:leaders.length,note:"Portfolio risk changes sizing/add guidance, never the independent company thesis. Correlation uses cached trailing daily returns when the market-data provider is available."},{headers:{"Cache-Control":"private, max-age=300"}})
}
