import {formatMoney,formatPercent} from "@/lib/nivora-format";
export default function StockSecurityHeader({company,symbol,price,changePct,status,detail,owns=false,positionLoaded=false,onToggleOwn}:{company?:string;symbol:string;price:number|null;changePct:number|null;status:string;detail:string;owns?:boolean;positionLoaded?:boolean;onToggleOwn?:()=>void}){
 const hasPrice=price!=null&&Number.isFinite(Number(price))&&Number(price)>0;
 const hasChange=hasPrice&&changePct!=null&&Number.isFinite(Number(changePct));
 const verifying=!hasPrice&&/verifying/i.test(status);
 return <><header className="aurynStockHeader"><div><small>{company||symbol}</small><h1>{symbol}</h1>{onToggleOwn&&<button type="button" className={`aurynOwnChip ${owns?"on":""}`} onClick={onToggleOwn}>{owns?(positionLoaded?"✓ Position loaded":"✓ I own this"):"+ I own this"}</button>}</div><div className={`aurynStockQuote ${hasPrice?"":"unverified"}`}><b>{hasPrice?formatMoney(Number(price)):verifying?"VERIFYING PRICE…":"PRICE UNVERIFIED"}</b>{hasChange&&<span className={Number(changePct)>=0?"up":"down"}>{formatPercent(Number(changePct))}</span>}</div></header><div className="aurynStockFresh"><span>{status}</span><span>{detail}</span></div></>
}
