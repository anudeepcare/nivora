import {NextResponse} from "next/server";import {createClient} from "@supabase/supabase-js";import {createHash} from "node:crypto";
import {runAurynValidationLab} from "@/lib/auryn/v99/validation-lab";import {auditValuationAnchoring} from "@/lib/auryn/v98/valuation-audit";
export const dynamic="force-dynamic";export const runtime="nodejs";
function authorized(req:Request){const s=process.env.CRON_SECRET;return Boolean(s)&&req.headers.get("authorization")===`Bearer ${s}`}
function db(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null}

export async function GET(req:Request){
 if(!authorized(req))return NextResponse.json({error:"Unauthorized"},{status:401});const client=db();if(!client)return NextResponse.json({error:"Supabase service configuration missing"},{status:503});
 const modelVersion="auryn-v9.8",today=new Date().toISOString().slice(0,10),since=new Date(Date.now()-90*86400000).toISOString().slice(0,10);
 const {data:rows}=await client.from("auryn_shadow_snapshots").select("symbol,evaluation_date,market_price,new_money_action,long_term_action,base_value").eq("model_version",modelVersion).gte("evaluation_date",since).limit(5000);
 const latest=new Map<string,any>();for(const x of rows||[]){const k=String(x.symbol);if(!latest.has(k)||String(x.evaluation_date)>String(latest.get(k).evaluation_date))latest.set(k,x)}
 const actions:Record<string,number>={};for(const x of latest.values()){const a=String(x.new_money_action||"UNKNOWN");actions[a]=(actions[a]||0)+1}
 const valuationRows=[...latest.values()].filter(x=>Number.isFinite(Number(x.base_value))&&Number.isFinite(Number(x.market_price))).map(x=>({symbol:String(x.symbol),marketPrice:Number(x.market_price),baseValue:Number(x.base_value)}));
 const lab=runAurynValidationLab(),anchoring=auditValuationAnchoring(valuationRows);
 const dominant=Object.entries(actions).sort((a,b)=>b[1]-a[1])[0]||["UNKNOWN",0],dominantShare=latest.size?Number(dominant[1])/latest.size*100:0;
 const dispersionFlag=latest.size>=50&&dominantShare>=80?"WATCH":"PASS";
 const status=lab.status==="FAIL"||anchoring.flag==="FAIL"?"FAIL":dispersionFlag==="WATCH"||anchoring.flag==="WATCH"?"WATCH":"PASS";
 const metrics={universeLatest:latest.size,actions,dominantAction:dominant[0],dominantSharePct:Number(dominantShare.toFixed(1)),decisionDispersion:dispersionFlag,valuationAnchoring:anchoring};
 const canonical={modelVersion,today,status,metrics,validationFingerprint:lab.fingerprint};const fingerprint=createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
 await client.from("auryn_model_health").upsert({model_version:modelVersion,as_of_date:today,status:latest.size<30?"COLLECTING":status,sample_n:latest.size,metrics,validation_report:lab,fingerprint},{onConflict:"model_version,as_of_date"});
 return NextResponse.json({...canonical,fingerprint,validation:lab});
}
