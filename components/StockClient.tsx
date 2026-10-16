"use client";
import {saveWatchlistSymbol} from "@/lib/watchlist.mjs";
import {createResearchJsonCache,createResearchWarmCache,COMPANY_EVIDENCE_CONTRACT,isCurrentCompanyEvidence,type ResearchWarmEntry} from "@/lib/client-research-cache.mjs";
import BusinessEvidence from "./research/BusinessEvidence";
import ValuationWorkbench from "./research/ValuationWorkbench";
import ResearchVisit from "./ResearchVisit";
import MetricHelp from "./MetricHelp";
import {extractValuationEvidence} from "@/lib/research-valuation-workbench";
import WeeklyStructure from "./research/WeeklyStructure";
import {buildBusinessEvidence,formatReportedAmount} from "@/lib/research-evidence";
import {buildFundamentalAnalyst} from "@/lib/auryn/v99910/fundamental-analyst";
import {buildMarketTruth,formatMarketTruth} from "@/lib/auryn/market-truth";

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
import AurynResearchOverviewV2 from "./premium/AurynResearchOverviewV2";
import {buildDecisionSnapshot} from "@/lib/auryn/v931/decision-snapshot";
import {buildInstitutionalDecisionKernel} from "@/lib/auryn/v931/decision-kernel";
import type {SetupState} from "@/lib/auryn/v931/domain";
import {projectMarketIntelligence} from "@/lib/auryn/v934/projections";
import {deriveV934DecisionTechnical} from "@/lib/auryn/v934/decision-bridge";
import MarketTimeframeTape from "./market/MarketTimeframeTape";
import MarketActionMap from "./market/MarketActionMap";

type Mode="now"|"swing"|"long"|"own";
type Tab="financials"|"valuation"|"risk"|"thesis"|"fundamentals"|"institutions"|"catalysts"|"news"|"earnings"|"technical"|"options";

const tone=(s:string)=>{
  const x=(s||"").toUpperCase();
  if(x.includes("BUY")||x.includes("CONSTRUCTIVE")||x.includes("HOLD")||x.includes("STRONG")||x.includes("ATTRACTIVE"))return"good";
  if(x.includes("CHASE")||x.includes("AVOID")||x.includes("REDUCE")||x.includes("NOT YET")||x.includes("WEAK")||x.includes("POOR"))return"bad";
  return"mid";
};

const money=(n:any)=>{
  const x=n==null||n===""?NaN:Number(n);
  if(!Number.isFinite(x))return String(n??"—");
  const a=Math.abs(x);
  return `${x<0?"-":""}$${a>=1e9?(a/1e9).toFixed(2)+"B":a>=1e6?(a/1e6).toFixed(1)+"M":a>=1e3?(a/1e3).toFixed(1)+"K":a.toLocaleString()}`;
};
const eps=(n:any)=>{const x=n==null||n===""?NaN:Number(n);return Number.isFinite(x)?`${x<0?"-":""}$${Math.abs(x).toFixed(2)}`:"—"};
const formatEpsValue=(n:any)=>{const x=n==null||n===""?NaN:Number(n);return Number.isFinite(x)?x.toFixed(2):"—"};
const formatOptionPercent=(n:any,d=1)=>{const x=n==null||n===""?NaN:Number(n);return Number.isFinite(x)?`${x.toFixed(d)}%`:"—"};
const formatOptionPrice=(n:any)=>{const x=n==null||n===""?NaN:Number(n);return Number.isFinite(x)?displayMoney(x):"—"};
const formatOptionNumber=(n:any,d=2)=>{const x=n==null||n===""?NaN:Number(n);return Number.isFinite(x)?x.toFixed(d):"—"};
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

