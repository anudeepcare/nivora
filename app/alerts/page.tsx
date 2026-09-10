"use client";
import {useEffect,useState} from "react";
import {Trash2,BellRing} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import {supabaseBrowser} from "@/lib/supabase";

function Content(){
 const[items,setItems]=useState<any[]>([]),[symbol,setSymbol]=useState(""),[price,setPrice]=useState("");
 async function load(){
  const s=supabaseBrowser();const{data:{user}}=await s.auth.getUser();if(!user)return;
  const{data}=await s.from("alerts").select("*").eq("user_id",user.id).order("created_at",{ascending:false});const base=data||[];
  if(!base.length){setItems([]);return}
  const syms=[...new Set(base.map((x:any)=>String(x.symbol||"").toUpperCase()).filter(Boolean))].slice(0,40);
  const q=await fetch(`/api/decision/summaries?symbols=${encodeURIComponent(syms.join(","))}`,{cache:"no-store"}).then(r=>r.json()).catch(()=>({items:[]}));
  const bySymbol=Object.fromEntries((q.items||[]).map((x:any)=>[x.symbol,x]));setItems(base.map((x:any)=>({...x,decision:bySymbol[String(x.symbol||"").toUpperCase()]||null})));
 }
 useEffect(()=>{load()},[]);
 async function add(e:React.FormEvent){e.preventDefault();const s=supabaseBrowser();const{data:{user}}=await s.auth.getUser();if(!user)return;await s.from("alerts").insert({user_id:user.id,symbol:symbol.toUpperCase(),alert_type:"price",target_price:+price});setSymbol("");setPrice("");load()}
 async function removeAlert(id:any,sym:string){if(!confirm(`Delete ${sym} alert?`))return;const s=supabaseBrowser();const{error}=await s.from("alerts").delete().eq("id",id);if(error)return;setItems(v=>v.filter(x=>x.id!==id))}
 return <section className="aurynPage"><header className="aurynPageHead"><div className="aurynEyebrow">MONITOR</div><h1>Know when the evidence changes.</h1><p>Every alert now sits beside the same canonical AURYN decision and 24/7 Market Truth price used by research.</p></header><form className="aurynInlineForm" onSubmit={add}><input aria-label="Ticker" placeholder="Ticker" value={symbol} onChange={e=>setSymbol(e.target.value)} required/><input aria-label="Target price" placeholder="Target price" type="number" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} required/><button>Add alert</button></form><div className="aurynMonitorSummary"><BellRing size={18}/><div><b>{items.length} active price alert{items.length===1?"":"s"}</b><span>Canonical decision context prevents a scanner or stale stored price from becoming a second opinion.</span></div></div><div className="aurynList">{items.length?items.map(x=>{const d=x.decision||{};return <div key={x.id} className="aurynAlertRow"><div><b>{x.symbol}</b><small>{d.canonicalAction?`CANONICAL · ${String(d.canonicalAction).replaceAll("_"," ")}`:"ANALYZE FOR CALL"}{Number.isFinite(Number(d.displayPrice))?` · $${Number(d.displayPrice).toFixed(2)}`:""}</small></div><span>Trigger ${Number(x.target_price).toLocaleString(undefined,{style:"currency",currency:"USD"})}</span><button type="button" className="aurynIconButton" aria-label={`Delete alert for ${x.symbol}`} onClick={()=>removeAlert(x.id,x.symbol)}><Trash2 size={16}/></button></div>}):<div className="emptySmall">No alerts yet.</div>}</div></section>
}
export default function Page(){return <AuthGuard><AppShell><Content/></AppShell></AuthGuard>}
