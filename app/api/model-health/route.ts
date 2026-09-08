import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {AURYN_V6_ENGINE_VERSION} from '@/lib/auryn/v6/version';
import {buildModelHealth} from '@/lib/auryn/v6/model-health';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return NextResponse.json({status:'unavailable',engineVersion:AURYN_V6_ENGINE_VERSION,reason:'Model-proof storage is not configured.'},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),q=new URL(req.url).searchParams,engine=q.get('engine')||AURYN_V6_ENGINE_VERSION,archetype=String(q.get('archetype')||'').trim().toUpperCase();
 const{data:snaps,error}=await db.from('nivora_v59_decision_snapshots').select('id,decision,evidence').eq("engine_version",engine).order('observed_at',{ascending:false}).limit(5000);if(error)return NextResponse.json({status:'error',error:error.message},{status:500});
 const scoped=(snaps||[]).filter((x:any)=>!archetype||String(x?.decision?.classification?.businessModel??x?.decision?.v5?.v4?.classification?.businessModel??'').toUpperCase()===archetype);
 const ids=scoped.map((x:any)=>Number(x.id)),outs:any[]=[];for(let i=0;i<ids.length;i+=250){const{data:o}=await db.from('nivora_v59_arena_outcomes').select('snapshot_id,horizon,alpha_pct,max_drawdown_pct,benchmark_return_pct').in('snapshot_id',ids.slice(i,i+250));outs.push(...(o||[]))}
 const health=buildModelHealth(scoped,outs);return NextResponse.json({status:'ok',engineVersion:engine,scope:{archetype:archetype||'ALL'},...health,autoPromote:false,note:'Model proof is historical exact-engine evidence, not a guarantee or probability of profit.'},{headers:{'Cache-Control':'private, no-store'}});
}
