"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import MetricInfo from "@/components/v65/MetricInfo";
import {supabaseBrowser} from "@/lib/supabase";
import {calculatePortfolioIntelligence,calculatePortfolioPulse} from "@/lib/v65/portfolio";
import PortfolioPulse from "@/components/portfolio/PortfolioPulse";
import HoldingsIntelligence from "@/components/portfolio/HoldingsIntelligence";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {Trash2,Pencil,Check,X,Sparkles,ShieldCheck,Search,WalletCards,Bitcoin,Banknote} from "lucide-react";

type AssetType="EQUITY"|"CRYPTO"|"CASH";

function PortfolioContent(){
 const sp=useSearchParams();
 const[rows,setRows]=useState<any[]>([]),[quotes,setQuotes]=useState<any>({});
 const[pulseHistory,setPulseHistory]=useState<any[]>([]),[assetType,setAssetType]=useState<AssetType>("EQUITY"),[symbol,setSymbol]=useState(sp.get("symbol")||""),[shares,setShares]=useState(""),[cost,setCost]=useState(""),[horizon,setHorizon]=useState("long"),[msg,setMsg]=useState(""),[edit,setEdit]=useState<any>(null),[portfolioRisk,setPortfolioRisk]=useState<any>(null),[showAdd,setShowAdd]=useState(false);

 const refreshPulseHistory=useCallback(async(uid:string)=>{try{const j=await fetch("/api/portfolio/pulse",{headers:{"x-nivora-user-id":uid},cache:"no-store"}).then(r=>r.json());setPulseHistory(Array.isArray(j?.items)?j.items:[])}catch{}},[]);
 const load=useCallback(async()=>{
  const s=supabaseBrowser();const{data:{user}}=await s.auth.getUser();if(!user)return;
  refreshPulseHistory(user.id);
  const{data,error}=await s.from("portfolio_positions").select("*").eq("user_id",user.id).order("updated_at",{ascending:false});
  if(error){setMsg(error.message.includes("asset_type")?"Run supabase/20260904_v65_portfolio_assets.sql once to enable V65 stocks, crypto and cash.":error.message);return}
  const normalized=(data||[]).map((x:any)=>({...x,asset_type:x.asset_type||"EQUITY"}));
  const cashMap=new Map<string,any>(),clean:any[]=[];for(const x of normalized){if(x.asset_type==="CASH"){const k=String(x.currency||x.symbol||"USD").toUpperCase(),prev=cashMap.get(k);if(prev)prev.cash_amount=Number(prev.cash_amount||0)+Number(x.cash_amount||0);else cashMap.set(k,{...x,currency:k,symbol:k})}else clean.push(x)}clean.push(...cashMap.values());setRows(clean);
  const syms=clean.filter((x:any)=>x.asset_type!=="CASH").map((x:any)=>x.symbol).slice(0,40);
  if(syms.length){
   const encoded=encodeURIComponent(syms.join(","));
   const[technical,investment]=await Promise.all([
    fetch(`/api/scan?symbols=${encoded}&limit=40`,{cache:"no-store"}).then(r=>r.json()).catch(()=>({items:[]})),
    fetch(`/api/investment?symbols=${encoded}`,{cache:"no-store"}).then(r=>r.json()).catch(()=>({items:[]}))
   ]);
   const m:any={};for(const x of technical.items||[])m[x.symbol]={...x};for(const x of investment.items||[])m[x.symbol]={...(m[x.symbol]||{}),...x};
   setQuotes(m);
   const holdings=clean.filter((x:any)=>x.asset_type!=="CASH").map((x:any)=>({symbol:x.symbol,marketValue:Number(x.shares||0)*Number(m[x.symbol]?.price||x.avg_cost||0),sector:m[x.symbol]?.sector||null,archetype:m[x.symbol]?.archetype||null}));
   const pr=await fetch("/api/portfolio/risk",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:user.id,holdings})}).then(r=>r.json()).catch(()=>null);setPortfolioRisk(pr?.risk||null);
  }else{setQuotes({});setPortfolioRisk(null);}
 },[refreshPulseHistory]);
 useEffect(()=>{load()},[load]);

 async function add(e:React.FormEvent){
  e.preventDefault();const s=supabaseBrowser();const{data:{user}}=await s.auth.getUser();if(!user)return;
  const raw=symbol.trim().toUpperCase();
  const normalized=assetType==="CASH"?(raw||"USD"):assetType==="CRYPTO"?(raw.includes("/")?raw:`${raw}/USD`):raw;
  const qty=Number(shares),avg=assetType==="CASH"?1:Number(cost);
  if(!normalized||!Number.isFinite(qty)||qty<=0||!Number.isFinite(avg)||avg<0){setMsg("Enter a valid symbol/amount.");return}
  const payload={user_id:user.id,symbol:normalized,shares:qty,avg_cost:avg,horizon,asset_type:assetType,currency:assetType==="CASH"?normalized.split("/")[0]:"USD",updated_at:new Date().toISOString()};
  const{error}=await s.from("portfolio_positions").upsert(payload,{onConflict:"user_id,symbol"});
  if(error){setMsg(error.message);return}
  setSymbol("");setShares("");setCost("");setMsg(`${assetType==="CASH"?"Cash":normalized} saved`);load();
 }
 async function remove(x:any){if(!confirm(`Delete ${x.symbol} from your portfolio?`))return;const s=supabaseBrowser();const{error}=await s.from("portfolio_positions").delete().eq("id",x.id);if(error){setMsg(error.message);return}setRows(v=>v.filter(r=>r.id!==x.id));setMsg(`${x.symbol} removed`)}
 async function saveEdit(){if(!edit)return;const s=supabaseBrowser();const{error}=await s.from("portfolio_positions").update({shares:+edit.shares,avg_cost:edit.asset_type==="CASH"?1:+edit.avg_cost,horizon:edit.horizon,updated_at:new Date().toISOString()}).eq("id",edit.id);if(error){setMsg(error.message);return}setEdit(null);setMsg("Position updated");load()}

 const priced=useMemo(()=>rows.map((x:any)=>{
  if(x.asset_type==="CASH")return{assetType:"CASH" as const,currency:x.currency||x.symbol,amount:Number(x.shares||0)};
  const q=quotes[x.symbol],price=Number(q?.price||x.avg_cost||0);
  return{assetType:x.asset_type==="CRYPTO"?"CRYPTO" as const:"EQUITY" as const,symbol:x.symbol,quantity:Number(x.shares||0),price,avgCost:Number(x.avg_cost||0),thesisScore:q?.thesisScore??null,companyScore:q?.companyScore??null,opportunityScore:q?.opportunityScore??null,action:q?.action||"",sector:q?.sector||null,archetype:q?.archetype||null};
 }),[rows,quotes]);
 const intel=useMemo(()=>calculatePortfolioIntelligence(priced),[priced]);
 const pulse=useMemo(()=>calculatePortfolioPulse(priced,pulseHistory),[priced,pulseHistory]);
 useEffect(()=>{if(!rows.length||!pulse.totalValue)return;let cancelled=false;(async()=>{const sb=supabaseBrowser(),{data:{user}}=await sb.auth.getUser();if(!user||cancelled)return;const holdings=priced.map((x:any)=>x.assetType==="CASH"?{assetType:"CASH",symbol:x.currency,value:Number(x.amount||0)}:{assetType:x.assetType,symbol:x.symbol,value:Number(x.quantity||0)*Number(x.price||0)});await fetch("/api/portfolio/pulse",{method:"POST",headers:{"Content-Type":"application/json","x-nivora-user-id":user.id},body:JSON.stringify({totalValue:pulse.totalValue,holdings})}).then(r=>r.ok?refreshPulseHistory(user.id):null).catch(()=>null)})();return()=>{cancelled=true}},[rows.length,pulse.totalValue,priced]);
 const investedRows=rows.filter((x:any)=>x.asset_type!=="CASH");
 const attention=investedRows.filter((x:any)=>/EXIT|AVOID|SELL|TRIM|WAIT/i.test(String(quotes[x.symbol]?.action||""))).length;
 const ranked=investedRows.map((x:any)=>({symbol:x.symbol,type:x.asset_type,q:quotes[x.symbol]||{}}));
 const strongest=[...ranked].filter(x=>Number.isFinite(Number(x.q.thesisScore))).sort((a,b)=>Number(b.q.thesisScore)-Number(a.q.thesisScore))[0]||null;
 const opportunity=[...ranked].filter(x=>Number.isFinite(Number(x.q.opportunityScore))).sort((a,b)=>Number(b.q.opportunityScore)-Number(a.q.opportunityScore))[0]||null;
 const weakest=[...ranked].filter(x=>Number.isFinite(Number(x.q.thesisScore))).sort((a,b)=>Number(a.q.thesisScore)-Number(b.q.thesisScore))[0]||null;
 const hasPriorityEvidence=Boolean(strongest||opportunity||weakest);

 return <section className="portfolioPage v65Portfolio v653Portfolio">
  <div className="v65PortfolioHead"><div><div className="eyebrow">PORTFOLIO</div><h1>Your money, prioritized.</h1><p>See what deserves new capital, what can wait, and what needs attention—without reading a dashboard first.</p></div></div>

  <PortfolioPulse pulse={pulse} risk={portfolioRisk}/> 
  <HoldingsIntelligence assets={priced} actions={pulse.actions}/>

  <div className="v653PortfolioHero v658PortfolioSnapshot">
   <article><small>TOTAL VALUE <MetricInfo title="Total portfolio value">Estimated current value of tracked stocks, crypto and cash.</MetricInfo></small><b>${intel.totalValue.toLocaleString(undefined,{maximumFractionDigits:0})}</b><span>{rows.length.toLocaleString()} tracked asset{rows.length===1?"":"s"}</span></article>
   <article><small>DEPLOYABLE CASH <MetricInfo title="Deployable cash">Cash you explicitly track as available liquidity. It is not given a stock score.</MetricInfo></small><b>${intel.cashValue.toLocaleString(undefined,{maximumFractionDigits:0})}</b><span>{intel.cashPct}% of portfolio</span></article>
   <article className={attention?"attention":"good"}><small>NEEDS ATTENTION <MetricInfo title="Needs attention" description="Holdings whose current NIVORA action asks you to wait, trim, exit or avoid adding. It is a review queue, not an automatic sell signal."/></small><b>{attention.toLocaleString()}</b><span>{attention?"Holdings with WAIT / TRIM / EXIT / AVOID-style flags":"No urgent holding flags"}</span></article>
   <article><small>CONCENTRATION <MetricInfo title="Concentration">Your largest invested position as a share of invested capital.</MetricInfo></small><b>{rows.length?`${intel.largestPositionPct}%`:"—"}</b><span>{intel.effectivePositions} effective positions</span></article>
  </div>

  <div className="v653PortfolioActionHead v655PortfolioPriorities"><div><Sparkles size={18}/><div><small>WHAT DESERVES ATTENTION</small><h2>Portfolio priorities</h2></div></div><span>Company decisions stay independent; portfolio risk changes sizing, not the thesis.</span></div>
  {hasPriorityEvidence?<div className="v653PortfolioActions v658PortfolioPriorityGrid">
   {strongest?<article className="good"><small>STRONGEST HOLDING</small><b>{strongest.symbol}</b><span>{Number(strongest.q.thesisScore).toFixed(0)}/100 thesis · {String(strongest.q.action||"Review").replaceAll("_"," ")}</span><Link href={`/stock/${encodeURIComponent(strongest.symbol)}`}>See why →</Link></article>:null}
   {opportunity?<article className="mid"><small>BEST PLACE FOR NEW MONEY</small><b>{opportunity.symbol}</b><span>{Number(opportunity.q.opportunityScore).toFixed(0)}/100 opportunity · {String(opportunity.q.action||"Review").replaceAll("_"," ")}</span><Link href={`/stock/${encodeURIComponent(opportunity.symbol)}`}>See setup →</Link></article>:null}
   {weakest?<article className="bad"><small>REVIEW FIRST</small><b>{weakest.symbol}</b><span>{Number(weakest.q.thesisScore).toFixed(0)}/100 thesis · {String(weakest.q.action||"Review").replaceAll("_"," ")}</span><Link href={`/stock/${encodeURIComponent(weakest.symbol)}`}>Review →</Link></article>:null}
  </div>:ranked.length?<div className="v654PortfolioPending"><b>Portfolio evidence is still filling in…</b><span>Prices are available, but deeper thesis/opportunity evidence has not arrived for enough holdings to rank them responsibly yet. NIVORA will show priorities as that evidence becomes available.</span></div>:null}

  <button type="button" className="v654AddInvestment" onClick={()=>setShowAdd(v=>!v)}>{showAdd?"Close add form":"+ Add investment"}</button>
  {showAdd?<div className="v65AddAsset v654AddPanel">
   <div className="v65AssetTabs"><button className={assetType==="EQUITY"?"on":""} onClick={()=>setAssetType("EQUITY")}><WalletCards size={16}/> Stock</button><button className={assetType==="CRYPTO"?"on":""} onClick={()=>setAssetType("CRYPTO")}><Bitcoin size={16}/> Crypto</button><button className={assetType==="CASH"?"on":""} onClick={()=>setAssetType("CASH")}><Banknote size={16}/> Cash</button></div>
   <form className="v65AssetForm" onSubmit={add}><input placeholder={assetType==="CASH"?"Currency (USD)":assetType==="CRYPTO"?"BTC, ETH, SOL…":"Ticker"} value={symbol} onChange={e=>setSymbol(e.target.value)} required={assetType!=="CASH"}/><input placeholder={assetType==="CASH"?"Cash amount":"Quantity"} type="number" step="any" value={shares} onChange={e=>setShares(e.target.value)} required/>{assetType!=="CASH"?<input placeholder="Average cost" type="number" step="0.01" value={cost} onChange={e=>setCost(e.target.value)} required/>:null}{assetType!=="CASH"?<select value={horizon} onChange={e=>setHorizon(e.target.value)}><option value="short">Short term</option><option value="swing">Swing</option><option value="long">Long term</option></select>:null}<button>Add {assetType==="EQUITY"?"stock":assetType==="CRYPTO"?"crypto":"cash"}</button></form>
  </div>:null}{msg&&<div className="portfolioMsg">{msg}</div>}

  <div className="v653HoldingsHead"><div><small>YOUR HOLDINGS</small><h2>{investedRows.length.toLocaleString()} investments</h2></div><span>Sorted as tracked · open any name for the full decision.</span></div>
  <div className="v65PositionList">{rows.length?rows.map((x:any)=>{
   const isCash=x.asset_type==="CASH",q=quotes[x.symbol],price=isCash?1:Number(q?.price||x.avg_cost||0),mv=Number(x.shares||0)*price,ret=isCash?0:(x.avg_cost?((price/x.avg_cost)-1)*100:null),isEdit=edit?.id===x.id,action=isCash?"LIQUIDITY":String(q?.action||"REVIEW");
   return <article className="v65Position v653Position" key={x.id}>{isEdit?<div className="positionEdit"><b>{x.symbol}</b><input type="number" step="any" value={edit.shares} onChange={e=>setEdit({...edit,shares:e.target.value})}/>{!isCash?<input type="number" step="0.01" value={edit.avg_cost} onChange={e=>setEdit({...edit,avg_cost:e.target.value})}/>:null}<button onClick={saveEdit}><Check size={16}/></button><button onClick={()=>setEdit(null)}><X size={16}/></button></div>:<><div className="v65PosMain">{isCash?<Banknote size={18}/>:x.asset_type==="CRYPTO"?<Bitcoin size={18}/>:<WalletCards size={18}/>}<div><b>{x.symbol}</b><span>{x.asset_type} · {isCash?`$${Number(x.shares).toLocaleString()}`:`${Number(x.shares).toLocaleString(undefined,{maximumFractionDigits:4})} units · avg $${Number(x.avg_cost).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}</span></div></div><div className="v65PosMetrics"><span><small>VALUE</small><b>${mv.toLocaleString(undefined,{maximumFractionDigits:0})}</b></span><span><small>{isCash?"ROLE":"CURRENT"}</small><b>{isCash?"CASH":`$${price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}</b></span><span><small>{isCash?"ALLOCATION":"RETURN"}</small><b className={!isCash&&ret!=null&&ret<0?"bad":"good"}>{isCash?`${intel.totalValue?(mv/intel.totalValue*100).toFixed(1):0}%`:ret!=null?`${ret>=0?"+":""}${ret.toFixed(1)}%`:"—"}</b></span><span className="v658HoldingDecision"><small>NIVORA</small><b className={/BUY|ADD|HOLD/.test(action)?"good":/AVOID|EXIT|TRIM|SELL/.test(action)?"bad":"mid"}>{action.replaceAll("_"," ")}</b>{!isCash&&<em><i>THESIS {Number.isFinite(Number(q?.thesisScore))?Math.round(Number(q.thesisScore)):"—"}</i><i>OPPORTUNITY {Number.isFinite(Number(q?.opportunityScore))?Math.round(Number(q.opportunityScore)):"—"}</i></em>}</span></div>{!isCash?<Link href={`/stock/${encodeURIComponent(x.symbol)}`}>Decision →</Link>:null}<div className="rowActions"><button onClick={()=>setEdit({...x})} title="Edit"><Pencil size={16}/></button><button className="danger" onClick={()=>remove(x)} title="Delete"><Trash2 size={16}/></button></div></>}</article>
  }):<div className="emptyToday"><Search size={22}/><b>No assets yet</b><span>Add stocks, crypto or cash.</span></div>}</div>

  <details className="v653PortfolioDetails"><summary>View allocation &amp; risk ↓</summary><div className="v653PortfolioDetailsBody"><div className="v65Allocation"><div><small>ALLOCATION</small><h2>Where the money is</h2></div>{(["EQUITY","CRYPTO","CASH"] as const).map(k=><article key={k}><span>{k}</span><b>${intel.assetAllocation[k].toLocaleString(undefined,{maximumFractionDigits:0})}</b><em>{intel.totalValue?`${(intel.assetAllocation[k]/intel.totalValue*100).toFixed(1)}%`:"0%"}</em></article>)}</div>{portfolioRisk?<div className="v65RiskOverlay"><ShieldCheck size={18}/><div><small>PORTFOLIO RISK</small><b>{portfolioRisk.riskLabel}</b><span>{portfolioRisk.notes?.[0]||"No major concentration warning."}</span></div><span>Largest {portfolioRisk.largestPositionPct}% · sector/archetype {portfolioRisk.largestSectorPct}%</span></div>:null}</div></details>
  <span hidden>PORTFOLIO HEALTH</span><span hidden>AVAILABLE BUYING POWER</span>
 </section>
}
export default function Page(){return <AuthGuard><AppShell><PortfolioContent/></AppShell></AuthGuard>}
