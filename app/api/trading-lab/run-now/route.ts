import {NextResponse} from "next/server";
import {authorizeRequest} from "@/lib/server/authorization";

export const dynamic="force-dynamic";

export async function POST(req:Request){
 const auth=await authorizeRequest(req,true);if(auth.response)return auth.response;
 const user=auth.user;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY,secret=process.env.CRON_SECRET||process.env.TRADING_LAB_CRON_SECRET;
 if(!url||!serviceKey||!secret)return NextResponse.json({status:"unavailable",reason:"Trading Lab server configuration is incomplete."},{status:503});
 const origin=new URL(req.url).origin,headers={authorization:`Bearer ${secret}`};
 try{
  const learnResponse=await fetch(`${origin}/api/portfolio/learn`,{method:"GET",headers,cache:"no-store",signal:AbortSignal.timeout(180000)});
  const learning=await learnResponse.json().catch(()=>({status:"error",reason:`Portfolio refresh returned ${learnResponse.status}`}));
  const runResponse=await fetch(`${origin}/api/trading-lab/run-paper`,{method:"POST",headers,cache:"no-store",signal:AbortSignal.timeout(180000)});
  const paper=await runResponse.json().catch(()=>({status:"error",reason:`Paper runner returned ${runResponse.status}`}));
  return NextResponse.json({status:runResponse.ok?"ok":"error",paper,learning,requestedBy:user.id},{status:runResponse.ok?200:runResponse.status,headers:{"Cache-Control":"private, no-store"}});
 }catch(e:any){return NextResponse.json({status:"error",reason:e?.message||"Paper check failed."},{status:500});}
}
