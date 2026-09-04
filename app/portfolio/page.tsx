"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import MetricInfo from "@/components/v65/MetricInfo";
import {supabaseBrowser} from "@/lib/supabase";
import {calculatePortfolioIntelligence} from "@/lib/v65/portfolio";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {Trash2,Pencil,Check,X,Sparkles,ShieldCheck,Search,WalletCards,Bitcoin,Banknote} from "lucide-react";

type AssetType="EQUITY"|"CRYPTO"|"CASH";

function PortfolioContent(){
 const sp=useSearchParams();
 const[rows,setRows]=useState<any[]>([]),[quotes,setQuotes]=useState<any>({});
 const[assetType,setAssetType]=useState<AssetType>("EQUITY"),[symbol,setSymbol]=useState(sp.get("symbol")||""),[shares,setShares]=useState(""),[cost,setCost]=useState(""),[horizon,setHorizon]=useState("long"),[msg,setMsg]=useState(""),[edit,setEdit]=useState<any>(null),[portfolioRisk,setPortfolioRisk]=useState<any>(null);

 const load=useCallback(async()=>{
  const s=supabaseBrowser();const{data:{user}}=await s.auth.getUser();if(!user)return;
  const{data,error}=await s.from("portfolio_positions").select("*").eq("user_id",user.id).order("updated_at",{ascending:false});
  if(error){setMsg(error.message.includes("asset_type")?"Run supabase/20260904_v65_portfolio_assets.sql once to enable V65 stocks, crypto and cash.":error.message);return}
  const clean=(data||[]).map((x:any)=>({...x,asset_type:x.asset_type||"EQUITY"}));setRows(clean);
  const syms=clean.filter((x:any)=>x.asset_type!=="CASH").map((x:any)=>x.symbol).slice(0,40);
  if(syms.length){
   const encoded=encodeURIComponent(syms.join(","));
   const[technical,investment]=await Promise.all([
    fetch(`/api/scan?symbols=${encoded}&limit=40`,{cache:"no-store"}).then(r=>r.json()).catch(()=>({items:[]})),
    fetch(`/api/investment?symbols=${encoded}`,{cache:"no-store"}).then(r=>r.json()).catch(()=>({items:[]}))
   ]);
   const m:any={};for(const x of technical.items||[])m[x.symbol]={...x};for(const x of investment.items||[])m[x.symbol]={...(m[x.symbol]||{}),...x};
   setQuotes(m);
  }else setQuotes({});
  const pr=await fetch("/api/portfolio/risk",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:user.id})}).then(r=>r.json()).catch(()=>null);setPortfolioRisk(pr?.risk||null);
 },[]);
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
  return{assetType:x.asset_type==="CRYPTO"?"CRYPTO" as const:"EQUITY" as const,symbol:x.symbol,quantity:Number(x.shares||0),price,companyScore:q?.companyScore??null,action:q?.action||"",sector:q?.sector||null};
 }),[rows,quotes]);
 const intel=useMemo(()=>calculatePortfolioIntelligence(priced),[priced]);
 const investedRows=rows.filter((x:any)=>x.asset_type!=="CASH");
 const attention=investedRows.filter((x:any)=>/EXIT|AVOID|SELL|TRIM|WAIT/i.test(String(quotes[x.symbol]?.action||""))).length;
 const ranked=investedRows.map((x:any)=>({symbol:x.symbol,type:x.asset_type,q:quotes[x.symbol]||{}}));
 const strongest=[...ranked].filter(x=>Number.isFinite(Number(x.q.thesisScore))).sort((a,b)=>Number(b.q.thesisScore)-Number(a.q.thesisScore))[0]||null;
 const opportunity=[...ranked].filter(x=>Number.isFinite(Number(x.q.opportunityScore))).sort((a,b)=>Number(b.q.opportunityScore)-Number(a.q.opportunityScore))[0]||null;
 const weakest=[...ranked].filter(x=>Number.isFinite(Number(x.q.thesisScore))).sort((a,b)=>Number(a.q.thesisScore)-Number(b.q.thesisScore))[0]||null;

 return <section className="portfolioPage v65Portfolio">
  <div className="v65PortfolioHead"><div><div className="eyebrow">PORTFOLIO INTELLIGENCE</div><h1>One view of everything you own.</h1><p>Stocks, crypto and deployable cash—measured separately, then combined into one portfolio risk and opportunity view.</p></div><Link href="/methodology">How NIVORA decides →</Link></div>

  <div className="v65PortfolioHero">
   <article><small>PORTFOLIO VALUE <MetricInfo title="Portfolio value">Current estimated value of tracked equities, crypto and cash. Missing live quotes fall back to average cost and are not treated as verified market value.</MetricInfo></small><b>${intel.totalValue.toLocaleString(undefined,{maximumFractionDigits:0})}</b><span>${intel.investedValue.toLocaleString(undefined,{maximumFractionDigits:0})} invested</span></article>
   <article><small>DEPLOYABLE CASH <MetricInfo title="Deployable cash">Cash is tracked as liquidity. It counts toward total portfolio value and allocation but receives no stock thesis score.</MetricInfo></small><b>${intel.cashValue.toLocaleString(undefined,{maximumFractionDigits:0})}</b><span>{intel.cashPct}% of portfolio</span></article>
   <article><small>PORTFOLIO HEALTH <MetricInfo title="Portfolio health">A weighted view of concentration, diversification, cash/liquidity, scorable equity thesis quality and how many holdings currently need attention. There is no artificial minimum score.</MetricInfo></small><b>{rows.length?intel.health.score:"—"}{rows.length?<em>/100</em>:null}</b><span>{rows.length?intel.health.label:"Add assets to start"}</span></article>
   <article><small>CONCENTRATION <MetricInfo title="Concentration">Largest invested position as a percentage of invested capital, excluding cash.</MetricInfo></small><b>{rows.length?`${intel.largestPositionPct}%`:"—"}</b><span>{intel.effectivePositions} effective positions</span></article>
  </div>

  <div className="v65Allocation">
   <div><small>ALLOCATION</small><h2>Where the money is</h2></div>
   {(["EQUITY","CRYPTO","CASH"] as const).map(k=><article key={k}><span>{k}</span><b>${intel.assetAllocation[k].toLocaleString(undefined,{maximumFractionDigits:0})}</b><em>{intel.totalValue?`${(intel.assetAllocation[k]/intel.totalValue*100).toFixed(1)}%`:"0%"}</em></article>)}
  </div>

  <div className="v65HealthBreakdown">{intel.health.components.map(c=><article key={c.key}><small>{c.label}</small><b>{c.score}/100</b><span>{c.reason}</span></article>)}</div>
  {portfolioRisk&&<div className="v65RiskOverlay"><ShieldCheck size={18}/><div><small>INVESTED-ASSET RISK OVERLAY</small><b>{portfolioRisk.riskLabel}</b><span>{portfolioRisk.notes?.[0]||"No major concentration warning."}</span></div><span>Largest {portfolioRisk.largestPositionPct}% · Sector/archetype {portfolioRisk.largestSectorPct}%</span></div>}

  <div className="v65AddAsset">
   <div className="v65AssetTabs">
    <button className={assetType==="EQUITY"?"on":""} onClick={()=>setAssetType("EQUITY")}><WalletCards size={16}/> Stock</button>
    <button className={assetType==="CRYPTO"?"on":""} onClick={()=>setAssetType("CRYPTO")}><Bitcoin size={16}/> Crypto</button>
    <button className={assetType==="CASH"?"on":""} onClick={()=>setAssetType("CASH")}><Banknote size={16}/> Cash</button>
   </div>
   <form className="v65AssetForm" onSubmit={add}>
    <input placeholder={assetType==="CASH"?"Currency (USD)":assetType==="CRYPTO"?"BTC, ETH, SOL…":"Ticker"} value={symbol} onChange={e=>setSymbol(e.target.value)} required={assetType!=="CASH"}/>
    <input placeholder={assetType==="CASH"?"Cash amount":"Quantity"} type="number" step="any" value={shares} onChange={e=>setShares(e.target.value)} required/>
    {assetType!=="CASH"?<input placeholder="Average cost" type="number" step="0.01" value={cost} onChange={e=>setCost(e.target.value)} required/>:null}
    {assetType!=="CASH"?<select value={horizon} onChange={e=>setHorizon(e.target.value)}><option value="short">Short term</option><option value="swing">Swing</option><option value="long">Long term</option></select>:null}
    <button>Add {assetType==="EQUITY"?"stock":assetType==="CRYPTO"?"crypto":"cash"}</button>
   </form>
  </div>{msg&&<div className="portfolioMsg">{msg}</div>}

  <div className="v65PortfolioSectionHead"><div><Sparkles size={18}/><div><small>ACTION CENTER</small><h2>{attention?`${attention} holding${attention===1?"":"s"} need attention`:"No urgent holding flags"}</h2></div></div><span>Cash is liquidity, not an investment signal.</span></div>
  <div className="v65PortfolioInsights">
   <article><small>STRONGEST THESIS</small><b>{strongest?.symbol||"—"}</b><span>{strongest?`${strongest.q.thesisScore}/100 · ${strongest.q.action||"Review"}`:"Analyze holdings to populate thesis evidence."}</span></article>
   <article><small>BEST CURRENT OPPORTUNITY</small><b>{opportunity?.symbol||"—"}</b><span>{opportunity?`${opportunity.q.opportunityScore}/100 · ${opportunity.q.action||"Review"}`:"Waiting for canonical opportunity scores."}</span></article>
   <article><small>WEAKEST THESIS</small><b>{weakest?.symbol||"—"}</b><span>{weakest?`${weakest.q.thesisScore}/100 · ${weakest.q.action||"Review"}`:"No scorable equity thesis yet."}</span></article>
   <article><small>AVAILABLE BUYING POWER</small><b>${intel.cashValue.toLocaleString(undefined,{maximumFractionDigits:0})}</b><span>{intel.cashPct}% cash before any broker/margin assumptions.</span></article>
  </div>

  <div className="v65PositionList">{rows.length?rows.map((x:any)=>{
   const isCash=x.asset_type==="CASH",q=quotes[x.symbol],price=isCash?1:Number(q?.price||x.avg_cost||0),mv=Number(x.shares||0)*price,ret=isCash?0:(x.avg_cost?((price/x.avg_cost)-1)*100:null),isEdit=edit?.id===x.id,action=isCash?"DEPLOYABLE":String(q?.action||"REVIEW");
   return <article className="v65Position" key={x.id}>
    {isEdit?<div className="positionEdit"><b>{x.symbol}</b><input type="number" step="any" value={edit.shares} onChange={e=>setEdit({...edit,shares:e.target.value})}/>{!isCash?<input type="number" step="0.01" value={edit.avg_cost} onChange={e=>setEdit({...edit,avg_cost:e.target.value})}/>:null}<button onClick={saveEdit}><Check size={16}/></button><button onClick={()=>setEdit(null)}><X size={16}/></button></div>:
    <><div className="v65PosMain">{isCash?<Banknote size={18}/>:x.asset_type==="CRYPTO"?<Bitcoin size={18}/>:<WalletCards size={18}/>}<div><b>{x.symbol}</b><span>{x.asset_type} · {isCash?`$${Number(x.shares).toLocaleString()}`:`${x.shares} units · avg $${Number(x.avg_cost).toLocaleString()}`}</span></div></div>
    <div className="v65PosMetrics"><span><small>VALUE</small><b>${mv.toLocaleString(undefined,{maximumFractionDigits:0})}</b></span><span><small>{isCash?"ROLE":"CURRENT"}</small><b>{isCash?"LIQUIDITY":`$${price.toLocaleString()}`}</b></span><span><small>{isCash?"ALLOCATION":"RETURN"}</small><b className={!isCash&&ret!=null&&ret<0?"bad":"good"}>{isCash?`${intel.totalValue?(mv/intel.totalValue*100).toFixed(1):0}%`:ret!=null?`${ret>=0?"+":""}${ret.toFixed(1)}%`:"—"}</b></span><span><small>NIVORA</small><b>{action}</b></span></div>
    {!isCash?<Link href={`/stock/${encodeURIComponent(x.symbol)}`}>Open analysis →</Link>:null}
    <div className="rowActions"><button onClick={()=>setEdit({...x})} title="Edit"><Pencil size={16}/></button><button className="danger" onClick={()=>remove(x)} title="Delete"><Trash2 size={16}/></button></div></>}
   </article>
  }):<div className="emptyToday"><Search size={22}/><b>No assets yet</b><span>Add stocks, crypto or cash above.</span></div>}</div>
 </section>
}
export default function Page(){return <AuthGuard><AppShell><PortfolioContent/></AppShell></AuthGuard>}
