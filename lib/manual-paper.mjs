export function validateManualTicket(input){
 const symbol=String(input?.symbol||'').trim().toUpperCase();
 if(!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(symbol))throw Error('Enter a supported US stock symbol.');
 if(!['BUY','SELL'].includes(input?.side))throw Error('Choose Buy or Sell.');
 if(typeof input.quantity!=='number'||!Number.isInteger(input.quantity)||input.quantity<1||input.quantity>10000)throw Error('Quantity must be a whole number between 1 and 10,000.');
 if(typeof input.limitPrice!=='number'||!Number.isFinite(input.limitPrice)||input.limitPrice<=0||input.limitPrice>1000000)throw Error('Enter a positive limit price.');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.requestId||''))throw Error('Invalid order request. Start a new review.');
 return {symbol,side:input.side,quantity:input.quantity,limitPrice:Math.round(input.limitPrice*100)/100,requestId:input.requestId.toLowerCase()};
}
export function checkManualRisk(ticket,{market,account,positions,clockOpen,configuration,now=Date.now()}){
 if(configuration?.no_shorting!==true||Number(configuration?.max_margin_multiplier)!==1||configuration?.suspend_trade===true)throw Error("Manual orders require Alpaca Paper account settings: no shorting enabled, maximum margin multiplier 1, and trading not suspended. Configure these broker protections first.");
 const price=market?.executionPrice,at=Date.parse(market?.executionPriceAsOf||'');
 if(!clockOpen||market?.session!=='REGULAR'||!market?.executionTradable||!market?.priceSensitiveAllowed||typeof price!=='number'||price<=0||!Number.isFinite(price)||!Number.isFinite(at)||now-at>60000||at-now>5000)throw Error('A fresh, tradable regular-session quote is required.');
 if(ticket.limitPrice<=0||Math.abs(ticket.limitPrice/price-1)>.02)throw Error('The limit price must be within 2% of the verified quote. Review current pricing.');
 const notional=ticket.quantity*ticket.limitPrice;
 if(ticket.side==='BUY'){
  if(!Number.isFinite(account?.cash)||!Number.isFinite(account?.equity)||!Number.isFinite(account?.buyingPower)||notional>Math.min(account.cash,account.buyingPower)||notional>account.equity*.1)throw Error('Buy orders must be cash funded and no more than 10% of paper-account equity.');
 }else if(ticket.quantity>(positions||[]).filter(x=>x.symbol===ticket.symbol).reduce((sum,x)=>sum+(Number(x.availableQty)||0),0))throw Error('Sell quantity exceeds owned paper shares. Short selling is disabled.');
 return {notional,referencePrice:price,quoteAsOf:market.executionPriceAsOf};
}

const manualTerminalStatuses=new Set(['filled','canceled','expired','rejected','replaced']);
const manualBrokerStatuses=new Set(['new','partially_filled','filled','done_for_day','canceled','expired','replaced','pending_cancel','pending_replace','accepted','pending_new','accepted_for_bidding','stopped','rejected','suspended','calculated']);
export function manualClientOrderId(requestId){
 if(typeof requestId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId))throw Error('Invalid order request.');
 return `auryn_manual_${requestId.toLowerCase().replaceAll('-','')}`;
}
export function isManualTerminal(status){return manualTerminalStatuses.has(status)}
export function canCancelManualOrder(row){return !row.cancel_requested_at&&['new','partially_filled','accepted','pending_new','accepted_for_bidding'].includes(row.status)}
/** A broker account is shared: validate the exact audited order before recording or cancelling it. */
export function manualOrderSnapshot(row,order,checkedAt=new Date().toISOString()){
 if(!order||typeof order.id!=='string'||!order.id||['undefined','null'].includes(order.id)||order.id.length>128||order.clientOrderId!==manualClientOrderId(row.id)||order.symbol!==row.symbol||String(order.side).toUpperCase()!==row.side||order.qty!==Number(row.quantity)||(row.broker_order_id&&order.id!==row.broker_order_id))throw Error('Broker order does not match this audited request.');
 if(!manualBrokerStatuses.has(order.status)||!Number.isFinite(order.filledQty)||order.filledQty<0||order.filledQty>order.qty||order.filledQty<Number(row.filled_quantity||0)||(order.status==='filled'&&order.filledQty!==order.qty)||(isManualTerminal(row.status)&&row.status!==order.status))throw Error('Broker order state is not consistent with the recorded order.');
 if(order.filledQty>0&&(!Number.isFinite(order.filledAvgPrice)||order.filledAvgPrice<=0))throw Error('Broker fill price is not available.');
 return {status:order.status,broker_order_id:order.id,filled_quantity:order.filledQty,filled_avg_price:order.filledQty>0?order.filledAvgPrice:null,broker_checked_at:checkedAt,detail:'Broker status verified for this manual paper order. Filled quantity is cumulative; cancellation never reverses completed fills.'};
}
