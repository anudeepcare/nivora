"use client";
import {useEffect,useRef} from 'react';
import {X} from 'lucide-react';
import ConnectedPlanner from '@/components/ConnectedPlanner';
export default function ContributionDialog({open,onClose,symbol,price,snapshot}:{open:boolean;onClose:()=>void;symbol:string;price:number|null;snapshot:any}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(open&&!ref.current?.open)ref.current?.showModal();if(!open&&ref.current?.open)ref.current.close()},[open]);
 return <dialog ref={ref} id="accumulation-plan" className="au-modal glassContributionDialog" onClose={onClose} onCancel={onClose} aria-label="Edit contribution"><div className="au-panelhead"><h2>Keep it simple.</h2><button className="au-icon" onClick={onClose} aria-label="Close contribution editor"><X size={17}/></button></div>{open&&<ConnectedPlanner onSaved={onClose} key={symbol} symbol={symbol} price={price} snapshot={snapshot}/>}</dialog>;
}
