import {ALPACA_PAPER_BASE_URL,authorizeBrokerExecution} from "./nivora-broker";
import type {PaperOrderPlan} from "./nivora-paper-execution";

export type AlpacaPaperAccount={equity:number;cash:number;buyingPower:number;lastEquity:number;dailyPnlPct:number};
export type AlpacaPaperPosition={symbol:string;qty:number;marketValue:number;avgEntryPrice:number};
export type AlpacaPaperOrder={id:string;clientOrderId:string;symbol:string;side:string;status:string;qty:number;filledQty:number;filledAvgPrice:number|null;submittedAt:string|null};

export class AlpacaPaperBroker{
 private key:string;private secret:string;
 constructor(key:string,secret:string){
  this.key=key;this.secret=secret;
  if(!this.key||!this.secret)throw new Error("Alpaca Paper credentials are not configured.");
 }
 private async request(path:string,init:RequestInit={}){
  const auth=authorizeBrokerExecution({mode:"paper",autoSubmit:true});if(!auth.mayTransmit)throw new Error(auth.reason);
  const r=await fetch(`${ALPACA_PAPER_BASE_URL}${path}`,{...init,cache:"no-store",headers:{"APCA-API-KEY-ID":this.key,"APCA-API-SECRET-KEY":this.secret,"Content-Type":"application/json",...(init.headers||{})}});
  const body=await r.json().catch(()=>null);if(!r.ok)throw new Error(body?.message||`Alpaca Paper ${r.status}`);return body;
 }
 async getAccount():Promise<AlpacaPaperAccount>{const a=await this.request("/v2/account");const equity=Number(a.equity||0),last=Number(a.last_equity||0);return{equity,cash:Number(a.cash||0),buyingPower:Number(a.buying_power||0),lastEquity:last,dailyPnlPct:last>0?+(((equity/last)-1)*100).toFixed(3):0}}
 async getPositions():Promise<AlpacaPaperPosition[]>{const rows=await this.request("/v2/positions");return(rows||[]).map((p:any)=>({symbol:String(p.symbol).toUpperCase(),qty:Number(p.qty||0),marketValue:Number(p.market_value||0),avgEntryPrice:Number(p.avg_entry_price||0)}))}
 async getFillActivities(after?:string):Promise<Array<{id:string;orderId:string;symbol:string;side:"BUY"|"SELL";qty:number;price:number;transactionTime:string}>>{
  const q=after?`?after=${encodeURIComponent(after)}&direction=asc&page_size=100`:"?direction=asc&page_size=100";const rows=await this.request(`/v2/account/activities/FILL${q}`);return(rows||[]).map((x:any)=>({id:String(x.id),orderId:String(x.order_id||""),symbol:String(x.symbol||"").toUpperCase(),side:String(x.side||"").toUpperCase()==="SELL"?"SELL":"BUY",qty:Number(x.qty||0),price:Number(x.price||0),transactionTime:String(x.transaction_time||x.date||new Date(0).toISOString())}))
 }

 async getLatestExecutionQuote(symbol:string):Promise<{quote:any;trade:any}>{
  const headers={"APCA-API-KEY-ID":this.key,"APCA-API-SECRET-KEY":this.secret};
  const [qr,tr]=await Promise.all([
   fetch(`https://data.alpaca.markets/v2/stocks/${encodeURIComponent(symbol)}/quotes/latest`,{cache:"no-store",headers}),
   fetch(`https://data.alpaca.markets/v2/stocks/${encodeURIComponent(symbol)}/trades/latest`,{cache:"no-store",headers})
  ]);
  const q=await qr.json().catch(()=>null),t=await tr.json().catch(()=>null);
  if(!qr.ok||!tr.ok)throw new Error(q?.message||t?.message||`Alpaca market data ${qr.status}/${tr.status}`);
  return{quote:q,trade:t};
 }
 async submitOrder(order:PaperOrderPlan):Promise<AlpacaPaperOrder>{const o=await this.request("/v2/orders",{method:"POST",body:JSON.stringify({symbol:order.symbol,qty:String(order.quantity),side:order.side.toLowerCase(),type:"limit",time_in_force:"day",limit_price:String(order.limitPrice),client_order_id:order.clientOrderId})});return{id:String(o.id),clientOrderId:String(o.client_order_id||order.clientOrderId),symbol:String(o.symbol),side:String(o.side),status:String(o.status),qty:Number(o.qty||order.quantity),filledQty:Number(o.filled_qty||0),filledAvgPrice:o.filled_avg_price==null?null:Number(o.filled_avg_price),submittedAt:o.submitted_at||null}}
}
