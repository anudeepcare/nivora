"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  ExternalLink,
  Info,
  Newspaper,
  PlusCircle,
  ShieldCheck,
  Star,
} from "lucide-react";
import SearchBox from "./SearchBox";
import PriceChart from "./PriceChart";
import {supabaseBrowser} from "@/lib/supabase";

type Mode="now"|"swing"|"long"|"own";
type Tab="overview"|"fundamentals"|"catalysts"|"news"|"earnings"|"technical"|"options";

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

function Help({title,children}:{title:string;children:React.ReactNode}){
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
    {open&&pos&&<span className={`metricHelpPop ${pos.below?"below":"above"}`} style={{left:pos.left,top:pos.top,width:pos.width}} role="tooltip"><b>{title}</b><span>{children}</span></span>}
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
  const[d,setD]=useState<any>(null);
  const[company,setCompany]=useState<any>(null);
  const[context,setContext]=useState<any>(null);
  const[err,setErr]=useState("");
  const[mode,setMode]=useState<Mode>("now");
  const[tab,setTab]=useState<Tab>("overview");
  const[watching,setWatching]=useState(false);
  const[optionsData,setOptionsData]=useState<any>(null);
  const[optionsLoading,setOptionsLoading]=useState(false);
  const[perfRange,setPerfRange]=useState<"6M"|"YTD"|"1Y">("6M");
  const[chartMode,setChartMode]=useState<"clean"|"trend">("clean");

  useEffect(()=>{
    let live=true;
    let core:AbortController|null=null;

    const loadCore=async(initial=false)=>{
      if(initial){setD(null);setCompany(null);setContext(null);setErr("")}
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
    if(tab!=="options"||d?.assetType==="crypto"||optionsData)return;
    const controller=new AbortController();
    setOptionsLoading(true);
    fetch(`/api/options/${encodeURIComponent(symbol)}`,{cache:"no-store",signal:controller.signal})
      .then(async r=>{const x=await r.json();if(!r.ok)throw new Error(x?.reason||x?.error||`Options request failed (${r.status})`);return x})
      .then(x=>setOptionsData(x))
      .catch((e:any)=>{if(e?.name!=="AbortError")setOptionsData({enabled:false,reason:e?.message||"Options intelligence could not load."})})
      .finally(()=>{if(!controller.signal.aborted)setOptionsLoading(false)});
    return()=>controller.abort();
  },[tab,symbol,d?.assetType,optionsData]);

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
  const positive=[...(business?.tone==="good"?(business.reasons||[]).slice(0,2):[]),...(d.positives||[])].filter(Boolean).slice(0,3);
  const risks=[...(company?.filingRisk?[company.filingRisk.label]:[]),...(news.tone==="negative"?[news.topReason]:[]),...(d.risks||[])].filter(Boolean).slice(0,3);

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

  return <div className="osStock v12Stock v18Stock">
    <Link href="/dashboard" className="v19NavBack"><ArrowLeft size={15}/> Today</Link>
    <div className="osStockSearch"><SearchBox/></div>

    <header className="osStockHead v12StockHead">
      <div><small>{company?.name||d.name||symbol}</small><h1>{symbol}</h1></div>
      <div><b>${d.price}</b><span className={d.changePct>=0?"up":"down"}>{d.changePct>=0?"+":""}{d.changePct}%</span></div>
    </header>

    <div className="liveFresh"><span className="liveStatus"><span className="liveDot"/>Near-live · shared cache</span><span className="liveCadence">Prices/decision ~30–45 sec · News ~2 min</span></div>

    <div className="v20ModeLabel"><span>Choose your goal</span><Help title="Investment horizon">Now emphasizes entry timing. Swing emphasizes price behavior and timing. Long term gives business quality the largest weight. I own it emphasizes business quality and downside risk.</Help></div>
    <div className="osMode v12Mode" aria-label="Investment horizon">
      <button className={mode==="now"?"on":""} onClick={()=>setMode("now")}>Now</button>
      <button className={mode==="swing"?"on":""} onClick={()=>setMode("swing")}>Swing</button>
      <button className={mode==="long"?"on":""} onClick={()=>setMode("long")}>Long term</button>
      <button className={mode==="own"?"on":""} onClick={()=>setMode("own")}>I own it</button>
    </div>

    <section className="v19Performance" aria-label="Quick market context">
      <div><div className="metricLabel"><small>PERFORMANCE</small><Help title="Performance">Price return over the selected period using available market history. Performance describes what happened; it does not predict what happens next.</Help></div><b>{selectedReturn==null?"—":`${selectedReturn>=0?"+":""}${selectedReturn}%`}</b><div className="v19Range">{(["6M","YTD","1Y"] as const).map(r=><button key={r} className={perfRange===r?"on":""} onClick={()=>setPerfRange(r)}>{r}</button>)}</div></div>
      <div><div className="metricLabel"><small>52-WEEK POSITION</small><Help title="52-week position">Shows where today’s price sits between the last 52-week low and high. Near the high is not automatically bad; it simply adds price-location context.</Help></div><b>{d.performance?.rangePositionPct!=null?`${d.performance.rangePositionPct}%`:"—"}</b><span>{d.performance?.yearLow!=null&&d.performance?.yearHigh!=null?`Low $${d.performance.yearLow} · High $${d.performance.yearHigh}`:"Waiting for 1-year history"}</span></div>
      <div><div className="metricLabel"><small>RISK / REWARD</small><Help title="Risk / reward">Compares the distance from today’s price to NIVORA’s confirmation level with the distance to its reassessment level. It is a technical planning ratio, not a forecast.</Help></div><b>{rr==null?"—":`${rr.toFixed(1)}×`}</b><span>{upside==null||downside==null?"Waiting for levels":`${upside>=0?"+":""}${upside.toFixed(1)}% to confirmation · ${downside.toFixed(1)}% to reassess`}</span></div>
      <div><div className="metricLabel"><small>DATA CONFIDENCE</small><Help title="Data confidence">Shows whether price history, business data, market context and news/catalyst sources are available. Higher confidence means better evidence coverage—not higher certainty of profit.</Help></div><b className={confidence==="High"?"good":confidence==="Low"?"bad":"mid"}>{confidence}</b><span>Price + business + news + market coverage.</span></div>
    </section>

    <section className={["osDecision",tone(view.label),"v12Decision","v18Decision"].join(" ")}>
      <div className="osDecisionTop">
        <div className="decisionEyebrow"><small>THE CALL</small><Help title="What does the call mean?">The call translates business quality, price behavior, current timing, risk, market context and catalysts into one action for the horizon you selected. It is decision support, not a guarantee.</Help></div>
        <h2>{view.label}</h2>
        <p>{view.text}</p>
        <div className="decisionWhy">
          <b>Why?</b>
          {(positive.length?positive:["Evidence is mixed; waiting for stronger confirmation."]).slice(0,2).map((x:string,i:number)=><span key={i}>✓ {x}</span>)}
          {risks[0]&&<span className="riskReason">• {risks[0]}</span>}
        </div>
        <div className="v19Explain">
          <details>
            <summary>Why NIVORA says this</summary>
            <div className="v19ExplainPanel">
              <div><span>Business quality</span><b>{businessScore}/100</b></div>
              <div><span>Recent price record</span><b>{sixScore}/100</b></div>
              <div><span>Entry quality</span><b>{timingScore}/100</b></div>
              <div><span>Risk</span><b>{riskScore}/100</b></div>
              <div><span>Decision confidence</span><b>{confidence}</b></div>
              <div><span>Supporting score</span><b>{overallScore}/100</b></div>
            </div>
          </details>
        </div>
      </div>
      <div className="osPlanGrid">
        <div><div className="metricLabel"><small>BETTER ENTRY</small><Help title="Better entry">A price area where the current risk/reward becomes more attractive. Reaching this area is not enough by itself; NIVORA still prefers stabilization.</Help></div><b>{betterEntryText}</b><span>Prefer stabilization here rather than buying simply because price is falling.</span></div>
        <div><div className="metricLabel"><small>CONFIRMATION</small><Help title="Confirmation">A price/volume condition that would strengthen the setup. NIVORA prefers a convincing close or retest, not the first spike through resistance.</Help></div><b>{confirmationText}</b><span>Prefer a strong close or breakout retest with improving volume/momentum.</span></div>
        <div><div className="metricLabel"><small>PROTECT / REASSESS</small><Help title="Protect / reassess">The technical thesis materially weakens below this area. It is not an automatic stop order; recheck fundamentals, news and your position risk.</Help></div><b>{invalidationText}</b><span>Technical thesis weakens here. Recheck fundamentals and catalyst risk.</span></div>
      </div>
    </section>

    <section className="v18DecisionStrip">
      <div><small>BUSINESS</small><b className={tone(business.label)}>{business.label}</b><Help title="Business quality">Scored from reported growth, profitability, cash generation, balance-sheet evidence and multi-year consistency when SEC data is available.</Help></div>
      <div><small>TREND</small><b className={tone(d.labels.trend)}>{d.labels.trend}</b><Help title="Trend">Uses multiple price horizons and structure. A strong trend can still receive a WAIT if the entry is stretched.</Help></div>
      <div><small>ENTRY</small><b className={tone(d.labels.entry)}>{d.labels.entry}</b><Help title="Entry quality">Combines price location, support/resistance, momentum, extension and downside risk. This answers “is today a good place to start?”</Help></div>
      <div><small>RISK</small><b className={d.labels.risk==="High"?"bad":d.labels.risk==="Lower"?"good":"mid"}>{d.labels.risk}</b><Help title="Risk">Reflects volatility, extension, downside structure and market context. High risk does not automatically mean a bad company.</Help></div>
      <div><small>CONFIDENCE</small><b className={confidence==="High"?"good":confidence==="Low"?"bad":"mid"}>{confidence}</b><Help title="Decision confidence">Confidence rises when price history, business data, market context and current news/catalyst data are all available. Low confidence means treat the call more cautiously.</Help></div>
    </section>

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

    <section className="osChartCard v12Chart">
      <div className="osSectionTitle"><div><small>PRICE MAP</small><h3>What price has to do next</h3></div><span>Green = entry/support · Orange = confirmation · Red = reassess</span></div>
      <div className="chartControls"><div><button className={chartMode==="clean"?"on":""} onClick={()=>setChartMode("clean")}>Clean</button><button className={chartMode==="trend"?"on":""} onClick={()=>setChartMode("trend")}>Trend</button></div><Help title="Chart modes">Clean keeps only price, volume and NIVORA levels. Trend adds 20-day and 50-day moving averages for users who want more technical context.</Help></div>
      <PriceChart candles={d.candles} levels={d.levels} showTrend={chartMode==="trend"}/>
    </section>

    <section className="beginnerScore v18Score">
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
    </section>

    <section className="v12ReasonGrid">
      <div className="v12Reason goodBox"><small>WHY IT CAN WORK</small><h3>What supports the setup</h3>{positive.length?positive.map((x:string,i:number)=><p key={i}>✓ {x}</p>):<p>Evidence is still loading or mixed.</p>}</div>
      <div className="v12Reason riskBox"><small>WHAT CAN GO WRONG</small><h3>What is holding it back</h3>{risks.length?risks.map((x:string,i:number)=><p key={i}>• {x}</p>):<p>No major risk flag was detected from the connected sources.</p>}</div>
    </section>

    <section className="osContext v12Context">
      <div className="osTabs v12Tabs">
        <button className={tab==="overview"?"on":""} onClick={()=>setTab("overview")}>Overview</button>
        <button className={tab==="fundamentals"?"on":""} onClick={()=>setTab("fundamentals")}>Fundamentals</button>
        <button className={tab==="catalysts"?"on":""} onClick={()=>setTab("catalysts")}>Catalysts</button>
        <button className={tab==="news"?"on":""} onClick={()=>setTab("news")}>News</button>
        <button className={tab==="earnings"?"on":""} onClick={()=>setTab("earnings")}>Earnings</button>
        <button className={tab==="technical"?"on":""} onClick={()=>setTab("technical")}>Technical</button>
        {d.assetType!=="crypto"&&<button className={tab==="options"?"on":""} onClick={()=>setTab("options")}>Options / Gamma</button>}
      </div>

      {tab==="overview"&&<div className="v12Overview">
        <div><BriefcaseBusiness size={18}/><div className="metricLabel"><small>Business</small><Help title="Business">Financial quality and consistency. This is intentionally separate from whether today is a good entry.</Help></div><b className={tone(business.label)}>{business.label}</b><span>{business.reasons?.[0]||"Loading fundamentals…"}</span></div>
        <div><Activity size={18}/><div className="metricLabel"><small>Entry</small><Help title="Entry">How attractive today’s price is relative to support, resistance, extension, momentum and downside risk.</Help></div><b className={tone(d.labels.entry)}>{d.labels.entry}</b><span>Current location versus support, extension and momentum.</span></div>
        <div><ShieldCheck size={18}/><div className="metricLabel"><small>Risk</small><Help title="Risk">Technical downside and volatility, plus broader market regime.</Help></div><b className={d.labels.risk==="High"?"bad":"mid"}>{d.labels.risk}</b><span>Technical downside plus market regime.</span></div>
        <div><Newspaper size={18}/><div className="metricLabel"><small>News</small><Help title="News">Material headlines are summarized for tone and impact. Headlines alone do not override price/fundamental evidence.</Help></div><b className={news.tone==="positive"?"good":news.tone==="negative"?"bad":"mid"}>{news.label}</b><span>{news.topReason}</span></div>
      </div>}

      {tab==="fundamentals"&&<div className="v12Fund">
        <div className={`fundSignal ${business.tone||"neutral"}`}><small>BUSINESS QUALITY</small><h3>{business.label}{business.score!=null?` · ${business.score}/100`:""}</h3>{(business.reasons||[]).slice(0,4).map((x:string,i:number)=><p key={i}>• {x}</p>)}{five&&<div className="fiveRecord"><small>5-YEAR RECORD</small><b>{five.score}/100 · {five.revenueTrend}</b><p>{five.summary}</p><div>{(five.history||[]).map((y:any)=><span key={y.year}><i>{y.year}</i><strong>{y.revenue!=null?money(y.revenue):"—"}</strong><em>{y.netIncome!=null?`NI ${money(y.netIncome)}`:"NI —"}</em></span>)}</div></div>}</div>
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

      {tab==="technical"&&<div className="v12Technical"><div className="techIntro"><h3>Technical evidence</h3><p>You do not need these numbers to use NIVORA. Tap the info icon to understand what each metric contributes.</p></div><div className="osTechGrid">{Object.entries(d.engine).map(([k,v]:any)=><div key={k}><div className="metricLabel"><span>{k}</span><Help title={k}>{k==="Trend"?"Multi-horizon direction and slope.":k==="Momentum"?"Speed and persistence of the current move.":k==="Flow"?"Volume/price participation and confirmation.":k==="Structure"?"Higher highs/lows, support and resistance behavior.":k==="RSI"?"Relative Strength Index; helps identify momentum extremes but is never used alone.":k==="MACD"?"Trend/momentum crossover evidence.":k==="Extension"?"How far price has moved away from its recent equilibrium; high extension increases chase risk.":k==="Relative strength"?"Performance versus the relevant benchmark.":k==="Market regime"?"Whether the broad market is supportive, mixed or risk-off.":"Supporting quantitative evidence used by the decision engine."}</Help></div><b>{typeof v==="number"?`${v}/100`:v}</b></div>)}</div><div className="techWhy">{d.why.map((x:string,i:number)=><p key={i}>• {x}</p>)}</div></div>}

      {tab==="options"&&<div className="gammaPanel v22Options">
        <div className="gammaHero"><small>OPTIONS INTELLIGENCE</small><h3>Options positioning — translated for beginners.</h3><p>Use this as supporting short-term context around important strikes, volatility and expected move. It does not override the main NIVORA call.</p></div>
        {optionsLoading?<div className="optionsState">Loading shared options snapshot…</div>:
        !optionsData?.enabled?<div className="optionsState"><b>Options data is not available.</b><span>{optionsData?.reason||"Add MARKETDATA_TOKEN in Vercel to enable the options module."}</span><button type="button" className="optionsRetry" onClick={()=>{setOptionsData(null);setOptionsLoading(false)}}>Retry</button></div>:
        <><div className="optionsFresh"><span>{optionsData.dataMode}</span><small>{optionsData.updatedAt?`Provider snapshot ${new Date(optionsData.updatedAt).toLocaleString()}`:"Provider timestamp unavailable"}</small></div>
        <div className="optionsQuick">
          <div><div className="metricLabel"><small>CALL WALL</small><Help title="Call wall">The strike with the largest call open interest in the fetched expiration. It can become an important attention area, but it is not guaranteed resistance.</Help></div><b>{optionsData.callWall!=null?`$${optionsData.callWall}`:"—"}</b></div>
          <div><div className="metricLabel"><small>PUT WALL</small><Help title="Put wall">The strike with the largest put open interest in the fetched expiration. It can become an important attention area, but it is not guaranteed support.</Help></div><b>{optionsData.putWall!=null?`$${optionsData.putWall}`:"—"}</b></div>
          <div><div className="metricLabel"><small>GAMMA NODE</small><Help title="Gamma node">The strike with the largest open-interest-weighted gamma concentration in this snapshot. This is a positioning proxy, not observed dealer inventory.</Help></div><b>{optionsData.gammaNode!=null?`$${optionsData.gammaNode}`:"—"}</b></div>
          <div><div className="metricLabel"><small>EXPECTED MOVE</small><Help title="Expected move">Approximation from the nearest at-the-money call + put midpoint in the fetched expiration. It is an options-implied range estimate, not a prediction.</Help></div><b>{optionsData.expectedMovePct!=null?`±${optionsData.expectedMovePct}%`:"—"}</b></div>
          <div><div className="metricLabel"><small>ATM IV</small><Help title="ATM implied volatility">Average implied volatility around the closest at-the-money strike available in this options snapshot.</Help></div><b>{optionsData.atmIV!=null?`${optionsData.atmIV}%`:"—"}</b></div>
          <div><div className="metricLabel"><small>PUT/CALL OI</small><Help title="Put/call open interest">Total put open interest divided by total call open interest in the fetched chain. Higher is more put-heavy, but direction cannot be inferred from this ratio alone.</Help></div><b>{optionsData.putCallOI??"—"}</b></div>
        </div>
        <div className="optionsRead"><small>PLAIN-ENGLISH READ</small><h4>{optionsData.position}</h4><p>{optionsData.gammaProxy}. {optionsData.note}</p></div>
        {optionsData.topNodes?.length>0&&<div className="optionsNodes"><small>TOP GAMMA-CONCENTRATION STRIKES</small>{optionsData.topNodes.map((x:any)=><div key={x.strike}><b>${x.strike}</b><span>Call OI {x.callOI.toLocaleString()} · Put OI {x.putOI.toLocaleString()}</span></div>)}</div>}
        </>}
      </div>}
    </section>

  </div>;
}
