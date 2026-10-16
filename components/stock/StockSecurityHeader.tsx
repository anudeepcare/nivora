"use client";
import Link from 'next/link';
import {ChevronLeft} from 'lucide-react';
import AssetLogo from '@/components/AssetLogo';
import MetricHelp from '@/components/MetricHelp';
import {formatMoney,formatPercent} from '@/lib/nivora-format';
type MarketFacts={marketCap?:number|null;volume?:number|null;week52High?:number|null;week52Low?:number|null;sector?:string|null;industry?:string|null;exchange?:string|null};
export default function StockSecurityHeader({company,symbol,price,changePct,status,detail,logoUrl,marketFacts,owns=false,positionLoaded=false,onToggleOwn}:{company?:string;symbol:string;price:number|null;changePct:number|null;status:string;detail:string;logoUrl?:string|null;marketFacts?:MarketFacts;owns?:boolean;positionLoaded?:boolean;onToggleOwn?:()=>void}){
 const valid=price!=null&&Number.isFinite(price)&&price>0;
 return <header className="clearSecurityHeader"><div className="clearSecurityIdentity"><Link href="/analyze" aria-label="Back to research" className="clearBack"><ChevronLeft size={21}/></Link><AssetLogo symbol={symbol} name={company} logoUrl={logoUrl} size={42}/><div><h1>{company||symbol}</h1><span>{symbol}{marketFacts?.exchange?` · ${marketFacts.exchange}`:''}</span></div>{onToggleOwn&&<button className={`aurynOwnChip ${owns?'on':''}`} onClick={onToggleOwn}>{owns?(positionLoaded?'Position':'Owned'):'+ Own'}</button>}</div><div className="clearSecurityQuote"><div><strong>{valid?formatMoney(price):'—'}</strong>{valid&&changePct!=null&&Number.isFinite(changePct)&&<span className={changePct>=0?'up':'down'}>{formatPercent(changePct)}</span>}<MetricHelp term="price"/></div><small>{valid?status:'Price unavailable'}{detail?` · ${detail}`:''}</small></div></header>;
}
