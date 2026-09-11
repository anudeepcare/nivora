import {formatMoney,formatPercent} from "@/lib/nivora-format";

const brandSlugs:Record<string,string>={
 AAPL:"apple",MSFT:"microsoft",GOOGL:"google",GOOG:"google",AMZN:"amazon",META:"meta",NVDA:"nvidia",TSLA:"tesla",NFLX:"netflix",AMD:"amd",INTC:"intel",CRM:"salesforce",ORCL:"oracle",ADBE:"adobe",PYPL:"paypal",UBER:"uber",SHOP:"shopify",SPOT:"spotify",IBM:"ibm",CSCO:"cisco"
};

function SecurityLogo({symbol,company}:{symbol:string;company?:string}){
 const key=String(symbol||"").toUpperCase();
 const slug=brandSlugs[key];
 if(slug)return <span className="aurynSecurityLogo"><img src={`https://cdn.simpleicons.org/${slug}/111111`} alt={`${company||key} logo`}/></span>;
 return <span className="aurynSecurityLogo aurynSecurityLogoFallback" aria-label={`${company||key} logo fallback`}>{key.slice(0,2)}</span>;
}

export default function StockSecurityHeader({company,symbol,price,changePct,status,detail,owns=false,positionLoaded=false,onToggleOwn}:{company?:string;symbol:string;price:number|null;changePct:number|null;status:string;detail:string;owns?:boolean;positionLoaded?:boolean;onToggleOwn?:()=>void}){
 const hasPrice=price!=null&&Number.isFinite(Number(price))&&Number(price)>0;
 const hasChange=hasPrice&&changePct!=null&&Number.isFinite(Number(changePct));
 const verifying=!hasPrice&&/verifying/i.test(status);
 return <header className="aurynStockMasthead">
   <div className="aurynStockIdentityWrap">
    <SecurityLogo symbol={symbol} company={company}/>
    <div className="aurynStockIdentity"><div><h1>{symbol}</h1>{onToggleOwn&&<button type="button" className={`aurynOwnChip ${owns?"on":""}`} onClick={onToggleOwn}>{owns?(positionLoaded?"✓ Position loaded":"✓ I own this"):"+ I own this"}</button>}</div><small>{company||symbol}</small></div>
   </div>
   <div className={`aurynStockMarket ${hasPrice?"":"unverified"}`}>
    <div><b>{hasPrice?formatMoney(Number(price)):verifying?"VERIFYING PRICE…":"PRICE UNVERIFIED"}</b>{hasChange&&<span className={Number(changePct)>=0?"up":"down"}>{formatPercent(Number(changePct))}</span>}</div>
    <small>{status}</small>
    <p>{detail}</p>
   </div>
  </header>;
}
