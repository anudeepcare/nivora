"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {
  Activity,
  BriefcaseBusiness,
  CalendarDays,
  ExternalLink,
  Info,
  Newspaper,
  PlusCircle,
  ShieldCheck,
  Star,
  Sparkles,
  Brain,
} from "lucide-react";
import SearchBox from "./SearchBox";
import PriceChart from "./PriceChart";
import {supabaseBrowser} from "@/lib/supabase";
import {buildNivoraIntelligence} from "@/lib/nivora-intelligence";

type Mode="now"|"swing"|"long"|"own";
type Depth="simple"|"investor"|"pro";
type Tab="overview"|"thesis"|"fundamentals"|"catalysts"|"news"|"earnings"|"technical"|"options";

const tone=(s:string)=>{
  const x=(s||"").toUpperCase();
  if(x.includes("BUY")||x.includes("CONSTRUCTIVE")||x.includes("HOLD")||x.includes("STRONG")||x.includes("ATTRACTIVE"))return"good";
  if(x.includes("CHASE")||x.includes("AVOID")||x.includes("REDUCE")||x.includes("NOT YET")||x.includes("WEAK")||x.includes("POOR"))return"bad";
  return"mid";
};

const money=(n:any)=>{
  const x=Number(n);
  if(!Number.isFinite(x))return String(n??"—");
  const a=Math.abs(x);
  return `${x<0?"-":""}$${a>=1e9?(a/1e9).toFixed(2)+"B":a>=1e6?(a/1e6).toFixed(1)+"M":a>=1e3?(a/1e3).toFixed(1)+"K":a.toLocaleString()}`;
};
const eps=(n:any)=>{const x=Number(n);return Number.isFinite(x)?`${x<0?"-":""}$${Math.abs(x).toFixed(2)}`:"—"};
const daysUntil=(d?:string|null)=>{if(!d)return null;return Math.ceil((new Date(d+"T12:00:00").getTime()-Date.now())/86400000)};

function Help({title,children}:{title:string;children?:React.ReactNode}){
  const [open,setOpen]=useState(false);
  const [pos,setPos]=useState<{left:number;top:number;width:number;below:boolean}|null>(null);
  const ref=useRef<HTMLSpanElement>(null);
  useEffect(()=>{
    if(!open)return;
    const place=()=>{
      const el=ref.current;if(!el)return;
      const r=el.getBoundingClientRect(), vw=window.innerWidth, vh=window.innerHeight;
      const width=Math.min(300,Math.max(240,vw-24)), pad=12;
      const left=Math.max(pad,Math.min(r.left+r.width/2-width/2,vw-width-pad));
      const estimated=150, below=r.bottom+10+estimated<vh-12;
      const top=below?r.bottom+8:Math.max(12,r.top-estimated-8);
      setPos({left,top,width,below});
    };
    place();
    const close=(e:PointerEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};
    const esc=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)};
    document.addEventListener("pointerdown",close);
    document.addEventListener("keydown",esc);
    window.addEventListener("resize",place);
    window.addEventListener("scroll",place,true);
    return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",esc);window.removeEventListener("resize",place);window.removeEventListener("scroll",place,true)};
  },[open]);
  return <span className="metricHelpInline" ref={ref}>
    <button type="button" aria-label={`Explain ${title}`} aria-expanded={open} onClick={(e:React.MouseEvent<HTMLButtonElement>)=>{e.stopPropagation();setOpen((v:boolean)=>!v)}}><Info size={13}/></button>
    {open&&pos&&<span
      className={`metricHelpPop ${pos.below?"below":"above"}`}
      style={{
        ["--help-left" as any]:`${pos.left}px`,
        ["--help-top" as any]:`${pos.top}px`,
        ["--help-width" as any]:`${pos.width}px`
      }}
      role="tooltip"
    ><b>{title}</b><span>{children}</span></span>}
  </span>;
}

function metricScore(mode:Mode,business:number,six:number,timing:number,risk:number){
  const safe=100-risk;
  const weights=mode==="long"
    ? {business:.50,six:.15,timing:.15,risk:.20}
    : mode==="own"
      ? {business:.40,six:.20,timing:.10,risk:.30}
      : mode==="swing"
        ? {business:.20,six:.30,timing:.30,risk:.20}
        : {business:.20,six:.20,timing:.40,risk:.20};
  return Math.max(0,Math.min(100,Math.round(
    business*weights.business+six*weights.six+timing*weights.timing+safe*weights.risk
  )));
}

