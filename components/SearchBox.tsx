"use client";
import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {ArrowRight,Search} from "lucide-react";
type R={symbol:string,name:string,exchange?:string,type?:string};
const local:R[]=[
 {symbol:"MU",name:"Micron Technology",exchange:"NASDAQ",type:"stock"},{symbol:"NVDA",name:"NVIDIA",exchange:"NASDAQ",type:"stock"},{symbol:"AAPL",name:"Apple",exchange:"NASDAQ",type:"stock"},{symbol:"MSFT",name:"Microsoft",exchange:"NASDAQ",type:"stock"},{symbol:"CRM",name:"Salesforce",exchange:"NYSE",type:"stock"},{symbol:"SAP",name:"SAP SE",exchange:"NYSE",type:"stock"},{symbol:"IREN",name:"IREN Limited",exchange:"NASDAQ",type:"stock"},{symbol:"NBIS",name:"Nebius Group",exchange:"NASDAQ",type:"stock"},{symbol:"HIMS",name:"Hims & Hers",exchange:"NYSE",type:"stock"},{symbol:"APP",name:"AppLovin",exchange:"NASDAQ",type:"stock"},{symbol:"BTC/USD",name:"Bitcoin",exchange:"CRYPTO",type:"crypto"},{symbol:"ETH/USD",name:"Ethereum",exchange:"CRYPTO",type:"crypto"},{symbol:"SOL/USD",name:"Solana",exchange:"CRYPTO",type:"crypto"}
];
export default function SearchBox({large=false,compact=false}:{large?:boolean;compact?:boolean}){
 const[q,setQ]=useState(""),[remote,setRemote]=useState<R[]>([]),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),r=useRouter();
 const localMatches=useMemo(()=>{const x=q.trim().toLowerCase();if(!x)return[];return local.filter(i=>i.symbol.toLowerCase().includes(x)||i.name.toLowerCase().includes(x)).slice(0,5)},[q]);
 const items=useMemo(()=>{const seen=new Set<string>();return[...localMatches,...remote].filter(x=>!seen.has(x.symbol)&&seen.add(x.symbol)).slice(0,7)},[localMatches,remote]);
 useEffect(()=>{if(q.trim().length<2){setRemote([]);return}const c=new AbortController();const t=setTimeout(async()=>{try{const x=await fetch(`/api/search?q=${encodeURIComponent(q)}`,{signal:c.signal}).then(z=>z.json());setRemote(x.results||[]);setOpen(true)}catch{}},140);return()=>{clearTimeout(t);c.abort()}},[q]);
 useEffect(()=>{items.slice(0,1).forEach(x=>{r.prefetch(`/stock/${encodeURIComponent(x.symbol)}`);fetch(`/api/quote/${encodeURIComponent(x.symbol)}`,{cache:"force-cache"}).catch(()=>{})})},[items,r]);
 function choose(x:R){setOpen(false);setBusy(true);r.push(`/stock/${encodeURIComponent(x.symbol)}`)}
 function submit(e:React.FormEvent){e.preventDefault();if(busy)return;if(items[0])choose(items[0]);else if(q.trim()){setBusy(true);r.push(`/stock/${encodeURIComponent(q.trim().toUpperCase())}`)}}
 return <div className={`aurynSearch ${large?"large":""} ${compact?"compact":""}`}>
  <form onSubmit={submit}><Search size={18}/><input aria-label="Search investments" value={q} onFocus={()=>setOpen(true)} onChange={e=>{setQ(e.target.value);setOpen(true)}} placeholder="Company, ticker or crypto…"/>{!compact&&<button disabled={busy} aria-label="Analyze">{busy?"…":<><span>Analyze</span><ArrowRight size={16}/></>}</button>}</form>
  {open&&items.length>0&&<div className="aurynSearchResults">{items.map(x=><button type="button" key={`${x.symbol}-${x.exchange}`} onClick={()=>choose(x)}><span><b>{x.name}</b><small>{x.exchange||x.type||""}</small></span><strong>{x.symbol}</strong></button>)}</div>}
 </div>
}