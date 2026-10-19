import {account,failure,HttpError,limit} from '@/lib/server';
import {symbolInput} from '@/lib/format';
import type {PriceTick} from '@/lib/live-price';
import {priceStreamHub} from '@/lib/price-stream-hub';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
export async function GET(request:Request){
 try{
  const {user}=await account(request);limit(`price-stream:${user.id}`,6);
  const token=process.env.EODHD_API_KEY||process.env.EODHD_API_TOKEN;
  if(!token||process.env.EODHD_STREAM_ENABLED==='false')throw new HttpError('Streaming unavailable; regular price updates continue.',503);
  const raw=(new URL(request.url).searchParams.get('symbols')||'').split(',').filter(Boolean);
  if(!raw.length||raw.length>30)throw new HttpError('Select 1–30 instruments.');
  const symbols=[...new Set(raw.map(symbolInput))];
  if(symbols.some(s=>!/^([A-Z][A-Z0-9.-]{0,14}|[A-Z0-9]{2,12}\/USD)$/.test(s)))throw new HttpError('Unsupported streaming symbol.');
  const encoder=new TextEncoder();let cleanup=()=>{};
  const stream=new ReadableStream<Uint8Array>({start(controller){
   let finished=false,release:()=>void=()=>{};let timer:ReturnType<typeof setTimeout>,heartbeat:ReturnType<typeof setInterval>,flush:ReturnType<typeof setInterval>;const pending=new Map<string,PriceTick>();
   const write=(event:unknown)=>{if(finished||(controller.desiredSize??0)<=0)return false;try{controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));return true;}catch{cleanup();return false;}};
   const send=(event:{type:string;tick?:PriceTick;status?:string})=>{if(event.type==='price'&&event.tick)pending.set(event.tick.symbol,event.tick);else write(event);};
   cleanup=()=>{if(finished)return;finished=true;release();clearTimeout(timer);clearInterval(heartbeat);clearInterval(flush);pending.clear();request.signal.removeEventListener('abort',cleanup);try{controller.close();}catch{}};
   timer=setTimeout(cleanup,55000);heartbeat=setInterval(()=>send({type:'heartbeat'}),15000);
   flush=setInterval(()=>{if(pending.size&&write({type:'prices',ticks:[...pending.values()]}))pending.clear();},1000);
   request.signal.addEventListener('abort',cleanup,{once:true});
   if(request.signal.aborted){cleanup();return;}
   try{release=priceStreamHub(token).add(`${user.id}:${crypto.randomUUID()}`,symbols,send);}catch{send({type:'status',status:'unavailable'});cleanup();}
  },cancel(){cleanup();}});
  return new Response(stream,{headers:{'Content-Type':'text/event-stream','Cache-Control':'private, no-store, no-transform','X-Accel-Buffering':'no'}});
 }catch(e){return failure(e);}
}
