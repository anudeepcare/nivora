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
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return NextResponse.json({status:"unavailable"},{status:503});
 const body=await req.json().catch(()=>({})),userId=String(body?.userId||"");if(!userId)return NextResponse.json({error:"userId required"},{status:400});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const{data:positions}=await db.from("portfolio_positions").select("symbol,shares,avg_cost,asset_type").eq("user_id",userId);
 const invested=(positions||[]).filter((x:any)=>String(x.asset_type||"EQUITY")!=="CASH");
 const syms=invested.map((x:any)=>x.symbol);if(!syms.length)return NextResponse.json({status:"ok",risk:analyzePortfolioRisk([])});
 const{data:scan}=await db.from("nivora_investment_scan").select("symbol,price,sector,archetype").in("symbol",syms);const sm=new Map((scan||[]).map((x:any)=>[x.symbol,x]));
 const base=invested.map((p:any)=>{const s:any=sm.get(p.symbol),price=Number(s?.price||p.avg_cost||0);return{symbol:String(p.symbol),marketValue:Number(p.shares||0)*price,sector:s?.sector||null,archetype:s?.archetype||null}}).filter((x:any)=>x.marketValue>0);
 const td=process.env.TWELVE_DATA_API_KEY;
 // Correlation is an execution/portfolio overlay. To control provider cost, calculate it on the largest 12 funded positions and cache daily-return series for one hour.
 const leaders=[...base].sort((a,b)=>b.marketValue-a.marketValue).slice(0,12);
 const returns=new Map<string,number[]>();
 if(td){
   const settled=await Promise.allSettled(leaders.map(async h=>[h.symbol,await trailingReturns(h.symbol,td)] as const));
   for(const r of settled)if(r.status==="fulfilled")returns.set(r.value[0],r.value[1]);
 }
 const holdings=base.map(h=>({...h,returns:returns.get(h.symbol)||[]}));
 const risk=analyzePortfolioRisk(holdings);
 const correlationCoverage=leaders.length?leaders.filter(h=>(returns.get(h.symbol)||[]).length>=20).length/leaders.length:0;
 return NextResponse.json({status:"ok",risk,correlationCoveragePct:+(correlationCoverage*100).toFixed(0),correlationUniverse:leaders.length,note:"Portfolio risk changes sizing/add guidance, never the independent company thesis. Correlation uses cached trailing daily returns when the market-data provider is available."},{headers:{"Cache-Control":"private, max-age=300"}})
}
