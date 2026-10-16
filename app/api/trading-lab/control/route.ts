import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {authorizeRequest} from '@/lib/server/authorization';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 const auth=await authorizeRequest(req,true);if(auth.response)return auth.response;
 const body=await req.json().catch(()=>null);
 if(typeof body?.paused!=='boolean')return NextResponse.json({error:'Choose pause or resume.'},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:'Paper control storage is unavailable.'},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await db.from('auryn_paper_control').update({paused:body.paused,updated_by:auth.user.id,updated_at:new Date().toISOString()}).eq('singleton',true).select('paused,updated_at').maybeSingle();
 if(error||!data)return NextResponse.json({error:'Paper controls require the current safety migration.'},{status:503});
 return NextResponse.json({...data,mode:'paper',message:body.paused?'New paper submissions are paused. Existing broker orders remain active until canceled.':'Paper submissions may resume when every execution gate passes.'},{headers:{'Cache-Control':'private, no-store'}});
}
