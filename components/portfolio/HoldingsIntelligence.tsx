"use client";
import Link from "next/link";
import {Bitcoin,Banknote,WalletCards,Pencil,Trash2,ArrowRight} from "lucide-react";
export default function HoldingsIntelligence({assets,onEdit,onRemove}:{assets:any[];onEdit?:(x:any)=>void;onRemove?:(x:any)=>void}){
 const rows=(assets||[]).map(x=>{const cash=x.assetType==="CASH",value=cash?Number(x.amount||0):Number(x.quantity||0)*Number(x.price||0);return{...x,value}}).sort((a,b)=>b.value-a.value);
 const total=rows.reduce((n,x)=>n+x.value,0);
 return <section id="portfolio-holdings" className="aurynSection"><div className="holdingsIntelHead"><div><div className="aurynEyebrow">Positions</div><h2>Your holdings</h2></div><span>{rows.length} tracked assets</span></div>
  <div className="aurynHoldingsList">{rows.map((x:any)=>{const cash=x.assetType==="CASH",crypto=x.assetType==="CRYPTO",name=cash?(x.currency||x.symbol||"USD"):x.symbol,weight=total?x.value/total*100:0,pnl=!cash&&Number(x.avgCost)>0?(Number(x.price)-Number(x.avgCost))*Number(x.quantity):null,action=cash?"LIQUIDITY":String(x.action||"REVIEW").replaceAll("_"," ");return <article className="aurynHoldingRow" key={`${x.assetType}-${name}`}>
   <div className="aurynHoldingName">{cash?<Banknote size={18}/>:crypto?<Bitcoin size={18}/>:<WalletCards size={18}/>}<div><b>{name}</b><span>{cash?"Cash":crypto?"Crypto":"Stock"} · {weight.toFixed(1)}% of portfolio</span></div></div>
   <div className="aurynHoldingMetric"><small>VALUE</small><b>${x.value.toLocaleString(undefined,{maximumFractionDigits:0})}</b></div>
   <div className="aurynHoldingMetric"><small>RETURN</small><b className={pnl!=null&&pnl<0?"bad":"good"}>{cash?"—":pnl==null?"—":`${pnl>=0?"+":""}$${Math.abs(pnl).toLocaleString(undefined,{maximumFractionDigits:0})}`}</b></div>
   <div className="aurynHoldingMetric"><small>AURYN</small><b>{action}</b></div>
   <div className="aurynHoldingActions">{!cash&&<Link href={`/stock/${encodeURIComponent(name)}`} aria-label={`Open ${name} decision`}><ArrowRight size={16}/></Link>}{onEdit&&<button type="button" aria-label={`Edit ${name}`} onClick={()=>onEdit(x.source||x)}><Pencil size={15}/></button>}{onRemove&&<button type="button" aria-label={`Delete ${name}`} onClick={()=>onRemove(x.source||x)}><Trash2 size={15}/></button>}</div>
  </article>})}</div>
 </section>
}