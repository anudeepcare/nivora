"use client";
import {useCallback,useEffect,useState} from "react";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import {supabaseBrowser} from "@/lib/supabase";
import Link from "next/link";
import {Star,Trash2} from "lucide-react";

function decisionTone(x:string){const s=String(x||"").toUpperCase();return /BUY|ADD|ATTRACTIVE/.test(s)?"good":/SELL|EXIT|REDUCE/.test(s)?"bad":"mid"}
function asOfLabel(x:any){if(!x)return"";try{return new Date(x).toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}catch{return""}}

function Content(){
 const[items,setItems]=useState<any[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState<string|null>(null);
 const load=useCallback(async()=>{
  setLoading(true);const s=supabaseBrowser();const{data:{session}}=await s.auth.getSession();const user=session?.user;if(!user){setLoading(false);return}
  const{data}=await s.from("watchlist_items").select("id,symbol,created_at").eq("user_id",user.id).order("created_at",{ascending:false});const base=data||[];
  if(base.length){
   const symbols=base.slice(0,40).map((x:any)=>x.symbol).join(",");
   const q=await fetch(`/api/canonical?symbols=${encodeURIComponent(symbols)}`,{cache:"no-store"}).then(r=>r.json()).catch(()=>({items:[]}));
   const m=Object.fromEntries((q.items||[]).map((x:any)=>{const r=x.research||{},mt=x.market||{};return[x.security?.symbol,{canonicalAction:r.action,canonicalOwnerAction:r.ownerAction,setupState:r.setupState,decisionAsOf:r.observedAt,displayPrice:mt.displayPrice,priceUse:mt.priceUse,canonicalSnapshotId:x.snapshotId,degraded:x.degraded}]}));setItems(base.map((x:any)=>({...x,...m[x.symbol]})));
  }else setItems([]);setLoading(false);
 },[]);
 useEffect(()=>{load()},[load]);
 async function remove(id:string,symbol:string){if(!confirm(`Remove ${symbol} from your watchlist?`))return;setBusy(id);const s=supabaseBrowser();const{error}=await s.from("watchlist_items").delete().eq("id",id);if(!error)setItems(v=>v.filter(x=>x.id!==id));setBusy(null)}
 return <section className="watchPage"><div className="eyebrow">WATCHLIST</div><h1>What needs attention?</h1><p>One canonical AURYN decision and one Market Truth price per name. Scanner signals never masquerade as the investment call.</p><div className="watchListV12">{loading?<div className="softSkeleton">Checking canonical decisions…</div>:items.length?items.map(x=><div className="watchRow" key={x.id}><Link href={`/stock/${encodeURIComponent(x.symbol)}`}><div><Star size={16}/><span><b>{x.symbol}</b><small>{x.canonicalAction?`CANONICAL DECISION · ${x.setupState?String(x.setupState).replaceAll("_"," "):"verified"}`:"ANALYZE FOR CALL"}{x.decisionAsOf?` · ${asOfLabel(x.decisionAsOf)}`:""}</small></span></div><div><strong className={decisionTone(x.canonicalAction)}>{x.canonicalAction?String(x.canonicalAction).replaceAll("_"," "):"ANALYZE"}</strong>{Number.isFinite(Number(x.displayPrice))?<small>${Number(x.displayPrice).toFixed(2)} · {String(x.priceUse||"").replaceAll("_"," ")}</small>:<small>Price verifying</small>}</div></Link><button className="iconDanger" disabled={busy===x.id} onClick={()=>remove(x.id,x.symbol)} aria-label={`Remove ${x.symbol}`} title="Remove from watchlist"><Trash2 size={16}/></button></div>):<div className="emptyToday"><Star size={22}/><b>No stocks yet</b><span>Add a stock from its analysis page and it will appear here.</span><Link href="/analyze">Analyze a stock →</Link></div>}</div></section>
}
export default function Page(){return <AuthGuard><AppShell><Content/></AppShell></AuthGuard>}
