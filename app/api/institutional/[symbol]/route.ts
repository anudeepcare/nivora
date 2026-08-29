import {NextResponse} from "next/server";
import {sharedJson} from "@/lib/shared-cache";

export const runtime="nodejs";

function isoDaysAgo(days:number){
  const d=new Date(Date.now()-days*86400000);
  return d.toISOString().slice(0,10);
}
function sum(xs:any[],key:string){return xs.reduce((a,x)=>a+(Number(x?.[key])||0),0)}
export async function GET(_:Request,{params}:{params:Promise<{symbol:string}>}){
  const {symbol:raw}=await params;
  const symbol=decodeURIComponent(raw).toUpperCase();
  if(symbol.includes("/"))return NextResponse.json({enabled:false,reason:"Institutional filings are not applicable to crypto."});
  const token=process.env.FINNHUB_API_KEY;
  if(!token)return NextResponse.json({enabled:false,reason:"Institutional feed not connected."});
  try{
    const [ownership,insider]=await Promise.allSettled([
      sharedJson(`https://finnhub.io/api/v1/stock/ownership?symbol=${encodeURIComponent(symbol)}&limit=30&token=${token}`,["finnhub","ownership",symbol],21600,4500),
      sharedJson(`https://finnhub.io/api/v1/stock/insider-transactions?symbol=${encodeURIComponent(symbol)}&from=${isoDaysAgo(180)}&to=${new Date().toISOString().slice(0,10)}&token=${token}`,["finnhub","insider",symbol],3600,4500)
    ]);
    const own:any=ownership.status==="fulfilled"?ownership.value:{};
    const ins:any=insider.status==="fulfilled"?insider.value:{};
    const rows=Array.isArray(own?.ownership)?own.ownership:Array.isArray(own?.data)?own.data:[];
    const insiders=Array.isArray(ins?.data)?ins.data:[];
    const changes=rows.map((x:any)=>Number(x.change??x.changeInShares??0)).filter(Number.isFinite);
    const inc=changes.filter((x:number)=>x>0).length, dec=changes.filter((x:number)=>x<0).length;
    const netChange=changes.reduce((a:number,b:number)=>a+b,0);
    const ownershipTone=rows.length===0?"Unavailable":inc>dec*1.25?"Accumulating":dec>inc*1.25?"Reducing":"Mixed";
    const buys=insiders.filter((x:any)=>Number(x.change??0)>0), sells=insiders.filter((x:any)=>Number(x.change??0)<0);
    const insiderTone=buys.length>sells.length*1.3?"Net buying":sells.length>buys.length*1.3?"Net selling":"Mixed";
    return NextResponse.json({
      enabled:true,
      source:"Finnhub institutional/insider endpoints",
      delayed:true,
      disclosure:"Reported ownership and insider filings are delayed regulatory/aggregated evidence, not real-time institutional order flow.",
      institutional:{
        label:ownershipTone,
        reportingRows:rows.length,
        increased:inc,
        reduced:dec,
        netReportedShareChange:netChange,
        top:rows.slice(0,8).map((x:any)=>({
          name:x.name||x.investorName||x.organization||"Reporting institution",
          shares:Number(x.share??x.shares??0)||null,
          change:Number(x.change??x.changeInShares??0)||null,
          percent:Number(x.percent??x.percentage??0)||null,
          filingDate:x.filingDate||x.reportDate||x.date||null
        }))
      },
      insiders:{
        label:insiderTone,
        buys:buys.length,
        sells:sells.length,
        recent:insiders.slice(0,8).map((x:any)=>({
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
