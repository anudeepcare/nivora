import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {ENGINE_VERSION,RELIABILITY_MIN_SAMPLE,WEIGHTS_VERSION} from "@/lib/nivora-version";
export const dynamic="force-dynamic";
export async function GET(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({status:"unavailable",engineVersion:ENGINE_VERSION,reason:"Arena storage is not configured."});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const [{count:snapshots},{data:rows}]=await Promise.all([
  db.from("nivora_v59_decision_snapshots").select("id",{count:"exact",head:true}).eq("engine_version",ENGINE_VERSION),
  db.from("nivora_v59_reliability_buckets").select("horizon,archetype,score_bucket,sample_n,hit_rate_pct,avg_alpha_pct,reliability_score,status").eq("engine_version",ENGINE_VERSION).eq("weights_version",WEIGHTS_VERSION).order("horizon")
 ]);
 const buckets=rows||[],calibrated=buckets.filter((x:any)=>x.status==="CALIBRATED").length;
 return NextResponse.json({status:calibrated?"calibrated":"collecting",engineVersion:ENGINE_VERSION,weightsVersion:WEIGHTS_VERSION,snapshots:snapshots||0,minimumBucketSample:RELIABILITY_MIN_SAMPLE,calibratedBuckets:calibrated,buckets,note:"Arena reports version-matched benchmark-relative evidence; it is not a promise of future returns."},{headers:{"Cache-Control":"private, max-age=300"}});
}
