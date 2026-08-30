import {NextResponse} from "next/server";
import {ema,rsi,pct,rnd,clamp,atr,macd,sma} from "@/lib/quant";
import {sharedJson,nowIso} from "@/lib/shared-cache";

const DEFAULT_RADAR=["NVDA","MSFT","AAPL","AMZN","META","GOOGL","AVGO","TSLA","AMD","PLTR","CRWD","NFLX","UBER","SHOP","COIN","HOOD","SOFI","APP","HIMS","IREN"];

async function one(symbol:string,key:string){
  try{
    const u=`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=120&apikey=${key}`;
    const j=await sharedJson(u,["twelve","radar-v36",symbol],600,3500);
    if(!j.values)return null;
    const rows=j.values.slice().reverse();
    const c=rows.map((x:any)=>+x.close),h=rows.map((x:any)=>+x.high),l=rows.map((x:any)=>+x.low),v=rows.map((x:any)=>+x.volume||0);
    const p=c.at(-1)!; if(!Number.isFinite(p))return null;
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
    const entryLow=rnd(Math.max(recentLow,e20-a*.75)),entryHigh=rnd(Math.min(p,e20+a*.20));
    const stop=rnd(Math.max(recentLow-a*.35,e50-a*.9));
    const target1=rnd(Math.max(recentHigh,p+a*1.7));
    const target2=rnd(Math.max(target1+a*1.25,p+a*3));
    const mid=(entryLow+entryHigh)/2,rr=Math.max(.1,(target1-mid)/Math.max(.01,mid-stop));

    let action="WAIT";
    if(score>=80&&entry>=65&&risk<68)action="BUY / START";
    else if(trend>=68&&extensionScore>=68)action="DON'T CHASE";
    else if(score>=68&&entry>=55)action="WATCH ENTRY";
    else if(trend<38)action="AVOID / EXIT WATCH";

    let category="Watch";
    if(action==="BUY / START")category="Best now";
    else if(trend>=70&&momentum>=62&&extensionScore<65)category="Early momentum";
    else if(trend>=65&&p<=e20*1.035)category="Quality pullback";
    else if(action.includes("EXIT")||trend<38)category="Exit watch";
    else if(flow>=65&&momentum>=60)category="In play";

    const confidence=Math.round(clamp(48+Math.abs(technical-50)*.30+Math.min(20,Math.abs(ret20)*100)+Math.min(12,Math.max(0,volRatio-1)*16),45,91));
    const reason=action==="BUY / START"?"Trend, timing and risk/reward are aligned.":
      action==="DON'T CHASE"?"Trend is strong, but price is stretched.":
      action.includes("EXIT")?"Trend structure is weak; protect capital first.":
      category==="Quality pullback"?"Constructive trend is returning toward a better entry.":"Setup is improving but still needs confirmation.";

    return {symbol,price:rnd(p),changePct:rnd(pct(p,c.at(-2)??p)),score,confidence,technical,entry:Math.round(entry),risk:Math.round(risk),action,category,reason,
      levels:{entryLow,entryHigh,target1,target2,stop,rr:rnd(rr)},metrics:{rsi:rnd(rv),volumeRatio:rnd(volRatio),trend:Math.round(trend),momentum:Math.round(momentum)}};
  }catch{return null}
}

export async function GET(req:Request){
  const key=process.env.TWELVE_DATA_API_KEY;
  if(!key)return NextResponse.json({items:[],partial:true,reason:"Market-data key unavailable"});
  const url=new URL(req.url),raw=url.searchParams.get("symbols")||"",radar=url.searchParams.get("radar")==="1";
  const requested=raw.split(",").map(x=>x.trim().toUpperCase()).filter(Boolean);
  const symbols=[...new Set((requested.length?requested:(radar?DEFAULT_RADAR:[])))].slice(0,20);
  if(!symbols.length)return NextResponse.json({items:[]});
  const settled=await Promise.allSettled(symbols.map(s=>one(s,key)));
  const items=settled.map(x=>x.status==="fulfilled"?x.value:null).filter(Boolean).sort((a:any,b:any)=>b.score-a.score);
  return NextResponse.json({items,requested:symbols.length,returned:items.length,partial:items.length<symbols.length,freshness:{at:nowIso(),ttlSeconds:600}},
    {headers:{"Cache-Control":"public, s-maxage=600, stale-while-revalidate=1200"}});
}
