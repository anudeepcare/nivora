import {formatMoney,formatPercent} from "@/lib/nivora-format";
export default function StockSecurityHeader({company,symbol,price,changePct,status,detail}:{company?:string;symbol:string;price:number;changePct:number;status:string;detail:string}){
 return <><header className="aurynStockHeader"><div><small>{company||symbol}</small><h1>{symbol}</h1></div><div className="aurynStockQuote"><b>{formatMoney(price)}</b><span className={changePct>=0?"up":"down"}>{formatPercent(changePct)}</span></div></header><div className="aurynStockFresh"><span>{status}</span><span>{detail}</span></div></>
}