import {createHash,randomUUID} from 'node:crypto';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {canonicalMarketKey,eodCallCost,eodUsage,safeMarketCap} from './market-policy';
export const sharedMarketEnabled=()=>process.env.AURYN_SHARED_MARKET_GUARD==='true';
export class MarketGuardError extends Error{}
let admin:SupabaseClient|null=null;
function database(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new MarketGuardError('Shared market protection is not configured.');return admin??=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});}
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const identity=(token:string)=>'eodhd:'+hash(token).slice(0,24);
let usage:{at:number;value:ReturnType<typeof eodUsage>}|null=null;
async function accountUsage(token:string){
 if(usage&&Date.now()-usage.at<(usage.value?300000:30000)&&(!usage.value||usage.value.date===new Date().toISOString().slice(0,10)))return usage.value;
 try{const response=await fetch(`https://eodhd.com/api/user?${new URLSearchParams({api_token:token,fmt:'json'})}`,{next:{revalidate:300},signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error();const value=eodUsage(await response.json());usage={at:Date.now(),value};return value;}catch{usage={at:Date.now(),value:null};return null;}
}
export async function sharedEodRead<T>(token:string,path:string,params:Record<string,string>,ttl:number,read:()=>Promise<T>):Promise<T>{
 if(!sharedMarketEnabled())return read();
 const db=database(),remote=await accountUsage(token),provider=identity(token),key=hash(provider+':'+canonicalMarketKey(path,params));
 const cap=remote?safeMarketCap(process.env.EODHD_DAILY_BUDGET,remote.limit):0,cost=eodCallCost(path,params);
 let lease:string|undefined;
 for(let attempt=0;attempt<12;attempt++){
  const {data,error}=await db.rpc('auryn_market_acquire',{p_key:key,p_provider:provider,p_cost:cost,p_cap:cap,p_remote_used:remote?.used??0});
  if(error)throw new MarketGuardError('Shared market protection is unavailable. Check the database migration.');
  if(data?.status==='cached')return data.value as T;
  if(data?.status==='paused')throw new MarketGuardError('Updates temporarily paused by the data source. Existing observations retain their timestamps.');
  if(data?.status==='limited')throw new MarketGuardError(remote?'Updates temporarily limited by the shared daily budget. Existing observations retain their timestamps.':'Market allowance could not be verified. Cached research remains available.');
  if(data?.status==='reserved'){lease=data.lease;break;}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 if(!lease)throw new MarketGuardError('This dataset is refreshing. Please retry shortly.');
 try{const value=await read();await db.rpc('auryn_market_publish',{p_key:key,p_lease:lease,p_value:value,p_ttl:Math.max(1,Math.min(86400,Math.ceil(ttl/1000)))});return value;}
 catch(error){await db.rpc('auryn_market_publish',{p_key:key,p_lease:lease,p_value:null,p_ttl:0});throw error;}
}
export async function allowMarketUser(user:string){
 if(!sharedMarketEnabled())return true;
 const n=Number(process.env.AURYN_USER_MARKET_REQUESTS_PER_DAY),cap=Number.isInteger(n)&&n>0&&n<=100000?n:2000;
 const {data,error}=await database().rpc('auryn_market_user_allow',{p_user:user,p_cap:cap});if(error)throw new MarketGuardError('Shared account allowance is unavailable.');return data===true;
}
const worker=randomUUID();
export async function allowStreamWorker(token:string){if(!sharedMarketEnabled())return true;const {data,error}=await database().rpc('auryn_market_stream_lease',{p_provider:identity(token),p_owner:worker});return !error&&data===true;}

export async function pauseSharedEod(token:string,seconds:number){if(!sharedMarketEnabled())return;try{await database().rpc('auryn_market_pause',{p_provider:identity(token),p_seconds:Math.max(1,Math.min(86400,Math.ceil(seconds)))});}catch{/* Local rejected-result cache still prevents a tight retry loop. */}}