type StockWarmCache=ResearchWarmEntry;
const CORE_ATTEMPTS=1,CORE_TIMEOUT_MS=4500;
const CACHE_MAX_AGE=15*60*1000;
const DISPLAY_QUOTE_GRACE_MS=90_000;
const STALE_CACHE_MAX_AGE=7*24*60*60*1000;
const stockWarmCache=createResearchWarmCache({maxEntries:24,maxAgeMs:STALE_CACHE_MAX_AGE});
const researchJsonCache=createResearchJsonCache({maxEntries:48});
const chartCacheTtl=(range:string)=>range==="1D"||range==="1W"?30_000:5*60*1000;
function sharedJson(url:string,signal?:AbortSignal,ttlMs=15000){
  return researchJsonCache.get(url,{signal,ttlMs});
}
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
  stockWarmCache.merge(symbol,patch);
}
function mergeEvidenceWarm(symbol:string,patch:Partial<StockWarmCache>){
  stockWarmCache.merge(symbol,patch);
}
export default function StockClient({symbol}:{symbol:string}){
  const thesisRef=useRef<HTMLElement>(null);
  const overviewRef=useRef<HTMLDivElement>(null);
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
  const[watchError,setWatchError]=useState("");
  const[optionsData,setOptionsData]=useState<any>(null);
  const[optionsLoading,setOptionsLoading]=useState(false);
  const[perfRange,setPerfRange]=useState<"6M"|"YTD"|"1Y">("6M");
  const[chartMode,setChartMode]=useState<"clean"|"trend">("clean");
  const[overviewChartRange,setOverviewChartRange]=useState<"1D"|"1W"|"1M"|"3M"|"6M"|"1Y"|"3Y"|"5Y">("3M");
  const[overviewChartBars,setOverviewChartBars]=useState<any[]|null>(null);
  const[longTermBars,setLongTermBars]=useState<any[]>([]);
  const[longTermLoading,setLongTermLoading]=useState(false);
  const[longTermError,setLongTermError]=useState("");
  const[overviewChartLoading,setOverviewChartLoading]=useState(false);
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
  const[fastQuote,setFastQuote]=useState<any>(null);
  const[stableDisplayQuote,setStableDisplayQuote]=useState<any>(null);
  const[quoteDiagnostic,setQuoteDiagnostic]=useState<string>("");
  const quoteRequestSeq=useRef(0);
  const[canonicalV935,setCanonicalV935]=useState<any>(null);
  const[liveMarketContext,setLiveMarketContext]=useState<any>(null);
  const[coreRetry,setCoreRetry]=useState(0);
  const[previousSetupState,setPreviousSetupState]=useState<SetupState|null>(null);

  useEffect(()=>{
    if(tab!=="thesis")return;
    const controller=new AbortController();
    const url=`/api/chart/${encodeURIComponent(symbol)}?range=${overviewChartRange}`,ttlMs=chartCacheTtl(overviewChartRange);
    const cached=researchJsonCache.peek(url,ttlMs);
    setOverviewChartLoading(!cached);setOverviewChartBars(Array.isArray(cached?.candles)?cached.candles:[]);
    sharedJson(url,controller.signal,ttlMs)
      .then(j=>{if(!controller.signal.aborted)setOverviewChartBars(Array.isArray(j?.candles)?j.candles:[])})
      .catch(()=>{if(!controller.signal.aborted)setOverviewChartBars([])})
      .finally(()=>{if(!controller.signal.aborted)setOverviewChartLoading(false)});
    return()=>controller.abort();
  },[symbol,overviewChartRange,tab]);
  useEffect(()=>{
    if(tab!=="thesis"&&tab!=="technical")return;
    const controller=new AbortController();
    const url=`/api/chart/${encodeURIComponent(symbol)}?range=5Y`,ttlMs=chartCacheTtl("5Y");
    const cached=researchJsonCache.peek(url,ttlMs);
    setLongTermBars(Array.isArray(cached?.candles)?cached.candles:[]);setLongTermLoading(!cached);setLongTermError("");
    sharedJson(url,controller.signal,ttlMs)
      .then(j=>{if(!controller.signal.aborted)setLongTermBars(Array.isArray(j?.candles)?j.candles:[])})
      .catch((error:any)=>{if(!controller.signal.aborted){setLongTermBars([]);setLongTermError(error?.message||"Weekly chart history could not be loaded.")}})
      .finally(()=>{if(!controller.signal.aborted)setLongTermLoading(false)});
    return()=>controller.abort();
  },[symbol,tab]);
  useEffect(()=>{
    try{const saved=localStorage.getItem(`auryn:v931:setup:${symbol}`) as SetupState|null;setPreviousSetupState(saved||null)}catch{setPreviousSetupState(null)}
  },[symbol]);

  useEffect(()=>{
    let active=true;
    const storageKey=`auryn:fastquote:${symbol}`;
    setFastQuote(null);setStableDisplayQuote(null);
    try{
      const raw=sessionStorage.getItem(storageKey);
      if(raw){
        const cached=JSON.parse(raw);
        if(cached?.price&&Date.now()-Number(cached.cachedAt||0)<DISPLAY_QUOTE_GRACE_MS){setFastQuote(cached);setStableDisplayQuote(cached)}
      }
    }catch{}
    const load=()=>{
      const seq=++quoteRequestSeq.current;
      return fetch(`/api/quote/${encodeURIComponent(symbol)}`,{cache:"no-store"}).then(async r=>{const q=await r.json();if(!r.ok||q?.error){const ds=Array.isArray(q?.diagnostics)?q.diagnostics.map((d:any)=>`${d.provider}: ${d.status}${d.price!=null?` $${Number(d.price).toFixed(2)}`:""}${d.ageSeconds!=null?` age ${Math.round(Number(d.ageSeconds))}s`:""}${d.detail?` (${d.detail})`:""}`).join(" · "):"";throw new Error(`${String(q?.reason||q?.error||"provider unavailable")}${ds?` · ${ds}`:""}`)}return q}).then((q:any)=>{
        if(!active||seq!==quoteRequestSeq.current||!q?.price)return;
        const next={...q,cachedAt:Date.now()};
        setQuoteDiagnostic("");setFastQuote(next);setStableDisplayQuote(next);
        try{sessionStorage.setItem(storageKey,JSON.stringify(next))}catch{}
      }).catch((e:any)=>{if(active&&seq===quoteRequestSeq.current)setQuoteDiagnostic(String(e?.message||"market provider unavailable"))});
    };
    load();
    const refresh=()=>{if(document.visibilityState==="visible")load()};
    const onVisibility=()=>{if(document.visibilityState==="visible")load()};
    const timer=window.setInterval(refresh,30000);
    window.addEventListener("focus",refresh);
    window.addEventListener("online",refresh);
    document.addEventListener("visibilitychange",onVisibility);
    return()=>{active=false;quoteRequestSeq.current++;window.clearInterval(timer);window.removeEventListener("focus",refresh);window.removeEventListener("online",refresh);document.removeEventListener("visibilitychange",onVisibility)};
  },[symbol]);

  useEffect(()=>{
    let active=true;let timer:any;const controller=new AbortController();
    setCanonicalV935(null);setLiveQuote(null);
    const loadCanonical=()=>sharedJson(`/api/canonical/${encodeURIComponent(symbol)}`,controller.signal,10000).then((x:any)=>{if(!active)return;setCanonicalV935(x);if(x?.market)setLiveQuote({...x.market,price:x.market.displayPrice,changePct:null,providerTimestamp:x.market.decisionPriceAsOf??x.market.asOf})}).catch(()=>{});
    loadCanonical();timer=setInterval(()=>{if(document.visibilityState==="visible")loadCanonical()},30000);
    return()=>{active=false;clearInterval(timer);controller.abort()};
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
    const evidenceController=new AbortController();
    let warm=stockWarmCache.get(symbol);
    if(!warm&&typeof window!=="undefined"){
      try{
        const raw=localStorage.getItem(`auryn:core:${symbol}`)||sessionStorage.getItem(`auryn:core:${symbol}`);
        if(raw){const parsed=JSON.parse(raw);if(parsed?.d&&Date.now()-Number(parsed.ts||0)<STALE_CACHE_MAX_AGE){warm=parsed;stockWarmCache.set(symbol,parsed)}}
      }catch{}
    }
    // Old company snapshots may have mixed reporting units. Invalidate only that
    // evidence contract; independently verified price/history remain reusable.
    if(warm?.company&&!isCurrentCompanyEvidence(warm.company)){
      warm={...warm,company:undefined,companyTs:undefined};
      stockWarmCache.set(symbol,warm);
    }
    const warmAge=warm?Date.now()-Number(warm.ts||0):Number.POSITIVE_INFINITY;
    const hasUsableWarm=!!warm?.d&&warmAge<STALE_CACHE_MAX_AGE;
    const hasFreshWarm=!!warm?.d&&warmAge<CACHE_MAX_AGE;
    if(hasUsableWarm){
      setD(warm?.d??null);
      setCompany(warm?.company??null);
      setContext(warm?.context??null);
      setInstitutional(warm?.institutional??null);
      setErr("");
    }else{
      setD(null);setCompany(null);setContext(null);setInstitutional(null);setLiveMarketContext(null);setErr("");
    }

    const fetchJson=(url:string,signal?:AbortSignal)=>{
      const ttl=url.includes("/api/company/")||url.includes("/api/institutional/")?5*60*1000:url.includes("/api/context/")?60*1000:url.includes("/api/analyze/")?10*1000:15*1000;
      return sharedJson(url,signal,ttl);
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
      if(showError&&live&&!stockWarmCache.get(symbol)?.d)setErr(lastError?.name==="AbortError"?"Confirmed history is temporarily unavailable. Retry research when ready; quote verification is independent.":lastError?.message||"Analysis is temporarily unavailable.");
    };

    const loadEvidence=async()=>{
      // V9.3.8: intentionally stagger non-critical provider-backed evidence.
      // The first screen already has canonical price/decision data; bursting company,
      // context and institutional requests together can exceed upstream minute limits.
      const jobs=[
        {fresh:!!warm?.companyTs&&Date.now()-warm.companyTs<30*60*1000,run:()=>fetchJson(`/api/company/${encodeURIComponent(symbol)}?evidenceContract=${COMPANY_EVIDENCE_CONTRACT}`,evidenceController.signal).then(x=>{if(live&&isCurrentCompanyEvidence(x)){setCompany(x);mergeEvidenceWarm(symbol,{company:x})}})},
        {fresh:!!warm?.contextTs&&Date.now()-warm.contextTs<5*60*1000,run:()=>fetchJson(`/api/context/${encodeURIComponent(symbol)}`,evidenceController.signal).then(x=>{if(live){setContext(x);mergeEvidenceWarm(symbol,{context:x})}})}
      ];
      for(const job of jobs){
        if(!live)return;
        if(job.fresh)continue;
        try{await job.run()}catch{}
        await new Promise(r=>setTimeout(r,220));
      }
    };

    if(!hasFreshWarm)loadCore(!hasUsableWarm);
    const cancelEvidence=scheduleNonCritical(()=>loadEvidence());

    const priceTimer=setInterval(()=>{if(document.visibilityState==="visible")loadCore(false)},900000);
    const newsTimer=setInterval(()=>{if(document.visibilityState==="visible")fetchJson(`/api/context/${encodeURIComponent(symbol)}`,evidenceController.signal).then(x=>{if(live){setContext(x);mergeEvidenceWarm(symbol,{context:x})}}).catch(()=>{})},300000);
    const onFocus=()=>{
      const last=stockWarmCache.get(symbol)?.ts||0;
      if(Date.now()-last>CACHE_MAX_AGE)loadCore(false);
    };
    window.addEventListener("focus",onFocus);
    return()=>{live=false;cancelEvidence();core?.abort();evidenceController.abort();clearInterval(priceTimer);clearInterval(newsTimer);window.removeEventListener("focus",onFocus)};
  },[symbol,coreRetry]);


  useEffect(()=>{
    let live=true;
    if(calibrationCache){setCalibration(calibrationCache);return()=>{live=false};}
    const cancel=scheduleNonCritical(()=>fetch(`/api/calibration?engine=${ENGINE_VERSION}`,{cache:"force-cache"}).then(r=>r.ok?r.json():null).then(x=>{if(x)calibrationCache=x;if(live&&x)setCalibration(x)}).catch(()=>{}));
    return()=>{live=false;cancel()};
  },[]);

  useEffect(()=>{
    if(tab!=="institutions"||d?.assetType==="crypto")return;
    let active=true;const controller=new AbortController();
    sharedJson(`/api/institutional/${encodeURIComponent(symbol)}`,controller.signal,5*60*1000)
      .then((x:any)=>{if(active){setInstitutional(x);mergeEvidenceWarm(symbol,{institutional:x})}})
      .catch(()=>{});
    return()=>{active=false;controller.abort()};
  },[tab,symbol,d?.assetType]);

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
    setWatchError("");
    try {
      const s=supabaseBrowser();
      const {data:{user},error:authError}=await s.auth.getUser();
      if(authError||!user)throw new Error("Sign in again to save this symbol.");
      await saveWatchlistSymbol(s,user.id,symbol);
      setWatching(true);
    }catch(e:any){setWatchError(e?.message||"Unable to save. Please try again.");}
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
  const fastQuotePrice=useMemo(()=>{const px=Number(fastQuote?.price);return Number.isFinite(px)&&px>0?px:null},[fastQuote]);
  const fastQuoteAgeMs=fastQuote?.retrievedAt?Date.now()-new Date(fastQuote.retrievedAt).getTime():Number.POSITIVE_INFINITY;
  const fastQuoteProviderAgeMs=fastQuote?.providerTimestamp?Date.now()-new Date(fastQuote.providerTimestamp).getTime():Number.POSITIVE_INFINITY;
  const fastQuoteProviderFresh=Number.isFinite(fastQuoteProviderAgeMs)&&fastQuoteProviderAgeMs>=0&&fastQuoteProviderAgeMs<15*60*1000&&fastQuote?.freshness!=="STALE";
  const fastQuoteFresh=fastQuotePrice!=null&&fastQuoteAgeMs<30000&&fastQuoteProviderFresh;
  const stableDisplayPrice=useMemo(()=>{const px=Number(stableDisplayQuote?.price);return Number.isFinite(px)&&px>0?px:null},[stableDisplayQuote]);
  const stableDisplayAgeMs=stableDisplayQuote?.retrievedAt?Date.now()-new Date(stableDisplayQuote.retrievedAt).getTime():stableDisplayQuote?.cachedAt?Date.now()-Number(stableDisplayQuote.cachedAt):Number.POSITIVE_INFINITY;
  const stableProviderTimestamp=stableDisplayQuote?.providerTimestamp?new Date(stableDisplayQuote.providerTimestamp).getTime():NaN;
  const stableProviderFresh=Number.isFinite(stableProviderTimestamp)&&Date.now()-stableProviderTimestamp>=0&&Date.now()-stableProviderTimestamp<15*60*1000&&stableDisplayQuote?.freshness!=="STALE";
  const liveSession=marketTruth?.session==="REGULAR"||marketTruth?.session==="PRE_MARKET"||marketTruth?.session==="AFTER_HOURS";
  const canonicalReferencePrice=canonicalDecisionPrice;
  const canonicalReferenceAt=marketTruth?.decisionPriceAsOf||marketTruth?.asOf||null;
  const quotePrice=Number(stableDisplayQuote?.price);
  const quoteAt=stableDisplayQuote?.providerTimestamp||null;
  const quoteAtMs=quoteAt?new Date(quoteAt).getTime():NaN;
  const canonicalAtMs=canonicalReferenceAt?new Date(canonicalReferenceAt).getTime():NaN;
  const quoteUsable=Number.isFinite(quotePrice)&&quotePrice>0&&Number.isFinite(quoteAtMs);
  const quoteIsLive=quoteUsable&&stableDisplayQuote?.displayState==="LIVE"&&stableDisplayQuote?.freshness==="LIVE";
  const quoteIsNewest=quoteUsable&&(!Number.isFinite(canonicalAtMs)||quoteAtMs>=canonicalAtMs);
  const selectedReference=quoteIsNewest
    ?{price:quotePrice,observedAt:quoteAt,kind:"LAST_AVAILABLE" as const}
    :canonicalReferencePrice!=null
      ?{price:canonicalReferencePrice,observedAt:canonicalReferenceAt,kind:"LAST_VERIFIED" as const}
      :quoteUsable?{price:quotePrice,observedAt:quoteAt,kind:"LAST_AVAILABLE" as const}:null;
  const sessionName=String(marketTruth?.session||stableDisplayQuote?.session||"CLOSED");
  const liveLabel=sessionName==="PRE_MARKET"?"PRE-MARKET":sessionName==="AFTER_HOURS"?"AFTER HOURS":sessionName==="OVERNIGHT"?"OVERNIGHT":sessionName==="CRYPTO_24X7"?"LIVE":sessionName==="REGULAR"?"LIVE":"MARKET CLOSED";
  const aurynPriceState=quoteIsLive
    ?{state:"LIVE" as const,price:quotePrice,observedAt:quoteAt,isLive:true,status:liveLabel}
    :selectedReference
      ?{state:selectedReference.kind,price:selectedReference.price,observedAt:selectedReference.observedAt,isLive:false,status:selectedReference.kind==="LAST_AVAILABLE"?"LAST AVAILABLE":sessionName==="CLOSED"?"MARKET CLOSED":"LAST VERIFIED"}
      :{state:"UNAVAILABLE" as const,price:null,observedAt:null,isLive:false,status:"PRICE UNAVAILABLE"};
  const displayAuthority=aurynPriceState.price!=null?{kind:aurynPriceState.isLive?"LAST_GOOD_LIVE" as const:"CANONICAL_REFERENCE" as const,price:aurynPriceState.price,quote:stableDisplayQuote}:null;
  const stableLiveFresh=aurynPriceState.isLive;
  const referencePriceActive=!aurynPriceState.isLive&&aurynPriceState.price!=null;
  const researchDisplayPrice=aurynPriceState.price;
  const researchDisplayChangePct=aurynPriceState.isLive&&Number.isFinite(Number(stableDisplayQuote?.changePct))?Number(stableDisplayQuote.changePct):null;
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

  const executionLevelsAllowed=priceSensitiveAllowed&&!canonicalTrustBlocked&&v5Analysis?.executionPlan.state==="READY";
  const executionIntent=v5Analysis?.executionPlan.intent??"BLOCKED";
  const executionEntryLabel=executionIntent==="ACCUMULATE"?"Initial entry":executionIntent==="WATCH"?"Structural watch zone":"No new entry";
  const canonicalValidationLevels=useMemo(()=>{
    const plan=v5Analysis?.executionPlan;
    if(!executionLevelsAllowed||!plan||plan.state!=="READY")return null;
    const permitsEntry=plan.intent==="ACCUMULATE"||plan.intent==="WATCH";
    const map=d?.marketIntelligence?.actionMap;
    if(map){
      const value=(x:any)=>x==null||x===""||!Number.isFinite(Number(x))?null:Number(x);
      const low=permitsEntry?value(map.preferredEntry?.low):null,high=permitsEntry?value(map.preferredEntry?.high):null;
      const confirmation=permitsEntry?value(map.confirm):null,t1=permitsEntry?value(map.t1):null,t2=permitsEntry?value(map.t2):null;
      return{
        entryLow:low,entryHigh:high,preferredEntry:low!=null&&high!=null?(low+high)/2:null,
        preferredEntryLow:low,preferredEntryHigh:high,support:value(map.support),majorSupport:value(map.majorSupport),
        confirm:confirmation,confirmation,breakout:confirmation,resistance:confirmation,
        target1:t1,target2:t2,t1,t2,stop:value(map.invalidation),invalidation:value(map.invalidation),
        entryLabel:plan.intent==="ACCUMULATE"?"Entry":"Watch zone",intent:plan.intent,
        snapshotId:d.marketIntelligence.snapshotId
      };
    }
    const low=permitsEntry?plan.initialEntry?.low??null:null,high=permitsEntry?plan.initialEntry?.high??null:null;
    const confirmation=permitsEntry?plan.confirmation:null,t1=permitsEntry?plan.targets[0]?.price??null:null,t2=permitsEntry?plan.targets[1]?.price??null:null;
    return{
      entryLow:low,entryHigh:high,preferredEntry:low,preferredEntryLow:low,preferredEntryHigh:high,
      support:high,majorSupport:plan.invalidation,confirm:confirmation,confirmation,breakout:confirmation,resistance:t1??confirmation,
      target1:t1,target2:t2,t1,t2,stop:plan.invalidation,invalidation:plan.invalidation,
      entryLabel:plan.intent==="ACCUMULATE"?"Entry":"Watch zone",dcaZones:plan.dcaZones,intent:plan.intent,snapshotId:plan.snapshotId
    };
  },[v5Analysis,d?.marketIntelligence,executionLevelsAllowed]);

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
      evidence:{coverage:enterprise.coverage,dataQuality:enterprise.dataQuality,contradictions:intelligence.contradictions,benchmark:d.market?.benchmark||"SPY",benchmarkPrice:d.market?.benchmarkPrice??null,v935:canonicalV935?{contract:canonicalV935.contract,snapshotId:canonicalV935.snapshotId,marketSnapshotId:canonicalV935.market?.snapshotId??null,researchState:canonicalV935.research?.state??null}:null,v934:d?.marketIntelligence?projectMarketIntelligence(d.marketIntelligence):null,v931:institutionalDecision?{snapshotId:institutionalDecision.snapshotId,newMoneyAction:institutionalDecision.newMoneyAction,ownerAction:institutionalDecision.ownerAction,longTermAction:institutionalDecision.longTermAction,canonicalPrimaryAction:institutionalDecision.canonicalPrimaryAction,legacyChallengerAction:institutionalDecision.legacyChallengerAction,hardVetoReasons:institutionalDecision.hardVetoReasons,policyReasons:institutionalDecision.policyReasons,executionAction:institutionalDecision.executionAction,setupState:institutionalDecision.setupState,decisionScore:institutionalDecision.decisionScore,evidenceCompleteness:institutionalDecision.evidenceCompleteness,nextDecisionTrigger:institutionalDecision.nextDecisionTrigger,invalidationTrigger:institutionalDecision.invalidationTrigger}:null,v5:v5Analysis&&v7Analysis?{snapshotId:v5Analysis.snapshotId,engineVersion:v7Analysis.engineVersion,action:v5Analysis.decision.primaryAction,ownerAction:v5Analysis.decision.ownerAction,executionState:v5Analysis.executionPlan.state,priceState:v5Analysis.marketTruth.priceState,executionPlan:v5Analysis.executionPlan,trustState:v7Analysis.trust.state,trustScore:v7Analysis.trust.score,thesisStrength:v5Analysis.metrics.find((m:any)=>m.id==="thesisStrength")?.value??null,businessQuality:v5Analysis.metrics.find((m:any)=>m.id==="businessQuality")?.value??null,entryQuality:v5Analysis.metrics.find((m:any)=>m.id==="entryQuality")?.value??null}:null},
      investorDecision:investorDecision?{companyScore:investorDecision.companyScore,thesisScore:investorDecision.thesisScore,opportunityScore:investorDecision.opportunityScore,thesisLabel:investorDecision.thesisLabel,thesisState:investorDecision.thesisState,valuationLabel:investorDecision.valuationLabel,action:investorDecision.action,confidence:investorDecision.confidence,dataCompleteness:investorDecision.dataCompleteness,archetype:investorDecision.archetype,factors:investorDecision.factors,horizons:investorDecision.horizons,drivers:investorDecision.drivers,risks:investorDecision.risks,today:investorDecision.today}:null,
      canonicalDecision:v7Analysis?serializeV7Decision(v7Analysis):null
    })}).catch(()=>{});
  },[d?.price,canonicalDecisionPrice,priceSensitiveAllowed,intelligence?.score,intelligence?.confidence,enterprise?.auditId,symbol,mode,investorDecision?.thesisScore,investorDecision?.opportunityScore,investorDecision?.today,v5Analysis?.snapshotId,v5Analysis?.decision.primaryAction,v5Analysis?.executionPlan.state,v7Analysis?.trust.state,institutionalDecision?.snapshotId,institutionalDecision?.newMoneyAction,institutionalDecision?.ownerAction,institutionalDecision?.setupState,decisionSnapshot?.snapshotId,d?.marketIntelligence?.snapshotId,canonicalV935?.snapshotId]);

  const formatPriceObservedAt=(stamp:string|null)=>{
    if(!stamp)return "Update time unavailable";
    const d=new Date(stamp);if(!Number.isFinite(d.getTime()))return "Update time unavailable";
    const exact=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",second:"2-digit",hour12:true,timeZoneName:"short"}).format(d);
    const ageSec=Math.max(0,Math.round((Date.now()-d.getTime())/1000));
    const age=ageSec<60?`${ageSec}s ago`:ageSec<3600?`${Math.floor(ageSec/60)}m ago`:ageSec<86400?`${Math.floor(ageSec/3600)}h ago`:`${Math.floor(ageSec/86400)}d ago`;
    return `${exact} · ${age}`;
  };

  if(!d||!view){
    const durable=canonicalV935?.research;
    const durableMap=durable?.actionMap||durable?.levels||null;
    const partialStatus=!marketTruth?"Verifying market price":marketTruth.priceState==="OFFICIAL_CLOSE"?(marketTruth.session==="REGULAR"?"Reference price · live verification pending":"Market closed · verified reference"):marketTruth.session==="PRE_MARKET"?"Pre-market · verified source":marketTruth.session==="AFTER_HOURS"?"After-hours · verified source":"Market open · verified source";
    const partialDetail=marketTruth?`${String(marketTruth.reason||"")}${marketTruth.decisionPriceAsOf?` · price as of ${new Date(marketTruth.decisionPriceAsOf).toLocaleString()}`:""}`:"Price verification loads independently from the research engine.";
    const partialChange=Number(liveQuote?.changePct);
    return <div className="aurynStockPage aurynProgressiveStock">
      <StockSecurityHeader company={symbol} symbol={symbol} price={aurynPriceState.price} changePct={researchDisplayChangePct} status={aurynPriceState.status} detail={aurynPriceState.observedAt?`${aurynPriceState.isLive?"Updated":"Price as of"} ${formatPriceObservedAt(aurynPriceState.observedAt)}`:"Market data temporarily unavailable"} owns={owns} positionLoaded={Boolean(ownerPosition)} onToggleOwn={()=>setOwns(!owns)}/>
      {durable?.action?<section className="v935DurableResearch" data-canonical-snapshot={canonicalV935?.snapshotId||""}>
        <div><small>LAST VERIFIED AURYN DECISION</small><h2>{String(durable.action).replaceAll("_"," ")}</h2><p>{durable.state==="STALE_VERIFIED"?"Verified research is preserved while AURYN refreshes the newest completed-bar evidence.":"Verified research is available while deeper evidence refreshes in the background."}</p></div>
        <div className="v935DurableActions"><span>OWNER <b>{durable.ownerAction||"—"}</b></span><span>LONG TERM <b>{durable.longTermAction||"—"}</b></span><span>SETUP <b>{String(durable.setupState||"—").replaceAll("_"," ")}</b></span></div>
        {durableMap&&priceSensitiveAllowed?<div className="v935DurableLevels"><span>ENTRY <b>{durableMap.preferredEntry?.low!=null?`${displayMoney(durableMap.preferredEntry.low)}–${displayMoney(durableMap.preferredEntry.high)}`:"—"}</b></span><span>CONFIRM <b>{displayMoney(durableMap.confirm??durableMap.breakout??null)}</b></span><span>T1 <b>{displayMoney(durableMap.t1??null)}</b></span><span>T2 <b>{displayMoney(durableMap.t2??null)}</b></span><span>RISK <b>{displayMoney(durableMap.invalidation??null)}</b></span></div>:null}
        <small className="v935RefreshState">Refreshing latest evidence in background{err?" · provider temporarily delayed":""}</small>
      </section>:<section className={`aurynProgressiveResearch ${err?"degraded":"loading"}`}>
        <small>{err?"RESEARCH TEMPORARILY UPDATING":"BUILDING CONFIRMED RESEARCH"}</small>
        <h2>{err?"Research is temporarily unavailable.":`Building ${symbol} without blocking the live price.`}</h2>
        <p>{err||"Confirmed daily and weekly structure load first. Tactical context follows separately."}</p>
        {err?<button type="button" onClick={()=>{setErr("");setCoreRetry(x=>x+1)}}>Retry research</button>:null}
      </section>}
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
  const displayChangePct=researchDisplayChangePct;
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
  // The current canonical map owns every displayed chart level; the V5 plan is its verified fallback.
  const v5ChartLevels=executionLevelsAllowed?canonicalValidationLevels:null;
  const horizonCandles=(d.candles||[]).slice(horizon==="now"?-65:horizon==="swing"?-125:-180);

  const marketTruthUi=buildMarketTruth(aurynPriceState.isLive?stableDisplayQuote:null,marketTruth,new Date().toISOString());
  const formattedMarketTruth=formatMarketTruth(marketTruthUi);
  const marketStatusLabel=aurynPriceState.status;
  const marketDetail=aurynPriceState.observedAt
    ?`${aurynPriceState.isLive?"Updated":"Price as of"} ${formatPriceObservedAt(aurynPriceState.observedAt)}`
    :aurynPriceState.state==="UNAVAILABLE"?"Market data temporarily unavailable":"";
  const yearlyBars=(d?.candles||[]).slice(-252);
  const yearlyHigh=yearlyBars.length?Math.max(...yearlyBars.map((x:any)=>Number(x.high)).filter(Number.isFinite)):null;
  const yearlyLow=yearlyBars.length?Math.min(...yearlyBars.map((x:any)=>Number(x.low)).filter(Number.isFinite)):null;
  const latestVolumeRaw=yearlyBars.length?Number(yearlyBars.at(-1)?.volume):NaN;
  const latestVolume=Number.isFinite(latestVolumeRaw)&&latestVolumeRaw>0?latestVolumeRaw:null;
  const capMillions=Number(context?.profile?.marketCapitalization);
  const securityMarketFacts={
    marketCap:Number.isFinite(capMillions)&&capMillions>0?capMillions*1_000_000:null,
    volume:latestVolume,
    week52High:Number.isFinite(yearlyHigh as number)?yearlyHigh:null,
    week52Low:Number.isFinite(yearlyLow as number)?yearlyLow:null,
    sector:context?.profile?.finnhubIndustry||company?.sector||null,
    industry:context?.profile?.industry||null,
    exchange:context?.profile?.exchange||null,
  };
  const analystFundamentals=buildFundamentalAnalyst({
    rawMetrics:company?.rawMetrics??null,
    fiveYearRecord:company?.fiveYearRecord??null,
    businessScore:canonicalBusinessScore,
    forwardScore:institutionalDecision?.pillars.earningsRevisions.score??null,
    currentPrice:marketTruthUi.price??researchDisplayPrice,
    marketCap:securityMarketFacts.marketCap,
    businessModel:proofArchetype
  });
  const valuationEvidence=extractValuationEvidence({symbol,company,profile:context?.profile,currentPrice:aurynPriceState.price,priceAsOf:aurynPriceState.observedAt,priceCurrency:context?.profile?.currency,businessModel:proofArchetype,assetType:d.assetType});
  const financialEvidence=buildBusinessEvidence(company,analystFundamentals,v4Analysis);
  const handleEvidenceTab=(next:Tab,target?:string)=>{
    setTab(next);
    requestAnimationFrame(()=>window.setTimeout(()=>{
      const el=target?(document.querySelector(`[data-auryn-section="${target}"]`)||document.querySelector(`[data-auryn-section="${next==="fundamentals"?"valuation":target}"]`)):thesisRef.current;
      (el as HTMLElement|null)?.scrollIntoView({behavior:"smooth",block:"start"});
    },120));
  };
  return <div className="aurynStockPage">
    <ResearchVisit symbol={symbol} name={company?.name||context?.profile?.name||symbol}/>
    <StockSecurityHeader company={company?.name||d.name||symbol} symbol={symbol} price={aurynPriceState.price} changePct={displayChangePct} status={marketStatusLabel} detail={marketDetail} logoUrl={context?.profile?.logo||null} marketFacts={securityMarketFacts} owns={owns} positionLoaded={Boolean(ownerPosition)} onToggleOwn={()=>setOwns(!owns)}/>
    {tab!=="thesis"&&institutionalDecision&&<div className="researchToolbar" aria-label="Canonical investment decision"><span>Canonical decision <b>{institutionalDecision.newMoneyAction.replaceAll("_"," ")}</b></span><span>Owner: {institutionalDecision.ownerAction.replaceAll("_"," ")} · Long term: {institutionalDecision.longTermAction.replaceAll("_"," ")}</span></div>}
    <StockEvidenceNav tab={tab} setTab={handleEvidenceTab} isCrypto={d.assetType==="crypto"}/>
    {marketTruth&&!priceSensitiveAllowed&&!stableLiveFresh?<div className="aurynIntegrityAlert aurynMarketTruthAlert" role="alert"><b>PRICE UNVERIFIED</b><span>{marketTruth.reason||"Independent market sources are not sufficiently aligned."} AURYN has disabled entry, confirmation, target, stop and risk/reward output until the canonical price is verified.</span></div>:null}
    {marketTruth&&!priceSensitiveAllowed&&stableLiveFresh?<div className="aurynIntegrityNote"><b>Research price live</b><span>Execution-grade verification is still pending; AURYN keeps automated execution blocked without hiding the live research price.</span></div>:null}
    {/* Compatibility contract: AurynResearchOverview decision={institutionalDecision} marketTruth={marketTruth}; runtime receives the unified display truth below. */}
    {watchError&&<p role="alert" className="formError">{watchError}</p>}
    <div id="research-tab-panel" role="tabpanel" aria-labelledby={`research-tab-${tab}`} tabIndex={0}><div ref={overviewRef}>{tab==="thesis"&&institutionalDecision?<AurynResearchOverviewV2 symbol={symbol} company={company} valuationEvidence={valuationEvidence} structureCandles={longTermBars} structureLoading={longTermLoading} structureError={longTermError} onOpenTechnicals={()=>handleEvidenceTab("technical")} decision={institutionalDecision} marketTruth={{...marketTruth,...marketTruthUi,priceState:marketTruthUi.freshness}} displayPrice={aurynPriceState.price} displayPriceLive={aurynPriceState.isLive} marketIntelligence={marketIntelligenceView??d?.marketIntelligence??null} fundamentalScenario={analystFundamentals.fundamentalScenario} analystFundamentals={analystFundamentals} technicalEvidence={{trend:technicalState.trend,momentum:technicalState.momentum,participation:technicalState.participation,relativeStrengthPct:null,volatilityRisk:technicalState.volatilityRisk}} entryQuality={technicalState.entryQuality} chartRange={overviewChartRange} chartLoading={overviewChartLoading} onChartRangeChange={setOverviewChartRange} onOpenCatalysts={()=>handleEvidenceTab("catalysts","catalysts")} onOpenRisks={()=>handleEvidenceTab("risk")} onOpenDetails={()=>handleEvidenceTab("earnings","earnings")} onOpenThesis={()=>handleEvidenceTab("fundamentals","thesis")} onOpenValuation={()=>handleEvidenceTab("valuation")} onAddWatchlist={watch} onTrackPosition={()=>{window.location.href="/portfolio?symbol="+encodeURIComponent(symbol)}} watching={watching} candles={overviewChartBars??(v5Analysis?.bars||d?.candles||[]).slice(-180)} longTermCandles={longTermBars.length?longTermBars:(v5Analysis?.bars||d?.candles||[])} scenario={v5Analysis?.scenario??null} executionLevelsAllowed={executionLevelsAllowed} executionIntent={executionIntent} chartLevels={v5ChartLevels}/>:null}</div>
    {tab==="thesis"&&(v5Analysis?<>{canonicalTrustBlocked?<div className="aurynIntegrityAlert aurynTrustBlock" role="alert"><b>CANONICAL TRUST BLOCK</b><span>{v7Analysis?.trust.blockers[0]||"AURYN detected an internal snapshot/plan inconsistency."} Price-sensitive execution levels are suppressed until the canonical chain is aligned.</span></div>:null}</>:<section className="aurynV5Unavailable v940PendingSnapshot"><small>{canonicalV935?.research?"LAST VERIFIED AURYN DECISION":"AURYN CANONICAL ANALYSIS"}</small><b>{canonicalV935?.research?"VERIFIED SNAPSHOT LOADED":"BUILDING FIRST VERIFIED SNAPSHOT"}</b><span>{canonicalV935?.research?"Refreshing deeper evidence… live market price and the last verified research snapshot remain available while the canonical analysis updates.":"AURYN is building the first canonical evidence snapshot. Price verification and research load independently."}</span><div className="v940PendingProgress"><i className="done"/><i className="done"/><i/><i/><span>Market price</span><span>Structure</span><span>Fundamentals</span><span>Canonical decision</span></div></section>)}

    <section ref={thesisRef} id="auryn-research" className="aurynStockResearch">
      <StockEvidenceSections>

      {tab==="fundamentals"&&<BusinessEvidence company={company} analystFundamentals={analystFundamentals} v4Analysis={v4Analysis} symbol={symbol} onNavigate={handleEvidenceTab}/>}

      {tab==="financials"&&<div className="researchTabBody evidenceTab">
        <header className="researchSectionHeading"><small>Reported evidence</small><h2>Financials <MetricHelp term="revenue" title="Reading financial statements" body="Compare exact reporting periods and currencies. Annual and quarterly results are different measures; discontinued operations and restatements can change the business basis."/></h2><p>Company filings, with period and currency preserved.</p></header>
        <div className="evidenceMetricGrid">{financialEvidence.metrics.filter(metric=>["revenue","netIncome","fcf"].includes(metric.key)).map(metric=><article className="evidenceMetric" key={metric.key}><span>{metric.label}<MetricHelp term={metric.key==="fcf"?"freeCashFlow":metric.key}/></span><strong>{metric.value==null?"Unavailable":metric.display}</strong><small>{metric.periodEnd?`Year ended ${metric.periodEnd}`:"Period unverified"}{metric.accountingBasis?` · ${metric.accountingBasis}`:""}</small>{metric.valuationExcluded&&<small>Excluded from current-business valuation</small>}</article>)}</div>
        <article className="researchCard"><header><h3>Annual financial history</h3><span>{five?.history?.length??0} reported periods</span></header>{five?.history?.length?<div className="researchTableWrap" tabIndex={0} role="region" aria-label="Annual financial history"><table><thead><tr><th scope="col">Period / currency</th><th scope="col">Revenue <MetricHelp term="revenue"/></th><th scope="col">Net income <MetricHelp term="netIncome"/></th><th scope="col">Operating cash flow <MetricHelp term="operatingCashFlow"/></th></tr></thead><tbody>{five.history.map((x:any,i:number)=><tr key={`${x.year}-${i}`}><th scope="row">{x.year}<small>{x.currency||"Currency unverified"}</small></th><td>{formatReportedAmount(x.revenue,x.currency??company?.dataQuality?.reportedCurrency)}</td><td>{formatReportedAmount(x.netIncome,x.currency??company?.dataQuality?.reportedCurrency)}</td><td>{formatReportedAmount(x.operatingCashFlow,x.currency??company?.dataQuality?.reportedCurrency)}</td></tr>)}</tbody></table></div>:<p>No comparable annual history returned.</p>}<details className="evidenceInlineDetails"><summary>Reporting basis & comparability</summary><p>{five?.summary||"Historical financial evidence is not available."}</p>{financialEvidence.warnings.map((warning:string)=><p key={warning}>{warning}</p>)}</details></article>
        <details className="researchCard evidenceDisclosure"><summary><Activity size={18}/> All operating metrics</summary><dl className="researchData">{company?.fundamentals?.length?company.fundamentals.map((x:any)=><div key={x.label}><dt>{x.label}{x.detail&&<small>{x.detail}</small>}</dt><dd>{x.value??"Unavailable"}</dd></div>):<p>No standardized financial metrics available.</p>}</dl></details>
        <details className="researchCard evidenceDisclosure"><summary><ExternalLink size={18}/> Source filings <span>{filings.length}</span></summary>{filings.length?filings.map((x:any)=><a className="researchSource" href={x.url} key={x.accession} target="_blank" rel="noreferrer"><span><b>{x.form}</b> · {x.label}</span><time>{x.date} ↗</time></a>):<p>No linked filings returned for this security.</p>}</details>
      </div>}
      {tab==="valuation"&&<div className="researchTabBody evidenceTab evidenceValuationTab">
        <ValuationWorkbench symbol={symbol} company={company} profile={context?.profile} currentPrice={aurynPriceState.price} priceAsOf={aurynPriceState.observedAt} priceCurrency={context?.profile?.currency} businessModel={proofArchetype} assetType={d.assetType} onOpenFinancials={()=>handleEvidenceTab("financials")}/>
        <details className="researchCard evidenceDisclosure"><summary><ShieldCheck size={18}/> Verified valuation status <span>{analystFundamentals.decisionGrade?"Verified":"Evidence pending"}</span></summary><p>Method: {String(analystFundamentals.method||"Unavailable").replaceAll("_"," ")} · {analystFundamentals.valuationState}</p>{analystFundamentals.fairValue!=null&&<p>Verified fair value: {money(analystFundamentals.fairValue)}</p>}{analystFundamentals.missingMethodInputs?.length>0&&<ul>{analystFundamentals.missingMethodInputs.map((item:string)=><li key={item}>{item}</li>)}</ul>}<p>Exploratory assumptions do not change the verified valuation or investment decision.</p>{valuationEvidence.fcfYieldPct!=null&&<p>Reported FCF yield: {valuationEvidence.fcfYieldPct.toFixed(1)}% <MetricHelp term="fcfYield"/><small className="evidenceSourceNote">{valuationEvidence.fcfYieldBasis}</small></p>}</details>
      </div>}
      {tab==="risk"&&<div className="researchTabBody evidenceTab">
        <header className="researchSectionHeading"><small>Thesis discipline</small><h2>Risk & counter-evidence</h2><p>What could weaken the investment case?</p></header>
        <article className="researchCard evidenceRiskList"><header><h3>Key counter-evidence</h3><MetricHelp term="risk" body="These are risks from the canonical evidence snapshot. Their presence is not a quantified probability of loss, and an empty list does not mean the business is safe."/></header>{institutionalDecision?.counterEvidence?.length?<>{institutionalDecision.counterEvidence.slice(0,3).map((x:string,i:number)=><div className="evidenceRiskRow" key={i}><span aria-hidden="true"/><p>{x}</p></div>)}{institutionalDecision.counterEvidence.length>3&&<details className="evidenceInlineDetails"><summary>More counter-evidence · {institutionalDecision.counterEvidence.length-3}</summary>{institutionalDecision.counterEvidence.slice(3).map((x:string,i:number)=><p key={i}>{x}</p>)}</details>}</>:<p>No canonical counter-evidence returned. Risk remains unassessed.</p>}</article>
        <details className="researchCard evidenceDisclosure" open={Boolean(institutionalDecision?.hardVetoReasons?.length)}><summary><ShieldCheck size={18}/> Hard constraints <span>{institutionalDecision?.hardVetoReasons?.length||"None recorded"}</span></summary>{institutionalDecision?.hardVetoReasons?.length?institutionalDecision.hardVetoReasons.map((x:string,i:number)=><p className="researchEvidence" key={i}>{x}</p>):<p>No hard veto recorded in the current snapshot.</p>}<p>{institutionalDecision?.pillars.riskAsymmetry.why||"Risk evidence is still building."}</p></details>
        <details className="researchCard evidenceDisclosure"><summary><Activity size={18}/> What would change the thesis?</summary><p>Sustained deterioration in growth, profitability, cash generation, balance-sheet resilience or competitive durability requires a fundamental review.</p><p>Technical levels govern deployment; a business thesis needs operating evidence.</p><dl className="researchData"><div><dt>Model confidence <MetricHelp term="Model confidence"/></dt><dd>{institutionalDecision?.confidenceScore??"Unavailable"}{institutionalDecision?.confidenceScore!=null?"/100":""}</dd></div><div><dt>Evidence completeness <MetricHelp term="Evidence completeness" body="The proportion of required evidence available in this snapshot. It measures coverage, not the probability that an investment will succeed."/></dt><dd>{institutionalDecision?.evidenceCompleteness??"Unavailable"}{institutionalDecision?.evidenceCompleteness!=null?"/100":""}</dd></div></dl></details>
      </div>}
      {tab==="news"&&<div className="researchTabBody evidenceTab">
        <header className="researchSectionHeading"><small>Source-linked developments</small><h2>News & filings</h2><p>{items.length?`${items.length} stories from the connected feed.`:"No recent source-backed stories returned."}</p></header>
        <div className="evidenceNewsList">{items.slice(0,5).map((x:any,i:number)=><article className="researchCard evidenceNewsRow" key={x.url||i}><div className="evidenceStoryIcon"><Newspaper size={22}/></div><div><small>{x.source||"Source unavailable"} · {x.date?fmtDate(x.date):"Date unavailable"}</small><h3>{x.url?<a href={x.url} target="_blank" rel="noreferrer">{x.headline}<ExternalLink size={14}/></a>:x.headline}</h3>{x.summary&&<details className="evidenceInlineDetails"><summary>Story context</summary><p>{x.summary}</p></details>}</div></article>)}</div>
        {items.length>5&&<details className="researchCard evidenceDisclosure"><summary><Newspaper size={18}/> More news <span>{items.length-5}</span></summary>{items.slice(5).map((x:any,i:number)=><article className="evidenceMoreStory" key={x.url||i}><small>{x.source||"Source unavailable"} · {x.date?fmtDate(x.date):"Date unavailable"}</small><h3>{x.headline}</h3><p>{x.summary}</p>{x.url&&<a href={x.url} target="_blank" rel="noreferrer">Read source ↗</a>}</article>)}</details>}
        {!items.length&&<article className="researchCard evidenceEmpty"><Newspaper size={24}/><h3>No stories available</h3><p>Review the latest filings for primary-source evidence.</p><button type="button" onClick={()=>handleEvidenceTab("financials")}>Open source filings →</button></article>}
      </div>}

      {tab==="institutions"&&<div className="researchTabBody evidenceTab"><header className="researchSectionHeading"><small>Ownership</small><h2>Who owns the business?</h2></header><details className="researchCard evidenceDisclosure evidenceContext"><summary><Info size={18}/> Evidence context & model assessment</summary><StockTabContext marketTruth={marketTruth} label="OWNERSHIP" title="Who owns the business?" score={canonicalMetricScore("positioning")} state={institutionalLabel} detail="Reported holdings are delayed SEC evidence. They do not establish who is buying or selling today."/></details><div className="researchClocks evidencePeriodGrid">{[["Report period",fmtDate(institutionalPeriod)],["Compared with",fmtDate(institutionalPriorPeriod)],["SEC dataset through",fmtDate(institutionalDatasetThrough)]].map(([k,v])=><article className="researchCard" key={k}><small>{k}</small><h3>{v}</h3></article>)}</div>{institutional?.enabled?<><div className="researchTwoColumns"><article className="researchCard"><h3>Reported institutional holdings</h3><p>{institutional.institutional?.directionLabel||institutionalLabel}</p><dl className="researchData"><div><dt>Net share change <MetricHelp term="Net share change" body="Change between the matched reported share counts in the two filing periods. 13F reporting is delayed and does not show today’s trading flows."/></dt><dd>{institutional.institutional?.netChangeLabel||"—"}</dd></div><div><dt>Managers adding</dt><dd>{institutional.institutional?.increased??"—"}</dd></div><div><dt>Managers trimming</dt><dd>{institutional.institutional?.reduced??"—"}</dd></div><div><dt>New positions / exits</dt><dd>{institutional.institutional?.newManagers??"—"} / {institutional.institutional?.exitedManagers??"—"}</dd></div></dl></article><article className="researchCard"><h3>Insider filings</h3><p>{institutional.insiders?.label||"Unavailable"}</p><dl className="researchData"><div><dt>Reported buys</dt><dd>{institutional.insiders?.buys??"—"}</dd></div><div><dt>Reported sells</dt><dd>{institutional.insiders?.sells??"—"}</dd></div></dl><h3>Price / volume behavior</h3><p>{marketLab?.accumulationLabel||"Insufficient data"} · market-behavior proxy, not named institutional flows.</p></article></div>{[["Largest reported holders",institutional.institutional?.top],["Biggest reported adders",institutional.institutional?.biggestBuyers],["Biggest reported trimmers",institutional.institutional?.biggestSellers],["New reported positions",institutional.institutional?.newPositions],["Reported exits",institutional.institutional?.exits]].map(([title,list]:any)=>Array.isArray(list)&&list.length>0?<details className="researchCard evidenceDisclosure" key={title} open={title==="Largest reported holders"}><summary>{title}</summary><div className="researchTableWrap"><table><thead><tr><th>Manager</th><th>Shares</th><th>Prior shares</th><th>Change</th><th>Reported</th></tr></thead><tbody>{list.slice(0,12).map((x:any,i:number)=><tr key={i}><td>{x.name}</td><td>{x.shares==null?"—":Number(x.shares).toLocaleString()}</td><td>{x.priorShares==null?"—":Number(x.priorShares).toLocaleString()}</td><td>{x.change==null?"—":Number(x.change).toLocaleString()}</td><td>{fmtDate(x.filingDate||x.reportPeriod||institutionalPeriod)}</td></tr>)}</tbody></table></div></details>:null)}</>:<article className="researchCard"><h3>Reported ownership unavailable</h3><p>{institutional?.reason||"The connected sources have not returned verified ownership evidence."}</p></article>}<p className="researchProvenance">13F positions refer to a past quarter. Reported value changes may also reflect stock-price movements.</p></div>}

      {tab==="catalysts"&&<div className="researchTabBody evidenceTab"><header className="researchSectionHeading"><small>Events</small><h2>Catalysts</h2></header><details className="researchCard evidenceDisclosure evidenceContext"><summary><Info size={18}/> Evidence context & model assessment</summary><StockTabContext marketTruth={marketTruth} label="CATALYSTS" title="Events that can change the thesis" score={canonicalMetricScore("catalysts")} state={catalystLabel} detail={institutionalDecision?.pillars.catalystsRegime.why||"Catalyst evidence is still building."}/></details>{earn&&<article className="researchCard researchEvent"><small>Next earnings · estimated</small><h3>{earn.date}</h3><p>{earnDays!=null&&earnDays>=0?`${earnDays} days away`:"Upcoming event"} · Dates remain estimates until confirmed by the company.</p></article>}<details className="researchCard evidenceDisclosure" open><summary><ExternalLink size={18}/> Material filings</summary>{filings.length?filings.slice(0,12).map((x:any)=><a className="researchSource" key={x.accession} href={x.url} target="_blank" rel="noreferrer"><div><b>{x.label}</b><p>{x.form} · {x.description||x.materiality}</p></div><time>{x.date} ↗</time></a>):<p>No recent material SEC filings found.</p>}</details><details className="researchCard evidenceDisclosure"><summary><Newspaper size={18}/> Related news <span>{Math.min(items.length,6)}</span></summary><div className="researchNewsGrid">{items.slice(0,6).map((x:any,i:number)=><article className="researchCard" key={i}><small>{x.source} · {x.materiality}</small><h3>{x.headline}</h3><p>{x.summary}</p><a href={x.url} target="_blank" rel="noreferrer">Read source ↗</a></article>)}</div></details></div>}

      {tab==="earnings"&&<div className="researchTabBody evidenceTab"><header className="researchSectionHeading"><small>Reported results</small><h2>Earnings</h2></header><details className="researchCard evidenceDisclosure evidenceContext"><summary><Info size={18}/> Evidence context & model assessment</summary><StockTabContext marketTruth={marketTruth} label="EARNINGS" title="Execution & reported results" score={canonicalMetricScore("fundamentals")} state={v4Analysis?.thesis.direction} detail={institutionalDecision?.pillars.earningsRevisions.why||"Earnings evidence is still building."}/></details><div className="researchTwoColumns"><article className="researchCard"><small>Latest reported results</small><h3>{latestReport?.date||"No verified report loaded"}</h3><p>{latestEarnNews?.headline||latestReport?.form||"Reported results will appear when returned by the connected sources."}</p>{latestEarnNews?.url&&<a href={latestEarnNews.url} target="_blank" rel="noreferrer">Read results ↗</a>}</article><article className="researchCard"><small>Next earnings · estimated</small><h3>{earn?.date||"Date unavailable"}</h3><dl className="researchData"><div><dt>EPS estimate <MetricHelp term="EPS estimate" body="Provider consensus estimate of earnings per share for the stated future reporting period. Estimates can change and may use an adjusted accounting basis."/></dt><dd>{eps(earn?.epsEstimate)}</dd></div><div><dt>Revenue estimate <MetricHelp term="Revenue estimate" body="Provider consensus revenue estimate for the future reporting period. It is a forecast, not reported revenue."/></dt><dd>{money(earn?.revenueEstimate)}</dd></div></dl><p>Future dates are estimates until confirmed by the company.</p></article></div><details className="researchCard evidenceDisclosure"><summary><Activity size={18}/> Earnings surprise history</summary>{context?.surprises?.length?<div className="researchTableWrap"><table><thead><tr><th>Period</th><th>Actual EPS</th><th>Estimated EPS</th><th>Surprise</th></tr></thead><tbody>{context.surprises.map((x:any,i:number)=><tr key={i}><td>{x.period}</td><td>{formatEpsValue(x.actual)}</td><td>{formatEpsValue(x.estimate)}</td><td>{x.surprisePercent==null?"—":`${Number(x.surprisePercent).toFixed(1)}%`}</td></tr>)}</tbody></table></div>:<p>No earnings-surprise history returned by the connected feed.</p>}</details></div>}

      {tab==="technical"&&<div className="researchTabBody evidenceTab"><header className="researchSectionHeading"><small>Market structure</small><h2>Timing, with context</h2></header><details className="researchCard evidenceDisclosure evidenceContext"><summary><Info size={18}/> Evidence context & model assessment</summary><StockTabContext marketTruth={marketTruth} label="FAST BRAIN · TECHNICALS" title="Timing, trend & participation" score={technicalState.strength} state={technicalState.state} detail={institutionalDecision?.pillars.marketStructure.why||"Completed-bar market evidence is still building."}/></details><WeeklyStructure key={symbol} symbol={symbol} bars={longTermBars} loading={longTermLoading} error={longTermError}/><div className="evidenceMetricGrid">{[["RSI · 14",proTech?.rsi14,"rsi"],["Volume / 20D",proTech?.volRatio,"volume"],["ATR %",proTech?.atrPct,"atr"]].map(([label,value,term])=><article className="evidenceMetric" key={String(label)}><span>{label}<MetricHelp term={String(term)}/></span><strong>{value==null?"Unavailable":Number(value).toFixed(2)}</strong><small>Daily market evidence</small></article>)}</div><details className="researchCard evidenceDisclosure researchTechnicalDetail"><summary>Daily indicators &amp; execution evidence</summary><div className="researchMetricGrid">{[["Entry quality",technicalState.entryQuality],["Trend",technicalState.trend],["Momentum",technicalState.momentum],["Participation",technicalState.participation],["Extension risk",technicalState.extensionRisk],["Volatility risk",technicalState.volatilityRisk]].map(([k,v])=><article className="researchCard" key={String(k)}><small>{k} <MetricHelp term={String(k)}/></small><h3>{v==null?"Unavailable":`${v}/100`}</h3>{v!=null&&<progress max="100" value={Number(v)} aria-label={String(k)}/>}</article>)}</div><article className="researchCard"><header><h3>Price structure</h3><span>Canonical levels · completed bars</span></header><div className="researchTechnicalChart">{v5Analysis?<PriceChart candles={v5Analysis.bars.slice(horizon==="now"?-65:horizon==="swing"?-125:-180)} levels={executionLevelsAllowed?v5ChartLevels:null} showTrend/>:<div className="researchEmpty">Verified price history is unavailable.</div>}</div><p>Technical weakness informs entry timing. It does not independently invalidate durable business fundamentals.</p></article><div className="researchTwoColumns"><article className="researchCard"><h3>Indicator evidence</h3><dl className="researchData">{[["RSI · 14",proTech?.rsi14],["MACD histogram",proTech?.macdHist],["Volume / 20D average",proTech?.volRatio],["Realized volatility",proTech?.rv],["ATR %",proTech?.atrPct],["52-week drawdown %",proTech?.drawdown]].map(([k,v])=><div key={String(k)}><dt>{k} <MetricHelp term={String(k).startsWith("RSI")?"rsi":String(k).startsWith("MACD")?"macd":String(k).startsWith("Volume")?"volume":String(k).startsWith("ATR")?"atr":String(k).startsWith("52-week")?"drawdown":"volatility"}/></dt><dd>{v==null?"Unavailable":Number(v).toFixed(2)}</dd></div>)}</dl></article><article className="researchCard"><h3>Execution discipline</h3><p>{technicalState.entryState}</p><dl className="researchData"><div><dt>{executionEntryLabel}</dt><dd>{!executionLevelsAllowed?"Blocked":canonicalValidationLevels?.entryLow!=null&&canonicalValidationLevels?.entryHigh!=null?`${displayMoney(canonicalValidationLevels.entryLow)} – ${displayMoney(canonicalValidationLevels.entryHigh)}`:"—"}</dd></div><div><dt>Confirmation</dt><dd>{!executionLevelsAllowed?"Blocked":canonicalValidationLevels?.confirmation!=null?displayMoney(canonicalValidationLevels.confirmation):"—"}</dd></div></dl><p>{v5Analysis?.executionPlan.reason}</p>{executionLevelsAllowed&&executionIntent==="ACCUMULATE"&&Boolean(v5Analysis?.executionPlan.dcaZones.length)&&<dl className="researchData">{v5Analysis?.executionPlan.dcaZones.map((zone:any)=><div key={zone.label}><dt>{zone.label}</dt><dd>{displayMoney(zone.low)} – {displayMoney(zone.high)}</dd></div>)}</dl>}<p>Execution levels publish only with sufficient price verification. Timing stays separate from fair value.</p></article></div>{d?.marketIntelligence&&<details className="researchCard"><summary>Multi-timeframe evidence</summary><MarketTimeframeTape marketIntelligence={marketIntelligenceView??d.marketIntelligence}/>{executionLevelsAllowed?<MarketActionMap marketIntelligence={d.marketIntelligence} newMoneyAction={institutionalDecision?.newMoneyAction} setup={institutionalDecision?.setupState} executionIntent={executionIntent}/>:<p>Execution levels unavailable until price and canonical trust are verified.</p>}</details>}</details></div>}

      {tab==="options"&&<div className="aurynStockTabPage gammaPanel v22Options v26Options evidenceTab evidenceOptions">
        <header className="researchSectionHeading"><small>Contract research</small><h2>Options</h2></header><details className="researchCard evidenceDisclosure"><summary><ShieldCheck size={18}/> Canonical thesis & risk context</summary><StockTabContext marketTruth={marketTruth} label="OPTIONS" title="Positioning & contract research" score={null} state={optionsData?.enabled?"Provider data":"Evidence dependent"} action={institutionalDecision?.newMoneyAction??v5Analysis?.decision.primaryAction} detail={institutionalDecision?.pillars.riskAsymmetry.why||"Risk/asymmetry evidence governs how options research is interpreted; options do not create a separate directional call."}/></details>
        <p className="evidenceCompactNotice"><ShieldCheck size={16}/> Research candidates only · no automatic trades</p>
        <div className="optionSubnav"><button className={optionView==="setups"?"on":""} onClick={()=>setOptionView("setups")}>Contract setups</button><button className={optionView==="positioning"?"on":""} onClick={()=>setOptionView("positioning")}>Gamma / positioning</button></div>
        {!priceSensitiveAllowed?<div className="optionsState marketTruthBlocked"><b>UNDERLYING PRICE UNVERIFIED</b><span>Contract setups are blocked until the underlying price is verified. AURYN will not rank strikes, premiums, break-even levels or leverage from an untrusted market snapshot.</span></div>:
        optionsLoading?<div className="optionsState">Loading shared options snapshot…</div>:
        !optionsData?.enabled?<div className="optionsState"><b>Options data is not available.</b><span>{optionsData?.reason||"The options provider is not connected for this workspace."}</span><button type="button" className="optionsRetry" onClick={()=>{setOptionsData(null);setOptionsLoading(false)}}>Retry</button></div>:
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
              <div className="contractStats"><div><small>PREMIUM</small><b>{x.premium!=null?`~${formatOptionPrice(x.premium)}`:"—"}</b></div><div><small>DELTA <MetricHelp term="Delta" body="Approximate option price change for a one-unit change in the underlying, with other inputs held constant. Delta changes with price, time and volatility."/></small><b>{formatOptionNumber(x.delta,2)}</b></div><div><small>DTE <MetricHelp term="DTE" body="Calendar days until the contract expires. Shorter duration generally leaves less time for the thesis to play out and can accelerate time decay."/></small><b>{x.dte!=null?Math.round(Number(x.dte)):"—"}</b></div><div><small>IV <MetricHelp term="Implied volatility" body="Volatility implied by the option price. It is an annualized model input, not a prediction of direction or a guaranteed future move."/></small><b>{formatOptionPercent(x.iv)}</b></div><div><small>OI <MetricHelp term="Open interest" body="Outstanding option contracts in the provider snapshot. It is not current trading volume and does not reveal who owns each side."/></small><b>{x.openInterest==null?"—":Number(x.openInterest).toLocaleString()}</b></div><div><small>SPREAD <MetricHelp term="Bid-ask spread" body="Difference between quoted ask and bid relative to the provider’s reference premium. Wider spreads generally increase trading costs; delayed quotes may not be executable."/></small><b>{formatOptionPercent(x.spreadPct)}</b></div><div><small>BREAK-EVEN <MetricHelp term="Break-even" body="Underlying price at expiration where the modeled premium cost is recovered, before fees. It is not a profit guarantee or a forecast."/></small><b>{formatOptionPrice(x.breakEven)}</b></div><div><small>LEVERAGE</small><b>{x.leverage!=null?`${formatOptionNumber(x.leverage,1)}×`:"—"}</b></div></div>
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
    </div>
  </div>;
}
