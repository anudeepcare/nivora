"use client";
import {useState,useEffect,useRef} from 'react';
import {ChevronDown} from 'lucide-react';
const primary=[['thesis','Overview'],['fundamentals','Business'],['financials','Financials'],['valuation','Valuation'],['technical','Technicals'],['catalysts','Events'],['institutions','Ownership']] as const;
const advanced=[['earnings','Earnings'],['risk','Risks'],['options','Options']] as const;
export default function StockEvidenceNav({tab,setTab,isCrypto}:{tab:string;setTab:(x:any)=>void;isCrypto:boolean}){
 const menu=useRef<HTMLDivElement>(null);
 const [open,setOpen]=useState(false),[compact,setCompact]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(max-width: 680px)'),sync=()=>setCompact(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);},[]);
 const available=primary.filter(([key])=>!isCrypto||['thesis','technical'].includes(key)),visible=compact?available.slice(0,3):available;
 useEffect(()=>{if(!open)return;const close=(e:PointerEvent)=>{if(!menu.current?.contains(e.target as Node))setOpen(false);};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);menu.current?.querySelector('button')?.focus();}};document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);};},[open]);
 const extras=[...(compact?available.slice(3):[]),...advanced.filter(([key])=>!isCrypto||key==='risk')];
 const select=(key:string)=>{setTab(key);setOpen(false);};
 return <nav className="aurynEvidenceNav" aria-label="Research sections"><div role="tablist" aria-label="Security research">{visible.map(([key,label],i)=><button key={key} type="button" id={`research-tab-${key}`} role="tab" aria-selected={tab===key} aria-controls="research-tab-panel" tabIndex={tab===key?0:-1} className={tab===key?'on':''} onClick={()=>select(key)} onKeyDown={e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%visible.length;else if(e.key==='ArrowLeft')n=(i+visible.length-1)%visible.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=visible.length-1;else return;e.preventDefault();select(visible[n][0]);document.getElementById(`research-tab-${visible[n][0]}`)?.focus();}}>{label}</button>)}</div><div className="researchMore" ref={menu}><button id={extras.some(([key])=>key===tab)?`research-tab-${tab}`:undefined} type="button" aria-expanded={open} aria-controls="research-extra-sections" className={extras.some(([key])=>key===tab)?'on':''} onClick={()=>setOpen(!open)}>More <ChevronDown size={14}/></button>{open&&<div id="research-extra-sections" className="researchMoreMenu">{extras.map(([key,label])=><button key={key} type="button" onClick={()=>select(key)}>{label}</button>)}</div>}</div></nav>;
}
