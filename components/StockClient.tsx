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
} from "lucide-react";
import SearchBox from "./SearchBox";
import PriceChart from "./PriceChart";
import {supabaseBrowser} from "@/lib/supabase";
import {buildNivoraIntelligence} from "@/lib/nivora-intelligence";
import {buildInvestorDecision} from "@/lib/nivora-investor";
import {applyLiveQuoteToToday} from "@/lib/nivora-live-today";
import StockSecurityHeader from "./stock/StockSecurityHeader";
import StockEvidenceNav from "./stock/StockEvidenceNav";
import StockEvidenceSections from "./stock/StockEvidenceSections";
import StockThesisPanel from "./stock/StockThesisPanel";
import StockTabContext from "./stock/StockTabContext";
import {metricDefinitions} from "@/lib/nivora-metrics";
import {ENGINE_VERSION} from "@/lib/nivora-version";
import {formatMoney as displayMoney,formatPercent} from "@/lib/nivora-format";
import MetricInfo from "@/components/v65/MetricInfo";
import {adaptCurrentEvidenceToV4} from "@/lib/auryn/v4/current-evidence-adapter";
import {buildAurynV4CoreAnalysis} from "@/lib/auryn/v4/analyze";
import {buildAurynV5Analysis} from "@/lib/auryn/v5/analyze";
import {buildAurynV6Analysis} from "@/lib/auryn/v6/analyze";
import {buildAurynV7Analysis} from "@/lib/auryn/v7/analyze";
import {serializeV7Decision} from "@/lib/auryn/v7/learning";
import {formatInvestmentAction} from "@/lib/auryn/v4/presentation";
import {formatScoreBand} from "@/lib/auryn/v5/format";
import InstitutionalDecisionBrief from "./stock/v931/InstitutionalDecisionBrief";
import {buildDecisionSnapshot} from "@/lib/auryn/v931/decision-snapshot";
import {buildInstitutionalDecisionKernel} from "@/lib/auryn/v931/decision-kernel";
import type {SetupState} from "@/lib/auryn/v931/domain";
import {projectMarketIntelligence} from "@/lib/auryn/v934/projections";
import {deriveV934DecisionTechnical} from "@/lib/auryn/v934/decision-bridge";
import MarketTimeframeTape from "./market/MarketTimeframeTape";
import MarketActionMap from "./market/MarketActionMap";

type Mode="now"|"swing"|"long"|"own";
type Tab="thesis"|"fundamentals"|"institutions"|"catalysts"|"news"|"earnings"|"technical"|"options";

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
const formatEpsValue=(n:any)=>{const x=Number(n);return Number.isFinite(x)?x.toFixed(2):"—"};
const formatOptionPercent=(n:any,d=1)=>{const x=Number(n);return Number.isFinite(x)?`${x.toFixed(d)}%`:"—"};
const formatOptionPrice=(n:any)=>{const x=Number(n);return Number.isFinite(x)?displayMoney(x):"—"};
const formatOptionNumber=(n:any,d=2)=>{const x=Number(n);return Number.isFinite(x)?x.toFixed(d):"—"};
const daysUntil=(d?:string|null)=>{if(!d)return null;return Math.ceil((new Date(d+"T12:00:00").getTime()-Date.now())/86400000)};

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

type StockWarmCache={d?:any;company?:any;context?:any;institutional?:any;ts:number;evidenceTs?:number};
const CORE_ATTEMPTS=1,CORE_TIMEOUT_MS=4500;
const stockWarmCache=new Map<string,StockWarmCache>();
const CACHE_MAX_AGE=15*60*1000;
const STALE_CACHE_MAX_AGE=7*24*60*60*1000;
let calibrationCache:any=null;
const modelHealthCache=new Map<string,any>();
function scheduleNonCritical(work:()=>void){
  if(typeof window==="undefined"){work();return()=>{}};
  const w=window as any;
  if(typeof w.requestIdleCallback==="function"){
    const id=w.requestIdleCallback(work,{timeout:900});
    return()=>w.cancelIdleCallback?.(id);
  }
  const id=window.setTimeout(work,260);
  return()=>window.clearTimeout(id);
}

