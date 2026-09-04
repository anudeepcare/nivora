import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

function db(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
}
function userId(req:Request){return String(req.headers.get("x-nivora-user-id")||"").trim()}

export async function GET(req:Request){
 const client=db(),uid=userId(req);if(!client)return NextResponse.json({status:"unavailable"},{status:503});if(!uid)return NextResponse.json({error:"user required"},{status:401});
 const{data,error}=await client.from("nivora_portfolio_snapshots").select("as_of,total_value,spy_price,qqq_price,holdings").eq("user_id",uid).order("as_of",{ascending:true}).limit(1600);
 if(error)return NextResponse.json({status:"error",error:error.message},{status:500});
 return NextResponse.json({status:"ok",items:(data||[]).map((x:any)=>({asOf:x.as_of,totalValue:Number(x.total_value),spy:x.spy_price==null?null:Number(x.spy_price),qqq:x.qqq_price==null?null:Number(x.qqq_price),holdings:x.holdings||[]}))},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(req:Request){
 const client=db(),uid=userId(req);if(!client)return NextResponse.json({status:"unavailable"},{status:503});if(!uid)return NextResponse.json({error:"user required"},{status:401});
 const b=await req.json().catch(()=>({})),totalValue=Number(b.totalValue);if(!Number.isFinite(totalValue)||totalValue<0)return NextResponse.json({error:"valid totalValue required"},{status:400});
 const td=process.env.TWELVE_DATA_API_KEY;
 const quote=async(symbol:string)=>{if(!td)return null;try{const r=await fetch(`https://api.twelvedata.com/price?symbol=${symbol}&apikey=${td}`,{cache:"no-store",signal:AbortSignal.timeout(1800)}),j=await r.json(),v=Number(j?.price);return Number.isFinite(v)&&v>0?v:null}catch{return null}};
 const [spy,qqq]=await Promise.all([quote("SPY"),quote("QQQ")]);
 const now=new Date(),row={user_id:uid,as_of:now.toISOString(),snapshot_day:now.toISOString().slice(0,10),total_value:totalValue,spy_price:spy,qqq_price:qqq,holdings:Array.isArray(b.holdings)?b.holdings:[],engine_version:"v65.11"};
 const{error}=await client.from("nivora_portfolio_snapshots").upsert(row,{onConflict:"user_id,snapshot_day"});
 if(error)return NextResponse.json({status:"error",error:error.message},{status:500});
 return NextResponse.json({status:"ok",snapshot:row});
}
