"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import SearchBox from "./SearchBox";
import {supabaseBrowser} from "@/lib/supabase";
import {ArrowUpRight,Activity,Eye,ShieldAlert,Zap,Target,TrendingUp,LogOut} from "lucide-react";

type RadarFilter="All"|"Best now"|"Early momentum"|"Quality pullback"|"In play"|"Exit watch";

export default function TodayClient(){
  const[market,setMarket]=useState<any>(null);
  const[scan,setScan]=useState<any[]>([]);
  const[radar,setRadar]=useState<any[]>([]);
  const[loading,setLoading]=useState(true);
  const[radarLoading,setRadarLoading]=useState(true);
  const[radarPartial,setRadarPartial]=useState(false);
  const[filter,setFilter]=useState<RadarFilter>("All");

  useEffect(()=>{
    let alive=true;
    fetch("/api/market").then(r=>r.json()).then(x=>alive&&setMarket(x)).catch(()=>{});
    fetch("/api/scan?radar=1").then(r=>r.json()).then(x=>{if(!alive)return;setRadar(x.items||[]);setRadarPartial(!!x.partial)}).catch(()=>{}).finally(()=>alive&&setRadarLoading(false));
    (async()=>{try{
      const s=supabaseBrowser();const{data:{session}}=await s.auth.getSession();const user=session?.user;if(!user)return;
      const{data}=await s.from("watchlist_items").select("symbol").eq("user_id",user.id).limit(12);
      const syms=(data||[]).map((x:any)=>x.symbol);
      if(syms.length){const x=await fetch(`/api/scan?symbols=${encodeURIComponent(syms.join(","))}`).then(r=>r.json());if(alive)setScan(x.items||[])}
    }finally{if(alive)setLoading(false)}})();
    return()=>{alive=false};
  },[]);

  const visible=useMemo(()=>filter==="All"?radar:radar.filter(x=>x.category===filter),[radar,filter]);
  const counts=useMemo(()=>({buy:radar.filter(x=>x.action==="BUY / START").length,watch:radar.filter(x=>x.action.includes("WATCH")||x.action.includes("CHASE")).length,exit:radar.filter(x=>x.action.includes("EXIT")||x.action.includes("AVOID")).length}),[radar]);

  return <div className="todayPage v36Today v37Today">
    <section className="todayHero v36TodayHero">
      <div><div className="eyebrow">NIVORA RADAR</div><h1>Start with the decision, not the data.</h1><p>Every candidate is ranked into an action, entry plan, target and risk level. Open the thesis only when you want the proof underneath.</p></div><SearchBox large/>
    </section>


    <section className="v39Promise" aria-label="Why NIVORA"><b>Decision first.</b><span>Action → entry → target → thesis break.</span><Link href="/about">Why NIVORA →</Link></section>
    <section className="marketStrip v36MarketStrip">
      <div className="marketRegime"><small>MARKET REGIME</small><b className={market?.regime==="Risk-on"?"good":market?.regime==="Risk-off"?"bad":"mid"}>{market?.regime||"Loading…"}</b><span>Broad-market context changes how aggressive new entries should be.</span></div>
      <div className="marketTiles">{market?.items?.map((x:any)=><Link key={x.symbol} href={`/stock/${encodeURIComponent(x.symbol)}`}><span>{x.symbol}</span><b className={x.changePct>=0?"good":"bad"}>{x.changePct>=0?"+":""}{x.changePct}%</b><small>{x.trend}</small></Link>)}</div>
    </section>

    <section className="v36Radar">
      <div className="v36RadarHead"><div><small>LIVE DECISION RADAR</small><h2>Top 20 Decision Board</h2><p>Best opportunities and biggest risks from the current scan. Score ranks evidence; action tells you what to do with it.</p></div><div className="v36RadarStats"><span><b>{counts.buy}</b> actionable</span><span><b>{counts.watch}</b> watch</span><span><b>{counts.exit}</b> exit risk</span></div></div>
      <div className="v36RadarFilters">{(["All","Best now","Early momentum","Quality pullback","In play","Exit watch"] as RadarFilter[]).map(x=><button key={x} className={filter===x?"on":""} onClick={()=>setFilter(x)}>{x}</button>)}</div>
      {radarLoading?<div className="softSkeleton">Scanning the NIVORA radar…</div>:visible.length?<div className="v36RadarList">{visible.slice(0,20).map((x:any,i:number)=><Link key={x.symbol} href={`/stock/${encodeURIComponent(x.symbol)}`} className="v36RadarRow">
        <div className="v36Rank">{i+1}</div><div className="v36RadarSymbol"><b>{x.symbol}</b><span>{x.category}</span></div>
        <div className="v36RadarAction"><strong className={x.action.includes("BUY")?"good":x.action.includes("EXIT")||x.action.includes("AVOID")?"bad":"mid"}>{x.action}</strong><span>{x.reason}</span></div>
        <div className="v36RadarScore"><b>{x.score}</b><span>{x.confidence}% conf.</span></div>
        <div className="v36RadarLevel"><small>ENTRY</small><b>${x.levels?.entryLow}–${x.levels?.entryHigh}</b></div>
        <div className="v36RadarLevel"><small>TARGET</small><b>${x.levels?.target1}</b></div>
        <div className="v36RadarLevel"><small>R:R</small><b>{x.levels?.rr}×</b></div>
        <ArrowUpRight size={16}/>
      </Link>)}</div>:<div className="emptyToday"><Eye size={21}/><b>No radar matches returned</b><span>The market-data provider may be rate-limited. NIVORA will show available candidates rather than fabricate rankings.</span></div>}
      {radarPartial&&<p className="v36RadarNote">Partial scan: the free market-data entitlement did not return every symbol. Rankings use only successfully refreshed candidates.</p>}
    </section>

    <section className="todayGrid">
      <div className="todayCard attention"><div className="todayTitle"><div><small>YOUR WATCHLIST</small><h2>Needs attention</h2></div><Link href="/watchlist">View all →</Link></div>{loading?<div className="softSkeleton">Checking your watchlist…</div>:scan.length?scan.slice(0,8).map((x:any)=><Link className="scanRow" key={x.symbol} href={`/stock/${encodeURIComponent(x.symbol)}`}><div><b>{x.symbol}</b><span>{x.reason}</span></div><div><strong className={x.action.includes("BUY")?"good":x.action.includes("EXIT")||x.action.includes("AVOID")?"bad":"mid"}>{x.action}</strong><small>${x.price} · {x.changePct>=0?"+":""}{x.changePct}%</small></div></Link>):<div className="emptyToday"><Eye size={21}/><b>Your watchlist is empty</b><span>Add stocks you care about. NIVORA will rank what needs attention here.</span><Link href="/analyze">Analyze a stock →</Link></div>}</div>
      <div className="todayCard playbook"><div className="todayTitle"><div><small>DECISION PLAYBOOK</small><h2>What are you looking for?</h2></div></div>
        <button onClick={()=>setFilter("Quality pullback")}><Target size={18}/><div><b>Quality pullbacks</b><span>Strong trend returning toward a better risk-adjusted price.</span></div><ArrowUpRight size={16}/></button>
        <button onClick={()=>setFilter("Early momentum")}><TrendingUp size={18}/><div><b>Early momentum</b><span>Improving trend + momentum before the move gets too extended.</span></div><ArrowUpRight size={16}/></button>
        <button onClick={()=>setFilter("Exit watch")}><LogOut size={18}/><div><b>Exit watch</b><span>Weakening structure where capital protection matters more than hope.</span></div><ArrowUpRight size={16}/></button>
        <Link href="/stock/SPY"><ShieldAlert size={18}/><div><b>Market check</b><span>Know whether the market is helping or hurting new risk.</span></div><ArrowUpRight size={16}/></Link>
      </div>
    </section>
  </div>;
}
