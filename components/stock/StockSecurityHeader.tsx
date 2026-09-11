"use client";

import {useMemo,useState} from "react";
import {formatMoney,formatPercent} from "@/lib/nivora-format";

const brandSlugs:Record<string,string>={AAPL:"apple",MSFT:"microsoft",GOOGL:"google",GOOG:"google",AMZN:"amazon",META:"meta",NVDA:"nvidia",TSLA:"tesla",NFLX:"netflix",AMD:"amd",INTC:"intel",CRM:"salesforce",ORCL:"oracle",ADBE:"adobe",PYPL:"paypal",UBER:"uber",SHOP:"shopify",SPOT:"spotify",IBM:"ibm",CSCO:"cisco"};

type MarketFacts={
 marketCap?:number|null;
 volume?:number|null;
 week52High?:number|null;
 week52Low?:number|null;
 sector?:string|null;
 industry?:string|null;
 exchange?:string|null;
};

function compact(v:number|null|undefined){
 const x=Number(v);if(!Number.isFinite(x)||x<=0)return null;
 return new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:x>=1e9?2:1}).format(x);
}
function SecurityLogo({symbol,company,logoUrl}:{symbol:string;company?:string;logoUrl?:string|null}){
 const key=String(symbol||"").toUpperCase();
 const slug=brandSlugs[key];
 const candidates=useMemo(()=>[logoUrl,slug?`https://cdn.simpleicons.org/${slug}/111111`:null,`https://financialmodelingprep.com/image-stock/${encodeURIComponent(key)}.png`].filter((x):x is string=>Boolean(x)),[logoUrl,key,slug]);
 const[index,setIndex]=useState(0),failed=index>=candidates.length;
 return <span className={`aurynSecurityLogo ${failed?"aurynSecurityLogoFallback":""}`} aria-label={`${company||key} logo`}>
  {failed?<b>{key.slice(0,2)}</b>:<img key={candidates[index]} src={candidates[index]} alt="" loading="eager" referrerPolicy="no-referrer" onError={()=>setIndex(i=>i+1)}/>} 
 </span>;
}

export default function StockSecurityHeader({company,symbol,price,changePct,status,detail,logoUrl,marketFacts,owns=false,positionLoaded=false,onToggleOwn}:{company?:string;symbol:string;price:number|null;changePct:number|null;status:string;detail:string;logoUrl?:string|null;marketFacts?:MarketFacts;owns?:boolean;positionLoaded?:boolean;onToggleOwn?:()=>void}){
 const hasPrice=price!=null&&Number.isFinite(Number(price))&&Number(price)>0;
 const hasChange=hasPrice&&changePct!=null&&Number.isFinite(Number(changePct));
 const verifying=!hasPrice&&/verifying/i.test(status);
 const marketCap=Number(marketFacts?.marketCap),volume=Number(marketFacts?.volume),week52High=Number(marketFacts?.week52High),week52Low=Number(marketFacts?.week52Low);
 const facts=[
  Number.isFinite(marketCap)&&marketCap>0?{label:"Mkt Cap",desktopLabel:"Market Cap",value:compact(marketCap)}:null,
  Number.isFinite(volume)&&volume>0?{label:"Volume",desktopLabel:"Volume",value:compact(volume)}:null,
  Number.isFinite(week52High)&&week52High>0?{label:"52W High",desktopLabel:"52W High",value:formatMoney(week52High)}:null,
  Number.isFinite(week52Low)&&week52Low>0?{label:"52W Low",desktopLabel:"52W Low",value:formatMoney(week52Low)}:null,
 ].filter((x):x is {label:string;desktopLabel:string;value:string}=>Boolean(x?.value));
 const descriptor=[marketFacts?.sector,marketFacts?.industry,marketFacts?.exchange].filter(Boolean).join(" · ");
 const ownText=owns?(positionLoaded?"✓ Position":"✓ Owned"):"+ Own";
 const priceText=hasPrice?formatMoney(Number(price)):verifying?"VERIFYING…":"UNVERIFIED";

 return <>
  <header className="aurynStockMobileMasthead" aria-label={`${symbol} market summary`}>
   <div className="aurynStockMobilePrimary">
    <div className="aurynStockMobileIdentity">
     <SecurityLogo symbol={symbol} company={company} logoUrl={logoUrl}/>
     <div>
      <div className="aurynStockMobileTickerRow"><h1 className="aurynStockMobileTicker">{symbol}</h1>{onToggleOwn?<button type="button" className={`aurynOwnChip ${owns?"on":""}`} onClick={onToggleOwn}>{ownText}</button>:null}</div>
      <strong>{company||symbol}</strong>
     </div>
    </div>
    <div className={`aurynStockMobilePrice ${hasPrice?"":"unverified"}`}>
     <div><b>{priceText}</b>{hasChange?<span className={Number(changePct)>=0?"up":"down"}>{formatPercent(Number(changePct))}</span>:null}</div>
     <small>{status}</small>
    </div>
   </div>
   <div className="aurynStockMobileMeta">
    <span>{descriptor||company||symbol}</span>
    <span>{detail}</span>
   </div>
   {facts.length?<div className="aurynStockMobileFacts" aria-label="Company market facts">{facts.map(x=><span key={x.desktopLabel}><small>{x.label}</small><b>{x.value}</b></span>)}</div>:null}
  </header>

  <header className="aurynStockMasthead aurynStockDesktopMasthead">
   <div className="aurynStockIdentityWrap">
    <SecurityLogo symbol={symbol} company={company} logoUrl={logoUrl}/>
    <div className="aurynStockIdentity"><div><h1>{symbol}</h1>{onToggleOwn&&<button type="button" className={`aurynOwnChip ${owns?"on":""}`} onClick={onToggleOwn}>{owns?(positionLoaded?"✓ Position loaded":"✓ I own this"):"+ I own this"}</button>}</div><small>{company||symbol}</small>{descriptor?<p>{descriptor}</p>:null}</div>
   </div>
   <div className={`aurynStockMarket ${hasPrice?"":"unverified"}`}>
    <div><b>{hasPrice?formatMoney(Number(price)):verifying?"VERIFYING PRICE…":"PRICE UNVERIFIED"}</b>{hasChange&&<span className={Number(changePct)>=0?"up":"down"}>{formatPercent(Number(changePct))}</span>}</div>
    <small>{status}</small>
    <p>{detail}</p>
   </div>
   {facts.length?<div className="aurynSecurityFacts" aria-label="Company market facts">{facts.map(x=><span key={x.desktopLabel}><small>{x.desktopLabel}</small><b>{x.value}</b></span>)}</div>:null}
  </header>
 </>;
}
