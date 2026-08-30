import {NextResponse} from "next/server";
import {ema,rsi,pct,rnd,clamp,atr,macd,sma} from "@/lib/quant";
import {sharedJson,nowIso} from "@/lib/shared-cache";
import {validateLongGeometry,classifyScanAction,categoryForScan,rankScanCandidate} from "@/lib/nivora-scan";

// Fallback only. Full-market Discover reads the persisted scanner table when the
// background universe scanner is configured. This seed keeps the product useful
// before the first full scan completes and is explicitly labelled in the response.
const DISCOVERY_SEED=[
"NVDA","MSFT","AAPL","AMZN","META","GOOGL","AVGO","TSLA","AMD","PLTR","CRWD","NFLX","UBER","SHOP","COIN","HOOD","SOFI","APP","HIMS","IREN",
"MU","ORCL","CRM","ADBE","NOW","PANW","ARM","SMCI","DELL","ANET","SNOW","DDOG","NET","MDB","ZS","FTNT","INTC","QCOM","AMAT","LRCX",
"JPM","BAC","GS","MS","V","MA","AXP","PYPL","SQ","COST","WMT","TGT","HD","LOW","NKE","SBUX","MCD","DIS","NFLX",
"LLY","UNH","JNJ","MRK","ABBV","TMO","ISRG","VRTX","REGN","XOM","CVX","CAT","GE","BA","RTX","LMT","NEE","CEG","VST","FSLR"
];

async function one(symbol:string,key:string){
  try{
    const u=`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=140&apikey=${key}`;
    const j=await sharedJson(u,["twelve","radar-v45",symbol],600,3800);
    if(!j.values)return null;
    const rows=j.values.slice().reverse();
    const c=rows.map((x:any)=>+x.close),h=rows.map((x:any)=>+x.high),l=rows.map((x:any)=>+x.low),v=rows.map((x:any)=>+x.volume||0);
    const p=c.at(-1)!; if(!Number.isFinite(p)||p<=0||c.length<55)return null;
    const e20=ema(c,20).at(-1)!,e50=ema(c,50).at(-1)!,rv=rsi(c),a=Math.max(.01,atr(rows));
    const ret5=p/(c.at(-6)??p)-1,ret20=p/(c.at(-21)??p)-1;
    const vol5=sma(v.slice(-5),Math.min(5,v.slice(-5).length))||0,vol20=sma(v,20)||0,volRatio=vol20?vol5/vol20:1;
    const m=macd(c);
    const trend=clamp(50+(p>e20?14:-14)+(e20>e50?16:-16)+ret20*110,5,95);
    const momentum=clamp(50+(rv-50)*.7+ret5*100+(m.hist>0?10:-10),5,95);
    const flow=clamp(50+(volRatio-1)*35+(ret5>0?8:-6),5,95);
    const extension=Math.abs(p-e20)/a;
    const extensionScore=clamp(extension*28,5,95);
    const technical=Math.round(trend*.35+momentum*.27+flow*.20+(100-extensionScore)*.18);
    const risk=clamp(25+(a/p)*600+extensionScore*.30,10,95);
    const entry=clamp(technical*.55+(100-risk)*.22+(rv>=38&&rv<=68?15:rv>75?-12:0)+(p<=e20*1.035?8:-4),5,95);
    const score=Math.round(technical*.58+entry*.27+(100-risk)*.15);

    const recentLow=Math.min(...l.slice(-30)),recentHigh=Math.max(...h.slice(-30));
    let entryLow=Math.max(recentLow,e20-a*.75),entryHigh=Math.min(p,e20+a*.20);
    if(entryLow>entryHigh){const tmp=entryLow;entryLow=entryHigh;entryHigh=tmp}
    // Stop must be meaningfully below the entry midpoint. Using min here prevents
    // tiny denominators that previously created 4,000x+ reward/risk values.
    const mid=(entryLow+entryHigh)/2;
    const stop=Math.min(recentLow-a*.35,e50-a*.90,mid-a*.75);
    const target1=Math.max(recentHigh,p+a*1.7,mid+a*1.4);
    const target2=Math.max(target1+a*1.25,p+a*3);
    const geometry=validateLongGeometry({entryLow,entryHigh,target1,target2,stop});

    const confidence=Math.round(clamp(48+Math.abs(technical-50)*.30+Math.min(20,Math.abs(ret20)*100)+Math.min(12,Math.max(0,volRatio-1)*16),45,91));
    const action=classifyScanAction({score,entry:Math.round(entry),risk:Math.round(risk),trend:Math.round(trend),momentum:Math.round(momentum),flow:Math.round(flow),extension:Math.round(extensionScore),geometryValid:geometry.geometryValid,rr:geometry.rr});
    const category=categoryForScan({action,trend:Math.round(trend),momentum:Math.round(momentum),flow:Math.round(flow),extension:Math.round(extensionScore),price:p,e20});
    const rankScore=rankScanCandidate({score,confidence,entry:Math.round(entry),risk:Math.round(risk),trend:Math.round(trend),momentum:Math.round(momentum),flow:Math.round(flow),extension:Math.round(extensionScore),rr:geometry.rr,geometryValid:geometry.geometryValid});
    const reason=action==="BUY / START"?"Timing, trend and validated reward/risk are aligned.":
      action==="START / PULLBACK"?"Constructive setup near a risk-defined entry area.":
      action==="DON'T CHASE"?"Trend is strong, but price is stretched.":
      action.includes("EXIT")||action==="AVOID"?"Risk and weak structure outweigh the current setup.":
      category==="Quality pullback"?"Constructive trend is returning toward a better entry.":"Setup is developing but still needs stronger confirmation.";

    return {symbol,price:rnd(p),changePct:rnd(pct(p,c.at(-2)??p)),score,rankScore,confidence,technical,entry:Math.round(entry),risk:Math.round(risk),action,category,reason,
      levels:{entryLow:geometry.entryLow,entryHigh:geometry.entryHigh,target1:geometry.target1,target2:geometry.target2,stop:geometry.stop,rr:geometry.rr,geometryValid:geometry.geometryValid,geometryReason:geometry.geometryReason||null},
      metrics:{rsi:rnd(rv),volumeRatio:rnd(volRatio),trend:Math.round(trend),momentum:Math.round(momentum),flow:Math.round(flow),extension:Math.round(extensionScore)}};
  }catch{return null}
}

