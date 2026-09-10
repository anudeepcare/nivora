"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import {supabaseBrowser} from "@/lib/supabase";
import {calculatePortfolioPulse} from "@/lib/v65/portfolio";
import PortfolioPulse from "@/components/portfolio/PortfolioPulse";
import HoldingsIntelligence from "@/components/portfolio/HoldingsIntelligence";
import {useSearchParams} from "next/navigation";
import {WalletCards,Bitcoin,Banknote} from "lucide-react";
import {buildPortfolioCioActions} from "@/lib/auryn/v6/portfolio-adapter";

type AssetType="EQUITY"|"CRYPTO"|"CASH";

function portfolioOwnerAction(q:any){
 const raw=String(q?.canonicalOwnerAction||"").toUpperCase();
 if(/EXIT|SELL/.test(raw))return "REDUCE / REASSESS";
 if(/REDUCE/.test(raw))return "REDUCE / REASSESS";
 if(/ADD|BUY/.test(raw))return "HOLD / ADD";
 if(/HOLD/.test(raw))return "HOLD";
 return "REVIEW";
}

function PortfolioContent(){
 const sp=useSearchParams();
 const[rows,setRows]=useState<any[]>([]),[quotes,setQuotes]=useState<any>({});
 const[pulseHistory,setPulseHistory]=useState<any[]>([]),[assetType,setAssetType]=useState<AssetType>("EQUITY"),[symbol,setSymbol]=useState(sp.get("symbol")||""),[shares,setShares]=useState(""),[cost,setCost]=useState(""),[horizon,setHorizon]=useState("long"),[msg,setMsg]=useState(""),[edit,setEdit]=useState<any>(null),[portfolioRisk,setPortfolioRisk]=useState<any>(null),[showAdd,setShowAdd]=useState(false),[pendingDelete,setPendingDelete]=useState<any>(null);

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
   const[technical,investment,canonical]=await Promise.all([
    fetch(`/api/scan?symbols=${encoded}&limit=40`,{cache:"no-store"}).then(r=>r.json()).catch(()=>({items:[]})),
    fetch(`/api/investment?symbols=${encoded}`,{cache:"no-store"}).then(r=>r.json()).catch(()=>({items:[]})),
    fetch(`/api/decision/summaries?symbols=${encoded}`,{cache:"no-store"}).then(r=>r.json()).catch(()=>({items:[]}))
   ]);
   const m:any={};for(const x of technical.items||[])m[x.symbol]={...x};for(const x of investment.items||[])m[x.symbol]={...(m[x.symbol]||{}),...x};for(const x of canonical.items||[])m[x.symbol]={...(m[x.symbol]||{}),...x};
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
 function requestRemove(x:any){setEdit(null);setPendingDelete(x)}
 async function confirmRemove(){if(!pendingDelete)return;const x=pendingDelete;const s=supabaseBrowser();const{error}=await s.from("portfolio_positions").delete().eq("id",x.id);if(error){setMsg(error.message);return}setRows(v=>v.filter(r=>r.id!==x.id));setPendingDelete(null);setMsg(`${x.symbol} removed`)}
 async function saveEdit(){if(!edit)return;const s=supabaseBrowser();const{error}=await s.from("portfolio_positions").update({shares:+edit.shares,avg_cost:edit.asset_type==="CASH"?1:+edit.avg_cost,horizon:edit.horizon,updated_at:new Date().toISOString()}).eq("id",edit.id);if(error){setMsg(error.message);return}setEdit(null);setMsg("Position updated");load()}

 const priced=useMemo(()=>rows.map((x:any)=>{
  if(x.asset_type==="CASH")return{assetType:"CASH" as const,currency:x.currency||x.symbol,symbol:x.symbol,amount:Number(x.shares||0),source:x};
  const q=quotes[x.symbol],price=Number(q?.displayPrice??q?.price??x.avg_cost??0);
  return{assetType:x.asset_type==="CRYPTO"?"CRYPTO" as const:"EQUITY" as const,symbol:x.symbol,quantity:Number(x.shares||0),price,avgCost:Number(x.avg_cost||0),thesisScore:q?.thesisScore??null,companyScore:q?.companyScore??null,opportunityScore:q?.opportunityScore??null,action:portfolioOwnerAction(q),sector:q?.sector||null,archetype:q?.archetype||null,marketIntelligence:q?.marketIntelligence??null,levels:q?.levels??null,source:x};
 }),[rows,quotes]);
 const pulse=useMemo(()=>calculatePortfolioPulse(priced,pulseHistory),[priced,pulseHistory]);
 const v6PortfolioActions=useMemo(()=>portfolioRisk?buildPortfolioCioActions({positions:priced.map((x:any)=>x.assetType==="CASH"?{symbol:x.currency||x.symbol,value:Number(x.amount||0),assetType:"CASH",archetype:null,rawAction:"HOLD"}:{symbol:x.symbol,value:Number(x.quantity||0)*Number(x.price||0),assetType:x.assetType,archetype:x.archetype||null,rawAction:x.action||"HOLD"}),portfolioRisk}):pulse.actions,[priced,portfolioRisk,pulse.actions]);
 const portfolioPulse=useMemo(()=>({...pulse,actions:v6PortfolioActions}),[pulse,v6PortfolioActions]);
 useEffect(()=>{if(!rows.length||!pulse.totalValue)return;let cancelled=false;(async()=>{const sb=supabaseBrowser(),{data:{user}}=await sb.auth.getUser();if(!user||cancelled)return;const holdings=priced.map((x:any)=>x.assetType==="CASH"?{assetType:"CASH",symbol:x.currency,value:Number(x.amount||0)}:{assetType:x.assetType,symbol:x.symbol,value:Number(x.quantity||0)*Number(x.price||0),marketIntelligence:x.marketIntelligence??null});await fetch("/api/portfolio/pulse",{method:"POST",headers:{"Content-Type":"application/json","x-nivora-user-id":user.id},body:JSON.stringify({totalValue:pulse.totalValue,holdings})}).then(r=>r.ok?refreshPulseHistory(user.id):null).catch(()=>null)})();return()=>{cancelled=true}},[rows.length,pulse.totalValue,priced]);
 const investedRows=rows.filter((x:any)=>x.asset_type!=="CASH");
 const attention=investedRows.filter((x:any)=>/REDUCE|REASSESS|WATCH/i.test(portfolioOwnerAction(quotes[x.symbol]))).length;
 const ranked=investedRows.map((x:any)=>({symbol:x.symbol,type:x.asset_type,q:quotes[x.symbol]||{}}));
 const strongest=[...ranked].filter(x=>Number.isFinite(Number(x.q.thesisScore))).sort((a,b)=>Number(b.q.thesisScore)-Number(a.q.thesisScore))[0]||null;
 const opportunity=[...ranked].filter(x=>Number.isFinite(Number(x.q.opportunityScore))).sort((a,b)=>Number(b.q.opportunityScore)-Number(a.q.opportunityScore))[0]||null;
 const weakest=[...ranked].filter(x=>Number.isFinite(Number(x.q.thesisScore))).sort((a,b)=>Number(a.q.thesisScore)-Number(b.q.thesisScore))[0]||null;
 const hasPriorityEvidence=Boolean(strongest||opportunity||weakest);

 return <section className="aurynPortfolioPage">
  <div className="aurynPortfolioIntro"><div><small>OWN</small><h1>Your capital, interpreted.</h1><p>Performance, benchmark context, risk, concentration and the decisions that matter now.</p></div><button type="button" onClick={()=>setShowAdd(v=>!v)}>{showAdd?"Close":"+ Add investment"}</button></div>

  <nav className="aurynPortfolioNav" aria-label="Portfolio sections"><a href="#portfolio-overview">Overview</a><a href="#portfolio-performance">Performance</a><a href="#portfolio-allocation">Allocation</a><a href="#portfolio-risk">Risk</a><a href="#portfolio-decisions">Decisions</a><a href="#portfolio-holdings">Holdings</a></nav>
  {showAdd?<div className="aurynSection aurynAddPanel">
   <div className="aurynAssetTabs"><button className={assetType==="EQUITY"?"on":""} onClick={()=>setAssetType("EQUITY")}><WalletCards size={16}/> Stock</button><button className={assetType==="CRYPTO"?"on":""} onClick={()=>setAssetType("CRYPTO")}><Bitcoin size={16}/> Crypto</button><button className={assetType==="CASH"?"on":""} onClick={()=>setAssetType("CASH")}><Banknote size={16}/> Cash</button></div>
   <form className="aurynAssetForm" onSubmit={add}><input placeholder={assetType==="CASH"?"Currency (USD)":assetType==="CRYPTO"?"BTC, ETH, SOL…":"Ticker"} value={symbol} onChange={e=>setSymbol(e.target.value)} required={assetType!=="CASH"}/><input placeholder={assetType==="CASH"?"Cash amount":"Qty"} type="number" step="any" value={shares} onChange={e=>setShares(e.target.value)} required/>{assetType!=="CASH"?<input placeholder="Average cost" type="number" step="0.01" value={cost} onChange={e=>setCost(e.target.value)} required/>:null}{assetType!=="CASH"?<select value={horizon} onChange={e=>setHorizon(e.target.value)}><option value="short">Short term</option><option value="swing">Swing</option><option value="long">Long term</option></select>:null}<button>Add {assetType==="EQUITY"?"stock":assetType==="CRYPTO"?"crypto":"cash"}</button></form>
  </div>:null}{msg&&<div className="formError">{msg}</div>}

  <div id="portfolio-overview"><PortfolioPulse pulse={portfolioPulse} risk={portfolioRisk}/></div> 

  


  <section className="v934PortfolioIntel" aria-label="Portfolio market intelligence"><div><small>MARKET INTELLIGENCE</small><h2>One market view across every holding.</h2></div><p>{investedRows.length?`${investedRows.filter((x:any)=>quotes[x.symbol]?.marketIntelligence?.timeframes?.["1D"]?.confirmed==="BUY").length} daily constructive · ${investedRows.filter((x:any)=>quotes[x.symbol]?.marketIntelligence?.timeframes?.["1D"]?.confirmed==="SELL").length} daily defensive. Open any holding for the same 15M / 1H / 4H / 1D / 1W evidence and action map.`:"Add a holding to build the canonical multi-timeframe portfolio view."}</p></section>

  <HoldingsIntelligence assets={priced} onEdit={x=>{setPendingDelete(null);setEdit(x)}} onRemove={requestRemove} editingId={edit?.id||null} editDraft={edit} onEditDraft={setEdit} onSaveEdit={saveEdit} onCancelEdit={()=>setEdit(null)} pendingDelete={pendingDelete?.id||null} onConfirmRemove={confirmRemove} onCancelRemove={()=>setPendingDelete(null)}/>

  <span hidden>PORTFOLIO HEALTH</span><span hidden>AVAILABLE BUYING POWER</span>
 </section>
}
export default function Page(){return <AuthGuard><AppShell><PortfolioContent/></AppShell></AuthGuard>}
