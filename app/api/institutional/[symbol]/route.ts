import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {sharedJson} from "@/lib/shared-cache";

export const runtime="nodejs";

function isoDaysAgo(days:number){
  const d=new Date(Date.now()-days*86400000);
  return d.toISOString().slice(0,10);
}
function compact(n:number){
  const a=Math.abs(n);
  const sign=n>0?"+":n<0?"−":"";
  if(a>=1e9)return `${sign}${(a/1e9).toFixed(1)}B shares`;
  if(a>=1e6)return `${sign}${(a/1e6).toFixed(1)}M shares`;
  if(a>=1e3)return `${sign}${(a/1e3).toFixed(1)}K shares`;
  return `${sign}${Math.round(a).toLocaleString()} shares`;
}
function classify(increased:number,reduced:number,net:number){
  if(increased===0&&reduced===0&&net===0)return {label:"Unavailable",directionLabel:"No verified filing trend"};
  if(net>0 && increased>=Math.max(1,reduced))return {label:"Accumulating",directionLabel:"Reported increasing"};
  if(net<0 && reduced>=Math.max(1,increased))return {label:"Reducing",directionLabel:"Reported reducing"};
  if(increased>reduced*1.25)return {label:"Accumulating",directionLabel:"Reported increasing"};
  if(reduced>increased*1.25)return {label:"Reducing",directionLabel:"Reported reducing"};
  return {label:"Mixed",directionLabel:"Reported mixed"};
}
async function cachedSec(symbol:string){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return null;
  try{
    const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data,error}=await db.from("nivora_institutional_snapshots")
      .select("*").eq("symbol",symbol).order("period_end",{ascending:false}).limit(1).maybeSingle();
    if(error||!data)return null;
    return data;
  }catch{return null}
}

export async function GET(_:Request,{params}:{params:Promise<{symbol:string}>}){
  const {symbol:raw}=await params;
  const symbol=decodeURIComponent(raw).toUpperCase();
  if(symbol.includes("/"))return NextResponse.json({
    enabled:false,reason:"Institutional filings are not applicable to crypto.",
    disclosure:"NIVORA does not infer named institutional buying from crypto price/volume."
  });

  const [secCache,provider] = await Promise.all([
    cachedSec(symbol),
    (async()=>{
      const token=process.env.FINNHUB_API_KEY;
      if(!token)return {rows:[] as any[],insiders:[] as any[],source:null as string|null};
      const [ownership,insider]=await Promise.allSettled([
        sharedJson(`https://finnhub.io/api/v1/stock/ownership?symbol=${encodeURIComponent(symbol)}&limit=60&token=${token}`,["finnhub","ownership",symbol],21600,4500),
        sharedJson(`https://finnhub.io/api/v1/stock/insider-transactions?symbol=${encodeURIComponent(symbol)}&from=${isoDaysAgo(180)}&to=${new Date().toISOString().slice(0,10)}&token=${token}`,["finnhub","insider",symbol],3600,4500)
      ]);
      const own:any=ownership.status==="fulfilled"?ownership.value:{};
      const ins:any=insider.status==="fulfilled"?insider.value:{};
      return {
        rows:Array.isArray(own?.ownership)?own.ownership:Array.isArray(own?.data)?own.data:[],
        insiders:Array.isArray(ins?.data)?ins.data:[],
        source:"Finnhub"
      };
    })()
  ]);

  try{
    const rows=provider.rows;
    const insiders=provider.insiders;
    const providerChanges=rows.map((x:any)=>Number(x.change??x.changeInShares??0)).filter(Number.isFinite);
    const pInc=providerChanges.filter((x:number)=>x>0).length;
    const pDec=providerChanges.filter((x:number)=>x<0).length;
    const pNet=providerChanges.reduce((a:number,b:number)=>a+b,0);

    // Prefer direct provider rows when the user's entitlement supplies them.
    // Otherwise use NIVORA's SEC 13F cache produced by the quarterly sync job.
    const useProvider=rows.length>0;
    const increased=useProvider?pInc:Number(secCache?.increased_managers||0);
    const reduced=useProvider?pDec:Number(secCache?.reduced_managers||0);
    const netChange=useProvider?pNet:Number(secCache?.net_share_change||0);
    const reportingRows=useProvider?rows.length:Number(secCache?.reporting_managers||0);
    const direction=classify(increased,reduced,netChange);
    const top=useProvider
      ? rows.slice(0,10).map((x:any)=>({
          name:x.name||x.investorName||x.organization||"Reporting institution",
          shares:Number(x.share??x.shares??0)||null,
          change:Number(x.change??x.changeInShares??0)||null,
          percent:Number(x.percent??x.percentage??0)||null,
          filingDate:x.filingDate||x.reportDate||x.date||null
        }))
      : Array.isArray(secCache?.top_holders)?secCache.top_holders:[];

    const buys=insiders.filter((x:any)=>Number(x.change??0)>0);
    const sells=insiders.filter((x:any)=>Number(x.change??0)<0);
    const insiderTone=buys.length>sells.length*1.3?"Net buying":sells.length>buys.length*1.3?"Net selling":"Mixed";

    const hasInstitutional=useProvider||Boolean(secCache);
    const source=useProvider?"Finnhub reported ownership":secCache?"SEC Form 13F quarterly cache":provider.source;
    if(!hasInstitutional && insiders.length===0){
      return NextResponse.json({
        enabled:false,
        reason:"No verified institutional snapshot is cached yet for this symbol. Run the SEC 13F sync or connect a provider entitlement with ownership data.",
        source:source||"none",
        disclosure:"NIVORA will not label price/volume behavior as named institutional buying."
      });
    }

    return NextResponse.json({
      enabled:hasInstitutional,
      source,
      delayed:true,
      asOf:useProvider?(rows[0]?.filingDate||rows[0]?.reportDate||rows[0]?.date||null):(secCache?.period_end||null),
      disclosure:"Institutional direction describes changes in reported holdings, not real-time buying or selling today. Form 13F is delayed filing evidence; NIVORA keeps it separate from the daily accumulation proxy.",
      institutional:{
        label:direction.label,
        directionLabel:direction.directionLabel,
        reportingRows,
        reportingManagers:reportingRows,
        increased,
        reduced,
        netReportedShareChange:netChange,
        netChangeLabel:netChange===0?"No verified net share change":`${compact(netChange)} vs prior available period`,
        periodLabel:useProvider?"Provider-reported filing data":secCache?.period_end?`13F period ending ${secCache.period_end}`:"Latest SEC 13F cache",
        confidence:useProvider?"Provider reported":secCache?.match_confidence||"SEC issuer-name matched",
        top
      },
      insiders:{
        label:insiderTone,
        buys:buys.length,
        sells:sells.length,
        recent:insiders.slice(0,10).map((x:any)=>({
          name:x.name||"Insider",
          change:Number(x.change??0)||0,
          transactionPrice:Number(x.transactionPrice??0)||null,
          date:x.transactionDate||x.filingDate||null
        }))
      }
    });
  }catch(e:any){
    return NextResponse.json({enabled:false,reason:e?.message||"Institutional intelligence is temporarily unavailable."});
  }
}
