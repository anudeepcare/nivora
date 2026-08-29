import {unstable_cache} from "next/cache";

export async function sharedJson(url:string,keyParts:string[],revalidate:number,timeout=3500,headers?:Record<string,string>){
  const load=unstable_cache(async()=>{
    const c=new AbortController(); const t=setTimeout(()=>c.abort(),timeout);
    try{
      const r=await fetch(url,{cache:"no-store",headers,signal:c.signal});
      if(!r.ok) throw new Error(`Upstream ${r.status}`);
      return await r.json();
    } finally { clearTimeout(t); }
  },["nivora",...keyParts],{revalidate});
  return load();
}
export const nowIso=()=>new Date().toISOString();
