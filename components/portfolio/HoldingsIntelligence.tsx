"use client";
import {useRouter} from "next/navigation";
import {Bitcoin,Banknote,WalletCards,Pencil,Trash2,Check,X} from "lucide-react";

export default function HoldingsIntelligence({assets,onEdit,onRemove,editingId,editDraft,onEditDraft,onSaveEdit,onCancelEdit,pendingDelete,onConfirmRemove,onCancelRemove}:{assets:any[];onEdit?:(x:any)=>void;onRemove?:(x:any)=>void;editingId?:string|number|null;editDraft?:any;onEditDraft?:(x:any)=>void;onSaveEdit?:()=>void;onCancelEdit?:()=>void;pendingDelete?:string|number|null;onConfirmRemove?:()=>void;onCancelRemove?:()=>void}){
 const router=useRouter();
 const rows=(assets||[]).map(x=>{const cash=x.assetType==="CASH",value=cash?Number(x.amount||0):Number(x.quantity||0)*Number(x.price||0);return{...x,value}}).sort((a,b)=>b.value-a.value);
 const total=rows.reduce((n,x)=>n+x.value,0);
 const open=(cash:boolean,name:string)=>{if(!cash)router.push(`/stock/${encodeURIComponent(name)}`)};
 return <section id="portfolio-holdings" className="aurynHoldingsSection"><div className="aurynHoldingsHead"><div><div className="aurynEyebrow">Positions</div><h2>Your holdings</h2></div><span>{rows.length} tracked assets</span></div>
  <div className="aurynPositionList">{rows.map((x:any)=>{const cash=x.assetType==="CASH",crypto=x.assetType==="CRYPTO",name=cash?(x.currency||x.symbol||"USD"):x.symbol,weight=total?x.value/total*100:0,pnl=!cash&&Number(x.avgCost)>0?(Number(x.price)-Number(x.avgCost))*Number(x.quantity):null,action=cash?"LIQUIDITY":String(x.action||"REVIEW").replaceAll("_"," "),source=x.source||x,isEditing=editingId!=null&&String(source.id)===String(editingId),isDeleting=pendingDelete!=null&&String(source.id)===String(pendingDelete);return <div className={`aurynPositionGroup ${isEditing||isDeleting?"active":""}`} key={`${x.assetType}-${name}`}>
   <article className={`aurynPositionRow ${cash?"":"clickable"}`} role={cash?undefined:"link"} aria-label={cash?undefined:`Open ${name} research`} tabIndex={cash?undefined:0} onClick={()=>open(cash,name)} onKeyDown={e=>{if(!cash&&(e.key==="Enter"||e.key===" ")){e.preventDefault();open(false,name)}}}>
    <div className="aurynPositionName">{cash?<Banknote size={18}/>:crypto?<Bitcoin size={18}/>:<WalletCards size={18}/>}<div><b>{name}</b><span>{cash?"Cash":crypto?"Crypto":"Stock"} · {weight.toFixed(1)}%</span></div></div>
    <div className="aurynPositionFacts">
     {!cash&&<span><small>SHARES</small><b>{Number(x.quantity||0).toLocaleString(undefined,{maximumFractionDigits:4})}</b></span>}
     {!cash&&<span><small>AVG COST</small><b>${Number(x.avgCost||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</b></span>}
     <span><small>VALUE</small><b>${x.value.toLocaleString(undefined,{maximumFractionDigits:0})}</b></span>
     <span><small>RETURN</small><b className={pnl!=null&&pnl<0?"bad":"good"}>{cash?"—":pnl==null?"—":`${pnl>=0?"+":""}$${Math.abs(pnl).toLocaleString(undefined,{maximumFractionDigits:0})}`}</b></span>
    </div>
    <div className="aurynPositionCall"><small>AURYN</small><b>{action}</b></div>
    <div className="aurynPositionActions" onClick={e=>e.stopPropagation()}>{onEdit&&<button type="button" aria-label={`Edit ${name}`} title="Edit position" onClick={()=>onEdit(source)}><Pencil size={14}/></button>}{onRemove&&<button type="button" aria-label={`Delete ${name}`} title="Delete position" onClick={()=>onRemove(source)}><Trash2 size={14}/></button>}</div>
   </article>
   {isEditing&&editDraft?<div className="aurynPositionEdit"><div><small>EDIT POSITION</small><b>{name}</b></div><label><span>{cash?"Amount":"Quantity"}</span><input aria-label="Quantity" type="number" step="any" value={editDraft.shares} onChange={e=>onEditDraft?.({...editDraft,shares:e.target.value})}/></label>{!cash?<label><span>Average cost</span><input aria-label="Average cost" type="number" step="0.01" value={editDraft.avg_cost} onChange={e=>onEditDraft?.({...editDraft,avg_cost:e.target.value})}/></label>:<span/>}<div className="aurynPositionInlineActions"><button className="primary" type="button" onClick={onSaveEdit}><Check size={15}/> Save</button><button type="button" onClick={onCancelEdit}><X size={15}/> Cancel</button></div></div>:null}
   {isDeleting?<div className="aurynPositionDeleteConfirm"><div><small>REMOVE POSITION?</small><b>Delete {name} from this portfolio?</b><span>This removes the tracked position; it does not place a broker order.</span></div><div className="aurynPositionInlineActions"><button className="danger" type="button" onClick={onConfirmRemove}><Trash2 size={15}/> Delete</button><button type="button" onClick={onCancelRemove}><X size={15}/> Keep</button></div></div>:null}
  </div>})}</div>
 </section>
}