function mergeWarm(symbol:string,patch:Partial<StockWarmCache>){
  const prev=stockWarmCache.get(symbol)||{ts:0};
  stockWarmCache.set(symbol,{...prev,...patch,ts:Date.now()});
}
function mergeEvidenceWarm(symbol:string,patch:Partial<StockWarmCache>){
  const prev=stockWarmCache.get(symbol)||{ts:0};
  stockWarmCache.set(symbol,{...prev,...patch,ts:Math.max(prev.ts||0,Date.now()),evidenceTs:Date.now()});
}
export default function StockClient({symbol}:{symbol:string}){
  const thesisRef=useRef<HTMLElement>(null);
  const[d,setD]=useState<any>(null);
  const[company,setCompany]=useState<any>(null);
  const[context,setContext]=useState<any>(null);
  const[err,setErr]=useState("");
  const[horizon]=useState<"now"|"swing"|"long">("long");
  const[owns,setOwns]=useState(false);
  const[ownerPosition,setOwnerPosition]=useState<any>(null);
  const mode:Mode=owns?"own":horizon;
  const[tab,setTab]=useState<Tab>("thesis");
  const[watching,setWatching]=useState(false);
  const[optionsData,setOptionsData]=useState<any>(null);
  const[optionsLoading,setOptionsLoading]=useState(false);
  const[perfRange,setPerfRange]=useState<"6M"|"YTD"|"1Y">("6M");
  const[chartMode,setChartMode]=useState<"clean"|"trend">("clean");
  const[optionView,setOptionView]=useState<"setups"|"positioning">("setups");
  const[optionSide,setOptionSide]=useState<"bullish"|"bearish">("bullish");
  const[optionStyle,setOptionStyle]=useState<"conservative"|"balanced"|"aggressive"|"leaps">("balanced");
  const[optionExpiration,setOptionExpiration]=useState<string|null>(null);
  const[answerOpen,setAnswerOpen]=useState<"why"|"change"|"risk"|"evidence"|null>(null);
  const[auditOpen,setAuditOpen]=useState(false);
  const[institutional,setInstitutional]=useState<any>(null);
  const[calibration,setCalibration]=useState<any>(null);
  const[modelHealth,setModelHealth]=useState<any>(null);
  const[liveQuote,setLiveQuote]=useState<any>(null);
  const[liveMarketContext,setLiveMarketContext]=useState<any>(null);
  const[coreRetry,setCoreRetry]=useState(0);
  const[previousSetupState,setPreviousSetupState]=useState<SetupState|null>(null);

  useEffect(()=>{
    try{const saved=localStorage.getItem(`auryn:v931:setup:${symbol}`) as SetupState|null;setPreviousSetupState(saved||null)}catch{setPreviousSetupState(null)}
  },[symbol]);

  useEffect(()=>{
    let active=true;let timer:any;
    const loadQuote=()=>fetch(`/api/quote/${encodeURIComponent(symbol)}`,{cache:"no-store"}).then(async r=>{const x=await r.json();if(r.ok&&active)setLiveQuote(x)}).catch(()=>{});
    loadQuote();timer=setInterval(()=>{if(document.visibilityState==="visible")loadQuote()},20000);
    return()=>{active=false;clearInterval(timer)};
  },[symbol]);

  useEffect(()=>{
    if(!d?.marketIntelligence?.snapshotId){setLiveMarketContext(null);return;}
    let active=true;const controller=new AbortController();let timer:any;
    const load=()=>fetch(`/api/market-intelligence/live/${encodeURIComponent(symbol)}`,{cache:"no-store",signal:controller.signal})
      .then(async r=>{const x=await r.json();if(active&&r.ok&&x?.status!=="UNAVAILABLE")setLiveMarketContext(x)})
      .catch(()=>{});
    const start=window.setTimeout(load,180);
    timer=window.setInterval(()=>{if(document.visibilityState==="visible")load()},60000);
    return()=>{active=false;window.clearTimeout(start);window.clearInterval(timer);controller.abort()};
  },[symbol,d?.marketIntelligence?.snapshotId]);

  useEffect(()=>{
    let active=true;
    const loadPosition=async()=>{
      try{
        const s=supabaseBrowser();
        const{data:{user}}=await s.auth.getUser();
        if(!user||!active)return;
        const{data}=await s.from("portfolio_positions").select("shares,avg_cost,horizon").eq("user_id",user.id).eq("symbol",symbol).maybeSingle();
        if(!active)return;
        if(data){setOwnerPosition(data);setOwns(true)}else setOwnerPosition(null);
      }catch{}
    };
    loadPosition();
    return()=>{active=false};
  },[symbol]);

  useEffect(()=>{
    let live=true;
    let core:AbortController|null=null;
    let warm=stockWarmCache.get(symbol);
    if(!warm&&typeof window!=="undefined"){
      try{
        const raw=localStorage.getItem(`auryn:core:${symbol}`)||sessionStorage.getItem(`auryn:core:${symbol}`);
        if(raw){const parsed=JSON.parse(raw);if(parsed?.d&&Date.now()-Number(parsed.ts||0)<STALE_CACHE_MAX_AGE){warm=parsed;stockWarmCache.set(symbol,parsed)}}
      }catch{}
    }
    const warmAge=warm?Date.now()-Number(warm.ts||0):Number.POSITIVE_INFINITY;
    const hasUsableWarm=!!warm&&warmAge<STALE_CACHE_MAX_AGE;
    const hasFreshWarm=!!warm&&warmAge<CACHE_MAX_AGE;
    if(hasUsableWarm){
      if(warm?.d)setD(warm.d);
      if(warm?.company)setCompany(warm.company);
      if(warm?.context)setContext(warm.context);
      if(warm?.institutional)setInstitutional(warm.institutional);
      setErr("");
    }else{
      setD(null);setCompany(null);setContext(null);setInstitutional(null);setLiveMarketContext(null);setErr("");
    }

    const fetchJson=async(url:string,signal?:AbortSignal)=>{
      const r=await fetch(url,{signal});
      const x=await r.json();
      if(!r.ok||x?.error)throw new Error(x?.error||`Request failed (${r.status})`);
      return x;
    };

    const loadCore=async(showError=false)=>{
      let lastError:any=null;
      for(let attempt=1;attempt<=CORE_ATTEMPTS;attempt++){
        core?.abort();
        core=new AbortController();
        const timer=setTimeout(()=>core?.abort(),CORE_TIMEOUT_MS);
        try{
          const a=await fetchJson(`/api/analyze/${encodeURIComponent(symbol)}`,core.signal);
          if(!live)return;
          setD(a);setErr("");mergeWarm(symbol,{d:a});try{const payload=JSON.stringify({d:a,ts:Date.now()});localStorage.setItem(`auryn:core:${symbol}`,payload);sessionStorage.setItem(`auryn:core:${symbol}`,payload)}catch{}return;
        }catch(e:any){
          lastError=e;
          if(!live)return;
          if(attempt<CORE_ATTEMPTS)await new Promise(r=>setTimeout(r,180));
        }finally{clearTimeout(timer)}
      }
      if(showError&&live&&!stockWarmCache.get(symbol)?.d)setErr(lastError?.name==="AbortError"?"Live history is temporarily slow. AURYN kept the verified price active; retry research when ready.":lastError?.message||"Analysis is temporarily unavailable.");
    };

    const loadEvidence=()=>{
      Promise.allSettled([
        fetchJson(`/api/company/${encodeURIComponent(symbol)}`).then(x=>{if(live){setCompany(x);mergeEvidenceWarm(symbol,{company:x})}}),
        fetchJson(`/api/context/${encodeURIComponent(symbol)}`).then(x=>{if(live){setContext(x);mergeEvidenceWarm(symbol,{context:x})}}),
        fetchJson(`/api/institutional/${encodeURIComponent(symbol)}`).then(x=>{if(live){setInstitutional(x);mergeEvidenceWarm(symbol,{institutional:x})}})
      ]);
    };

    if(!hasFreshWarm)loadCore(!hasUsableWarm);
    const evidenceFresh=!!warm?.evidenceTs&&Date.now()-warm.evidenceTs<30*60*1000;
    const cancelEvidence=!evidenceFresh?scheduleNonCritical(()=>loadEvidence()):()=>{};

    const priceTimer=setInterval(()=>{if(document.visibilityState==="visible")loadCore(false)},900000);
    const newsTimer=setInterval(()=>{if(document.visibilityState==="visible")fetchJson(`/api/context/${encodeURIComponent(symbol)}`).then(x=>{if(live){setContext(x);mergeEvidenceWarm(symbol,{context:x})}}).catch(()=>{})},120000);
    const onFocus=()=>{
      const last=stockWarmCache.get(symbol)?.ts||0;
      if(Date.now()-last>CACHE_MAX_AGE)loadCore(false);
    };
    window.addEventListener("focus",onFocus);
    return()=>{live=false;cancelEvidence();core?.abort();clearInterval(priceTimer);clearInterval(newsTimer);window.removeEventListener("focus",onFocus)};
  },[symbol,coreRetry]);


  useEffect(()=>{
    let live=true;
    if(calibrationCache){setCalibration(calibrationCache);return()=>{live=false};}
    const cancel=scheduleNonCritical(()=>fetch(`/api/calibration?engine=${ENGINE_VERSION}`,{cache:"force-cache"}).then(r=>r.ok?r.json():null).then(x=>{if(x)calibrationCache=x;if(live&&x)setCalibration(x)}).catch(()=>{}));
    return()=>{live=false;cancel()};
  },[]);

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
    const i=d?.indicators;
    const ts=d?.technicalState;
    if(i){
      const rsi14=Number(i.rsi14);
      const macdHist=Number(i.macd?.histogram);
      const macdLine=Number(i.macd?.line);
      const macdSignal=Number(i.macd?.signal);
      const rsiLabel=!Number.isFinite(rsi14)?"Unavailable":rsi14>=70?"Overbought":rsi14<=30?"Oversold":rsi14>=55?"Bullish":rsi14<=45?"Bearish":"Neutral";
      const macdLabel=!Number.isFinite(macdHist)?"Unavailable":macdHist>0&&macdLine>macdSignal?"Bullish":macdHist<0&&macdLine<macdSignal?"Bearish":"Mixed";
      const trendLabel=ts?.trend>=67?"Bullish":ts?.trend<42?"Bearish":"Mixed";
      const vr=Number(i.volumeRatio20);
      const volumeLabel=!Number.isFinite(vr)?"Unavailable":vr>=1.35?"Strong participation":vr>=.8?"Normal":"Light";
      return {atr14:Number(i.atr14),atrPct:Number(i.atrPct),rv:i.realizedVol20==null?null:Number(i.realizedVol20),sma20:i.sma20==null?null:Number(i.sma20),sma50:i.sma50==null?null:Number(i.sma50),sma200:i.sma200==null?null:Number(i.sma200),d20:i.distance20Pct==null?null:Number(i.distance20Pct),d50:i.distance50Pct==null?null:Number(i.distance50Pct),d200:i.distance200Pct==null?null:Number(i.distance200Pct),bbPos:i.bollingerPosition==null?null:Number(i.bollingerPosition),volRatio:Number(i.volumeRatio20),drawdown:i.drawdown52wPct==null?null:Number(i.drawdown52wPct),rsi14,rsiLabel,macd:macdLine,macdSignal,macdHist,macdLabel,trendLabel,volumeLabel};
    }
    const cs=(d?.candles||[]).filter((x:any)=>Number.isFinite(Number(x.close)));
    if(cs.length<20)return null;
    const closes=cs.map((x:any)=>Number(x.close)), vols=cs.map((x:any)=>Number(x.volume||0));
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
    return {atr14,atrPct:atr14&&last?atr14/last*100:null,rv,sma20:s20,sma50:s50,sma200:s200,d20:pct(s20),d50:pct(s50),d200:pct(s200),bbPos,volRatio,drawdown,rsi14:null,rsiLabel:"Unavailable",macd:null,macdSignal:null,macdHist:null,macdLabel:"Unavailable",trendLabel:d?.labels?.trend||"Unavailable",volumeLabel:volRatio==null?"Unavailable":volRatio>=1.35?"Strong participation":volRatio>=.8?"Normal":"Light"};
  },[d]);

  const marketTruth=useMemo(()=>liveQuote?.snapshotId?liveQuote:null,[liveQuote]);
  const canonicalDecisionPrice=useMemo(()=>{
    if(!marketTruth?.priceSensitiveAllowed)return null;
    const px=Number(marketTruth?.decisionPrice);
    return Number.isFinite(px)&&px>0?px:null;
  },[marketTruth]);
  const priceSensitiveAllowed=Boolean(marketTruth?.priceSensitiveAllowed&&canonicalDecisionPrice!=null);
  const marketIntelligenceView=useMemo(()=>{
    const base=d?.marketIntelligence;if(!base)return null;if(!liveMarketContext)return base;
    const confirmed={...base.confirmed,...(liveMarketContext.confirmed||{})};
    const livePreview={...base.livePreview,...(liveMarketContext.livePreview||{})};
    const requested=base.coverage?.requested||['15M','1H','4H','1D','1W'];
    const covered=requested.filter((tf:string)=>Boolean(confirmed?.[tf]));
    return{...base,confirmed,livePreview,coverage:{...base.coverage,confirmed:covered,missing:requested.filter((tf:string)=>!confirmed?.[tf])},tacticalContextAsOf:liveMarketContext.asOf||null};
  },[d?.marketIntelligence,liveMarketContext]);
  const canonicalMarket=useMemo(()=>{
    if(!d)return d;
    return canonicalDecisionPrice!=null?{...d,price:canonicalDecisionPrice,canonicalMarketSnapshot:marketTruth}:{...d,canonicalMarketSnapshot:marketTruth};
  },[d,canonicalDecisionPrice,marketTruth]);

  const intelligence=useMemo(()=>buildNivoraIntelligence({
    market:canonicalMarket,company,context,options:optionsData,institutional,mode
  }),[canonicalMarket,company,context,optionsData,institutional,mode]);

  const investorDecision=useMemo(()=>buildInvestorDecision({
    market:canonicalMarket,company,context,institutional,owns,
    position:ownerPosition?{shares:Number(ownerPosition.shares||0),avgCost:Number(ownerPosition.avg_cost||0)}:null
  }),[canonicalMarket,company,context,institutional,owns,ownerPosition]);
  const presentedDecision=useMemo(()=>{
    if(!investorDecision)return null;
    const label=calibration?.status==="collecting"?"Collecting":calibration?.status==="calibrated"?"Calibrated":"Uncalibrated";
    const today=applyLiveQuoteToToday(investorDecision.today,priceSensitiveAllowed?liveQuote:null,owns);
    const ce=calibration?.summary?{scope:String(calibration.summary.scope||"Weight-compatible history"),n:Number(calibration.summary.n||0),hitRatePct:Number(calibration.summary.hitRatePct||0),avgAlphaPct:Number(calibration.summary.avgAlphaPct||0),medianAlphaPct:Number(calibration.summary.medianAlphaPct||0),brierScore:Number(calibration.summary.brierScore||0),expectedCalibrationErrorPct:Number(calibration.summary.expectedCalibrationErrorPct||0),confidence95:calibration.summary.confidence95||null}:null;
    const marketDataIntegrity=marketTruth?{state:String(marketTruth.priceState||marketTruth.integrityState||"UNKNOWN"),reason:String(marketTruth.reason||marketTruth.integrityReason||""),provider:marketTruth.provider||null,ageSeconds:marketTruth.ageSeconds??null,disagreementPct:marketTruth.providerAgreementPct??marketTruth.disagreementPct??null,tradable:Boolean(marketTruth.executionTradable??marketTruth.integrityTradable??false),snapshotId:marketTruth.snapshotId}:null;
    return {...investorDecision,today,marketDataIntegrity,calibrationEvidence:ce,modelConfidenceLabel:label as "Uncalibrated"|"Collecting"|"Calibrated"};
  },[investorDecision,calibration,liveQuote,marketTruth,priceSensitiveAllowed,owns]);

  const v4Analysis=useMemo(()=>{
    if(!d||!presentedDecision)return null;
    try{
      const bundle=adaptCurrentEvidenceToV4({
        symbol,asOf:marketTruth?.asOf||new Date().toISOString(),market:canonicalMarket,company,context,institutional,legacyDecision:presentedDecision
      });
      return buildAurynV4CoreAnalysis(bundle);
    }catch{return null;}
  },[symbol,d,canonicalMarket,marketTruth,company,context,institutional,presentedDecision]);

  const v5Analysis=useMemo(()=>{
    if(!v4Analysis||!marketTruth)return null;
    try{
      const technical=canonicalMarket?.technicalState&&canonicalMarket?.indicators?canonicalMarket:null;
      const bars=Array.isArray(canonicalMarket?.candles)?canonicalMarket.candles:[];
      return buildAurynV5Analysis({symbol,marketTruth,v4:v4Analysis,technical,bars});
    }catch{return null;}
  },[symbol,marketTruth,canonicalMarket,v4Analysis]);

  const decisionSnapshot=useMemo(()=>{
    if(!marketTruth||!v5Analysis)return null;
    const metricEvidence=Object.fromEntries(v5Analysis.metrics.map((m:any)=>[m.id,{value:m.value,state:m.state,available:m.available,source:m.source,timeframe:m.timeframe??null}]));
    return buildDecisionSnapshot({symbol,asOf:marketTruth.asOf,marketTruth,completedDailyBarCutoff:d?.analysisAnchorAsOf??null,fundamentalsAsOf:company?.asOf??company?.updatedAt??null,earningsAsOf:context?.earnings?.date??null,estimatesAsOf:context?.estimatesAsOf??null,newsCutoff:context?.asOf??null,macroAsOf:d?.analysisAnchorAsOf??null,featureVersion:String(d?.indicatorVersion||'wilder-v1'),modelVersion:String(v5Analysis.engineVersion),policyVersion:'auryn-v9.3.1',evidence:metricEvidence});
  },[symbol,marketTruth,v5Analysis,d?.analysisAnchorAsOf,d?.indicatorVersion,company?.asOf,company?.updatedAt,context?.earnings?.date,context?.estimatesAsOf,context?.asOf]);

  const institutionalDecision=useMemo(()=>{
    if(!v5Analysis||!decisionSnapshot)return null;
    const metric=(id:string)=>v5Analysis.metrics.find((x:any)=>x.id===id);
    const mv=(id:string)=>{const m=metric(id);const n=Number(m?.value);return m?.available&&Number.isFinite(n)?n:null};
    const metricWhy=(id:string,label:string)=>{const m:any=metric(id);const n=Number(m?.value);return m?.available&&Number.isFinite(n)?`${label} is ${Math.round(n)}/100. ${String(m.interpretation||'Verified canonical evidence is available.')}`:`${label} is unavailable on this snapshot; AURYN withholds the pillar rather than treating missing evidence as bearish.`};
    const tech=v5Analysis.technical;const px=Number(marketTruth?.decisionPrice);const resistance=Number(tech?.levels?.resistance);const invalidation=Number(tech?.levels?.invalidation);
    const contextMetrics=['catalysts','macro','sector'].map(metric).filter((m:any)=>m?.available&&Number.isFinite(Number(m.value)));
    const contextScores=contextMetrics.map((m:any)=>Number(m.value));
    const contextWhy=contextMetrics.length?contextMetrics.map((m:any)=>`${m.label} ${Math.round(Number(m.value))}/100: ${String(m.interpretation||'verified')}`).join(' '):'Catalyst, sector and macro context are incomplete; AURYN withholds this pillar rather than filling gaps with assumptions.';
    const ts=tech?.technicalState;
    const v934Technical=d?.marketIntelligence?deriveV934DecisionTechnical(d.marketIntelligence):null;
    const marketStructureWhy=v934Technical?.why??(ts?`Completed daily-bar structure is ${Math.round(Number(ts.strength))}/100: trend ${Math.round(Number(ts.trend))}, momentum ${Math.round(Number(ts.momentum))}, participation ${Math.round(Number(ts.participation))}, structure ${Math.round(Number(ts.structure))}. Completed-bar evidence governs the swing setup; an extended-hours tick cannot silently rewrite it.`:'Completed daily-bar market structure is unavailable, so AURYN does not infer a technical setup.');
    const marketStructureScore=v934Technical?.marketStructureScore??ts?.strength??null;
    const riskPressure=mv('riskPressure');const available=[mv('businessQuality'),mv('fundamentals'),mv('valuation'),marketStructureScore,contextScores.length?contextScores.reduce((a,b)=>a+b,0)/contextScores.length:null,riskPressure==null?null:100-riskPressure].filter(x=>x!=null).length;
    return buildInstitutionalDecisionKernel({snapshotId:decisionSnapshot.snapshotId,symbol,marketPrice:Number.isFinite(px)?px:null,executionTradable:Boolean(marketTruth?.executionTradable),previousSetupState,scores:{business:mv('businessQuality'),earningsRevisions:mv('fundamentals'),valuation:mv('valuation'),marketStructure:marketStructureScore,catalystsRegime:contextScores.length?contextScores.reduce((a,b)=>a+b,0)/contextScores.length:null,riskAsymmetry:riskPressure==null?null:100-riskPressure},pillarEvidence:{business:{why:metricWhy('businessQuality','Business quality'),evidenceIds:['metric.businessQuality'],asOf:company?.asOf??company?.updatedAt??null},earningsRevisions:{why:metricWhy('fundamentals','Earnings and forward-fundamental evidence'),evidenceIds:['metric.fundamentals'],asOf:context?.estimatesAsOf??context?.earnings?.date??null},valuation:{why:metricWhy('valuation','Valuation and expected-return evidence'),evidenceIds:['metric.valuation'],asOf:company?.asOf??company?.updatedAt??null},marketStructure:{why:marketStructureWhy,evidenceIds:d?.marketIntelligence?['v934.15M','v934.1H','v934.4H','v934.1D','v934.1W']:['metric.technicalStrength','metric.trend','metric.participation'],asOf:d?.marketIntelligence?.actionMap?.asOf??d?.analysisAnchorAsOf??null},catalystsRegime:{why:contextWhy,evidenceIds:contextMetrics.map((m:any)=>`metric.${m.id}`),asOf:context?.asOf??d?.analysisAnchorAsOf??null},riskAsymmetry:{why:riskPressure==null?'Verified risk-pressure evidence is unavailable; AURYN does not manufacture an asymmetry score.':`${metricWhy('riskPressure','Risk pressure')} The decision pillar inverts pressure into risk/asymmetry quality, so lower pressure is better.`,evidenceIds:['metric.riskPressure'],asOf:d?.analysisAnchorAsOf??null}},technical:v934Technical?{trend:v934Technical.trend,momentum:v934Technical.momentum,flow:v934Technical.flow,structure:v934Technical.structure,nearResistance:v934Technical.nearResistance,confirmedBreakout:v934Technical.confirmedBreakout,structuralBreak:v934Technical.structuralBreak,reclaimLevel:v934Technical.reclaimLevel,invalidation:v934Technical.invalidation}:{trend:ts?.trend??50,momentum:ts?.momentum??50,flow:ts?.participation??50,structure:ts?.structure??50,nearResistance:Number.isFinite(px)&&Number.isFinite(resistance)?px>=resistance*.94&&px<=resistance*1.03:false,confirmedBreakout:Number.isFinite(px)&&Number.isFinite(resistance)?px>resistance&&(ts?.participation??0)>=60:false,structuralBreak:Number.isFinite(px)&&Number.isFinite(invalidation)?px<invalidation:false,reclaimLevel:Number.isFinite(resistance)?resistance:null,invalidation:Number.isFinite(invalidation)?invalidation:null},evidenceCompleteness:Math.round(available/6*100),canonicalAction:v5Analysis.decision.primaryAction,canonicalOwnerAction:v5Analysis.decision.ownerAction});
  },[v5Analysis,decisionSnapshot,symbol,marketTruth,previousSetupState,company?.asOf,company?.updatedAt,context?.estimatesAsOf,context?.earnings?.date,context?.asOf,d?.analysisAnchorAsOf,d?.marketIntelligence?.snapshotId]);

  useEffect(()=>{if(!institutionalDecision)return;try{localStorage.setItem(`auryn:v931:setup:${symbol}`,institutionalDecision.setupState)}catch{}},[symbol,institutionalDecision?.setupState]);

  const proofArchetype=v5Analysis?.v4.classification.businessModel||null;
  useEffect(()=>{
    let live=true;if(!proofArchetype){setModelHealth(null);return()=>{live=false};}
    const key=String(proofArchetype).toUpperCase(),cached=modelHealthCache.get(key);
    if(cached){setModelHealth(cached);return()=>{live=false};}
    const cancel=scheduleNonCritical(()=>fetch(`/api/model-health?archetype=${encodeURIComponent(key)}`,{cache:"force-cache"}).then(r=>r.ok?r.json():null).then(x=>{if(x)modelHealthCache.set(key,x);if(live)setModelHealth(x)}).catch(()=>{if(live)setModelHealth(null)}));
    return()=>{live=false;cancel()};
  },[proofArchetype]);

  const v6Analysis=useMemo(()=>{
    if(!v5Analysis)return null;
    try{return buildAurynV6Analysis({v5:v5Analysis,owns,modelProof:modelHealth?.proof??null});}catch{return null;}
  },[v5Analysis,owns,modelHealth?.proof]);

  const v7Analysis=useMemo(()=>{
    if(!v6Analysis)return null;
    try{return buildAurynV7Analysis({v6:v6Analysis});}catch{return null;}
  },[v6Analysis]);
  const canonicalTrustBlocked=v7Analysis?.trust.state==="BLOCK";

  const canonicalValidationLevels=useMemo(()=>{
    const map=d?.marketIntelligence?.actionMap;
    if(map){
      const low=Number(map.preferredEntry?.low),high=Number(map.preferredEntry?.high);
      return{
        preferredEntry:Number.isFinite(low)&&Number.isFinite(high)?(low+high)/2:null,
        preferredEntryLow:Number.isFinite(low)?low:null,
        preferredEntryHigh:Number.isFinite(high)?high:null,
        support:map.support??null,
        majorSupport:map.majorSupport??null,
        resistance:map.confirm??null,
        breakout:map.confirm??null,
        confirmation:map.confirm??null,
        t1:map.t1??null,t2:map.t2??null,
        invalidation:map.invalidation??null,
        actionMap:map,
        snapshotId:d.marketIntelligence.snapshotId
      };
    }
    const plan=v5Analysis?.executionPlan;
    if(!plan||plan.state!=="READY")return d?.levels||{};
    return{
      preferredEntry:plan.initialEntry?.low??null,
      support:plan.initialEntry?.high??null,
      majorSupport:plan.invalidation??null,
      resistance:plan.targets[0]?.price??plan.confirmation??null,
      breakout:plan.confirmation??null,
      invalidation:plan.invalidation??null,
      dcaZones:plan.dcaZones,
      intent:plan.intent,
      snapshotId:plan.snapshotId
    };
  },[v5Analysis,d?.levels,d?.marketIntelligence]);

  const enterprise=useMemo(()=>{
    if(!d||!intelligence)return null;
    const now=Date.now();
    const freshness=[
      {name:"Price / decision",ok:priceSensitiveAllowed,label:marketTruth?`${marketTruth.priceState} · ${marketTruth.snapshotId}`:"verifying canonical market truth"},
      {name:"Fundamentals",ok:!!company?.fundamentalSignal,label:company?.fundamentalSignal?"SEC/company evidence loaded":"missing"},
      {name:"Institutional",ok:d.assetType==="crypto"||!!institutional?.enabled,label:d.assetType==="crypto"?"not applicable":institutional?.enabled?"reported ownership/insider evidence loaded":"not available"},
      {name:"News / catalysts",ok:!!context?.enabled,label:context?.enabled?"context feed loaded":"missing"},
      {name:"Earnings",ok:!!context?.earnings,label:context?.earnings?.date||"not identified"},
      {name:"Options",ok:d.assetType==="crypto"||!!optionsData?.enabled,label:d.assetType==="crypto"?"not applicable":optionsData?.enabled?(optionsData.dataMode||"provider snapshot"):"not loaded"}
    ];
    const coverage=Math.round(freshness.filter(x=>x.ok).length/freshness.length*100);
    const dataQuality=Math.round((coverage*.55)+(intelligence.confidence*.45));
    const auditId=`${symbol}-${mode}-${marketTruth?.snapshotId||`analysis-${Math.round(Number(d.price||0)*100)}`}-${intelligence.score}`;
    const validationStatus="Shadow validation enabled";
    return {freshness,coverage,dataQuality,auditId,validationStatus,engineVersion:ENGINE_VERSION,generatedAt:new Date(now).toISOString()};
  },[d,intelligence,company,context,optionsData,institutional,symbol,mode,priceSensitiveAllowed,marketTruth]);

  useEffect(()=>{
    if(!d||!intelligence||!enterprise||!institutionalDecision||!decisionSnapshot||!priceSensitiveAllowed||canonicalDecisionPrice==null||canonicalTrustBlocked||typeof window==="undefined")return;
    const todayFingerprint=investorDecision?.today?`${investorDecision.today.action}:${investorDecision.today.blocked}:${investorDecision.today.policyVersion}:${investorDecision.today.reason}`:"today-pending";
    const key=`nivora-validation:${enterprise.auditId}:${todayFingerprint}`;
    if(sessionStorage.getItem(key))return;
    sessionStorage.setItem(key,"1");
    fetch("/api/validation/snapshot",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
      symbol,engineVersion:enterprise.engineVersion,mode,price:canonicalDecisionPrice,score:intelligence.score,
      confidence:intelligence.confidence,action:intelligence.action,thesisLabel:intelligence.thesisLabel,
      dimensions:intelligence.dimensions,levels:canonicalValidationLevels,auditId:enterprise.auditId,
      evidence:{coverage:enterprise.coverage,dataQuality:enterprise.dataQuality,contradictions:intelligence.contradictions,benchmark:d.market?.benchmark||"SPY",benchmarkPrice:d.market?.benchmarkPrice??null,v934:d?.marketIntelligence?projectMarketIntelligence(d.marketIntelligence):null,v931:institutionalDecision?{snapshotId:institutionalDecision.snapshotId,newMoneyAction:institutionalDecision.newMoneyAction,ownerAction:institutionalDecision.ownerAction,longTermAction:institutionalDecision.longTermAction,canonicalPrimaryAction:institutionalDecision.canonicalPrimaryAction,legacyChallengerAction:institutionalDecision.legacyChallengerAction,hardVetoReasons:institutionalDecision.hardVetoReasons,policyReasons:institutionalDecision.policyReasons,executionAction:institutionalDecision.executionAction,setupState:institutionalDecision.setupState,decisionScore:institutionalDecision.decisionScore,evidenceCompleteness:institutionalDecision.evidenceCompleteness,nextDecisionTrigger:institutionalDecision.nextDecisionTrigger,invalidationTrigger:institutionalDecision.invalidationTrigger}:null,v5:v5Analysis&&v7Analysis?{snapshotId:v5Analysis.snapshotId,engineVersion:v7Analysis.engineVersion,action:v5Analysis.decision.primaryAction,ownerAction:v5Analysis.decision.ownerAction,executionState:v5Analysis.executionPlan.state,priceState:v5Analysis.marketTruth.priceState,executionPlan:v5Analysis.executionPlan,trustState:v7Analysis.trust.state,trustScore:v7Analysis.trust.score,thesisStrength:v5Analysis.metrics.find((m:any)=>m.id==="thesisStrength")?.value??null,businessQuality:v5Analysis.metrics.find((m:any)=>m.id==="businessQuality")?.value??null,entryQuality:v5Analysis.metrics.find((m:any)=>m.id==="entryQuality")?.value??null}:null},
      investorDecision:investorDecision?{companyScore:investorDecision.companyScore,thesisScore:investorDecision.thesisScore,opportunityScore:investorDecision.opportunityScore,thesisLabel:investorDecision.thesisLabel,thesisState:investorDecision.thesisState,valuationLabel:investorDecision.valuationLabel,action:investorDecision.action,confidence:investorDecision.confidence,dataCompleteness:investorDecision.dataCompleteness,archetype:investorDecision.archetype,factors:investorDecision.factors,horizons:investorDecision.horizons,drivers:investorDecision.drivers,risks:investorDecision.risks,today:investorDecision.today}:null,
      canonicalDecision:v7Analysis?serializeV7Decision(v7Analysis):null
    })}).catch(()=>{});
  },[d?.price,canonicalDecisionPrice,priceSensitiveAllowed,intelligence?.score,intelligence?.confidence,enterprise?.auditId,symbol,mode,investorDecision?.thesisScore,investorDecision?.opportunityScore,investorDecision?.today,v5Analysis?.snapshotId,v5Analysis?.decision.primaryAction,v5Analysis?.executionPlan.state,v7Analysis?.trust.state,institutionalDecision?.snapshotId,institutionalDecision?.newMoneyAction,institutionalDecision?.ownerAction,institutionalDecision?.setupState,decisionSnapshot?.snapshotId,d?.marketIntelligence?.snapshotId]);

  if(!d||!view){
    const partialStatus=!marketTruth?"Verifying market price":marketTruth.priceState==="OFFICIAL_CLOSE"?"Market closed · verified reference":marketTruth.session==="PRE_MARKET"?"Pre-market · verified source":marketTruth.session==="AFTER_HOURS"?"After-hours · verified source":"Market open · verified source";
    const partialDetail=marketTruth?`${String(marketTruth.reason||"")}${marketTruth.decisionPriceAsOf?` · price as of ${new Date(marketTruth.decisionPriceAsOf).toLocaleString()}`:""}`:"Price verification loads independently from the research engine.";
    const partialChange=Number(liveQuote?.changePct);
    return <div className="aurynStockPage aurynProgressiveStock">
      <StockSecurityHeader company={symbol} symbol={symbol} price={priceSensitiveAllowed?canonicalDecisionPrice:null} changePct={priceSensitiveAllowed&&Number.isFinite(partialChange)?partialChange:null} status={partialStatus} detail={partialDetail} owns={owns} positionLoaded={Boolean(ownerPosition)} onToggleOwn={()=>setOwns(!owns)}/>
      <section className={`aurynProgressiveResearch ${err?"degraded":"loading"}`}>
        <small>{err?"RESEARCH TEMPORARILY UPDATING":"BUILDING CONFIRMED RESEARCH"}</small>
        <h2>{err?"Live price is active. Historical intelligence is retrying.":`Building ${symbol} without blocking the live price.`}</h2>
        <p>{err||"Confirmed 4H, daily and weekly structure load first. Tactical 15M/1H context follows separately."}</p>
        {err?<button type="button" onClick={()=>{setErr("");setCoreRetry(x=>x+1)}}>Retry research</button>:null}
      </section>
    </div>;
  }

  const business=company?.fundamentalSignal||{label:d.assetType==="crypto"?"Crypto":"Loading",tone:"neutral",reasons:[]};
  const canonicalMetricScore=(id:string)=>{const m=v5Analysis?.metrics.find(x=>x.id===id);return m?.available&&Number.isFinite(Number(m.value))?Math.round(Number(m.value)):null;};
  const canonicalBusinessScore=canonicalMetricScore("businessQuality");
  const canonicalBusinessLabel=canonicalBusinessScore==null?"N/A":formatScoreBand(canonicalBusinessScore);
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
  const canonicalPlan=v5Analysis?.executionPlan;
  const canonicalPlanZone=canonicalPlan?.initialEntry??null;
  const supportText=canonicalPlanZone?`${canonicalPlan?.intent==="ACCUMULATE"?"Plan zone":"Watch zone"} ${displayMoney(canonicalPlanZone.low)}–${displayMoney(canonicalPlanZone.high)}`:`Support ${displayMoney(Number(d.levels.support))}`;
  const resistanceText=canonicalPlan?.confirmation!=null?`Confirm ${displayMoney(canonicalPlan.confirmation)}`:`Resistance ${displayMoney(Number(d.levels.resistance))}`;
  const todayMoveText=changeAbs>=4?"Large "+(d.changePct>=0?"move up":"move down")+": "+(d.changePct>=0?"+":"")+String(d.changePct)+"%":"Today’s move";
  const nextCatalystTitle=earn?"Earnings · "+String(earn.date):(filings[0]?.label||"No scheduled catalyst found");
  const nextCatalystDetail=earn?String(earn.hour||"Timing not listed")+(earn.epsEstimate!=null?" · EPS est. "+String(earn.epsEstimate):""):filings[0]?String(filings[0].form)+" filed "+String(filings[0].date):"AURYN will surface a catalyst when a connected source identifies one.";
  const marketContextText=d.market.benchmark?String(symbol)+" is "+String(d.market.relativeStrength).toLowerCase()+" versus "+String(d.market.benchmark)+" over the recent period.":"Crypto benchmark context is handled separately.";
  const selectedReturn=perfRange==="6M"?d.performance?.sixMonthPct??d.sixMonth?.returnPct??null:
    perfRange==="YTD"?d.performance?.ytdPct??null:d.performance?.oneYearPct??null;
  // One canonical market price drives every price-sensitive surface. When market truth is blocked,
  // structural research may still use the daily analysis internally, but the UI must not present it as current.
  const currentPx=Number(canonicalDecisionPrice??d.price);
  const displayChangePct=priceSensitiveAllowed&&Number.isFinite(Number(liveQuote?.changePct))?Number(liveQuote.changePct):Number(d.changePct);
  const breakoutPx=Number(d.levels.breakout), invalidPx=Number(d.levels.invalidation);
  const upside=Number.isFinite(currentPx)&&currentPx?((breakoutPx/currentPx-1)*100):null;
  const downside=Number.isFinite(currentPx)&&currentPx?((invalidPx/currentPx-1)*100):null;
  const rrRaw=upside!=null&&downside!=null&&downside<0&&Math.abs(downside)>=0.4?Math.abs(upside/downside):null;
  const rr=rrRaw!=null&&Number.isFinite(rrRaw)&&rrRaw>0&&rrRaw<=12?rrRaw:null;

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


  const commandScore=intelligence?.score??overallScore;
  const contradictionCount=Number(intelligence?.contradictions?.length||0);
  const openResearch=(nextTab:Tab="thesis")=>{
    setTab(nextTab);
    requestAnimationFrame(()=>setTimeout(()=>thesisRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),80));
  };

  const valuationScoreRaw=intelligence?.valuation;
  const valuationScore=valuationScoreRaw==null||!Number.isFinite(Number(valuationScoreRaw))?null:Number(valuationScoreRaw);
  // Institutions must only represent verified reported ownership/13F evidence.
  // Never substitute the price/volume accumulation proxy into this slot.
  const institutionalPct=Number(institutional?.institutional?.shareChangePct);
  const institutionalHasPct=institutional?.enabled && Number.isFinite(institutionalPct);
  const fmtDate=(value?:string|null)=>{
    if(!value)return "Unavailable";
    const dt=new Date(`${value}T12:00:00`);
    return Number.isNaN(dt.getTime())?String(value):dt.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});
  };
  const institutionalPeriod=institutional?.institutional?.reportPeriod||institutional?.asOf||null;
  const institutionalPriorPeriod=institutional?.institutional?.previousPeriodEnd||null;
  const institutionalDatasetThrough=institutional?.institutional?.datasetThrough||null;

  const latestAnalyst=Array.isArray(context?.recommendations)?context.recommendations[0]:null;
  const analystCounts=latestAnalyst?{
    strongBuy:Number(latestAnalyst.strongBuy||0),buy:Number(latestAnalyst.buy||0),hold:Number(latestAnalyst.hold||0),
    sell:Number(latestAnalyst.sell||0),strongSell:Number(latestAnalyst.strongSell||0)
  }:null;
  const analystTotal=analystCounts?Object.values(analystCounts).reduce((a:number,b:number)=>a+b,0):0;
  const analystBuy=analystCounts?(analystCounts.strongBuy+analystCounts.buy):0;
  const analystSell=analystCounts?(analystCounts.sell+analystCounts.strongSell):0;
  const pt=context?.priceTarget||{};
  const targetMean=Number(pt.targetMean);
  const targetMedian=Number(pt.targetMedian);
  const targetHigh=Number(pt.targetHigh);
  const targetLow=Number(pt.targetLow);
  const hasAnalystTarget=Number.isFinite(targetMean)&&targetMean>0;

  const technicalState=d?.technicalState||{
    strength:Math.max(0,Math.min(100,Math.round(Number(d.scores?.trend??50)*.34+Number(d.scores?.momentum??50)*.27+Number(d.scores?.flow??50)*.17+Number(d.scores?.structure??50)*.16+50*.06))),
    entryQuality:Number(d.scores?.entry??d.scores?.timing??50),trend:Number(d.scores?.trend??50),momentum:Number(d.scores?.momentum??50),participation:Number(d.scores?.flow??50),structure:Number(d.scores?.structure??50),extensionRisk:Number(d.scores?.extension??50),volatilityRisk:Number(d.scores?.risk??50),state:d.labels?.trend||"Mixed",entryState:d.labels?.entry||"Mixed"
  };

  const fairValue=(()=>{
    const technicalAnchor=Math.max(Number(d.levels?.breakout||currentPx),Number(marketLab?.waveTarget||currentPx));
    const businessAnchor=currentPx*(1+Math.max(-.22,Math.min(.28,(businessScore-50)/250)));
    const mid=hasAnalystTarget
      ? targetMean*.60+businessAnchor*.25+technicalAnchor*.15
      : businessAnchor*.60+technicalAnchor*.40;
    const quality=Math.max(-.04,Math.min(.04,(businessScore-55)/800));
    return {
      mid:Number(mid.toFixed(2)),
      low:Number((mid*(.92+quality)).toFixed(2)),
      high:Number((mid*(1.08+quality)).toFixed(2)),
      source:hasAnalystTarget?"Analyst target + business quality + price structure":"Business quality + price structure"
    };
  })();

  const horizonPlan=(()=>{
    const atr=Math.max(.01,Number(proTech?.atr14||currentPx*.025));
    const pref=Number(d.levels.preferredEntry), sup=Number(d.levels.support), major=Number(d.levels.majorSupport), res=Number(d.levels.resistance), brk=Number(d.levels.breakout), inv=Number(d.levels.invalidation);
    let entryLow=Math.min(pref,sup),entryHigh=Math.max(pref,sup),confirm=brk,target1=res,target2=Math.max(brk+atr*1.25,res+atr*1.75),stop=inv;
    if(horizon==="swing"){
      entryLow=Math.max(0,Math.min(major,sup-atr*.55));entryHigh=sup;confirm=res;target1=brk;target2=brk+atr*1.6;stop=Math.min(inv,entryLow-atr*.85);
    }
    if(horizon==="long"){
      entryLow=Math.max(0,Math.min(Number(marketLab?.dcaLow||major),major));entryHigh=Math.max(Number(marketLab?.dcaHigh||sup),sup);confirm=brk;
      target1=Math.max(brk,fairValue.low,currentPx*1.10);target2=Math.max(target1+atr,fairValue.mid,currentPx*1.22);stop=Math.min(inv,major-atr*1.15);
    }
    // A "buy zone" must be decision-useful, not a huge percentage band.
    // Clamp the visible zone around its midpoint; wider structural levels remain visible as support/major support.
    const rawMid=(entryLow+entryHigh)/2;
    const isCrypto=/BTC|ETH|\//i.test(String(d.symbol||d.name||""));
    const maxZonePct=isCrypto?.045:.065;
    const maxHalf=Math.max(currentPx*.012,rawMid*maxZonePct/2);
    if(entryHigh-entryLow>maxHalf*2){entryLow=Math.max(0,rawMid-maxHalf);entryHigh=rawMid+maxHalf;}
    const plannedEntry=(entryLow+entryHigh)/2;
    const reward=Math.max(.01,target1-plannedEntry),riskAmt=Math.max(.01,plannedEntry-stop);
    const ratioRaw=reward/riskAmt;
    const ratio=Number.isFinite(ratioRaw)&&ratioRaw>0&&ratioRaw<=12&&riskAmt/plannedEntry>=.004?ratioRaw:0;
    return {
      entryLow:Number(entryLow.toFixed(2)),entryHigh:Number(entryHigh.toFixed(2)),confirm:Number(confirm.toFixed(2)),
      target1:Number(target1.toFixed(2)),target2:Number(target2.toFixed(2)),stop:Number(stop.toFixed(2)),rr:Number(ratio.toFixed(1)),
      timeframe:horizon==="now"?"Current / daily structure":horizon==="swing"?"Swing / daily-weekly structure":"Long term / weekly-monthly thesis"
    };
  })();
  const rsiNow=Number(proTech?.rsi14??d.engine?.RSI??50), extensionNow=Number(d.scores?.extension??50);
  const timingState=(()=>{
    if((rsiNow>=76||extensionNow>=82)&&currentPx>=Number(d.levels?.resistance||Infinity))return{label:owns?"TRIM / DO NOT ADD":"DO NOT CHASE",reason:`Price is stretched${Number.isFinite(rsiNow)?` (RSI ${rsiNow.toFixed(0)})`:""} near/above resistance. This is a timing warning, not automatically a broken thesis.`,tone:"bad" as const};
    if(rsiNow>=70||extensionNow>=74)return{label:"OVEREXTENDED",reason:"Momentum is strong but entry quality is poor. Prefer consolidation, a pullback, or new fundamental evidence before adding.",tone:"mid" as const};
    if(currentPx>=horizonPlan.entryLow&&currentPx<=horizonPlan.entryHigh&&rsiNow<68)return{label:"ATTRACTIVE ENTRY",reason:"Price is inside the preferred accumulation band without an extreme momentum reading. Thesis must still remain intact.",tone:"good" as const};
    if(currentPx<horizonPlan.entryLow)return{label:"WAIT FOR STABILITY",reason:"Price is below the planned area. Cheaper is not automatically better; wait for stabilization and intact thesis evidence.",tone:"mid" as const};
    return{label:"WAIT / WATCH",reason:"The investment thesis and the current entry are not aligned strongly enough for a high-conviction add.",tone:"mid" as const};
  })();

  const horizonChartLevels={
    entryLow:horizonPlan.entryLow,entryHigh:horizonPlan.entryHigh,confirm:horizonPlan.confirm,
    target1:horizonPlan.target1,target2:horizonPlan.target2,stop:horizonPlan.stop,
    preferredEntry:horizonPlan.entryLow,support:horizonPlan.entryHigh,majorSupport:Number(d.levels.majorSupport),
    resistance:horizonPlan.target1,breakout:horizonPlan.confirm,invalidation:horizonPlan.stop
  };
  const v5ChartLevels=(()=>{
    const plan=v5Analysis?.executionPlan;
    if(!plan||plan.state!=="READY"||!plan.initialEntry)return null;
    const t1=plan.targets[0]?.price??null,t2=plan.targets[1]?.price??t1;
    return {
      entryLow:plan.initialEntry.low,entryHigh:plan.initialEntry.high,confirm:plan.confirmation,
      target1:t1,target2:t2,stop:plan.invalidation,preferredEntry:plan.initialEntry.low,
      support:plan.initialEntry.high,majorSupport:plan.invalidation,resistance:t1,breakout:plan.confirmation,invalidation:plan.invalidation
    };
  })();
  const horizonCandles=(d.candles||[]).slice(horizon==="now"?-65:horizon==="swing"?-125:-180);

  const marketStatusLabel=!marketTruth?"Verifying market price"
    :marketTruth.priceState==="OFFICIAL_CLOSE"&&marketTruth.session==="AFTER_HOURS"?"After-hours · Verified regular close"
    :marketTruth.priceState==="OFFICIAL_CLOSE"&&marketTruth.session==="PRE_MARKET"?"Pre-market · Verified regular close"
    :marketTruth.priceState==="OFFICIAL_CLOSE"&&marketTruth.session==="OVERNIGHT"?"Overnight · Verified regular close"
    :marketTruth.priceState==="OFFICIAL_CLOSE"?"Market closed · Verified regular close"
    :marketTruth.priceState==="LIVE_VERIFIED"&&marketTruth.session==="AFTER_HOURS"?"After-hours · Live verified"
    :marketTruth.priceState==="LIVE_VERIFIED"&&marketTruth.session==="PRE_MARKET"?"Pre-market · Live verified"
    :marketTruth.priceState==="LIVE_VERIFIED"?"Market open · Live verified"
    :marketTruth.priceState==="LIVE_SINGLE_SOURCE"&&marketTruth.session==="AFTER_HOURS"?"After-hours · Verified source"
    :marketTruth.priceState==="LIVE_SINGLE_SOURCE"&&marketTruth.session==="PRE_MARKET"?"Pre-market · Verified source"
    :marketTruth.priceState==="LIVE_SINGLE_SOURCE"?"Market open · Verified source"
    :marketTruth.priceState==="UNVERIFIED"?"PRICE UNVERIFIED"
    :"Price unavailable";
  const marketDetail=marketTruth
    ?`${String(marketTruth.reason||"")}${(marketTruth.decisionPriceAsOf||marketTruth.asOf)?` · price as of ${new Date(marketTruth.decisionPriceAsOf||marketTruth.asOf).toLocaleString()}`:""}${marketTruth.providerAgreementPct!=null?` · provider gap ${Number(marketTruth.providerAgreementPct).toFixed(2)}%`:""}`
    :"AURYN is verifying independent market sources before displaying a current price.";
  return <div className="aurynStockPage">
    <StockSecurityHeader company={company?.name||d.name||symbol} symbol={symbol} price={priceSensitiveAllowed?canonicalDecisionPrice:null} changePct={priceSensitiveAllowed?displayChangePct:null} status={marketStatusLabel} detail={marketDetail} owns={owns} positionLoaded={Boolean(ownerPosition)} onToggleOwn={()=>setOwns(!owns)}/>
    {marketTruth&&!priceSensitiveAllowed?<div className="aurynIntegrityAlert aurynMarketTruthAlert" role="alert"><b>PRICE UNVERIFIED</b><span>{marketTruth.reason||"Independent market sources are not sufficiently aligned."} AURYN has disabled entry, confirmation, target, stop and risk/reward output until the canonical price is verified.</span></div>:null}
    {institutionalDecision?<InstitutionalDecisionBrief decision={institutionalDecision} marketTruth={marketTruth} executionPlan={v5Analysis?.executionPlan??null} support={v5Analysis?.technical?.levels?.support??null} marketIntelligence={marketIntelligenceView??d?.marketIntelligence??null} scenario={v5Analysis?.scenario??null} entryQuality={technicalState.entryQuality}/>:null}
    {v5Analysis?<>{canonicalTrustBlocked?<div className="aurynIntegrityAlert aurynTrustBlock" role="alert"><b>CANONICAL TRUST BLOCK</b><span>{v7Analysis?.trust.blockers[0]||"AURYN detected an internal snapshot/plan inconsistency."} Price-sensitive execution levels are suppressed until the canonical chain is aligned.</span></div>:null}</>:<section className="aurynV5Unavailable"><small>AURYN CANONICAL ANALYSIS</small><b>COLLECTING VERIFIED EVIDENCE</b><span>AURYN will not publish a fallback verdict while the canonical snapshot is unavailable.</span></section>}
    <div className="aurynOwnershipNote"><Sparkles size={14}/><span>AURYN separates long-term thesis, owner action and new-money timing.</span></div>


    <div className="v6510ActionToolbar">
      <div className="v6510ActionButtons">
        <button type="button" onClick={watch}><Star size={16} fill={watching?"currentColor":"none"}/>{watching?"Watching":"Add to watchlist"}</button>
        <Link href={"/portfolio?symbol="+encodeURIComponent(symbol)}><PlusCircle size={16}/>Track position</Link>
      </div>
      {!canonicalTrustBlocked&&priceSensitiveAllowed&&<div className="v6510MarketLevels" aria-label="Market levels"><span>{supportText}</span><span>{resistanceText}</span></div>}
    </div>

    <section ref={thesisRef} id="auryn-research" className="aurynStockResearch">
      <StockEvidenceNav tab={tab} setTab={setTab} isCrypto={d.assetType==="crypto"}/>
      <StockEvidenceSections>

      {tab==="thesis"&&presentedDecision&&(v5Analysis?<StockThesisPanel decision={presentedDecision} v5={v5Analysis} metricDefinitions={metricDefinitions} marketTruth={marketTruth}/>:<div className="aurynV5Unavailable"><small>THESIS</small><b>CANONICAL SNAPSHOT PENDING</b><span>Structural evidence is loading into the canonical snapshot; AURYN will not publish a legacy fallback verdict.</span></div>)}

      {tab==="fundamentals"&&<div className="aurynStockTabPage v12Fund">
        <StockTabContext marketTruth={marketTruth} label="BUSINESS" title="Business quality & durability" score={canonicalBusinessScore} state={v4Analysis?.thesis.direction} action={institutionalDecision?.newMoneyAction??v5Analysis?.decision.primaryAction} detail={institutionalDecision?.pillars.business.why||"Business evidence is loading into the canonical AURYN decision."}/>
        <div className={`fundSignal ${business.tone||"neutral"}`}><small>BUSINESS QUALITY</small><h3>{canonicalBusinessLabel}{canonicalBusinessScore!=null?` · ${canonicalBusinessScore}/100`:""}</h3>{(business.reasons||[]).slice(0,4).map((x:string,i:number)=><p key={i}>• {x}</p>)}{five&&<div className="fiveRecord"><small>5-YEAR RECORD</small><b>{five.score}/100 · {formatScoreBand(Number(five.score))}</b><p>{five.summary}</p><small>Revenue trend: {five.revenueTrend}</small><div>{(five.history||[]).map((y:any)=><span key={y.year}><i>{y.year}</i><strong>{y.revenue!=null?money(y.revenue):"—"}</strong><em>{y.netIncome!=null?`NI ${money(y.netIncome)}`:"NI —"}</em></span>)}</div></div>}</div>
        <div className="osList">{company?.fundamentals?.length?company.fundamentals.map((x:any)=><div key={x.label}><span>{x.label}{x.detail&&<small>{x.detail}</small>}</span><b>{x.value}</b></div>):<p>No standardized SEC fundamentals available for this symbol yet.</p>}</div>
      </div>}

      {tab==="institutions"&&<div className="aurynStockTabPage v34InstitutionsPage">
        <StockTabContext marketTruth={marketTruth} label="OWNERSHIP" title="Ownership & positioning evidence" score={canonicalMetricScore("positioning")} state={institutionalLabel} action={institutionalDecision?.newMoneyAction??v5Analysis?.decision.primaryAction} detail="Ownership evidence is delayed context and feeds the same canonical decision without pretending to be real-time order flow."/>
        <div className="v34InstitutionHero">
          <div><small>INSTITUTIONAL OWNERSHIP INTELLIGENCE</small><h3>{institutional?.enabled?(institutional.institutional?.shareChangePctLabel||institutional.institutional?.directionLabel||institutionalLabel):"13F data unavailable"}</h3><p>Who reported adding, trimming, opening or exiting positions — translated from delayed SEC 13F evidence.</p></div>
          <div className="v34InstitutionDates">
            <div><small>REPORT PERIOD</small><b>{fmtDate(institutionalPeriod)}</b></div>
            <div><small>COMPARED WITH</small><b>{fmtDate(institutionalPriorPeriod)}</b></div>
            <div><small>SEC DATASET THROUGH</small><b>{fmtDate(institutionalDatasetThrough)}</b></div>
          </div>
        </div>
        <div className="v34InstitutionDisclosure"><Info size={14}/><span>13F shows reported holdings for a past quarter. It does not prove an institution is buying or selling today. AURYN separately labels current price/volume accumulation.</span></div>
        <div className="v32Institutional">
          <div className="v32InstitutionalHead"><div><small>INSTITUTIONAL INTELLIGENCE</small><h3>{institutionalLabel}</h3><p>{institutional?.disclosure||"Reported institutional ownership is not available from the connected feed for this symbol."}</p></div><MetricInfo title="Institutional intelligence">Reported institutional ownership and insider filings are delayed evidence. AURYN keeps this separate from the daily accumulation proxy so it never presents quarterly filings as real-time institutional buying.</MetricInfo></div>
          {institutional?.enabled?<div className="v32InstitutionalGrid v321InstitutionalGrid">
            <div><small>QUARTER-OVER-QUARTER</small><b className={Number(institutional.institutional?.shareChangePct||0)>0?"good":Number(institutional.institutional?.shareChangePct||0)<0?"bad":"mid"}>{institutional.institutional?.shareChangePctLabel||institutional.institutional?.directionLabel||institutionalLabel}</b><span>{institutional.institutional?.directionLabel||institutionalLabel} · {institutional.institutional?.increased||0} adding · {institutional.institutional?.reduced||0} trimming</span><em>{institutional.institutional?.periodLabel||"Latest available filing period"}</em></div>
            <div><small>REPORTED HOLDINGS</small><b className={Number(institutional.institutional?.netReportedShareChange||0)>0?"good":Number(institutional.institutional?.netReportedShareChange||0)<0?"bad":"mid"}>{institutional.institutional?.netChangeLabel||"Mixed / unavailable"}</b><span>{institutional.institutional?.totalShares!=null?`${Number(institutional.institutional.totalShares).toLocaleString()} shares now · ${Number(institutional.institutional.priorTotalShares||0).toLocaleString()} prior`: `${institutional.institutional?.reportingRows||0} reporting managers`}</span><em>{institutional.institutional?.totalValueLabel&&institutional.institutional?.priorTotalValueLabel?`${institutional.institutional.totalValueLabel} reported value · prior ${institutional.institutional.priorTotalValueLabel}`:"Delayed filing evidence — not today's order flow"}</em></div>
            <div><small>MANAGER BREADTH</small><b className={institutionalTone}>{institutional.institutional?.increased||0} adding · {institutional.institutional?.reduced||0} trimming</b><span>{institutional.institutional?.newManagers!=null?`${institutional.institutional.newManagers} new positions · ${institutional.institutional.exitedManagers||0} exits`: `${institutional.institutional?.reportingRows||0} reporting positions`}</span><em>{institutional.institutional?.unchangedManagers!=null?`${institutional.institutional.unchangedManagers} unchanged · ${institutional.institutional.reportingManagers||0} current managers`:"Latest available ownership evidence"}</em></div>
            <div><small>INSIDERS</small><b className={institutional.insiders?.label==="Net buying"?"good":institutional.insiders?.label==="Net selling"?"bad":"mid"}>{institutional.insiders?.label||"Mixed"}</b><span>{institutional.insiders?.buys||0} buys · {institutional.insiders?.sells||0} sells in available feed</span><em>Reported transactions only</em></div>
            <div><small>TODAY'S ACCUMULATION PROXY</small><b className={marketLab?.accumulationLabel==="Accumulating"?"good":marketLab?.accumulationLabel==="Distribution risk"?"bad":"mid"}>{marketLab?.accumulationLabel||"Insufficient data"}</b><span>{marketLab?`${marketLab.accumulation}/100 from price/volume behavior`:"Needs more price/volume history"}</span><em>Market-behavior proxy, not named-institution flow</em></div>
          </div>:<div className="v32InstitutionalEmpty"><b>Reported institutional filings unavailable.</b><span>{institutional?.reason||"AURYN could not verify current ownership data from the connected/cache sources."}</span><small>Price/volume accumulation remains available separately; AURYN will not call that institutional buying.</small></div>}
          {institutional?.enabled&&<div className="v33InstitutionalDeep">
            <div className="v33Pulse">
              <div><small>INSTITUTIONAL SCORE</small><b className={Number(institutional.institutional?.institutionalScore||50)>=60?"good":Number(institutional.institutional?.institutionalScore||50)<45?"bad":"mid"}>{institutional.institutional?.institutionalScore??50}/100</b><span>Quarterly filing trend strength</span></div>
              <div><small>ADD / TRIM BREADTH</small><b>{Number(institutional.institutional?.addBreadthPct||0).toFixed(0)}% / {Number(institutional.institutional?.trimBreadthPct||0).toFixed(0)}%</b><span>Among managers that changed positions</span></div>
              <div><small>REPORTED VALUE CHANGE</small><b className={Number(institutional.institutional?.valueChangePct||0)>0?"good":Number(institutional.institutional?.valueChangePct||0)<0?"bad":"mid"}>{institutional.institutional?.valueChangePctLabel||"Unavailable"}</b><span>Value also moves with stock price</span></div>
            </div>
            {[
              ["LARGEST REPORTED HOLDERS",institutional.institutional?.top],
              ["BIGGEST REPORTED ADDERS",institutional.institutional?.biggestBuyers],
              ["BIGGEST REPORTED TRIMMERS",institutional.institutional?.biggestSellers],
              ["NEW REPORTED POSITIONS",institutional.institutional?.newPositions],
              ["REPORTED EXITS",institutional.institutional?.exits]
            ].map(([title,list]:any)=>Array.isArray(list)&&list.length>0&&<details className="v33ManagerGroup" key={title} open={title==="LARGEST REPORTED HOLDERS"}>
              <summary><span>{title}</span><em>{list.length} shown</em></summary>
              <div className="v33ManagerTable">
                <div className="head"><span>Manager</span><span>Current</span><span>Prior</span><span>Change</span><span>Reported</span></div>
                {list.slice(0,12).map((x:any,i:number)=>{const ch=Number(x.change||0);const cp=Number(x.changePct);const total=Number(institutional.institutional?.totalShares||0);const poolPct=total>0?Number(x.shares||0)/total*100:null;return <div key={`${title}-${x.name}-${i}`}><b>{x.name}<small>{x.status?String(x.status).replace(/^./,(c:string)=>c.toUpperCase()):""}</small></b><span>{Number(x.shares||0).toLocaleString()} sh{poolPct!=null&&<small>{poolPct.toFixed(poolPct>=10?1:2)}% of reported 13F shares</small>}</span><span>{x.priorShares!=null?`${Number(x.priorShares).toLocaleString()} sh`:"—"}</span><em className={ch>0?"good":ch<0?"bad":"mid"}>{ch>0?"+":""}{Math.round(ch).toLocaleString()} {Number.isFinite(cp)?`(${cp>0?"+":""}${cp.toFixed(1)}%)`:""}</em><time>{x.filingDate?fmtDate(x.filingDate):(x.reportPeriod?fmtDate(x.reportPeriod):fmtDate(institutionalPeriod))}</time></div>})}
              </div>
            </details>)}
            <div className="v33InstitutionalNote"><b>How to read this</b><span>13F shows what reporting managers held at the report period—not what they are buying today. Manager percentages shown here are each manager’s share of AURYN’s aggregated reported 13F shares, not ownership % of the whole company. True company ownership % needs a period-matched shares-outstanding denominator.</span></div>
          </div>}
        </div>

      </div>}

      {tab==="catalysts"&&<div className="aurynStockTabPage v12Catalysts v37Events">
        <StockTabContext marketTruth={marketTruth} label="CATALYSTS" title="Events that can change the thesis" score={canonicalMetricScore("catalysts")} state={catalystLabel} action={institutionalDecision?.newMoneyAction??v5Analysis?.decision.primaryAction} detail={institutionalDecision?.pillars.catalystsRegime.why||"Catalyst and regime evidence is loading into the canonical AURYN decision."}/>
        <div className="v37EventsSummary"><div><small>EVENT RISK / OPPORTUNITY</small><h3>{catalystLabel}</h3><p>{intelligence?.dimensions?.catalysts!=null?`Catalyst score ${intelligence.dimensions.catalysts}/100. Events can change the thesis quickly; price confirmation still matters.`:"Event evidence is loading."}</p></div><div><small>NEWS TONE</small><b className={news.tone==="positive"?"good":news.tone==="negative"?"bad":"mid"}>{news.label}</b><span>{news.topReason||"No dominant headline signal."}</span></div></div>
        {earn&&<div className="nextEvent"><CalendarDays size={18}/><div><small>NEXT EARNINGS</small><b>{earn.date}</b><span>{earnDays!=null&&earnDays>=0?`${earnDays} days away`:"Upcoming"}{earn.epsEstimate!=null?` · EPS est. ${eps(earn.epsEstimate)}`:""}</span></div></div>}
        <div className="catalystIntro"><div><small>RECENT MATERIAL FILINGS</small><MetricInfo title="Catalysts">Company filings and scheduled events that may change the investment thesis. A filing is evidence to review, not automatically bullish or bearish.</MetricInfo></div><span>Newest first</span></div>
        <div className="catalystList">{filings.length?filings.slice(0,8).map((x:any)=><a className="catalystRow" href={x.url} target="_blank" rel="noreferrer" key={x.accession}>
          <div className="catalystMain"><b>{x.label}</b><small>{x.form}{x.description?` · ${x.description}`:""}</small></div>
          <div className="catalystMeta"><em className={x.tone}>{x.materiality}</em><time>{x.date}</time><ExternalLink size={14}/></div>
        </a>):<p className="emptyState">No recent material SEC filings found.</p>}</div>
        <div className="v37EventNews"><div className="catalystIntro"><div><small>RECENT MATERIAL NEWS</small></div><span>Context, not a standalone signal</span></div>{items.slice(0,5).map((x:any,i:number)=><a href={x.url} target="_blank" rel="noreferrer" key={i}><div><span className={`newsTone ${x.tone}`}>{x.tone}</span><small>{x.materiality} · {x.source}</small></div><b>{x.headline}</b><p>{x.summary}</p></a>)}</div>
      </div>}

      {tab==="news"&&<div className="aurynStockTabPage v12News">{context?.enabled===false?<div className="connectFeed"><Newspaper size={22}/><b>Connect live news</b><p>Add a Finnhub API key. Price analysis and SEC data continue to work without it.</p></div>:items.length?items.map((x:any,i:number)=><a href={x.url} target="_blank" rel="noreferrer" key={i}><div><span className={`newsTone ${x.tone}`}>{x.tone}</span><small>{x.materiality} materiality · {x.source}</small></div><b>{x.headline}</b><p>{x.summary}</p><ExternalLink size={13}/></a>):<p>No recent company headlines were returned.</p>}</div>}

      {tab==="earnings"&&<div className="aurynStockTabPage v12Earnings"><StockTabContext marketTruth={marketTruth} label="EARNINGS" title="Execution, revisions & reported results" score={canonicalMetricScore("fundamentals")} state={v4Analysis?.thesis.direction} action={institutionalDecision?.newMoneyAction??v5Analysis?.decision.primaryAction} detail={institutionalDecision?.pillars.earningsRevisions.why||"Earnings and forward-fundamental evidence is loading into the canonical AURYN decision."}/><div className="earnSplit">{latestReport&&<div className="earnNext earnReported"><small>LATEST REPORTED RESULTS</small><h3>{latestEarnNews?.date?new Date(latestEarnNews.date).toLocaleDateString():latestReport.date}</h3><p>{latestEarnNews?.headline||`${latestReport.form} filed — latest reported financial filing`}</p>{latestEarnNews?.url&&<a href={latestEarnNews.url} target="_blank" rel="noreferrer">Read results <ExternalLink size={12}/></a>}</div>}{earn&&<div className="earnNext estimated"><small>NEXT EARNINGS · ESTIMATED</small><h3>{earn.date}</h3><p>{earn.hour||"Time not listed"}{earn.epsEstimate!=null?` · EPS est. ${eps(earn.epsEstimate)}`:""}{earn.revenueEstimate!=null?` · Revenue est. ${money(earn.revenueEstimate)}`:""}</p><p className="earnMeta">Future calendar dates are estimates until confirmed by the company.</p></div>}</div><div className="earnGrid">{(context?.surprises||[]).length?context.surprises.map((x:any,i:number)=><div key={i}><small>{x.period}</small><b className={(x.surprisePercent??0)>=0?"good":"bad"}>{x.surprisePercent!=null?`${x.surprisePercent>=0?"+":""}${Number(x.surprisePercent).toFixed(1)}% surprise`:"Reported"}</b><span>Actual {formatEpsValue(x.actual)} · Est. {formatEpsValue(x.estimate)}</span></div>):<p>No earnings-surprise history returned by the connected feed.</p>}</div></div>}

      {tab==="technical"&&<div className="aurynStockTabPage v12Technical v26Technical">
        {d?.marketIntelligence?<section className="v934TechnicalCore" data-market-intelligence-snapshot={d.marketIntelligence.snapshotId}><div className="aurynEyebrow">MULTI-TIMEFRAME MARKET STATE</div><MarketTimeframeTape marketIntelligence={marketIntelligenceView??d.marketIntelligence}/><MarketActionMap marketIntelligence={d.marketIntelligence}/></section>:null}
        <StockTabContext marketTruth={marketTruth} label="TECHNICALS" title="Timing, trend & confluence" score={technicalState.strength} state={d.labels.trend} action={institutionalDecision?.newMoneyAction??v5Analysis?.decision.primaryAction} detail={institutionalDecision?.pillars.marketStructure.why||"Completed-bar market structure is loading into the canonical AURYN decision."}/>
        <div className="v34TechnicalHero v383TechnicalHero">
          <div><small>TECHNICAL DECISION SUPPORT</small><h3>Strength and entry are different questions.</h3><p>AURYN measures trend strength separately from entry quality, then uses RSI, MACD, participation, volatility and extension to explain why. A strong chart can still be a poor place to chase.</p></div>
          <div className="v34TechVerdict"><small>TECHNICAL STRENGTH</small><b className={technicalState.strength>=68?"good":technicalState.strength<45?"bad":"mid"}>{technicalState.strength}/100</b><span>{technicalState.state} · {proTech?.macdLabel||"MACD unavailable"} MACD · {proTech?.rsiLabel||"RSI unavailable"} RSI</span></div>
        </div>
        <div className="v383TechnicalStateGrid">
          <div><small>ENTRY QUALITY</small><b className={technicalState.entryQuality>=68?"good":technicalState.entryQuality<45?"bad":"mid"}>{technicalState.entryQuality}/100</b><span>{technicalState.entryState}</span></div>
          <div><small>TREND</small><b>{technicalState.trend}/100</b><span>{technicalState.trend>=67?"Bullish":technicalState.trend<42?"Bearish":"Mixed"}</span></div>
          <div><small>MOMENTUM</small><b>{technicalState.momentum}/100</b><span>{technicalState.momentum>=67?"Strong":technicalState.momentum<42?"Weak":"Mixed"}</span></div>
          <div><small>PARTICIPATION</small><b>{technicalState.participation}/100</b><span>{proTech?.volumeLabel||"Volume context"}</span></div>
          <div><small>EXTENSION RISK</small><b className={technicalState.extensionRisk>=70?"bad":technicalState.extensionRisk<40?"good":"mid"}>{technicalState.extensionRisk}/100</b><span>Higher = more chase risk</span></div>
          <div><small>VOLATILITY RISK</small><b className={technicalState.volatilityRisk>=70?"bad":technicalState.volatilityRisk<40?"good":"mid"}>{technicalState.volatilityRisk}/100</b><span>Higher = larger price swings</span></div>
        </div>
        {proTech&&<div className="v34IndicatorGrid">
<div>
  <div className="metricLabel">
    <small>RSI · 14</small>
    <MetricInfo title="RSI (14)">
      Relative Strength Index from 0–100. Above 70 can indicate an overbought/extended condition; below 30 can indicate oversold. AURYN does not use RSI alone.
    </MetricInfo>
  </div>

  <b
    className={
      proTech.rsi14 == null
        ? "mid"
        : proTech.rsi14 >= 70
        ? "bad"
        : proTech.rsi14 <= 30
        ? "good"
        : "mid"
    }
  >
    {proTech.rsi14 != null ? proTech.rsi14.toFixed(1) : "—"}
  </b>

  <span>{proTech.rsiLabel}</span>
</div>          <div><div className="metricLabel"><small>MACD · 12/26/9</small><MetricInfo title="MACD">MACD compares fast and slow exponential moving averages. A positive histogram supports bullish momentum; a negative histogram supports bearish momentum.</MetricInfo></div><b className={proTech.macdLabel==="Bullish"?"good":proTech.macdLabel==="Bearish"?"bad":"mid"}>{proTech.macdLabel}</b><span>{proTech.macdHist!=null?`Histogram ${proTech.macdHist>=0?"+":""}${proTech.macdHist.toFixed(3)}`:"Unavailable"}</span></div>
          <div><div className="metricLabel"><small>20D / 50D TREND</small><MetricInfo title="Moving-average trend">Compares price with the 20-day and 50-day moving averages. Alignment can confirm trend direction but can lag turning points.</MetricInfo></div><b className={proTech.trendLabel==="Bullish"?"good":proTech.trendLabel==="Bearish"?"bad":"mid"}>{proTech.trendLabel}</b><span>{proTech.d20!=null?`${proTech.d20>=0?"+":""}${proTech.d20.toFixed(1)}% vs 20D`:"—"} · {proTech.d50!=null?`${proTech.d50>=0?"+":""}${proTech.d50.toFixed(1)}% vs 50D`:"—"}</span></div>
          <div><div className="metricLabel"><small>VOLUME</small><MetricInfo title="Volume confirmation">Compares current volume with the recent 20-session average. Strong participation can make breakouts or reversals more meaningful.</MetricInfo></div><b>{proTech.volRatio!=null?`${proTech.volRatio.toFixed(2)}×`:"—"}</b><span>{proTech.volumeLabel}</span></div>
          <div><div className="metricLabel"><small>ATR · 14</small><MetricInfo title="ATR (14)">Average True Range estimates typical recent daily movement. ATR% helps compare volatility across stocks with different prices.</MetricInfo></div><b>{proTech.atrPct!=null?`${proTech.atrPct.toFixed(1)}%`:"—"}</b><span>Typical daily range</span></div>
          <div><div className="metricLabel"><small>{v5Analysis?.executionPlan.intent==="ACCUMULATE"?"DCA / INITIAL ENTRY":"STRUCTURAL WATCH ZONE"}</small><MetricInfo title="Canonical execution zone">This level comes from the single canonical execution plan. DCA multipliers appear only when AURYN has an active buy decision and decision-grade valuation.</MetricInfo></div><b>{!priceSensitiveAllowed?"BLOCKED":v5Analysis?.executionPlan.initialEntry?`${displayMoney(v5Analysis.executionPlan.initialEntry.low)}–${displayMoney(v5Analysis.executionPlan.initialEntry.high)}`:"—"}</b><span>{!priceSensitiveAllowed?"Price-sensitive technical zones are hidden until Market Truth verifies the underlying price.":v5Analysis?.executionPlan.intent==="ACCUMULATE"?"Canonical entry zone; staged DCA is enabled only while thesis and valuation remain valid.":v5Analysis?.executionPlan.initialEntry?"Structural watch level only; this is not an instruction to average down.":"No active structural zone"}</span></div>
          <div><div className="metricLabel"><small>BOLLINGER POSITION</small><MetricInfo title="Bollinger position">Shows where price sits within a 20-day, two-standard-deviation band. Near the top suggests extension; near the bottom suggests weakness/possible mean reversion.</MetricInfo></div><b>{proTech.bbPos!=null?`${Math.max(0,Math.min(100,proTech.bbPos)).toFixed(0)}%`:"—"}</b><span>0% lower band · 100% upper band</span></div>
          <div><div className="metricLabel"><small>REALIZED VOL · 20D</small><MetricInfo title="Realized volatility">Annualized recent realized volatility from daily returns. Higher values imply larger price variability and usually require more conservative sizing.</MetricInfo></div><b>{proTech.rv!=null?`${proTech.rv.toFixed(1)}%`:"—"}</b><span>{proTech.drawdown!=null?`${proTech.drawdown.toFixed(1)}% from 52-week high`:"52-week drawdown unavailable"}</span></div>
        </div>}
        {v5Analysis?<div className="v933TechnicalChart">
          <div className="v32MarketLabHead"><div><small>PRICE STRUCTURE</small><h3>Levels on the chart</h3><p>The chart uses the same preferred entry, confirmation, risk and target levels shown in the AURYN call above.</p></div></div>
          <PriceChart candles={v5Analysis.bars.slice(horizon==="now"?-65:horizon==="swing"?-125:-180)} levels={v5ChartLevels} showTrend={true}/>
        </div>:null}
      </div>}

      {tab==="options"&&<div className="aurynStockTabPage gammaPanel v22Options v26Options">
        <StockTabContext marketTruth={marketTruth} label="OPTIONS" title="Positioning & contract research" score={null} state={optionsData?.enabled?"Provider data":"Evidence dependent"} action={institutionalDecision?.newMoneyAction??v5Analysis?.decision.primaryAction} detail={institutionalDecision?.pillars.riskAsymmetry.why||"Risk/asymmetry evidence governs how options research is interpreted; options do not create a separate directional call."}/>
        <div className="gammaHero"><small>OPTIONS LAB</small><h3>Positioning + contract research in one place.</h3><p>Start with the stock thesis, then use options data to compare structure, liquidity, volatility and leverage. Candidate contracts are ranked research outputs, not automatic trades.</p></div>
        <div className="optionSubnav"><button className={optionView==="setups"?"on":""} onClick={()=>setOptionView("setups")}>Contract setups</button><button className={optionView==="positioning"?"on":""} onClick={()=>setOptionView("positioning")}>Gamma / positioning</button></div>
        {!priceSensitiveAllowed?<div className="optionsState marketTruthBlocked"><b>UNDERLYING PRICE UNVERIFIED</b><span>Contract setups are blocked until the underlying price is verified. AURYN will not rank strikes, premiums, break-even levels or leverage from an untrusted market snapshot.</span></div>:
        optionsLoading?<div className="optionsState">Loading shared options snapshot…</div>:
        !optionsData?.enabled?<div className="optionsState"><b>Options data is not available.</b><span>{optionsData?.reason||"Add MARKETDATA_TOKEN in Vercel to enable the options module."}</span><button type="button" className="optionsRetry" onClick={()=>{setOptionsData(null);setOptionsLoading(false)}}>Retry</button></div>:
        <><div className="optionsFresh"><span>{optionsData.dataMode}</span><small>{optionsData.updatedAt?`Provider snapshot ${new Date(optionsData.updatedAt).toLocaleString()}`:"Provider timestamp unavailable"}</small></div>
        {optionView==="setups"?<div className="contractLab">
          <div className="contractContext"><div><small>UNDERLYING CALL</small><b className={tone(v5Analysis?formatInvestmentAction(v5Analysis.decision.primaryAction):"VERIFY")}>{institutionalDecision?institutionalDecision.newMoneyAction.replaceAll("_"," "):v5Analysis?formatInvestmentAction(v5Analysis.decision.primaryAction):"VERIFY"}</b><span>Options express the same canonical AURYN thesis—they never create a separate directional call.</span></div><div><small>EXPECTED MOVE</small><b>{optionsData.expectedMovePct!=null?`±${formatOptionPercent(optionsData.expectedMovePct)}`:"—"}</b><span>From near-ATM option premium</span></div><div><small>ATM IV</small><b>{formatOptionPercent(optionsData.atmIV)}</b><span>Volatility priced into options</span></div></div>
          <div className="contractControls"><div><button className={optionSide==="bullish"?"on":""} onClick={()=>setOptionSide("bullish")}>Calls · bullish</button><button className={optionSide==="bearish"?"on":""} onClick={()=>setOptionSide("bearish")}>Puts · bearish</button></div><div><button className={optionStyle==="conservative"?"on":""} onClick={()=>{setOptionExpiration(null);setOptionStyle("conservative")}}>Safer</button><button className={optionStyle==="balanced"?"on":""} onClick={()=>{setOptionExpiration(null);setOptionStyle("balanced")}}>Balanced</button><button className={optionStyle==="aggressive"?"on":""} onClick={()=>{setOptionExpiration(null);setOptionStyle("aggressive")}}>Aggressive</button><button className={optionStyle==="leaps"?"on":""} onClick={()=>{setOptionExpiration(null);setOptionStyle("leaps")}}>LEAPS</button></div></div>
          <div className="styleExplain"><MetricInfo title="Contract styles">Safer targets higher delta and better liquidity. Balanced seeks a middle ground. Aggressive accepts lower delta/shorter duration and can lose premium faster. LEAPS favors long duration and higher delta to reduce short-term theta pressure.</MetricInfo><span>{optionStyle==="leaps"?"Long-duration candidates for investors seeking stock-like exposure with defined premium risk.":optionStyle==="aggressive"?"Higher leverage and faster premium decay. Treat this as the highest-risk filter.":optionStyle==="conservative"?"Higher-delta candidates with stronger emphasis on liquidity and spread quality.":"A compromise between leverage, duration, liquidity and delta."}</span></div>
          {optionsData?.expirations?.length>0&&<div className="expirationLab">
            <div className="expirationHead"><div><small>EXPIRATION INTELLIGENCE</small><b>{optionsData.selectedExpiration?new Date(`${optionsData.selectedExpiration}T12:00:00`).toLocaleDateString():"Choose a date"}</b><span>{optionsData.expirationFit}</span></div><button className={!optionExpiration?"on":""} onClick={()=>setOptionExpiration(null)}>Auto best-fit</button></div>
            <div className="expirationRail">
              {optionsData.expirations.map((x:any)=><button key={x.date} className={(optionExpiration||optionsData.selectedExpiration)===x.date?"on":""} onClick={()=>setOptionExpiration(x.date)}><b>{new Date(`${x.date}T12:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric",year:x.dte>250?"numeric":undefined})}</b><span>{x.dte} DTE</span></button>)}
            </div>
          </div>}

          {(()=>{
            const list=optionsData.contractSetups?.[optionSide]?.[optionStyle]||[];
            return list.length?<div className="contractCards">{list.map((x:any,i:number)=><div className={`contractCard ${i===0?"top":""}`} key={`${x.expiration}-${x.strike}-${x.side}`}>
              <div className="contractHead"><span>{i===0?"TOP RANKED":"ALTERNATIVE"}</span><b>{x.expiration?new Date(x.expiration).toLocaleDateString():"—"} · {formatOptionPrice(x.strike)} {x.side==="call"?"Call":"Put"}</b><em>{Math.round(Number(x.score||0))}/100</em></div>
              <div className="contractStats"><div><small>PREMIUM</small><b>{x.premium!=null?`~${formatOptionPrice(x.premium)}`:"—"}</b></div><div><small>DELTA</small><b>{formatOptionNumber(x.delta,2)}</b></div><div><small>DTE</small><b>{x.dte!=null?Math.round(Number(x.dte)):"—"}</b></div><div><small>IV</small><b>{formatOptionPercent(x.iv)}</b></div><div><small>OI</small><b>{Number(x.openInterest||0).toLocaleString()}</b></div><div><small>SPREAD</small><b>{formatOptionPercent(x.spreadPct)}</b></div><div><small>BREAK-EVEN</small><b>{formatOptionPrice(x.breakEven)}</b></div><div><small>LEVERAGE</small><b>{x.leverage!=null?`${formatOptionNumber(x.leverage,1)}×`:"—"}</b></div></div>
              <p>{x.score>=75?"Strong candidate quality from the available chain.":x.score>=60?"Usable candidate, but inspect liquidity/IV before acting.":"Lower-quality candidate from this delayed snapshot."}</p>
            </div>)}</div>:<div className="optionsState"><b>No contracts matched this filter.</b><span>The provider snapshot may not include the required expiration range or liquid contracts.</span></div>
          })()}
          <div className="contractFoot"><ShieldCheck size={15}/><p>{optionsData.rankingNote}</p></div>
        </div>:<div className="positioningLab">
          <div className="optionsQuick">
            <div><div className="metricLabel"><small>CALL WALL</small><MetricInfo title="Call wall">Largest call open-interest strike in the fetched chain. It is an attention area, not guaranteed resistance.</MetricInfo></div><b>{formatOptionPrice(optionsData.callWall)}</b></div>
            <div><div className="metricLabel"><small>PUT WALL</small><MetricInfo title="Put wall">Largest put open-interest strike in the fetched chain. It is an attention area, not guaranteed support.</MetricInfo></div><b>{formatOptionPrice(optionsData.putWall)}</b></div>
            <div><div className="metricLabel"><small>GAMMA NODE</small><MetricInfo title="Gamma node">Largest OI-weighted gamma concentration. This is a proxy; AURYN does not observe dealer inventory.</MetricInfo></div><b>{formatOptionPrice(optionsData.gammaNode)}</b></div>
            <div><small>EXPECTED MOVE</small><b>{optionsData.expectedMovePct!=null?`±${formatOptionPercent(optionsData.expectedMovePct)}`:"—"}</b></div>
            <div><small>ATM IV</small><b>{formatOptionPercent(optionsData.atmIV)}</b></div>
            <div><small>PUT/CALL OI</small><b>{optionsData.putCallOI!=null?formatOptionNumber(optionsData.putCallOI,2):"—"}</b></div>
          </div>
          <div className="optionsRead"><small>PLAIN-ENGLISH READ</small><h4>{optionsData.position}</h4><p>{optionsData.gammaProxy}. {optionsData.note}</p></div>
          {optionsData.topNodes?.length>0&&<div className="optionsNodes"><small>TOP GAMMA-CONCENTRATION STRIKES</small>{optionsData.topNodes.map((x:any)=><div key={x.strike}><b>{formatOptionPrice(x.strike)}</b><span>Call OI {x.callOI.toLocaleString()} · Put OI {x.putOI.toLocaleString()}</span></div>)}</div>}
        </div>}
        </>}
      </div>}
      </StockEvidenceSections>
    </section>

  </div>;
}
