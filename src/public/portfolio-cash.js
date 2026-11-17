export const CASH_BALANCE_KEY='auryn.portfolio.cash.v1';

export function normalizeCashBalance(value){
  return typeof value==='number'&&Number.isFinite(value)&&value>=0
    ?{status:'available',amount:value,currency:'USD'}
    :{status:'invalid',reason:'Cash balance must be a finite nonnegative USD amount.'};
}

export function readCashBalance(storage){
  const raw=storage.getItem(CASH_BALANCE_KEY);
  if(raw===null)return{status:'unset',amount:null,currency:'USD'};
  try{
    const parsed=JSON.parse(raw);
    if(parsed?.currency!=='USD')return{status:'invalid',amount:null,currency:'USD',raw};
    const normalized=normalizeCashBalance(parsed.amount);return normalized.status==='available'?normalized:{...normalized,amount:null,currency:'USD',raw};
  }catch{return{status:'invalid',amount:null,currency:'USD',raw}}
}

export function saveCashBalance(storage,value){
  const normalized=normalizeCashBalance(value);
  if(normalized.status!=='available')return normalized;
  storage.setItem(CASH_BALANCE_KEY,JSON.stringify({amount:normalized.amount,currency:'USD'}));
  return normalized;
}
