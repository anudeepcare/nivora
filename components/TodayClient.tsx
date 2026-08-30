"use client";
import {useEffect,useMemo,useState} from "react";
import {usePathname} from "next/navigation";
import Link from "next/link";
import SearchBox from "./SearchBox";
import {supabaseBrowser} from "@/lib/supabase";
import {ArrowUpRight,Eye,ShieldAlert,Target,TrendingUp,LogOut,CheckCircle2,Clock3} from "lucide-react";

type RadarFilter="All"|"Highest conviction"|"Strengthening"|"Attractive"|"Risk";

export default function TodayClient(){
  const path=usePathname(); const isDiscover=path.startsWith("/discover");
  const[market,setMarket]=useState<any>(null);
  const[watchScan,setWatchScan]=useState<any[]>([]);
  const[radar,setRadar]=useState<any[]>([]);
  const[coverage,setCoverage]=useState<any>(null);
  const[currentIdeas,setCurrentIdeas]=useState<any[]>([]);
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
        const x=await fetch(`/api/discover?mode=${mode}&limit=${isDiscover?60:12}`).then(r=>r.json());
        if(!alive)return;setRadar(x.items||[]);setCoverage(x.coverage||null);setRadarPartial(!!x.partial);
        if(!isDiscover){fetch(`/api/discover?mode=discover&limit=8`).then(r=>r.json()).then(y=>{if(alive)setCurrentIdeas(y.items||[])}).catch(()=>{});}
      }catch{}finally{if(alive)setRadarLoading(false)}
    })();
    (async()=>{try{
      const s=supabaseBrowser();const{data:{session}}=await s.auth.getSession();const user=session?.user;if(!user)return;
      const{data}=await s.from("watchlist_items").select("symbol").eq("user_id",user.id).limit(12);
      const syms=(data||[]).map((x:any)=>x.symbol);
      if(syms.length){const x=await fetch(`/api/investment?symbols=${encodeURIComponent(syms.join(","))}`).then(r=>r.json());if(alive)setWatchScan(x.items||[])}
    }finally{if(alive)setLoading(false)}})();
    return()=>{alive=false};
  },[isDiscover]);

  const visible=useMemo(()=>filter==="All"?radar:radar.filter(x=>filter==="Highest conviction"?x.thesisScore>=75:filter==="Strengthening"?x.thesisState==="Strengthening":filter==="Attractive"?x.valuationScore>=65:filter==="Risk"?(x.action?.includes("REDUCE")||x.action?.includes("AVOID")||x.thesisLabel==="BEARISH"):true),[radar,filter]);
  const counts=useMemo(()=>({buy:radar.filter(x=>x.action?.includes("BUY")||x.action==="ACCUMULATE").length,watch:radar.filter(x=>x.action?.includes("HOLD")||x.action==="WATCH").length,exit:radar.filter(x=>x.action?.includes("REDUCE")||x.action?.includes("EXIT")||x.action==="AVOID").length}),[radar]);
  const coverageText=coverage?.fullMarket
    ? `${Number(coverage.eligibleUniverse||0).toLocaleString()} eligible U.S. stocks covered · thesis scan refreshed continuously`
    : coverage?.ready
      ? `Investment radar preview · ${Number(coverage.scanned||0).toLocaleString()} companies analyzed (${Number(coverage.coveragePct||0)}% universe coverage) · rankings improve as coverage grows`
      : coverage?.mode==="thesis-first-investment-scan"
        ? `Building thesis-first coverage · ${Number(coverage.scanned||0).toLocaleString()} companies analyzed${coverage?.diagnostic?` · ${coverage.diagnostic}`:""}`
        : `Investment scanner is not configured`;

  return <div className="todayPage v36Today v37Today v45Today">
    <section className="todayHero v36TodayHero v45TodayHero">
      <div><div className="eyebrow">{isDiscover?"DISCOVER":"TODAY"}</div><h1>{isDiscover?"Find businesses worth owning — before the crowd agrees.":"What changed in the investment thesis?"}</h1><p>{isDiscover?"NIVORA ranks company quality, forward growth, financial strength, valuation, analysts and evidence confidence. Price action confirms risk; it does not define the thesis.":"Today only surfaces material thesis, valuation and conviction changes. A noisy price move by itself is not a new investment decision."}</p></div><SearchBox large/>
    </section>

    {!isDiscover&&<section className="v45TodayBrief">
      <div><small>TODAY'S DECISION BRIEF</small><h2>{radarLoading?"Scanning current signals…":radar.length?`${radar.length} signal${radar.length===1?"":"s"} worth reviewing`:"No high-quality action is forcing itself today"}</h2><p>{radar.length?"NIVORA only surfaces material changes in thesis, valuation or investor action. It does not force a daily buy list.":"That is a valid result. Keep capital patient until the evidence improves."}</p></div>
      <div className="v45BriefCounts"><span><b>{counts.buy}</b><small>actionable</small></span><span><b>{counts.watch}</b><small>developing</small></span><span><b>{counts.exit}</b><small>risk</small></span></div>
    </section>}

    {isDiscover&&<section className="v41Promise" aria-label="Why NIVORA"><div><small>THE NIVORA DIFFERENCE</small><b>Business first. Thesis second. Price last.</b></div><span>NIVORA separates company quality, forward thesis and current opportunity so a 10% price move cannot automatically rewrite conviction.</span><Link href="/about">How the engine thinks →</Link></section>}

    <section className="marketStrip v36MarketStrip">
      <div className="marketRegime"><small>MARKET REGIME</small><b className={market?.regime==="Risk-on"?"good":market?.regime==="Risk-off"?"bad":"mid"}>{market?.regime||"Loading…"}</b><span>Broad-market context changes how aggressive new entries should be.</span></div>
      <div className="marketTiles">{market?.items?.map((x:any)=><Link key={x.symbol} href={`/stock/${encodeURIComponent(x.symbol)}`}><span>{x.symbol}</span><b className={x.changePct>=0?"good":"bad"}>{x.changePct>=0?"+":""}{x.changePct}%</b><small>{x.trend}</small></Link>)}</div>
    </section>

    <section className="v36Radar v45Radar">
      <div className="v36RadarHead"><div><small>{isDiscover?"INVESTMENT OPPORTUNITY ENGINE":"THESIS CHANGE ENGINE"}</small><h2>{isDiscover?"Best long-horizon opportunities in current coverage":"Only material changes — not market noise"}</h2><p>{isDiscover?"Opportunity score combines thesis strength with valuation and risk. Technicals are a small confirmation layer, not the investment thesis.":"NIVORA compares the latest durable thesis with the prior observation and only surfaces meaningful changes."}</p><div className="v45Coverage"><CheckCircle2 size={14}/><span>{coverageText}</span></div></div><div className="v36RadarStats"><span><b>{counts.buy}</b> actionable</span><span><b>{counts.watch}</b> watch</span><span><b>{counts.exit}</b> risk</span></div></div>
      {isDiscover&&<div className="v36RadarFilters">{(["All","Highest conviction","Strengthening","Attractive","Risk"] as RadarFilter[]).map(x=><button key={x} className={filter===x?"on":""} onClick={()=>setFilter(x)}>{x}</button>)}</div>}
      {radarLoading?<div className="softSkeleton">{isDiscover?"Ranking thesis-first investment evidence…":"Checking for material thesis changes…"}</div>:!coverage?.ready?<div className="v47Warmup"><div className="v47WarmupBar"><i style={{width:`${Math.max(2,Number(coverage?.coveragePct||0))}%`}}/></div><b>{coverage?.diagnostic||"Building the investment radar"}</b><span>{Number(coverage?.scanned||0).toLocaleString()} companies currently have durable thesis data. {coverage?.eligibleUniverse?`${Number(coverage.eligibleUniverse).toLocaleString()} symbols are in the eligible universe. `:""}NIVORA will not fabricate rankings when the thesis scanner has no completed records.</span>{coverage?.lastScanAt&&<small>Last investment scan: {new Date(coverage.lastScanAt).toLocaleString()}</small>}</div>:visible.length?<div className="v36RadarList">{visible.slice(0,isDiscover?30:12).map((x:any,i:number)=><Link key={x.symbol} href={`/stock/${encodeURIComponent(x.symbol)}`} className="v36RadarRow">
        <div className="v36Rank">{i+1}</div><div className="v36RadarSymbol"><b>{x.symbol}</b><span>{x.thesisLabel} · {x.thesisState}</span></div>
        <div className="v36RadarAction"><strong className={x.action?.includes("BUY")||x.action==="ACCUMULATE"?"good":x.action?.includes("REDUCE")||x.action?.includes("EXIT")||x.action==="AVOID"?"bad":"mid"}>{x.action}</strong><span>{x.reason}</span></div>
        <div className="v36RadarScore"><b>{x.opportunityScore}</b><span>{x.confidence}% evidence</span></div>
        <div className="v36RadarLevel"><small>COMPANY</small><b>{x.companyScore}/100</b></div>
        <div className="v36RadarLevel"><small>THESIS</small><b>{x.thesisScore}/100</b></div>
        <div className="v36RadarLevel"><small>VALUATION</small><b>{x.valuationScore}/100{x.targetUpsidePct!=null?` · ${x.targetUpsidePct>=0?"+":""}${x.targetUpsidePct}%`:""}</b></div>
        <ArrowUpRight size={16}/>
      </Link>)}</div>:<div className="emptyToday"><Clock3 size={21}/><b>{isDiscover?"No qualified scanner results yet":"Nothing crossed today's action threshold"}</b><span>{isDiscover?"If the full-market scanner was just installed, let its rolling universe scan populate. NIVORA will not fabricate rankings.":"No forced trades. Review your watchlist or return when the evidence changes."}</span></div>}
      {radarPartial&&<p className="v36RadarNote">Coverage is still expanding. Rankings only compare companies with completed thesis-first evidence, and NIVORA labels the board as a preview until broad-universe coverage is reached.</p>}
    </section>

    {!isDiscover&&currentIdeas.length>0&&<section className="v50TodayIdeas"><div className="todayTitle"><div><small>CURRENT INVESTMENT RADAR</small><h2>Best opportunities in current coverage</h2><p>Not trades for today — strongest thesis/opportunity combinations currently covered.</p></div><Link href="/discover">Open Discover →</Link></div><div className="v50IdeaGrid">{currentIdeas.slice(0,6).map((x:any)=><Link key={x.symbol} href={`/stock/${encodeURIComponent(x.symbol)}`}><div><b>{x.symbol}</b><span>{x.thesisLabel} · {x.thesisState}</span></div><strong className={x.thesisLabel==="BULLISH"?"good":x.thesisLabel==="BEARISH"?"bad":"mid"}>{x.action}</strong><small>Thesis {x.thesisScore} · Opportunity {x.opportunityScore}</small></Link>)}</div></section>}
    {!isDiscover&&<section className="todayGrid">
      <div className="todayCard attention"><div className="todayTitle"><div><small>YOUR WATCHLIST</small><h2>Thesis pulse</h2></div><Link href="/watchlist">View all →</Link></div>{loading?<div className="softSkeleton">Checking thesis changes…</div>:watchScan.length?watchScan.slice(0,8).map((x:any)=><Link className="scanRow" key={x.symbol} href={`/stock/${encodeURIComponent(x.symbol)}`}><div><b>{x.symbol}</b><span>{x.thesisState} thesis · {x.thesisScore}/100</span></div><div><strong className={x.action?.includes("BUY")||x.action==="ACCUMULATE"?"good":x.action?.includes("REDUCE")||x.action?.includes("EXIT")||x.action==="AVOID"?"bad":"mid"}>{x.action}</strong><small>{x.opportunityScore}/100 opportunity</small></div></Link>):<div className="emptyToday"><Eye size={21}/><b>No thesis data on your watchlist yet</b><span>Add companies you care about. NIVORA will surface material thesis changes, not daily chart noise.</span><Link href="/analyze">Analyze a stock →</Link></div>}</div>
      <div className="todayCard playbook"><div className="todayTitle"><div><small>DISCOVER MORE</small><h2>Search by investment edge</h2></div><Link href="/discover">Open Discover →</Link></div>
        <Link href="/discover"><Target size={18}/><div><b>Quality at a discount</b><span>Strong businesses where valuation has become more attractive.</span></div><ArrowUpRight size={16}/></Link>
        <Link href="/discover"><TrendingUp size={18}/><div><b>Thesis strengthening</b><span>Forward growth, earnings or analyst evidence improving before price fully reflects it.</span></div><ArrowUpRight size={16}/></Link>
        <Link href="/discover"><LogOut size={18}/><div><b>Thesis deterioration</b><span>Business or forward evidence weakening enough to reconsider capital.</span></div><ArrowUpRight size={16}/></Link>
        <Link href="/stock/SPY"><ShieldAlert size={18}/><div><b>Market context</b><span>Use regime as a sizing/risk overlay—not as the company thesis.</span></div><ArrowUpRight size={16}/></Link>
      </div>
    </section>}
  </div>;
}
