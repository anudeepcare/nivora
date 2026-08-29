import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

export const runtime="nodejs";

export async function POST(req:Request){
  try{
    const body=await req.json();
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!url||!key)return NextResponse.json({enabled:false,reason:"Validation persistence is not configured."});
    const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const row={
      symbol:String(body.symbol||"").toUpperCase(),
      engine_version:String(body.engineVersion||"NIVORA V30"),
      mode:String(body.mode||"now"),
      price:Number(body.price||0),
      score:Number(body.score||0),
      confidence:Number(body.confidence||0),
      action:String(body.action||""),
      thesis_label:String(body.thesisLabel||""),
      factors:body.dimensions||{},
      levels:body.levels||{},
      evidence:body.evidence||{},
      audit_id:String(body.auditId||""),
      observed_at:new Date().toISOString()
    };
    const {error}=await db.from("nivora_validation_snapshots").insert(row);
    if(error)throw error;
    return NextResponse.json({enabled:true,saved:true});
  }catch(e:any){return NextResponse.json({enabled:false,error:e?.message||"Validation snapshot failed"},{status:500})}
}
