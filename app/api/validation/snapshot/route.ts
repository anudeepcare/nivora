import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authorizeRequest } from '@/lib/server/authorization';
import { rateLimitDistributed } from '@/lib/rate-limit';
import { runAutonomousCanonicalResearch } from '@/lib/auryn/v995/autonomous-research';
import { persistAutonomousResearch } from '@/lib/auryn/v995/persist-research';
export const runtime='nodejs';
export const maxDuration=60;

/** Clients request a refresh. They cannot author the shared research or trading evidence. */
export async function POST(req:Request) {
  const auth=await authorizeRequest(req);
  if(auth.response)return auth.response;
  let body:any;
  try{body=await req.json();}catch{return NextResponse.json({error:'Invalid JSON.'},{status:400});}
  const symbol=typeof body?.symbol==='string'?body.symbol.trim().toUpperCase():'';
  if(!/^[A-Z0-9][A-Z0-9.-]{0,14}(\/[A-Z]{2,6})?$/.test(symbol))return NextResponse.json({error:'A supported symbol is required.'},{status:400});
  const quota=await rateLimitDistributed(`canonical-refresh:${auth.user.id}`,4,60_000);
  if(!quota.ok)return NextResponse.json({error:'Research refresh limit reached.'},{status:429,headers:{'Retry-After':'60'}});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return NextResponse.json({enabled:false,error:'Research persistence is not configured.'},{status:503});
  try {
    const origin=process.env.AURYN_BASE_URL||new URL(req.url).origin;
    const result=await runAutonomousCanonicalResearch(symbol,{origin});
    if(result.state!=='RESEARCH_READY')return NextResponse.json({enabled:true,saved:false,...result},{status:result.state==='TEMPORARY_PROVIDER_FAILURE'?503:422});
    const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const saved=await persistAutonomousResearch(client,symbol,result);
    return NextResponse.json({enabled:true,saved:true,snapshotId:saved.canonicalSnapshotId,decision:result.decision},{headers:{'Cache-Control':'private, no-store'}});
  } catch { return NextResponse.json({enabled:false,error:'Canonical research could not be saved. Existing history is unchanged.'},{status:503}); }
}
