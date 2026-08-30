import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
export async function GET(req:Request){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return NextResponse.json({items:[]});
  const syms=(new URL(req.url).searchParams.get("symbols")||"").split(",").map(x=>x.trim().toUpperCase()).filter(Boolean).slice(0,50);
  if(!syms.length)return NextResponse.json({items:[]});
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});const{data}=await db.from("nivora_investment_scan").select("*").in("symbol",syms);
  const items=(data||[]).map((x:any)=>({symbol:x.symbol,price:Number(x.price||0),changePct:Number(x.change_pct||0),action:x.action,reason:x.reason,thesisScore:Number(x.thesis_score||0),thesisState:x.thesis_state,opportunityScore:Number(x.opportunity_score||0),confidence:Number(x.evidence_confidence||0)}));
  return NextResponse.json({items},{headers:{"Cache-Control":"private, max-age=60"}});
}
