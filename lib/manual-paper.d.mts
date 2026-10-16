export type ManualTicket={symbol:string;side:'BUY'|'SELL';quantity:number;limitPrice:number;requestId:string};
export function validateManualTicket(input:any):ManualTicket;
export function checkManualRisk(ticket:ManualTicket,context:any):{notional:number;referencePrice:number;quoteAsOf:string};
export function manualClientOrderId(requestId:string):string;
export function isManualTerminal(status:string):boolean;
export function canCancelManualOrder(row:any):boolean;
export function manualOrderSnapshot(row:any,order:any,checkedAt?:string):{status:string;broker_order_id:string;filled_quantity:number;filled_avg_price:number|null;broker_checked_at:string;detail:string};
