"use client";
import {useEffect,useMemo,useState} from "react";
import {usePathname} from "next/navigation";
import Link from "next/link";
import SearchBox from "./SearchBox";
import {supabaseBrowser} from "@/lib/supabase";
import {ArrowUpRight,Eye,ShieldAlert,Target,TrendingUp,LogOut,CheckCircle2,Clock3} from "lucide-react";

type RadarFilter="All"|"Best now"|"Early momentum"|"Quality pullback"|"In play"|"Exit watch";

export default function TodayClient(){
  const path=usePathname(); const isDiscover=path.startsWith("/discover");
  const[market,setMarket]=useState<any>(null);
  const[watchScan,setWatchScan]=useState<any[]>([]);
  const[radar,setRadar]=useState<any[]>([]);
  const[coverage,setCoverage]=useState<any>(null);
  const[loading,setLoading]=useState(true);
  const[radarLoading,setRadarLoading]=useState(true);
  const[radarPartial,setRadarPartial]=useState(false);
  const[filter,setFilter]=useState<RadarFilter>("All");

  useEffect(()=>{
    let alive=true;
    fetch("/api/market").then(r=>r.json()).then(x=>alive&&setMarket(x)).catch(()=>{});
    (async()=>{
      try{
        const mode=isDiscover?"discover":"today";
        let x=await fetch(`/api/discover?mode=${mode}&limit=${isDiscover?60:12}`).then(r=>r.json());
        if(!x?.items?.length){
          const fallback=await fetch(`/api/scan?radar=1&limit=${isDiscover?20:20}`).then(r=>r.json());
          x={...fallback,coverage:fallback.coverage||{mode:"seed-fallback",fullMarket:false,scanned:fallback.returned||0}};
          if(!isDiscover)x.items=(fallback.items||[]).filter((z:any)=>z.action==="BUY / START"||z.action==="START / PULLBACK"||z.action?.includes("EXIT")||z.category==="Exit watch"||z.rankScore>=78).slice(0,10);
        }
        if(!alive)return;setRadar(x.items||[]);setCoverage(x.coverage||null);setRadarPartial(!!x.partial);
      }catch{}finally{if(alive)setRadarLoading(false)}
    })();
    (async()=>{try{
      const s=supabaseBrowser();const{data:{session}}=await s.auth.getSession();const user=session?.user;if(!user)return;
      const{data}=await s.from("watchlist_items").select("symbol").eq("user_id",user.id).limit(12);
      const syms=(data||[]).map((x:any)=>x.symbol);
      if(syms.length){const x=await fetch(`/api/scan?symbols=${encodeURIComponent(syms.join(","))}`).then(r=>r.json());if(alive)setWatchScan(x.items||[])}
    }finally{if(alive)setLoading(false)}})();
    return()=>{alive=false};
  },[isDiscover]);

  const visible=useMemo(()=>filter==="All"?radar:radar.filter(x=>x.category===filter),[radar,filter]);
  const counts=useMemo(()=>({buy:radar.filter(x=>x.action==="BUY / START"||x.action==="START / PULLBACK").length,watch:radar.filter(x=>x.action?.includes("WATCH")||x.action?.includes("CHASE")||x.action==="WAIT").length,exit:radar.filter(x=>x.action?.includes("EXIT")||x.action==="AVOID").length}),[radar]);
  const coverageText=coverage?.fullMarket
    ? `${Number(coverage.scanned||0).toLocaleString()} recent candidates scored across ${Number(coverage.eligibleUniverse||0).toLocaleString()} eligible US symbols`
    : coverage?.mode==="persisted-market-scan"
      ? `${Number(coverage.scanned||0).toLocaleString()} of ${Number(coverage.eligibleUniverse||0).toLocaleString()} eligible US symbols refreshed so far`
      : `${Number(coverage?.scanned||radar.length).toLocaleString()} symbols in fallback scan · full-market scanner warming up`;

  return <div className="todayPage v36Today v37Today v45Today">
    <section className="todayHero v36TodayHero v45TodayHero">
      <div><div className="eyebrow">{isDiscover?"DISCOVER":"TODAY"}</div><h1>{isDiscover?"Find the strongest setups across the market.":"What changed — and what deserves action."}</h1><p>{isDiscover?"NIVORA screens the eligible U.S. universe, validates price geometry, ranks the best setups and hides the noise.":"A short daily brief: actionable market setups, portfolio/watchlist changes and risk that deserves your attention."}</p></div><SearchBox large/>
    </section>

    {!isDiscover&&<section className="v45TodayBrief">
      <div><small>TODAY'S DECISION BRIEF</small><h2>{radarLoading?"Scanning current signals…":radar.length?`${radar.length} signal${radar.length===1?"":"s"} worth reviewing`:"No high-quality action is forcing itself today"}</h2><p>{radar.length?"NIVORA only surfaces setups that crossed an action/risk threshold. It does not force a daily buy list.":"That is a valid result. Keep capital patient until the evidence improves."}</p></div>
      <div className="v45BriefCounts"><span><b>{counts.buy}</b><small>actionable</small></span><span><b>{counts.watch}</b><small>developing</small></span><span><b>{counts.exit}</b><small>risk</small></span></div>
    </section>}

    {isDiscover&&<section className="v41Promise" aria-label="Why NIVORA"><div><small>THE NIVORA DIFFERENCE</small><b>Don’t analyze the analysis.</b></div><span>Stage 1 screens broadly. Stage 2 validates entry, target, thesis break and evidence quality before a setup earns attention.</span><Link href="/about">How the engine thinks →</Link></section>}

    <section className="marketStrip v36MarketStrip">
      <div className="marketRegime"><small>MARKET REGIME</small><b className={market?.regime==="Risk-on"?"good":market?.regime==="Risk-off"?"bad":"mid"}>{market?.regime||"Loading…"}</b><span>Broad-market context changes how aggressive new entries should be.</span></div>
      <div className="marketTiles">{market?.items?.map((x:any)=><Link key={x.symbol} href={`/stock/${encodeURIComponent(x.symbol)}`}><span>{x.symbol}</span><b className={x.changePct>=0?"good":"bad"}>{x.changePct>=0?"+":""}{x.changePct}%</b><small>{x.trend}</small></Link>)}</div>
    </section>

    <section className="v36Radar v45Radar">
      <div className="v36RadarHead"><div><small>{isDiscover?"MARKET OPPORTUNITY ENGINE":"CURRENT SIGNALS"}</small><h2>{isDiscover?"Ranked opportunities — after risk checks":"Only what changed enough to matter"}</h2><p>{isDiscover?"Rank score blends setup quality, entry quality, risk, evidence confidence and validated reward/risk. Invalid price plans are penalized or removed.":"Action first. If nothing is actionable, NIVORA says so rather than manufacturing a trade."}</p><div className="v45Coverage"><CheckCircle2 size={14}/><span>{coverageText}</span></div></div><div className="v36RadarStats"><span><b>{counts.buy}</b> actionable</span><span><b>{counts.watch}</b> watch</span><span><b>{counts.exit}</b> risk</span></div></div>
      {isDiscover&&<div className="v36RadarFilters">{(["All","Best now","Early momentum","Quality pullback","In play","Exit watch"] as RadarFilter[]).map(x=><button key={x} className={filter===x?"on":""} onClick={()=>setFilter(x)}>{x}</button>)}</div>}
      {radarLoading?<div className="softSkeleton">{isDiscover?"Ranking the latest market scan…":"Checking what changed…"}</div>:visible.length?<div className="v36RadarList">{visible.slice(0,isDiscover?30:12).map((x:any,i:number)=><Link key={x.symbol} href={`/stock/${encodeURIComponent(x.symbol)}`} className="v36RadarRow">
        <div className="v36Rank">{i+1}</div><div className="v36RadarSymbol"><b>{x.symbol}</b><span>{x.category}</span></div>
        <div className="v36RadarAction"><strong className={x.action?.includes("BUY")||x.action?.includes("START")?"good":x.action?.includes("EXIT")||x.action==="AVOID"?"bad":"mid"}>{x.action}</strong><span>{x.reason}</span></div>
        <div className="v36RadarScore"><b>{x.rankScore??x.score}</b><span>{x.confidence}% evidence</span></div>
        <div className="v36RadarLevel"><small>ENTRY</small><b>{x.levels?.geometryValid?`$${x.levels.entryLow}–$${x.levels.entryHigh}`:"—"}</b></div>
        <div className="v36RadarLevel"><small>TARGET</small><b>{x.levels?.geometryValid?`$${x.levels.target1}`:"Pending"}</b></div>
        <div className="v36RadarLevel"><small>REWARD / RISK</small><b>{x.levels?.geometryValid&&x.levels?.rr!=null?`${x.levels.rr}×`:"—"}</b></div>
        <ArrowUpRight size={16}/>
      </Link>)}</div>:<div className="emptyToday"><Clock3 size={21}/><b>{isDiscover?"No qualified scanner results yet":"Nothing crossed today's action threshold"}</b><span>{isDiscover?"If the full-market scanner was just installed, let its rolling universe scan populate. NIVORA will not fabricate rankings.":"No forced trades. Review your watchlist or return when the evidence changes."}</span></div>}
      {radarPartial&&<p className="v36RadarNote">Coverage is partial. Rankings use only successfully refreshed candidates; the UI does not claim a full-market scan until at least 90% of the eligible universe is refreshed.</p>}
    </section>

    {!isDiscover&&<section className="todayGrid">
      <div className="todayCard attention"><div className="todayTitle"><div><small>YOUR WATCHLIST</small><h2>Needs attention</h2></div><Link href="/watchlist">View all →</Link></div>{loading?<div className="softSkeleton">Checking your watchlist…</div>:watchScan.length?watchScan.slice(0,8).map((x:any)=><Link className="scanRow" key={x.symbol} href={`/stock/${encodeURIComponent(x.symbol)}`}><div><b>{x.symbol}</b><span>{x.reason}</span></div><div><strong className={x.action?.includes("BUY")||x.action?.includes("START")?"good":x.action?.includes("EXIT")||x.action==="AVOID"?"bad":"mid"}>{x.action}</strong><small>${x.price} · {x.changePct>=0?"+":""}{x.changePct}%</small></div></Link>):<div className="emptyToday"><Eye size={21}/><b>Your watchlist is empty</b><span>Add stocks you care about. NIVORA will tell you when their setup materially changes.</span><Link href="/analyze">Analyze a stock →</Link></div>}</div>
      <div className="todayCard playbook"><div className="todayTitle"><div><small>DISCOVER MORE</small><h2>Search the market by setup</h2></div><Link href="/discover">Open Discover →</Link></div>
        <Link href="/discover"><Target size={18}/><div><b>Quality pullbacks</b><span>Strong structure returning toward a better risk-adjusted price.</span></div><ArrowUpRight size={16}/></Link>
        <Link href="/discover"><TrendingUp size={18}/><div><b>Early momentum</b><span>Improving trend before the move becomes crowded or extended.</span></div><ArrowUpRight size={16}/></Link>
        <Link href="/discover"><LogOut size={18}/><div><b>Exit watch</b><span>Weakening structure where capital protection matters more than hope.</span></div><ArrowUpRight size={16}/></Link>
        <Link href="/stock/SPY"><ShieldAlert size={18}/><div><b>Market check</b><span>Know whether the broad market is helping or hurting new risk.</span></div><ArrowUpRight size={16}/></Link>
      </div>
    </section>}
  </div>;
}
