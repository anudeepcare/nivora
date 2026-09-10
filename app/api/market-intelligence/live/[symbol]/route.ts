import {NextResponse} from 'next/server';
import {sharedJson} from '@/lib/shared-cache';
import {loadV934LiveContext} from '@/lib/auryn/v934/twelve-multitimeframe';
import {computeTimeframeTechnicalState} from '@/lib/auryn/v934/timeframes';
import {rateLimitDistributed,requestKey} from '@/lib/rate-limit';

export const dynamic='force-dynamic';

export async function GET(req:Request,{params}:{params:Promise<{symbol:string}>}){
 const rl=await rateLimitDistributed(`v934-live:${requestKey(req)}`,120,60_000);
 if(!rl.ok)return NextResponse.json({error:'Too many tactical-context requests.'},{status:429,headers:{'Retry-After':'15'}});
 const {symbol:raw}=await params;const symbol=decodeURIComponent(raw).toUpperCase();const key=process.env.TWELVE_DATA_API_KEY||'';
 if(!key)return NextResponse.json({status:'UNAVAILABLE',symbol,reason:'Market-data provider is not configured.'},{status:503});
 const asOf=new Date();const benchmark=symbol==='SPY'?null:'SPY';
 const fetchJson=(url:string,keyParts:string[],revalidate:number,timeout:number)=>sharedJson(url,keyParts,revalidate,timeout);
 try{
  const [bars,bench]=await Promise.all([
   loadV934LiveContext({symbol,key,asOf,fetchJson}),
   benchmark?loadV934LiveContext({symbol:benchmark,key,asOf,fetchJson}).catch(()=>null):Promise.resolve(null)
  ]);
  const confirmed:any={},livePreview:any={};
  for(const tf of ['15M','1H'] as const){
   const c=bars.confirmed[tf];if(c?.length){const s=computeTimeframeTechnicalState(c,bench?.confirmed?.[tf]??null,tf,benchmark);if(s)confirmed[tf]=s}
   const p=bars.preview[tf];if(p?.length){const s=computeTimeframeTechnicalState(p,bench?.preview?.[tf]??null,tf,benchmark);if(s)livePreview[tf]=s}
  }
  return NextResponse.json({version:'auryn-v9.3.4.1-live',symbol,asOf:asOf.toISOString(),confirmed,livePreview,coverage:bars.coverage,status:'OK'},{headers:{'Cache-Control':'private, max-age=0, stale-while-revalidate=20'}});
 }catch(error){
  return NextResponse.json({version:'auryn-v9.3.4.1-live',symbol,asOf:asOf.toISOString(),confirmed:{},livePreview:{},coverage:{'15M':0,'1H':0},status:'DEGRADED',reason:String(error)},{status:200,headers:{'Cache-Control':'private, max-age=0, stale-while-revalidate=15'}});
 }
}
