"use client";
import type {ReactNode} from 'react';
import AssetLogo from '@/components/AssetLogo';
import MetricHelp from '@/components/MetricHelp';
import {formatMoney,formatPercent} from '@/lib/nivora-format';
type MarketFacts={marketCap?:number|null;volume?:number|null;week52High?:number|null;week52Low?:number|null;sector?:string|null;industry?:string|null;exchange?:string|null};
export default function StockSecurityHeader({company,symbol,price,changePct,status,detail,logoUrl,marketFacts,controls}:{company?:string;symbol:string;price:number|null;changePct:number|null;status:string;detail:string;logoUrl?:string|null;marketFacts?:MarketFacts;controls?:ReactNode;owns?:boolean;positionLoaded?:boolean;onToggleOwn?:()=>void}){
 const valid=price!=null&&Number.isFinite(price)&&price>0;
 return <header className="au-stockhead"><div className="au-security"><AssetLogo symbol={symbol} name={company} logoUrl={logoUrl} size={42}/><div><h1>{company||symbol}</h1><span className="au-small au-muted">{symbol}{marketFacts?.exchange?` · ${marketFacts.exchange}`:''}</span></div></div><div className="au-quote"><div className="au-metric">{valid?formatMoney(price):'—'}</div><div className="glassQuoteChange">{valid&&changePct!=null&&Number.isFinite(changePct)&&<span className={`au-small ${changePct>=0?'au-positive':'au-negative'}`}>{formatPercent(changePct)}</span>}<span className="au-small au-muted">{valid?status:'Price unavailable'}</span><MetricHelp term="price" body={detail||undefined}/></div><small className="glassPriceTime">{detail}</small></div>{controls}</header>;
}
