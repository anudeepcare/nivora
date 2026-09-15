import {NextResponse} from "next/server";
import {sharedJson} from "@/lib/shared-cache";
import {providerMarketHint} from "@/lib/auryn/v82/security-master";
const RANGE:any={"1D":{interval:"15min",size:32},"1W":{interval:"15min",size:140},"1M":{interval:"1day",size:32},"3M":{interval:"1day",size:75},"6M":{interval:"1day",size:150},"1Y":{interval:"1day",size:270},"3Y":{interval:"1day",size:800},"5Y":{interval:"1day",size:1350}};
export async function GET(req:Request,{params}:{params:Promise<{symbol:string}>}){
 const{symbol:raw}=await params,symbol=decodeURIComponent(raw).toUpperCase(),u=new URL(req.url),range=String(u.searchParams.get("range")||"3M").toUpperCase(),cfg=RANGE[range]||RANGE["3M"],key=process.env.TWELVE_DATA_API_KEY;
 if(!key)return NextResponse.json({error:"Market history provider unavailable."},{status:503});
 const hint=providerMarketHint(symbol),url=`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${cfg.interval}&outputsize=${cfg.size}&timezone=UTC${hint.exchange?`&exchange=${encodeURIComponent(hint.exchange)}`:""}&apikey=${key}`;
 try{const j=await sharedJson(url,["chart-range",symbol,range],range==="1D"||range==="1W"?60:900,1800);const rows=(Array.isArray(j?.values)?j.values:[]).map((x:any)=>({time:cfg.interval==="15min"?Math.floor(Date.parse(String(x.datetime).replace(" ","T")+"Z")/1000):String(x.datetime).slice(0,10),open:+x.open,high:+x.high,low:+x.low,close:+x.close,volume:+x.volume||0})).filter((x:any)=>[x.open,x.high,x.low,x.close].every(Number.isFinite)).reverse();return NextResponse.json({symbol,range,interval:cfg.interval,candles:rows},{headers:{"Cache-Control":"private, max-age=30"}})}
 catch(e:any){return NextResponse.json({error:e?.message||"Chart history unavailable."},{status:503})}
}
