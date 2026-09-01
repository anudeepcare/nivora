import {coalesceRequest,recordProviderResult} from "./provider-resilience";
import {unstable_cache} from "next/cache";
const providerId=(x:string)=>x==="twelve"?"twelvedata":x;
export async function sharedJson(url:string,keyParts:string[],revalidate:number,timeout=3500,headers?:Record<string,string>){
  const provider=providerId(keyParts[0]||"unknown");
  const load=unstable_cache(async()=>{
    const c=new AbortController(); const t=setTimeout(()=>c.abort(),timeout);const started=Date.now();
    try{
      const r=await fetch(url,{cache:"no-store",headers,signal:c.signal});
      if(!r.ok) throw new Error(`Upstream ${r.status}`);
      const data=await r.json();recordProviderResult(provider,true,Date.now()-started);return data;
    } catch(e){recordProviderResult(provider,false,Date.now()-started);throw e}
    finally { clearTimeout(t); }
  },["nivora",...keyParts],{revalidate});
  return coalesceRequest(`shared:${keyParts.join(":")}`,load,provider);
}
export const nowIso=()=>new Date().toISOString();