export async function GET(req:Request){
  const key=process.env.TWELVE_DATA_API_KEY;
  if(!key)return NextResponse.json({items:[],partial:true,reason:"Market-data key unavailable",coverage:{mode:"unavailable",scanned:0}});
  const url=new URL(req.url),raw=url.searchParams.get("symbols")||"",radar=url.searchParams.get("radar")==="1";
  const requested=raw.split(",").map(x=>x.trim().toUpperCase()).filter(Boolean);
  const max=Math.max(1,Math.min(40,Number(url.searchParams.get("limit")||20)));
  const symbols=[...new Set((requested.length?requested:(radar?DISCOVERY_SEED:[])))].slice(0,max);
  if(!symbols.length)return NextResponse.json({items:[],coverage:{mode:"none",scanned:0}});
  const settled=await Promise.allSettled(symbols.map(s=>one(s,key)));
  const items=settled.map(x=>x.status==="fulfilled"?x.value:null).filter(Boolean).sort((a:any,b:any)=>b.rankScore-a.rankScore||b.score-a.score);
  return NextResponse.json({items,requested:symbols.length,returned:items.length,partial:items.length<symbols.length,
    coverage:{mode:requested.length?"requested-symbols":"seed-fallback",scanned:items.length,eligibleUniverse:null,fullMarket:false},
    freshness:{at:nowIso(),ttlSeconds:600}},
    {headers:{"Cache-Control":"public, s-maxage=600, stale-while-revalidate=1200"}});
}