export default function StockClient({symbol}:{symbol:string}){
  const thesisRef=useRef<HTMLElement>(null);
  const[d,setD]=useState<any>(null);
  const[company,setCompany]=useState<any>(null);
  const[context,setContext]=useState<any>(null);
  const[err,setErr]=useState("");
  const[horizon,setHorizon]=useState<"now"|"swing"|"long">("now");
  const[owns,setOwns]=useState(false);
  const mode:Mode=owns?"own":horizon;
  const[tab,setTab]=useState<Tab>("overview");
  const[watching,setWatching]=useState(false);
  const[optionsData,setOptionsData]=useState<any>(null);
  const[optionsLoading,setOptionsLoading]=useState(false);
  const[perfRange,setPerfRange]=useState<"6M"|"YTD"|"1Y">("6M");
  const[chartMode,setChartMode]=useState<"clean"|"trend">("clean");
  const[optionView,setOptionView]=useState<"setups"|"positioning">("setups");
  const[optionSide,setOptionSide]=useState<"bullish"|"bearish">("bullish");
  const[optionStyle,setOptionStyle]=useState<"conservative"|"balanced"|"aggressive"|"leaps">("balanced");
  const[optionExpiration,setOptionExpiration]=useState<string|null>(null);
  const[depth,setDepth]=useState<Depth>("simple");
  const[answerOpen,setAnswerOpen]=useState<"why"|"change"|"risk"|"evidence"|null>(null);
  const[auditOpen,setAuditOpen]=useState(false);
  const[institutional,setInstitutional]=useState<any>(null);

  useEffect(()=>{
    let live=true;
    let core:AbortController|null=null;

    const loadCore=async(initial=false)=>{
      if(initial){setD(null);setCompany(null);setContext(null);setInstitutional(null);setErr("")}
      core?.abort();
      core=new AbortController();
      const timer=setTimeout(()=>core?.abort(),6500);
      try{
        const r=await fetch(`/api/analyze/${encodeURIComponent(symbol)}`,{signal:core.signal,cache:"no-store"});
        const a=await r.json();
        if(!r.ok||a.error)throw new Error(a.error||"Analysis unavailable");
        if(!live)return;
        setD(a);
        if(initial){
          Promise.allSettled([
            fetch(`/api/company/${encodeURIComponent(symbol)}`,{cache:"no-store"}).then(r=>r.ok?r.json():null).then(x=>live&&x&&setCompany(x)),
            fetch(`/api/context/${encodeURIComponent(symbol)}`,{cache:"no-store"}).then(r=>r.ok?r.json():null).then(x=>live&&x&&setContext(x)),
            fetch(`/api/institutional/${encodeURIComponent(symbol)}`,{cache:"no-store"}).then(r=>r.ok?r.json():null).then(x=>live&&x&&setInstitutional(x)),
          ]);
        }
      }catch(e:any){
        if(initial&&live)setErr(e.name==="AbortError"?"Market data is taking too long. Try again.":e.message);
      }finally{clearTimeout(timer)}
    };

    const loadContext=()=>fetch(`/api/context/${encodeURIComponent(symbol)}`,{cache:"no-store"})
      .then(r=>r.ok?r.json():null).then(x=>live&&x&&setContext(x)).catch(()=>{});

    loadCore(true);
    const priceTimer=setInterval(()=>{if(document.visibilityState==="visible")loadCore(false)},30000);
    const newsTimer=setInterval(()=>{if(document.visibilityState==="visible")loadContext()},120000);
    const onFocus=()=>{loadCore(false);loadContext()};
    window.addEventListener("focus",onFocus);
    return()=>{live=false;core?.abort();clearInterval(priceTimer);clearInterval(newsTimer);window.removeEventListener("focus",onFocus)};
  },[symbol]);


  useEffect(()=>{
    if(tab!=="options"||d?.assetType==="crypto")return;
    const controller=new AbortController();
    setOptionsLoading(true);
    const qs=new URLSearchParams({style:optionStyle,side:optionSide==="bullish"?"call":"put"});
    if(optionExpiration)qs.set("expiration",optionExpiration);
    fetch(`/api/options/${encodeURIComponent(symbol)}?${qs.toString()}`,{cache:"no-store",signal:controller.signal})
      .then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x?.reason||x?.error||`Options request failed (${r.status})`);return x})
      .then(x=>setOptionsData(x))
      .catch((e:any)=>{if(e?.name!=="AbortError")setOptionsData({enabled:false,reason:e?.message||"Options intelligence could not load."})})
      .finally(()=>{if(!controller.signal.aborted)setOptionsLoading(false)});
    return()=>controller.abort();
  },[tab,symbol,d?.assetType,optionStyle,optionSide,optionExpiration]);

  async function watch(){
    const s=supabaseBrowser();
    const{data:{user}}=await s.auth.getUser();
    if(!user)return;
    let{data:w}=await s.from("watchlists").select("id").eq("user_id",user.id).limit(1).maybeSingle();
    if(!w){const x=await s.from("watchlists").insert({user_id:user.id,name:"My Watchlist"}).select("id").single();w=x.data}
    if(w){await s.from("watchlist_items").upsert({watchlist_id:w.id,user_id:user.id,symbol},{onConflict:"watchlist_id,symbol"});setWatching(true)}
  }

  const view=useMemo(()=>{
    if(!d)return null;
    if(mode==="now")return d.views.today;
    if(mode==="swing")return d.views.swing;
    if(mode==="own")return d.views.own;
    const f=company?.fundamentalSignal;
    if(f?.label==="Strong"&&d.scores.trend>=45)return{label:"ATTRACTIVE / WATCH ENTRY",tone:"good",text:"Business quality looks strong. Use price weakness selectively rather than chasing; valuation and catalysts still matter."};
    if(f?.label?.includes("Weak"))return{label:"RESEARCH BEFORE BUYING",tone:"bad",text:"The business-quality signals are weak or mixed enough that a lower price alone is not a reason to buy."};
    return d.views.longTerm;
  },[d,mode,company]);

  const proTech=useMemo(()=>{
    const cs=(d?.candles||[]).filter((x:any)=>Number.isFinite(Number(x.close)));
    if(cs.length<20)return null;
    const closes=cs.map((x:any)=>Number(x.close)), highs=cs.map((x:any)=>Number(x.high)), lows=cs.map((x:any)=>Number(x.low)), vols=cs.map((x:any)=>Number(x.volume||0));
    const last=closes.at(-1)??0;
    const avg=(a:number[])=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
    const sma=(n:number)=>closes.length>=n?avg(closes.slice(-n)):null;
    const s20=sma(20),s50=sma(50),s200=sma(200);
    const tr=cs.slice(1).map((x:any,i:number)=>Math.max(Number(x.high)-Number(x.low),Math.abs(Number(x.high)-closes[i]),Math.abs(Number(x.low)-closes[i])));
    const atr14=tr.length>=14?avg(tr.slice(-14)):null;
    const ret=closes.slice(1).map((x:number,i:number)=>Math.log(x/closes[i])).filter(Number.isFinite);
    const rv=ret.length>=20?Math.sqrt(avg(ret.slice(-20).map((x:number)=>x*x)))*Math.sqrt(252)*100:null;
    const mean20=s20, sd20=mean20!=null?Math.sqrt(avg(closes.slice(-20).map((x:number)=>(x-mean20)**2))):null;
    const upper=mean20!=null&&sd20!=null?mean20+2*sd20:null, lower=mean20!=null&&sd20!=null?mean20-2*sd20:null;
    const bbPos=upper!=null&&lower!=null&&upper>lower?((last-lower)/(upper-lower))*100:null;
    const vol20=avg(vols.slice(-20)), volRatio=vol20>0?(vols.at(-1)??0)/vol20:null;
    const pct=(v:number|null)=>v&&last?((last/v)-1)*100:null;
    const drawdown=closes.length?((last/Math.max(...closes.slice(-252)))-1)*100:null;
    return {atr14,atrPct:atr14&&last?atr14/last*100:null,rv,sma20:s20,sma50:s50,sma200:s200,d20:pct(s20),d50:pct(s50),d200:pct(s200),bbPos,volRatio,drawdown};
  },[d?.candles]);

  const intelligence=useMemo(()=>buildNivoraIntelligence({
    market:d,company,context,options:optionsData,mode
  }),[d,company,context,optionsData,mode]);

  const quickAnswers=useMemo(()=>{
    if(!intelligence)return null;
    return {
      why:`${intelligence.biggestPositive} ${intelligence.biggestRisk?`The main reason not to be more aggressive is: ${intelligence.biggestRisk}`:""}`,
      change:`The next decision trigger is ${intelligence.nextDecision}. A stronger call also needs better alignment across entry, momentum, flow and catalysts.`,
      risk:`${intelligence.biggestRisk} ${intelligence.bearTriggers?.[0]?`Key deterioration trigger: ${intelligence.bearTriggers[0]}.`:""}`,
      evidence:intelligence.contradictions?.length
        ?`The engine sees disagreement: ${intelligence.contradictions[0]}`
        :`The major evidence layers are broadly aligned. Confidence is ${intelligence.confidenceLabel.toLowerCase()} with ${intelligence.confidence}/100 evidence coverage.`
    };
  },[intelligence]);

  const enterprise=useMemo(()=>{
    if(!d||!intelligence)return null;
    const now=Date.now();
    const freshness=[
      {name:"Price / decision",ok:true,label:"near-live shared cache"},
      {name:"Fundamentals",ok:!!company?.fundamentalSignal,label:company?.fundamentalSignal?"SEC/company evidence loaded":"missing"},
      {name:"Institutional",ok:d.assetType==="crypto"||!!institutional?.enabled,label:d.assetType==="crypto"?"not applicable":institutional?.enabled?"reported ownership/insider evidence loaded":"not available"},
      {name:"News / catalysts",ok:!!context?.enabled,label:context?.enabled?"context feed loaded":"missing"},
      {name:"Earnings",ok:!!context?.earnings,label:context?.earnings?.date||"not identified"},
      {name:"Options",ok:d.assetType==="crypto"||!!optionsData?.enabled,label:d.assetType==="crypto"?"not applicable":optionsData?.enabled?(optionsData.dataMode||"provider snapshot"):"not loaded"}
    ];
    const coverage=Math.round(freshness.filter(x=>x.ok).length/freshness.length*100);
    const dataQuality=Math.round((coverage*.55)+(intelligence.confidence*.45));
    const auditId=`${symbol}-${mode}-${Math.round(Number(d.price||0)*100)}-${intelligence.score}`;
    const validationStatus="Shadow validation enabled";
    return {freshness,coverage,dataQuality,auditId,validationStatus,engineVersion:"NIVORA V32.1",generatedAt:new Date(now).toISOString()};
  },[d,intelligence,company,context,optionsData,institutional,symbol,mode]);

  useEffect(()=>{
    if(!d||!intelligence||!enterprise||typeof window==="undefined")return;
    const key=`nivora-validation:${enterprise.auditId}`;
    if(sessionStorage.getItem(key))return;
    sessionStorage.setItem(key,"1");
    fetch("/api/validation/snapshot",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
      symbol,engineVersion:enterprise.engineVersion,mode,price:d.price,score:intelligence.score,
      confidence:intelligence.confidence,action:intelligence.action,thesisLabel:intelligence.thesisLabel,
      dimensions:intelligence.dimensions,levels:d.levels,auditId:enterprise.auditId,
      evidence:{coverage:enterprise.coverage,dataQuality:enterprise.dataQuality,contradictions:intelligence.contradictions}
    })}).catch(()=>{});
  },[d?.price,intelligence?.score,intelligence?.confidence,enterprise?.auditId,symbol,mode]);

  if(err)return <div className="osError"><b>Couldn’t analyze {symbol}</b><span>{err}</span><button onClick={()=>location.reload()}>Try again</button></div>;
  if(!d||!view)return <div className="osStockLoading"><div className="osLogo">NIVORA<span>.</span></div><b>Analyzing {symbol}</b><span>Building the decision first. Evidence loads after.</span></div>;

  const business=company?.fundamentalSignal||{label:d.assetType==="crypto"?"Crypto":"Loading",tone:"neutral",reasons:[]};
  const news=context?.summary||{label:context?.enabled===false?"Feed not connected":"Loading",tone:"neutral",topReason:""};
  const earn=context?.earnings;
  const earnDays=daysUntil(earn?.date);
  const filings=company?.filings||[];
  const items=context?.news||[];
  const latestEarnNews=context?.latestEarningsNews;
  const latestReport=latestEarnNews||filings.find((f:any)=>["10-K","10-Q","20-F","6-K"].includes(f.form));
  const catalystLabel=earn?`Earnings ${earnDays!=null&&earnDays>=0?`in ${earnDays}d`:earn.date}`:company?.filingRisk?"Financing watch":filings[0]?filings[0].label:"None found";
  const changeAbs=Math.abs(d.changePct);
  const topNews=items.find((x:any)=>x.materiality==="High")||items[0];
  const moveReason=topNews?topNews.headline:changeAbs>=4?"No single material headline was identified yet. Treat the move as price/volume-driven until new evidence appears.":"No unusual move requiring a specific headline explanation was detected.";
  const fundamentalPos=(business?.positiveReasons||[]).filter(Boolean);
  const fundamentalRisk=(business?.riskReasons||[]).filter(Boolean);
  const positive=[...fundamentalPos,...(d.positives||[])].filter(Boolean).slice(0,4);
  const risks=[...fundamentalRisk,...(company?.filingRisk?[company.filingRisk.label]:[]),...(news.tone==="negative"?[news.topReason]:[]),...(d.risks||[])].filter(Boolean).slice(0,4);

  const five=company?.fiveYearRecord;
  const businessScore=Number(business?.score??50);
  const sixScore=Number(d.sixMonth?.score??50);
  const timingScore=Number(d.scores?.entry??50);
  const riskScore=Number(d.scores?.risk??50);
  const overallScore=metricScore(mode,businessScore,sixScore,timingScore,riskScore);
  const overallLabel=overallScore>=80?"Excellent evidence":overallScore>=65?"Promising / selective":overallScore>=50?"Mixed / wait":"Weak setup";
  const confidenceCount=[company?.fundamentalSignal,d?.candles?.length>=60,context!==null,d?.market?.regime].filter(Boolean).length;
  const confidence=confidenceCount>=4?"High":confidenceCount>=3?"Medium":"Low";
  const scoreFormula=mode==="long"
    ? "Long-term mode emphasizes business quality (50%), then 6-month record, timing and risk."
    : mode==="own"
      ? "Owner mode emphasizes business quality and downside risk more than fresh-entry timing."
      : mode==="swing"
        ? "Swing mode emphasizes 6-month behavior and current timing, while still checking business quality and risk."
        : "Now mode emphasizes current entry quality, then business quality, 6-month behavior and risk.";

  const beginnerReason=view.label.includes("BUY")
    ? "The evidence is strong enough to consider a disciplined entry at the mapped price levels."
    : view.label.includes("HOLD")
      ? "If you already own it, the current evidence does not require an immediate exit, but the risk levels still matter."
      : "The stock may still be a good company, but today is not a strong enough entry yet.";
  const fiveRecordText=five?String(five.years)+"-year record · "+String(five.revenueTrend):"Loading financial history";
  const sixMonthText=d.sixMonth?(d.sixMonth.returnPct>=0?"+":"")+String(d.sixMonth.returnPct)+"% return":"Price history";
  const betterEntryText="$"+String(d.levels.preferredEntry)+"–$"+String(d.levels.support);
  const confirmationText="Above $"+String(d.levels.breakout);
  const invalidationText="Below $"+String(d.levels.invalidation);
  const supportText="Support $"+String(d.levels.support);
  const resistanceText="Resistance $"+String(d.levels.resistance);
  const todayMoveText=changeAbs>=4?"Large "+(d.changePct>=0?"move up":"move down")+": "+(d.changePct>=0?"+":"")+String(d.changePct)+"%":"Today’s move";
  const nextCatalystTitle=earn?"Earnings · "+String(earn.date):(filings[0]?.label||"No scheduled catalyst found");
  const nextCatalystDetail=earn?String(earn.hour||"Timing not listed")+(earn.epsEstimate!=null?" · EPS est. "+String(earn.epsEstimate):""):filings[0]?String(filings[0].form)+" filed "+String(filings[0].date):"NIVORA will surface a catalyst when a connected source identifies one.";
  const marketContextText=d.market.benchmark?String(symbol)+" is "+String(d.market.relativeStrength).toLowerCase()+" versus "+String(d.market.benchmark)+" over the recent period.":"Crypto benchmark context is handled separately.";
  const selectedReturn=perfRange==="6M"?d.performance?.sixMonthPct??d.sixMonth?.returnPct??null:
    perfRange==="YTD"?d.performance?.ytdPct??null:d.performance?.oneYearPct??null;
  const currentPx=Number(d.price);
  const supportPx=Number(d.levels.support), breakoutPx=Number(d.levels.breakout), invalidPx=Number(d.levels.invalidation);
  const upside=Number.isFinite(currentPx)&&currentPx?((breakoutPx/currentPx-1)*100):null;
  const downside=Number.isFinite(currentPx)&&currentPx?((invalidPx/currentPx-1)*100):null;
  const rr=upside!=null&&downside!=null&&downside<0?Math.abs(upside/downside):null;

  const marketLab=(()=>{
    const cs=(d?.candles||[]).filter((x:any)=>Number.isFinite(Number(x.close))&&Number.isFinite(Number(x.high))&&Number.isFinite(Number(x.low)));
    if(cs.length<40)return null;
    const recent=cs.slice(-Math.min(160,cs.length));
    const highs=recent.map((x:any)=>Number(x.high)), lows=recent.map((x:any)=>Number(x.low)), closes=recent.map((x:any)=>Number(x.close));
    const hi=Math.max(...highs), lo=Math.min(...lows), range=hi-lo, last=closes.at(-1)??0;
    const hiIdx=highs.lastIndexOf(hi), loIdx=lows.lastIndexOf(lo), rising=loIdx<hiIdx;
    const fib=(ratio:number)=>Number((rising?hi-range*ratio:lo+range*ratio).toFixed(2));
    const fib382=fib(.382),fib50=fib(.5),fib618=fib(.618);
    const vol=(d?.scores?.flow??50), trend=(d?.scores?.trend??50), momentum=(d?.scores?.momentum??50), structure=(d?.scores?.structure??50);
    const accumulation=Math.max(0,Math.min(100,Math.round(vol*.48+trend*.22+momentum*.14+structure*.16)));
    const accumulationLabel=accumulation>=70?"Accumulating":accumulation>=55?"Constructive":accumulation>=42?"Mixed":"Distribution risk";
    const waveScore=Math.max(20,Math.min(85,Math.round(structure*.45+trend*.35+momentum*.20)));
    const waveLabel=trend>=62&&structure>=60?"Advancing impulse candidate":trend<42?"Corrective / weak structure":"Developing structure";
    const waveTarget=trend>=62?Number((hi+range*.272).toFixed(2)):Number((fib382).toFixed(2));
    const waveInvalidation=trend>=62?fib618:Number(d?.levels?.breakout||hi);
    const dcaLow=Math.min(Number(d?.levels?.preferredEntry||last),Number(d?.levels?.support||last),fib50);
    const dcaHigh=Math.max(Number(d?.levels?.preferredEntry||last),Number(d?.levels?.support||last));
    return {hi,lo,fib382,fib50,fib618,accumulation,accumulationLabel,waveScore,waveLabel,waveTarget,waveInvalidation,dcaLow:Number(dcaLow.toFixed(2)),dcaHigh:Number(dcaHigh.toFixed(2))};
  })();

  const institutionalLabel=institutional?.enabled
    ? institutional?.institutional?.label||"Mixed"
    : "Not available";
  const institutionalTone=institutionalLabel==="Accumulating"?"good":institutionalLabel==="Reducing"?"bad":"mid";

  const ownerAction=(()=>{
    if(!owns)return view.label;
    const b=Number(business?.score??50),r=Number(d.scores?.risk??50),e=Number(d.scores?.entry??50),ext=Number(d.scores?.extension??50),t=Number(d.scores?.trend??50);
    if(currentPx<=invalidPx||b<38)return"REASSESS / EXIT RISK";
    if(ext>=78&&currentPx>=Number(d.levels.resistance||Infinity))return"TRIM / HOLD";
    if(e>=66&&r<70&&t>=50)return"ADD SELECTIVELY";
    if(r>=78||t<35)return"HOLD / REDUCE RISK";
    return"HOLD";
  })();

  const commandReason=owns
    ? ownerAction.startsWith("ADD")?"The thesis remains intact and the current location is attractive enough for a measured add."
      : ownerAction.startsWith("TRIM")?"The position remains healthy, but price is extended enough that trimming risk can be more disciplined than adding."
      : ownerAction.includes("EXIT")?"Price or business evidence has crossed a thesis-risk threshold. Reassess the position before adding more risk."
      : "The thesis remains intact enough to hold. Use the add, trim and reassessment levels instead of reacting to daily noise."
    : view.text;

  const commandScore=intelligence?.score??overallScore;
  const commandConfidence=intelligence?.confidenceLabel||confidence;
  const openResearch=(nextTab:Tab="thesis")=>{
    setTab(nextTab);
    requestAnimationFrame(()=>setTimeout(()=>thesisRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),80));
  };

  const derivativesScore=Number(intelligence?.dimensions?.derivatives ?? 50);
  const valuationScore=Number(intelligence?.valuation ?? 50);
  // Institutions must only represent verified reported ownership/13F evidence.
  // Never substitute the price/volume accumulation proxy into this slot.
  const institutionalQuick=institutional?.enabled
    ? (institutional?.institutional?.directionLabel||institutionalLabel)
    : "13F not loaded";
  const institutionalQuickTone=institutional?.enabled ? institutionalTone : "mid";
  const signalRows=[
    ["Business",business.label,tone(business.label)],
    ["Trend",d.labels.trend,tone(d.labels.trend)],
    ["Entry",d.labels.entry,tone(d.labels.entry)],
    ["Institutions",institutionalQuick,institutionalQuickTone],
    ["Options",optionsData?.enabled?(derivativesScore>=60?"Supportive":derivativesScore<45?"Cautious":"Neutral"):"Not loaded",optionsData?.enabled?(derivativesScore>=60?"good":derivativesScore<45?"bad":"mid"):"mid"],
    ["Valuation",valuationScore>=65?"Attractive":valuationScore<45?"Expensive":"Fair",valuationScore>=65?"good":valuationScore<45?"bad":"mid"]
  ];

  return <div className="osStock v12Stock v18Stock">
    <div className="osStockSearch"><SearchBox/></div>

    <header className="osStockHead v12StockHead">
      <div><small>{company?.name||d.name||symbol}</small><h1>{symbol}</h1></div>
      <div><b>${d.price}</b><span className={d.changePct>=0?"up":"down"}>{d.changePct>=0?"+":""}{d.changePct}%</span></div>
    </header>

    <div className="liveFresh"><span className="liveStatus"><span className="liveDot"/>Near-live · shared cache</span><span className="liveCadence">Prices/decision ~30–45 sec · News ~2 min</span></div>

    <div className="v32QuestionBar">
      <div>
        <span>Time horizon</span><Help title="Time horizon">Now prioritizes immediate entry quality. Swing emphasizes price behavior and confirmation. Long term gives business quality and valuation more weight.</Help>
        <div className="osMode v12Mode v32Horizon" aria-label="Investment horizon">
          <button className={horizon==="now"?"on":""} onClick={()=>setHorizon("now")}>Now</button>
          <button className={horizon==="swing"?"on":""} onClick={()=>setHorizon("swing")}>Swing</button>
          <button className={horizon==="long"?"on":""} onClick={()=>setHorizon("long")}>Long term</button>
        </div>
      </div>
      <div>
        <span>My position</span><Help title="My position">Looking to buy answers whether a new entry makes sense. I own it changes the decision to ADD, HOLD, TRIM or REASSESS and gives owner-specific levels.</Help>
        <div className="osMode v12Mode v32Position" aria-label="Position status">
          <button className={!owns?"on":""} onClick={()=>setOwns(false)}>Looking to buy</button>
          <button className={owns?"on":""} onClick={()=>setOwns(true)}>I own it</button>
        </div>
      </div>
    </div>

    <div className="v28DepthBar">
      <div><Sparkles size={15}/><span>View</span><Help title="View depth">Simple gives the answer first. Investor adds the research needed to validate the thesis. Pro exposes the full technical, options and model evidence without changing the underlying NIVORA decision.</Help></div>
      <div className="v28DepthToggle" role="tablist" aria-label="Analysis depth">
        <button className={depth==="simple"?"on":""} onClick={()=>setDepth("simple")}>Simple</button>
        <button className={depth==="investor"?"on":""} onClick={()=>setDepth("investor")}>Investor</button>
        <button className={depth==="pro"?"on":""} onClick={()=>setDepth("pro")}>Pro</button>
      </div>
    </div>

    {depth!=="simple"&&intelligence&&<section className="v31Grid" aria-label="NIVORA Intelligence Grid">
      <div className="v31GridHead"><div><small>NIVORA INTELLIGENCE GRID</small><h3>Independent evidence, synthesized into one thesis.</h3><p>Each engine answers a different question. NIVORA combines them for the selected horizon, exposes disagreement, and limits confidence when evidence is incomplete.</p></div><Help title="Intelligence Grid">This is NIVORA’s synthesis architecture—not a claim that every input is AI-generated. Market and company data remain measured inputs; the decision layer combines, weights and explains them.</Help></div>
      <div className="v31EngineStrip">{[["BUSINESS",intelligence.dimensions.business,"Is the company strong?"],["VALUATION",intelligence.dimensions.valuation,"What are we paying?"],["TREND",intelligence.dimensions.trend,"What is price doing?"],["ENTRY",intelligence.dimensions.timing,"Is now attractive?"],["FLOW",intelligence.dimensions.flow,"Is participation confirming?"],["CATALYSTS",intelligence.dimensions.catalysts,"What can change the thesis?"],["DERIVATIVES",intelligence.dimensions.derivatives,"What does options context add?"],["RISK",100-intelligence.dimensions.risk,"How much safety remains?"]].map(([name,score,q]:any)=><div key={name}><small>{name}</small><b>{score}/100</b><span>{q}</span><i><em style={{width:`${Math.max(0,Math.min(100,Number(score)))}%`}}/></i></div>)}</div>
      <div className="v31Synthesis"><Brain size={16}/><div><small>SYNTHESIS</small><b>{intelligence.thesisLabel} · {intelligence.score}/100</b><span>{intelligence.contradictions.length?`${intelligence.contradictions.length} evidence contradiction${intelligence.contradictions.length>1?"s":""} detected and reflected in confidence.`:"Major evidence layers are broadly aligned."}</span></div><div className="v31Next"><small>NEXT TRIGGER</small><b>{intelligence.nextDecision}</b></div></div>
    </section>}

    {depth==="pro"&&enterprise&&intelligence&&<section className="v29ProCockpit">
      <div className="proCockpitHead"><div><small>PRO WORKSPACE</small><h3>Decision evidence & model diagnostics</h3><p>Same NIVORA call, with the underlying factor, data-quality and audit evidence exposed.</p></div><button type="button" onClick={()=>setAuditOpen(!auditOpen)}><ShieldCheck size={15}/>{auditOpen?"Hide audit":"Audit trail"}</button></div>
      <div className="proCockpitGrid">
        <div><small>MODEL</small><b>{enterprise.engineVersion}</b><span>{mode.toUpperCase()} weighting · regime aware</span></div>
        <div><small>MARKET REGIME</small><b>{intelligence.regime?.label}</b><span>{intelligence.regime?.score}/100 environment score</span></div>
        <div><small>VALUATION</small><b>{intelligence.valuation}/100</b><span>Valuation contribution to the current horizon</span></div>
        <div><small>DATA QUALITY</small><b>{enterprise.dataQuality}/100</b><span>{enterprise.coverage}% evidence sources present</span></div>
        <div><small>MODEL CONFIDENCE</small><b>{intelligence.confidence}/100</b><span>{intelligence.confidenceLabel}</span></div>
        <div><small>CONTRADICTIONS</small><b>{intelligence.contradictions.length}</b><span>{intelligence.contradictions[0]||"Evidence broadly aligned"}</span></div>
        <div><small>VALIDATION</small><b>SHADOW</b><span>Forward outcomes are recorded for calibration</span></div>
        <div><small>AUDIT ID</small><b className="auditId">{enterprise.auditId}</b><span>Reproducible decision fingerprint</span></div>
      </div>
      {auditOpen&&<div className="v29Audit">
        <div><small>EVIDENCE STATUS</small>{enterprise.freshness.map((x:any)=><p key={x.name}><span className={x.ok?"auditOk":"auditBad"}>{x.ok?"●":"○"}</span><b>{x.name}</b> · {x.label}</p>)}</div>
        <div><small>DECISION ATTRIBUTION</small>{Object.entries(intelligence.dimensions).map(([k,v]:any)=><p key={k}><b>{k}</b><span>{v}/100</span></p>)}</div>
        <div><small>REPRODUCIBILITY</small><p>Engine: {enterprise.engineVersion}</p><p>Generated: {new Date(enterprise.generatedAt).toLocaleString()}</p><p>Mode: {mode}</p><p>Symbol: {symbol}</p></div>
      </div>}
    </section>}

    {depth!=="simple"&&<section className="v19Performance" aria-label="Quick market context">
      <div><div className="metricLabel"><small>PERFORMANCE</small><Help title="Performance">Price return over the selected period using available market history. Performance describes what happened; it does not predict what happens next.</Help></div><b>{selectedReturn==null?"—":`${selectedReturn>=0?"+":""}${selectedReturn}%`}</b><div className="v19Range">{(["6M","YTD","1Y"] as const).map(r=><button key={r} className={perfRange===r?"on":""} onClick={()=>setPerfRange(r)}>{r}</button>)}</div></div>
      <div><div className="metricLabel"><small>52-WEEK POSITION</small><Help title="52-week position">Shows where today’s price sits between the last 52-week low and high. Near the high is not automatically bad; it simply adds price-location context.</Help></div><b>{d.performance?.rangePositionPct!=null?`${d.performance.rangePositionPct}%`:"—"}</b><span>{d.performance?.yearLow!=null&&d.performance?.yearHigh!=null?`Low $${d.performance.yearLow} · High $${d.performance.yearHigh}`:"Waiting for 1-year history"}</span></div>
      <div><div className="metricLabel"><small>RISK / REWARD</small><Help title="Risk / reward">Compares the distance from today’s price to NIVORA’s confirmation level with the distance to its reassessment level. It is a technical planning ratio, not a forecast.</Help></div><b>{rr==null?"—":`${rr.toFixed(1)}×`}</b><span>{upside==null||downside==null?"Waiting for levels":`${upside>=0?"+":""}${upside.toFixed(1)}% to confirmation · ${downside.toFixed(1)}% to reassess`}</span></div>
      <div><div className="metricLabel"><small>DATA CONFIDENCE</small><Help title="Data confidence">Shows whether price history, business data, market context and news/catalyst sources are available. Higher confidence means better evidence coverage—not higher certainty of profit.</Help></div><b className={confidence==="High"?"good":confidence==="Low"?"bad":"mid"}>{confidence}</b><span>Price + business + news + market coverage.</span></div>
    </section>}

    <section className={["v32Command",tone(ownerAction)].join(" ")} aria-label="NIVORA decision">
      <div className="v32CommandHero">
        <div>
          <div className="v32CommandEyebrow"><span>NIVORA DECISION</span><Help title="NIVORA decision">The fastest summary of the current evidence for your selected horizon and position status. It changes as price, fundamentals, catalysts, risk and supporting evidence change.</Help></div>
          <div className="v32ActionLine"><h2>{ownerAction}</h2><span><b>{commandScore}</b>/100 · {commandConfidence} confidence</span></div>
          <p>{commandReason}</p>
        </div>
        <div className="v32NextTrigger"><small>NEXT DECISION TRIGGER</small><b>{intelligence?.nextDecision||confirmationText}</b><span>What NIVORA is waiting for next.</span></div>
      </div>

      <div className="v32Levels">
        <div><small>{owns?"ADD ZONE":"BUY ZONE"}</small><b>{betterEntryText}</b><span>{owns?"Add only if the thesis remains intact and price stabilizes.":"Prefer stabilization instead of buying simply because price is falling."}</span></div>
        <div><small>{owns?"TRIM / STRENGTH ZONE":"CONFIRM"}</small><b>{owns?`$${d.levels.resistance}–$${d.levels.breakout}`:confirmationText}</b><span>{owns?"Consider trimming only when extension/risk rises; this is not an automatic sell target.":"A strong close/retest with improving participation strengthens the setup."}</span></div>
        <div><small>REASSESS</small><b>{invalidationText}</b><span>{owns?"Thesis risk rises here. Recheck business, catalysts and position size.":"Technical thesis materially weakens below this area."}</span></div>
      </div>

      <div className="v32Signals">
        <div className="v32SignalsTitle"><small>WHAT NIVORA SEES</small><span>Interpretation first. Tap deeper research only if you need it.</span></div>
        <div className="v32SignalRail">{signalRows.map(([name,label,cls]:any)=><div key={name}><small>{name}</small><b className={cls}>{label}</b></div>)}</div>
      </div>

      <div className="v32CommandFooter">
        <div><b>What changes the decision?</b><span>{quickAnswers?.change||intelligence?.nextDecision||"Wait for stronger evidence alignment."}</span></div>
        <div className="v32CommandActions">
          <button type="button" onClick={()=>openResearch("thesis")}>Why?</button>
          <button type="button" onClick={()=>{if(depth==="simple")setDepth("investor");openResearch("thesis")}}>Explore analysis</button>
        </div>
      </div>
    </section>

    {depth!=="simple"&&intelligence&&quickAnswers&&<section className="v28AnswerFirst">
      <div className="v28AnswerHeadline">
        <div><small>NIVORA ANSWER</small><b>{intelligence.thesisLabel} · {intelligence.confidenceLabel} confidence</b><p>{intelligence.biggestPositive} <strong>Watch:</strong> {intelligence.biggestRisk}</p>
          <div className="v30Expression"><span>BEST EXPRESSION</span><b>{intelligence.bestExpression?.type}</b><em>{intelligence.bestExpression?.reason}</em></div>
        </div>
        <button type="button" onClick={()=>openResearch("thesis")}><Brain size={16}/> Full thesis</button>
      </div>
      <div className="v28QuestionRow">
        {[
          ["why","Why not more aggressive?"],
          ["change","What changes the call?"],
          ["risk","Biggest risk?"],
          ["evidence","Do signals disagree?"]
        ].map(([key,label])=><button type="button" key={key} className={answerOpen===key?"on":""} onClick={()=>setAnswerOpen(answerOpen===key?null:key as any)}>{label}</button>)}
      </div>
      {answerOpen&&<div className="v28AnswerBody">{quickAnswers[answerOpen]}</div>}
    </section>}

    {depth!=="simple"&&<section className="v18DecisionStrip">
      <div><small>BUSINESS</small><b className={tone(business.label)}>{business.label}</b><Help title="Business quality">Scored from reported growth, profitability, cash generation, balance-sheet evidence and multi-year consistency when SEC data is available.</Help></div>
      <div><small>TREND</small><b className={tone(d.labels.trend)}>{d.labels.trend}</b><Help title="Trend">Uses multiple price horizons and structure. A strong trend can still receive a WAIT if the entry is stretched.</Help></div>
      <div><small>ENTRY</small><b className={tone(d.labels.entry)}>{d.labels.entry}</b><Help title="Entry quality">Combines price location, support/resistance, momentum, extension and downside risk. This answers “is today a good place to start?”</Help></div>
      <div><small>RISK</small><b className={d.labels.risk==="High"?"bad":d.labels.risk==="Lower"?"good":"mid"}>{d.labels.risk}</b><Help title="Risk">Reflects volatility, extension, downside structure and market context. High risk does not automatically mean a bad company.</Help></div>
      <div><small>CONFIDENCE</small><b className={confidence==="High"?"good":confidence==="Low"?"bad":"mid"}>{confidence}</b><Help title="Decision confidence">Confidence rises when price history, business data, market context and current news/catalyst data are all available. Low confidence means treat the call more cautiously.</Help></div>
    </section>}

    <div className="osMicroActions v12Actions">
      <button onClick={watch}><Star size={16} fill={watching?"currentColor":"none"}/>{watching?"Watching":"Add to watchlist"}</button>
      <Link href={"/portfolio?symbol="+encodeURIComponent(symbol)}><PlusCircle size={16}/>Track position</Link>
      <span>{supportText}</span><span>{resistanceText}</span>
    </div>

    <section className="v12Pulse v18Pulse">
      <div><small>WHAT CHANGED TODAY</small><h3>{todayMoveText}</h3><p>{moveReason}</p>{topNews?.url&&<a href={topNews.url} target="_blank" rel="noreferrer">Read source <ExternalLink size={13}/></a>}</div>
      <div><small>NEXT CATALYST</small><h3>{nextCatalystTitle}</h3><p>{nextCatalystDetail}</p></div>
      <div><small>MARKET CONTEXT</small><h3>{d.market.regime}</h3><p>{marketContextText}</p></div>
    </section>

    {depth!=="simple"&&<section className="osChartCard v12Chart">
      <div className="osSectionTitle"><div><small>PRICE MAP</small><h3>What price has to do next</h3></div><span>Green = entry/support · Orange = confirmation · Red = reassess</span></div>
      <div className="chartControls"><div><button className={chartMode==="clean"?"on":""} onClick={()=>setChartMode("clean")}>Clean</button><button className={chartMode==="trend"?"on":""} onClick={()=>setChartMode("trend")}>Trend</button></div><Help title="Chart modes">Clean keeps only price, volume and NIVORA levels. Trend adds 20-day and 50-day moving averages for users who want more technical context.</Help></div>
      <PriceChart candles={d.candles} levels={d.levels} showTrend={chartMode==="trend"}/>
    </section>}

    {depth==="pro"&&<section className="beginnerScore v18Score">
      <div className="beginnerScoreMain">
        <div className="decisionEyebrow"><small>NIVORA SCORE</small><Help title="How is the NIVORA score calculated?">{scoreFormula} The score is a summary, not the decision itself. 80–100 = excellent evidence, 65–79 = promising/selective, 50–64 = mixed, below 50 = weak. The action above can still be WAIT when price is extended.</Help></div>
        <div className="scoreLine"><b>{overallScore}</b><span>/100</span><em>{overallLabel}</em></div>
        <h3>{view.label}</h3><p>{beginnerReason}</p>
      </div>
      <div className="beginnerMath">
        <div><div className="metricLabel"><small>BUSINESS</small><Help title="Business score">Uses reported financial history and quality signals. It is weighted more heavily in Long-term mode.</Help></div><b>{business.label}</b><span>{fiveRecordText}</span></div>
        <div><div className="metricLabel"><small>6-MONTH CHART</small><Help title="6-month record">Measures the stock’s recent trend, return, drawdown and price structure over roughly six months.</Help></div><b>{d.sixMonth?.label||"Mixed"}</b><span>{sixMonthText}</span></div>
        <div><div className="metricLabel"><small>TIMING NOW</small><Help title="Timing now">Focuses on whether today’s price is attractive relative to the setup—not whether the company is good.</Help></div><b>{d.labels.entry}</b><span>Entry quality at today’s price.</span></div>
        <div><div className="metricLabel"><small>RISK</small><Help title="Risk in the score">The score rewards lower risk and penalizes unusually high downside/extension risk. Position sizing still belongs to the user.</Help></div><b>{d.labels.risk}</b><span>Higher risk means use more caution.</span></div>
      </div>
    </section>}

    {depth!=="simple"&&intelligence&&<section className="v27IntelStrip">
      <div className="intelLead"><small>NIVORA INTELLIGENCE</small><div><b>{intelligence.score}/100</b><span className={tone(intelligence.thesisLabel)}>{intelligence.thesisLabel}</span></div><p>{intelligence.biggestPositive} <strong>Watch:</strong> {intelligence.biggestRisk}</p></div>
      <div><small>NEXT DECISION TRIGGER</small><b>{intelligence.nextDecision}</b></div>
      <div><small>CONFIDENCE</small><b>{intelligence.confidenceLabel}</b><span>{intelligence.confidence}/100 evidence coverage</span></div>
      <button type="button" onClick={()=>{setTab("thesis");window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>thesisRef.current?.scrollIntoView({behavior:"smooth",block:"start"})))}}>Open full thesis →</button>
    </section>}

    {depth!=="simple"&&<section className="v12ReasonGrid">
      <div className="v12Reason goodBox"><small>WHY IT CAN WORK</small><h3>What supports the setup</h3>{positive.length?positive.map((x:string,i:number)=><p key={i}>✓ {x}</p>):<p>Evidence is still loading or mixed.</p>}</div>
      <div className="v12Reason riskBox"><small>WHAT CAN GO WRONG</small><h3>What is holding it back</h3>{risks.length?risks.map((x:string,i:number)=><p key={i}>• {x}</p>):<p>No major risk flag was detected from the connected sources.</p>}</div>
    </section>}

    <section ref={thesisRef} id="nivora-research" className={["osContext","v12Context",depth==="simple"?"v28SimpleContext":""].join(" ")}>
      <div className="osTabs v12Tabs v28Tabs">
        <button className={tab==="overview"?"on":""} onClick={()=>setTab("overview")}>Decision</button>
        <button className={tab==="thesis"?"on":""} onClick={()=>setTab("thesis")}>Thesis</button>
        {depth!=="simple"&&<button className={tab==="fundamentals"?"on":""} onClick={()=>setTab("fundamentals")}>Fundamentals</button>}
        {depth!=="simple"&&<button className={tab==="catalysts"?"on":""} onClick={()=>setTab("catalysts")}>Catalysts</button>}
        {depth!=="simple"&&<button className={tab==="news"?"on":""} onClick={()=>setTab("news")}>News</button>}
        {depth!=="simple"&&<button className={tab==="earnings"?"on":""} onClick={()=>setTab("earnings")}>Earnings</button>}
        {depth==="pro"&&<button className={tab==="technical"?"on":""} onClick={()=>setTab("technical")}>Technical Lab</button>}
        {d.assetType!=="crypto"&&<button className={tab==="options"?"on":""} onClick={()=>setTab("options")}>{depth==="pro"?"Options Lab":"Options"}</button>}
      </div>

      {tab==="overview"&&<div className="v12Overview">
        <div><BriefcaseBusiness size={18}/><div className="metricLabel"><small>Business</small><Help title="Business">Financial quality and consistency. This is intentionally separate from whether today is a good entry.</Help></div><b className={tone(business.label)}>{business.label}</b><span>{business.reasons?.[0]||"Loading fundamentals…"}</span></div>
        <div><Activity size={18}/><div className="metricLabel"><small>Entry</small><Help title="Entry">How attractive today’s price is relative to support, resistance, extension, momentum and downside risk.</Help></div><b className={tone(d.labels.entry)}>{d.labels.entry}</b><span>Current location versus support, extension and momentum.</span></div>
        <div><ShieldCheck size={18}/><div className="metricLabel"><small>Risk</small><Help title="Risk">Technical downside and volatility, plus broader market regime.</Help></div><b className={d.labels.risk==="High"?"bad":"mid"}>{d.labels.risk}</b><span>Technical downside plus market regime.</span></div>
        <div><Newspaper size={18}/><div className="metricLabel"><small>News</small><Help title="News">Material headlines are summarized for tone and impact. Headlines alone do not override price/fundamental evidence.</Help></div><b className={news.tone==="positive"?"good":news.tone==="negative"?"bad":"mid"}>{news.label}</b><span>{news.topReason}</span></div>
      </div>}

      {tab==="thesis"&&intelligence&&<div className="v27Thesis">
        <div className="thesisHero">
          <div><small>NIVORA SYNTHESIS ENGINE</small><h3>{intelligence.thesisLabel} · {intelligence.score}/100</h3><p>{intelligence.explanation}</p></div>
          <div className="thesisAction"><small>CURRENT ACTION</small><b className={tone(intelligence.action)}>{intelligence.action}</b><span>{intelligence.nextDecision}</span></div>
        </div>

        <div className="thesisDimensions">
          {Object.entries(intelligence.dimensions).map(([k,v]:any)=><div key={k}><span>{k}</span><b>{v}/100</b><i><em style={{width:`${Math.max(3,Math.min(100,v))}%`}}/></i></div>)}
        </div>

        <div className="thesisGrid">
          <div className="thesisCard positive"><small>WHAT SUPPORTS THE THESIS</small>{intelligence.positives.length?intelligence.positives.map((x:string,i:number)=><p key={i}>✓ {x}</p>):<p>No dominant positive evidence yet.</p>}</div>
          <div className="thesisCard concern"><small>WHAT CAN BREAK IT</small>{intelligence.concerns.length?intelligence.concerns.map((x:string,i:number)=><p key={i}>• {x}</p>):<p>No dominant risk flag right now.</p>}</div>
          <div className="thesisCard contradiction"><small>CONTRADICTION DETECTOR</small>{intelligence.contradictions.length?intelligence.contradictions.map((x:string,i:number)=><p key={i}>↔ {x}</p>):<p>Major evidence layers are broadly aligned.</p>}</div>
        </div>

        <div className="scenarioSection">
          <div className="scenarioTitle"><div><small>SCENARIO ENGINE</small><h3>What could happen next?</h3></div><Help title="Scenario engine">These are evidence-weighted scenarios, not price predictions. Probabilities are normalized from current business, technical, catalyst and risk evidence and should change as evidence changes.</Help></div>
          <div className="scenarioGrid">{intelligence.scenarios.map((x:any)=><div key={x.name} className={x.name.startsWith("Bull")?"bull":x.name.startsWith("Bear")?"bear":"base"}><span>{x.name}</span><b>{x.probability}%</b><strong>{x.level!=null?`Key level $${x.level}`:"Key level unavailable"}</strong><p>{x.logic}</p></div>)}</div>
        </div>

        <div className="triggerGrid">
          <div><small>WHAT WOULD MAKE NIVORA MORE BULLISH</small>{intelligence.bullTriggers.length?intelligence.bullTriggers.map((x:string,i:number)=><p key={i}>+ {x}</p>):<p>Evidence is already relatively aligned.</p>}</div>
          <div><small>WHAT WOULD MAKE NIVORA MORE CAUTIOUS</small>{intelligence.bearTriggers.length?intelligence.bearTriggers.map((x:string,i:number)=><p key={i}>− {x}</p>):<p>No major deterioration trigger identified.</p>}</div>
        </div>

        {intelligence.missing.length>0&&<div className="intelMissing"><Info size={15}/><span>Confidence could improve with: {intelligence.missing.join(", ")}.</span></div>}
      </div>}

      {tab==="fundamentals"&&<div className="v12Fund">
        <div className={`fundSignal ${business.tone||"neutral"}`}><small>BUSINESS QUALITY</small><h3>{business.label}{business.score!=null?` · ${business.score}/100`:""}</h3>{(business.reasons||[]).slice(0,4).map((x:string,i:number)=><p key={i}>• {x}</p>)}{five&&<div className="fiveRecord"><small>5-YEAR RECORD</small><b>{five.score}/100 · {five.revenueTrend}</b><p>{five.summary}</p><div>{(five.history||[]).map((y:any)=><span key={y.year}><i>{y.year}</i><strong>{y.revenue!=null?money(y.revenue):"—"}</strong><em>{y.netIncome!=null?`NI ${money(y.netIncome)}`:"NI —"}</em></span>)}</div></div>}</div>
        <div className="v32Institutional">
          <div className="v32InstitutionalHead"><div><small>INSTITUTIONAL INTELLIGENCE</small><h3>{institutionalLabel}</h3><p>{institutional?.disclosure||"Reported institutional ownership is not available from the connected feed for this symbol."}</p></div><Help title="Institutional intelligence">Reported institutional ownership and insider filings are delayed evidence. NIVORA keeps this separate from the daily accumulation proxy so it never presents quarterly filings as real-time institutional buying.</Help></div>
          {institutional?.enabled?<div className="v32InstitutionalGrid v321InstitutionalGrid">
            <div><small>REPORTED INSTITUTIONS</small><b className={institutionalTone}>{institutional.institutional?.directionLabel||institutionalLabel}</b><span>{institutional.institutional?.increased||0} managers increased · {institutional.institutional?.reduced||0} reduced</span><em>{institutional.institutional?.periodLabel||"Latest available filing period"}</em></div>
            <div><small>REPORTED SHARE CHANGE</small><b className={Number(institutional.institutional?.netReportedShareChange||0)>0?"good":Number(institutional.institutional?.netReportedShareChange||0)<0?"bad":"mid"}>{institutional.institutional?.netChangeLabel||"Mixed / unavailable"}</b><span>{institutional.institutional?.reportingRows||0} reporting positions in the connected/cached data</span><em>Delayed filing evidence — not today's order flow</em></div>
            <div><small>INSIDERS</small><b className={institutional.insiders?.label==="Net buying"?"good":institutional.insiders?.label==="Net selling"?"bad":"mid"}>{institutional.insiders?.label||"Mixed"}</b><span>{institutional.insiders?.buys||0} buys · {institutional.insiders?.sells||0} sells in available feed</span><em>Reported transactions only</em></div>
            <div><small>TODAY'S ACCUMULATION PROXY</small><b className={marketLab?.accumulationLabel==="Accumulating"?"good":marketLab?.accumulationLabel==="Distribution risk"?"bad":"mid"}>{marketLab?.accumulationLabel||"Insufficient data"}</b><span>{marketLab?`${marketLab.accumulation}/100 from price/volume behavior`:"Needs more price/volume history"}</span><em>Market-behavior proxy, not named-institution flow</em></div>
          </div>:<div className="v32InstitutionalEmpty"><b>Reported institutional filings unavailable.</b><span>{institutional?.reason||"NIVORA could not verify current ownership data from the connected/cache sources."}</span><small>Price/volume accumulation remains available separately; NIVORA will not call that institutional buying.</small></div>}
          {institutional?.enabled&&Array.isArray(institutional.institutional?.top)&&institutional.institutional.top.length>0&&<div className="v321HolderList">
            <div><small>TOP REPORTED MANAGERS</small><span>Latest available filing evidence</span></div>
            {institutional.institutional.top.slice(0,6).map((x:any,i:number)=><div key={`${x.name}-${i}`}><b>{x.name}</b><span>{x.shares!=null?`${Number(x.shares).toLocaleString()} shares`:"Shares unavailable"}</span><em className={Number(x.change||0)>0?"good":Number(x.change||0)<0?"bad":"mid"}>{Number(x.change||0)>0?"Reported increase":Number(x.change||0)<0?"Reported reduction":"No verified change"}</em></div>)}
          </div>}
        </div>
        <div className="osList">{company?.fundamentals?.length?company.fundamentals.map((x:any)=><div key={x.label}><span>{x.label}{x.detail&&<small>{x.detail}</small>}</span><b>{x.value}</b></div>):<p>No standardized SEC fundamentals available for this symbol yet.</p>}</div>
      </div>}

      {tab==="catalysts"&&<div className="v12Catalysts">
        {earn&&<div className="nextEvent"><CalendarDays size={18}/><div><small>NEXT EARNINGS</small><b>{earn.date}</b><span>{earnDays!=null&&earnDays>=0?`${earnDays} days away`:"Upcoming"}</span></div></div>}
        <div className="catalystIntro"><div><small>RECENT MATERIAL FILINGS</small><Help title="Catalysts">Company filings and scheduled events that may change the investment thesis. A filing is evidence to review, not automatically bullish or bearish.</Help></div><span>Newest first</span></div>
        <div className="catalystList">{filings.length?filings.slice(0,8).map((x:any)=><a className="catalystRow" href={x.url} target="_blank" rel="noreferrer" key={x.accession}>
          <div className="catalystMain"><b>{x.label}</b><small>{x.form}{x.description?` · ${x.description}`:""}</small></div>
          <div className="catalystMeta"><em className={x.tone}>{x.materiality}</em><time>{x.date}</time><ExternalLink size={14}/></div>
        </a>):<p className="emptyState">No recent material SEC filings found.</p>}</div>
      </div>}

      {tab==="news"&&<div className="v12News">{context?.enabled===false?<div className="connectFeed"><Newspaper size={22}/><b>Connect live news</b><p>Add a Finnhub API key. Price analysis and SEC data continue to work without it.</p></div>:items.length?items.map((x:any,i:number)=><a href={x.url} target="_blank" rel="noreferrer" key={i}><div><span className={`newsTone ${x.tone}`}>{x.tone}</span><small>{x.materiality} materiality · {x.source}</small></div><b>{x.headline}</b><p>{x.summary}</p><ExternalLink size={13}/></a>):<p>No recent company headlines were returned.</p>}</div>}

      {tab==="earnings"&&<div className="v12Earnings"><div className="earnSplit">{latestReport&&<div className="earnNext earnReported"><small>LATEST REPORTED RESULTS</small><h3>{latestEarnNews?.date?new Date(latestEarnNews.date).toLocaleDateString():latestReport.date}</h3><p>{latestEarnNews?.headline||`${latestReport.form} filed — latest reported financial filing`}</p>{latestEarnNews?.url&&<a href={latestEarnNews.url} target="_blank" rel="noreferrer">Read results <ExternalLink size={12}/></a>}</div>}{earn&&<div className="earnNext estimated"><small>NEXT EARNINGS · ESTIMATED</small><h3>{earn.date}</h3><p>{earn.hour||"Time not listed"}{earn.epsEstimate!=null?` · EPS est. ${eps(earn.epsEstimate)}`:""}{earn.revenueEstimate!=null?` · Revenue est. ${money(earn.revenueEstimate)}`:""}</p><p className="earnMeta">Future calendar dates are estimates until confirmed by the company.</p></div>}</div><div className="earnGrid">{(context?.surprises||[]).length?context.surprises.map((x:any,i:number)=><div key={i}><small>{x.period}</small><b className={(x.surprisePercent??0)>=0?"good":"bad"}>{x.surprisePercent!=null?`${x.surprisePercent>=0?"+":""}${Number(x.surprisePercent).toFixed(1)}% surprise`:"Reported"}</b><span>Actual {x.actual??"—"} · Est. {x.estimate??"—"}</span></div>):<p>No earnings-surprise history returned by the connected feed.</p>}</div></div>}

      {tab==="technical"&&<div className="v12Technical v26Technical">
        {marketLab&&<div className="v32ConfluenceChart">
          <div className="v32MarketLabHead"><div><small>CONFLUENCE MAP</small><h3>Fib + structure + NIVORA risk levels</h3><p>Advanced levels are supporting evidence, not standalone buy/sell signals. Wave interpretation is heuristic and confidence-limited.</p></div><Help title="Confluence map">Fibonacci retracements, NIVORA support/entry levels and the current Elliott-style scenario are overlaid so experienced users can see where independent technical evidence clusters.</Help></div>
          <PriceChart candles={d.candles} levels={d.levels} showTrend={true} confluence={marketLab}/>
        </div>}
        <div className="techIntro"><div><small>TECHNICAL LAB</small><h3>Professional evidence, still readable.</h3><p>The main call stays simple. This workspace shows the market mechanics experienced investors may want to inspect.</p></div><Help title="Technical Lab">Technical indicators describe price behavior and risk. They can improve timing, but none can guarantee direction or replace business/catalyst analysis.</Help></div>
        {proTech&&<div className="proTechGrid">
          <div><small>ATR · 14D</small><b>{proTech.atrPct!=null?`${proTech.atrPct.toFixed(1)}%`:"—"}</b><span>Typical daily range</span></div>
          <div><small>REALIZED VOL · 20D</small><b>{proTech.rv!=null?`${proTech.rv.toFixed(0)}%`:"—"}</b><span>Annualized recent volatility</span></div>
          <div><small>VOLUME VS 20D</small><b>{proTech.volRatio!=null?`${proTech.volRatio.toFixed(1)}×`:"—"}</b><span>Participation today</span></div>
          <div><small>20D MA</small><b className={(proTech.d20??0)>=0?"good":"bad"}>{proTech.d20!=null?`${proTech.d20>=0?"+":""}${proTech.d20.toFixed(1)}%`:"—"}</b><span>Distance from short trend</span></div>
          <div><small>50D MA</small><b className={(proTech.d50??0)>=0?"good":"bad"}>{proTech.d50!=null?`${proTech.d50>=0?"+":""}${proTech.d50.toFixed(1)}%`:"—"}</b><span>Distance from intermediate trend</span></div>
          <div><small>200D MA</small><b className={(proTech.d200??0)>=0?"good":"bad"}>{proTech.d200!=null?`${proTech.d200>=0?"+":""}${proTech.d200.toFixed(1)}%`:"—"}</b><span>Distance from long trend</span></div>
          <div><small>BOLLINGER POSITION</small><b>{proTech.bbPos!=null?`${Math.round(proTech.bbPos)}%`:"—"}</b><span>0% lower band · 100% upper</span></div>
          <div><small>52W DRAWDOWN</small><b>{proTech.drawdown!=null?`${proTech.drawdown.toFixed(1)}%`:"—"}</b><span>Distance from recent high</span></div>
        </div>}
        {marketLab&&<div className="v32MarketLab">
          <div className="v32MarketLabHead"><div><small>MARKET INTELLIGENCE</small><h3>Confluence, not indicator clutter.</h3><p>NIVORA turns technical evidence into zones and scenarios instead of asking you to interpret dozens of lines.</p></div></div>
          <div className="v32MarketLabGrid">
            <div><small>ACCUMULATION PROXY</small><b className={marketLab.accumulationLabel==="Accumulating"?"good":marketLab.accumulationLabel==="Distribution risk"?"bad":"mid"}>{marketLab.accumulationLabel}</b><strong>{marketLab.accumulation}/100</strong><span>Price/volume behavior proxy — not a claim that a specific institution is trading today.</span></div>
            <div><small>FIBONACCI CONFLUENCE</small><b>${marketLab.fib382} · ${marketLab.fib50} · ${marketLab.fib618}</b><strong>38.2% · 50% · 61.8%</strong><span>Used as supporting zones only when they overlap with structure/support.</span></div>
            <div><small>DCA / ACCUMULATION ZONE</small><b>${marketLab.dcaLow}–${marketLab.dcaHigh}</b><strong>Confluence zone</strong><span>Combines NIVORA entry/support with the current swing structure. Thesis must remain intact.</span></div>
            <div><small>ELLIOTT-STYLE WAVE</small><b>{marketLab.waveLabel}</b><strong>{marketLab.waveScore}% confidence</strong><span>Heuristic structure only. Candidate target ${marketLab.waveTarget}; invalidation ${marketLab.waveInvalidation}.</span></div>
          </div>
        </div>}
        <div className="techRead"><small>NIVORA TECHNICAL READ</small><h4>{d.labels.trend} trend · {d.labels.momentum} momentum · {d.labels.risk} risk</h4><p>{d.why?.slice(0,3).join(" ")}</p></div>
        <div className="osTechGrid">{Object.entries(d.engine).map(([k,v]:any)=><div key={k}><div className="metricLabel"><span>{k}</span><Help title={k}>{k==="Trend"?"Multi-horizon direction and slope.":k==="Momentum"?"Speed and persistence of the current move.":k==="Flow"?"Volume/price participation and confirmation.":k==="Structure"?"Higher highs/lows, support and resistance behavior.":k==="RSI"?"Relative Strength Index; helps identify momentum extremes but is never used alone.":k==="MACD"?"Trend/momentum crossover evidence.":k==="Extension"?"How far price has moved away from its recent equilibrium; high extension increases chase risk.":k==="Relative strength"?"Performance versus the relevant benchmark.":k==="Market regime"?"Whether the broad market is supportive, mixed or risk-off.":"Supporting quantitative evidence used by the decision engine."}</Help></div><b>{typeof v==="number"?`${v}/100`:v}</b></div>)}</div>
      </div>}

      {tab==="options"&&<div className="gammaPanel v22Options v26Options">
        <div className="gammaHero"><small>OPTIONS LAB</small><h3>Positioning + contract research in one place.</h3><p>Start with the stock thesis, then use options data to compare structure, liquidity, volatility and leverage. Candidate contracts are ranked research outputs, not automatic trades.</p></div>
        <div className="optionSubnav"><button className={optionView==="setups"?"on":""} onClick={()=>setOptionView("setups")}>Contract setups</button><button className={optionView==="positioning"?"on":""} onClick={()=>setOptionView("positioning")}>Gamma / positioning</button></div>
        {optionsLoading?<div className="optionsState">Loading shared options snapshot…</div>:
        !optionsData?.enabled?<div className="optionsState"><b>Options data is not available.</b><span>{optionsData?.reason||"Add MARKETDATA_TOKEN in Vercel to enable the options module."}</span><button type="button" className="optionsRetry" onClick={()=>{setOptionsData(null);setOptionsLoading(false)}}>Retry</button></div>:
        <><div className="optionsFresh"><span>{optionsData.dataMode}</span><small>{optionsData.updatedAt?`Provider snapshot ${new Date(optionsData.updatedAt).toLocaleString()}`:"Provider timestamp unavailable"}</small></div>
        {optionView==="setups"?<div className="contractLab">
          <div className="contractContext"><div><small>UNDERLYING CALL</small><b className={tone(view.label)}>{view.label}</b><span>Options should express a thesis—not create one.</span></div><div><small>EXPECTED MOVE</small><b>{optionsData.expectedMovePct!=null?`±${optionsData.expectedMovePct}%`:"—"}</b><span>From near-ATM option premium</span></div><div><small>ATM IV</small><b>{optionsData.atmIV!=null?`${optionsData.atmIV}%`:"—"}</b><span>Volatility priced into options</span></div></div>
          <div className="contractControls"><div><button className={optionSide==="bullish"?"on":""} onClick={()=>setOptionSide("bullish")}>Calls · bullish</button><button className={optionSide==="bearish"?"on":""} onClick={()=>setOptionSide("bearish")}>Puts · bearish</button></div><div><button className={optionStyle==="conservative"?"on":""} onClick={()=>{setOptionExpiration(null);setOptionStyle("conservative")}}>Safer</button><button className={optionStyle==="balanced"?"on":""} onClick={()=>{setOptionExpiration(null);setOptionStyle("balanced")}}>Balanced</button><button className={optionStyle==="aggressive"?"on":""} onClick={()=>{setOptionExpiration(null);setOptionStyle("aggressive")}}>Aggressive</button><button className={optionStyle==="leaps"?"on":""} onClick={()=>{setOptionExpiration(null);setOptionStyle("leaps")}}>LEAPS</button></div></div>
          <div className="styleExplain"><Help title="Contract styles">Safer targets higher delta and better liquidity. Balanced seeks a middle ground. Aggressive accepts lower delta/shorter duration and can lose premium faster. LEAPS favors long duration and higher delta to reduce short-term theta pressure.</Help><span>{optionStyle==="leaps"?"Long-duration candidates for investors seeking stock-like exposure with defined premium risk.":optionStyle==="aggressive"?"Higher leverage and faster premium decay. Treat this as the highest-risk filter.":optionStyle==="conservative"?"Higher-delta candidates with stronger emphasis on liquidity and spread quality.":"A compromise between leverage, duration, liquidity and delta."}</span></div>
          {optionsData?.expirations?.length>0&&<div className="expirationLab">
            <div className="expirationHead"><div><small>EXPIRATION INTELLIGENCE</small><b>{optionsData.selectedExpiration?new Date(`${optionsData.selectedExpiration}T12:00:00`).toLocaleDateString():"Choose a date"}</b><span>{optionsData.expirationFit}</span></div><button className={!optionExpiration?"on":""} onClick={()=>setOptionExpiration(null)}>Auto best-fit</button></div>
            <div className="expirationRail">
              {optionsData.expirations.map((x:any)=><button key={x.date} className={(optionExpiration||optionsData.selectedExpiration)===x.date?"on":""} onClick={()=>setOptionExpiration(x.date)}><b>{new Date(`${x.date}T12:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric",year:x.dte>250?"numeric":undefined})}</b><span>{x.dte} DTE</span></button>)}
            </div>
          </div>}

          {(()=>{
            const list=optionsData.contractSetups?.[optionSide]?.[optionStyle]||[];
            return list.length?<div className="contractCards">{list.map((x:any,i:number)=><div className={`contractCard ${i===0?"top":""}`} key={`${x.expiration}-${x.strike}-${x.side}`}>
              <div className="contractHead"><span>{i===0?"TOP RANKED":"ALTERNATIVE"}</span><b>{x.expiration?new Date(x.expiration).toLocaleDateString():"—"} · ${x.strike} {x.side==="call"?"Call":"Put"}</b><em>{x.score}/100</em></div>
              <div className="contractStats"><div><small>PREMIUM</small><b>{x.premium!=null?`~$${x.premium}`:"—"}</b></div><div><small>DELTA</small><b>{x.delta!=null?Number(x.delta).toFixed(2):"—"}</b></div><div><small>DTE</small><b>{x.dte??"—"}</b></div><div><small>IV</small><b>{x.iv!=null?`${x.iv}%`:"—"}</b></div><div><small>OI</small><b>{Number(x.openInterest||0).toLocaleString()}</b></div><div><small>SPREAD</small><b>{x.spreadPct!=null?`${x.spreadPct}%`:"—"}</b></div><div><small>BREAK-EVEN</small><b>{x.breakEven!=null?`$${x.breakEven}`:"—"}</b></div><div><small>LEVERAGE</small><b>{x.leverage!=null?`${x.leverage}×`:"—"}</b></div></div>
              <p>{x.score>=75?"Strong candidate quality from the available chain.":x.score>=60?"Usable candidate, but inspect liquidity/IV before acting.":"Lower-quality candidate from this delayed snapshot."}</p>
            </div>)}</div>:<div className="optionsState"><b>No contracts matched this filter.</b><span>The provider snapshot may not include the required expiration range or liquid contracts.</span></div>
          })()}
          <div className="contractFoot"><ShieldCheck size={15}/><p>{optionsData.rankingNote}</p></div>
        </div>:<div className="positioningLab">
          <div className="optionsQuick">
            <div><div className="metricLabel"><small>CALL WALL</small><Help title="Call wall">Largest call open-interest strike in the fetched chain. It is an attention area, not guaranteed resistance.</Help></div><b>{optionsData.callWall!=null?`$${optionsData.callWall}`:"—"}</b></div>
            <div><div className="metricLabel"><small>PUT WALL</small><Help title="Put wall">Largest put open-interest strike in the fetched chain. It is an attention area, not guaranteed support.</Help></div><b>{optionsData.putWall!=null?`$${optionsData.putWall}`:"—"}</b></div>
            <div><div className="metricLabel"><small>GAMMA NODE</small><Help title="Gamma node">Largest OI-weighted gamma concentration. This is a proxy; NIVORA does not observe dealer inventory.</Help></div><b>{optionsData.gammaNode!=null?`$${optionsData.gammaNode}`:"—"}</b></div>
            <div><small>EXPECTED MOVE</small><b>{optionsData.expectedMovePct!=null?`±${optionsData.expectedMovePct}%`:"—"}</b></div>
            <div><small>ATM IV</small><b>{optionsData.atmIV!=null?`${optionsData.atmIV}%`:"—"}</b></div>
            <div><small>PUT/CALL OI</small><b>{optionsData.putCallOI??"—"}</b></div>
          </div>
          <div className="optionsRead"><small>PLAIN-ENGLISH READ</small><h4>{optionsData.position}</h4><p>{optionsData.gammaProxy}. {optionsData.note}</p></div>
          {optionsData.topNodes?.length>0&&<div className="optionsNodes"><small>TOP GAMMA-CONCENTRATION STRIKES</small>{optionsData.topNodes.map((x:any)=><div key={x.strike}><b>${x.strike}</b><span>Call OI {x.callOI.toLocaleString()} · Put OI {x.putOI.toLocaleString()}</span></div>)}</div>}
        </div>}
        </>}
      </div>}
    </section>

  </div>;
}
