import {createClient} from "@supabase/supabase-js";
type Hit={count:number;reset:number};const g=globalThis as any;if(!g.__nivoraRate)g.__nivoraRate=new Map<string,Hit>();const store:Map<string,Hit>=g.__nivoraRate;
export function rateLimit(key:string,limit=90,windowMs=60_000){const now=Date.now();let h=store.get(key);if(!h||h.reset<=now){h={count:0,reset:now+windowMs};store.set(key,h)}h.count++;return{ok:h.count<=limit,remaining:Math.max(0,limit-h.count),reset:h.reset,mode:"local-fallback" as const}}
export async function rateLimitDistributed(key:string,limit=90,windowMs=60_000){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,service=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!service)return rateLimit(key,limit,windowMs);
 try{const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});const{data,error}=await db.rpc("nivora_take_rate_limit",{p_key:key,p_limit:limit,p_window_seconds:Math.ceil(windowMs/1000)});if(error)throw error;return{ok:Boolean(data?.ok),remaining:Number(data?.remaining??0),reset:Number(data?.reset??Date.now()+windowMs),mode:"distributed" as const}}catch{return rateLimit(key,limit,windowMs)}
}
export function requestKey(req:Request){const f=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();return f||req.headers.get("x-real-ip")||"anonymous"}
