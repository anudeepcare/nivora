"use client";
import {useRouter} from "next/navigation";
import {Bitcoin,Banknote,WalletCards,Pencil,Trash2,Check,X,MoreHorizontal,ExternalLink} from "lucide-react";
const tf=(mi:any,key:string)=>mi?.timeframes?.[key]?.confirmed??"—";
const levelNum=(mi:any,key:string)=>{const x=Number(mi?.levels?.[key]??mi?.actionMap?.[key]);return Number.isFinite(x)&&x>0?x:null};
const finiteNum=(v:any)=>v==null||v===""?null:Number.isFinite(Number(v))?Number(v):null;
const usd=(v:any,d=2)=>{const x=finiteNum(v);return x!=null?`$${x.toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d})}`:"—"};

export default function HoldingsIntelligence({assets,onEdit,onRemove,editingId,editDraft,onEditDraft,onSaveEdit,onCancelEdit,pendingDelete,onConfirmRemove,onCancelRemove}:{assets:any[];onEdit?:(x:any)=>void;onRemove?:(x:any)=>void;editingId?:string|number|null;editDraft?:any;onEditDraft?:(x:any)=>void;onSaveEdit?:()=>void;onCancelEdit?:()=>void;pendingDelete?:string|number|null;onConfirmRemove?:()=>void;onCancelRemove?:()=>void}){
 const router=useRouter();
 const rows=(assets||[]).map(x=>{const cash=x.assetType==="CASH",amount=finiteNum(x.amount),qty=finiteNum(x.quantity),price=finiteNum(x.price),value=cash?(amount??0):qty!=null&&price!=null?qty*price:finiteNum(x.value)??0;return{...x,value}}).sort((a,b)=>b.value-a.value);
 const total=rows.reduce((n,x)=>n+x.value,0);
 const open=(cash:boolean,name:string)=>{if(!cash)router.push(`/stock/${encodeURIComponent(name)}`)};
 return <section id="portfolio-holdings" className="aurynHoldingsSection"><div className="aurynHoldingsHead"><div><div className="aurynEyebrow">Positions</div><h2>Your holdings</h2></div><span>{rows.length} tracked assets</span></div>
  <div className="aurynPositionList">{rows.map((x:any)=>{const cash=x.assetType==="CASH",crypto=x.assetType==="CRYPTO",qtyLabel=crypto?"Qty":"Qty",name=cash?(x.currency||x.symbol||"USD"):x.symbol,weight=total?x.value/total*100:0,current=finiteNum(x.price),avg=finiteNum(x.avgCost),qty=finiteNum(x.quantity)??0,pnl=!cash&&avg!=null&&avg>0&&current!=null?(current-avg)*qty:null,pnlPct=!cash&&avg!=null&&avg>0&&current!=null?(current/avg-1)*100:null,action=cash?"LIQUIDITY":String(x.action||"REVIEW").replaceAll("_"," "),source=x.source||x,isEditing=editingId!=null&&String(source.id)===String(editingId),isDeleting=pendingDelete!=null&&String(source.id)===String(pendingDelete),confirm=levelNum(x.marketIntelligence,"confirm"),invalidate=levelNum(x.marketIntelligence,"invalidation"),nextTrigger=String(x.nextTrigger||"").trim()||(confirm?`Confirm above ${usd(confirm)}`:invalidate?`Reassess below ${usd(invalidate)}`:"Await new evidence");return <div className={`aurynPositionGroup ${isEditing||isDeleting?"active":""}`} key={`${x.assetType}-${name}`}>
   <article className={`aurynPositionRow ${cash?"":"clickable"}`} role={cash?undefined:"link"} aria-label={cash?undefined:`Open ${name} research`} tabIndex={cash?undefined:0} onClick={()=>open(cash,name)} onKeyDown={e=>{if(!cash&&(e.key==="Enter"||e.key===" ")){e.preventDefault();open(false,name)}}}>
    <div className="aurynPositionName">{cash?<Banknote size={18}/>:crypto?<Bitcoin size={18}/>:<WalletCards size={18}/>}<div><b>{name}</b><span>{cash?"Cash":crypto?"Crypto":"Stock"} · {weight.toFixed(1)}%</span>{!cash&&x.marketIntelligence?<span className="v934HoldingTape" data-market-intelligence-snapshot={x.marketIntelligence.snapshotId||""}><i>4H {tf(x.marketIntelligence,"4H")}</i><i>1D {tf(x.marketIntelligence,"1D")}</i><i>1W {tf(x.marketIntelligence,"1W")}</i></span>:null}</div></div>
    <div className="aurynPositionMobileSummary">
     {!cash?<span><small>CURRENT</small><b>{usd(current)}</b></span>:<span><small>VALUE</small><b>${x.value.toLocaleString(undefined,{maximumFractionDigits:0})}</b></span>}
     {!cash?<span><small>RETURN</small><b className={pnl!=null&&pnl<0?"bad":"good"}>{pnl==null?"—":`${pnl>=0?"+":"-"}$${Math.abs(pnl).toLocaleString(undefined,{maximumFractionDigits:0})}`}</b></span>:<span><small>WEIGHT</small><b>{weight.toFixed(1)}%</b></span>}
     {!cash?<em>{qtyLabel} {qty.toLocaleString(undefined,{maximumFractionDigits:4})} · Avg {usd(avg)}</em>:null}
    </div>
    <div className="aurynPositionFacts">
     {!cash&&<span><small>CURRENT</small><b>{usd(current)}</b></span>}
     {!cash&&<span><small>QTY</small><b>{qty.toLocaleString(undefined,{maximumFractionDigits:4})}</b></span>}
     {!cash&&<span><small>AVG COST</small><b>{usd(avg)}</b></span>}
     <span><small>VALUE</small><b>${x.value.toLocaleString(undefined,{maximumFractionDigits:0})}</b></span>
     <span><small>RETURN</small><b className={pnl!=null&&pnl<0?"bad":"good"}>{cash?"—":pnl==null?"—":`${pnl>=0?"+":"-"}$${Math.abs(pnl).toLocaleString(undefined,{maximumFractionDigits:0})}`}</b></span>
     {!cash&&<span><small>P/L %</small><b className={pnlPct!=null&&pnlPct<0?"bad":"good"}>{pnlPct==null?"—":`${pnlPct>=0?"+":""}${pnlPct.toFixed(1)}%`}</b></span>}
     <span><small>WEIGHT</small><b>{weight.toFixed(1)}%</b></span>
    </div>
    <div className="aurynPositionCall"><small>AURYN</small><b>{action}</b></div>
    {!cash?<div className="aurynPositionTrigger"><small>NEXT TRIGGER</small><b>{nextTrigger}</b></div>:null}
    <div className="aurynPositionActions" onClick={e=>e.stopPropagation()}>{onEdit&&<button type="button" aria-label={`Edit ${name}`} title="Edit position" onClick={()=>onEdit(source)}><Pencil size={14}/></button>}{onRemove&&<button type="button" aria-label={`Delete ${name}`} title="Delete position" onClick={()=>onRemove(source)}><Trash2 size={14}/></button>}<details className="aurynPositionMenu"><summary aria-label={`Actions for ${name}`}><MoreHorizontal size={17}/></summary><div><button type="button" onClick={()=>open(cash,name)}><ExternalLink size={14}/> View research</button>{onEdit?<button type="button" onClick={()=>onEdit(source)}><Pencil size={14}/> Edit position</button>:null}{onRemove?<button type="button" className="danger" onClick={()=>onRemove(source)}><Trash2 size={14}/> Delete position</button>:null}</div></details></div>
   </article>
   {isEditing&&editDraft?<div className="aurynPositionEdit"><div><small>EDIT POSITION</small><b>{name}</b></div><label><span>{cash?"Amount":"Quantity"}</span><input aria-label="Quantity" type="number" step="any" value={editDraft.shares} onChange={e=>onEditDraft?.({...editDraft,shares:e.target.value})}/></label>{!cash?<label><span>Average cost</span><input aria-label="Average cost" type="number" step="0.01" value={editDraft.avg_cost} onChange={e=>onEditDraft?.({...editDraft,avg_cost:e.target.value})}/></label>:<span/>}<div className="aurynPositionInlineActions"><button className="primary" type="button" onClick={onSaveEdit}><Check size={15}/> Save</button><button type="button" onClick={onCancelEdit}><X size={15}/> Cancel</button></div></div>:null}
   {isDeleting?<div className="aurynPositionDeleteConfirm"><div><small>REMOVE POSITION?</small><b>Delete {name} from this portfolio?</b><span>This removes the tracked position; it does not place a broker order.</span></div><div className="aurynPositionInlineActions"><button className="danger" type="button" onClick={onConfirmRemove}><Trash2 size={15}/> Delete</button><button type="button" onClick={onCancelRemove}><X size={15}/> Keep</button></div></div>:null}
  </div>})}</div>
 </section>
}
