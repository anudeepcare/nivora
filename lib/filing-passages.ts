import type {Research} from './types';
import type {Evidence} from './report';
const documents=new Map<string,{until:number;text:string}>();
const MAX_BYTES=2_000_000;
// URL inputs come from server-loaded research. No arbitrary document URL is accepted.
export async function filingPassages(r:Pick<Research,'filings'|'retrievedAt'>,intent:string,read:typeof fetch=fetch,agent=process.env.SEC_USER_AGENT??''):Promise<Evidence[]>{
 if(!agent.trim())return [];
 const day=r.retrievedAt.slice(0,10),seen=new Set<string>();
 const filings=r.filings.filter(f=>{
  try{const u=new URL(f.url);return u.protocol==='https:'&&u.hostname==='www.sec.gov'&&u.port===''&&!u.username&&!u.password&&!u.search&&u.pathname.startsWith('/Archives/edgar/data/')&&/\.html?$/i.test(u.pathname)&&/^\d{4}-\d{2}-\d{2}$/.test(f.date)&&f.date<=day&&!seen.has(f.url)&&!!seen.add(f.url);}catch{return false;}
 }).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,1);
 const out:Evidence[]=[];
 for(const f of filings){
  try{
   const old=read===fetch?documents.get(f.url):undefined;
   let text=old&&old.until>Date.now()?old.text:'';
   if(!text){
    const res=await read(f.url,{headers:{'User-Agent':agent,Accept:'text/html'},redirect:'error',signal:AbortSignal.timeout(7000),cache:'no-store'});
    if(!res.ok||!res.headers.get('content-type')?.includes('text/html')||Number(res.headers.get('content-length')??0)>MAX_BYTES){await res.body?.cancel();continue;}
    const reader=res.body?.getReader();if(!reader)continue;
    const decoder=new TextDecoder();let bytes=0,raw='';
    try{for(;;){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>MAX_BYTES){await reader.cancel();raw='';break;}raw+=decoder.decode(chunk.value,{stream:true});}raw+=decoder.decode();}finally{reader.releaseLock();}
    if(!raw)continue;
    text=raw.replace(/<(script|style|ix:header)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&(?:nbsp|#160);/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
    if(read===fetch){documents.set(f.url,{until:Date.now()+21600000,text});if(documents.size>12)documents.delete(documents.keys().next().value!);}
   }
   const terms=intent==='explain'?/cash flows?|capital expenditures?|operating activities/gi:intent==='strengthen'?/revenue|customers?|gross margin/gi:/risk factors?|liquidity|concentration|dilution|financing/gi;
   let match:RegExpExecArray|null,lastEnd=-1,count=0;
   while((match=terms.exec(text))&&count<3){
    const start=Math.max(0,match.index-180),end=Math.min(text.length,match.index+650);if(start<lastEnd)continue;
    const passage=text.slice(start,end);if(passage.length<120)continue;
    out.push({id:`F${out.length+1}`,label:`${f.form} · ${f.date} · filing excerpt`,url:f.url,value:null,unit:'excerpt',period:f.date,filed:f.date,passage});lastEnd=end;count++;
   }
  }catch{/* Unavailable documents never become invented evidence. */}
 }
 return out;
}
