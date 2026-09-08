import type {HistoricalBar,HistoricalCorporateAction} from '../v91/domain';

const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
const dateLike=(x:unknown)=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}/.test(x);
const symbolOf=(symbol:string)=>{const s=String(symbol||'').trim().toUpperCase();if(!s)throw new Error('Corporate-action symbol is required.');return s;};

export function buildTwelveDataSplitsUrl(input:{symbol:string;apiKey:string}){
  const symbol=symbolOf(input.symbol);if(!input.apiKey)throw new Error('Twelve Data splits request requires apiKey.');
  const u=new URL('https://api.twelvedata.com/splits');u.searchParams.set('symbol',symbol);u.searchParams.set('apikey',input.apiKey);return u.toString();
}

export function buildTwelveDataDividendsUrl(input:{symbol:string;apiKey:string;startDate?:string;endDate?:string}){
  const symbol=symbolOf(input.symbol);if(!input.apiKey)throw new Error('Twelve Data dividends request requires apiKey.');
  const u=new URL('https://api.twelvedata.com/dividends');u.searchParams.set('symbol',symbol);
  if(input.startDate||input.endDate){
    if(input.startDate){if(!dateLike(input.startDate))throw new Error('Invalid dividend startDate.');u.searchParams.set('start_date',input.startDate.slice(0,10));}
    if(input.endDate){if(!dateLike(input.endDate))throw new Error('Invalid dividend endDate.');u.searchParams.set('end_date',input.endDate.slice(0,10));}
  }else u.searchParams.set('range','full');
  u.searchParams.set('apikey',input.apiKey);return u.toString();
}

export function normalizeTwelveDataSplits(symbol:string,payload:any):HistoricalCorporateAction[]{
  const s=symbolOf(symbol);if(payload?.status==='error')throw new Error(`Twelve Data splits provider error: ${payload?.message||'unknown error'}`);
  const rows=Array.isArray(payload?.splits)?payload.splits:[];
  return rows.map((r:any,i:number)=>{
    const date=String(r?.date||'').slice(0,10),ratio=Number(r?.ratio);
    const from=Number(r?.from_factor),to=Number(r?.to_factor);
    if(!dateLike(date)||!finite(ratio)||ratio<=0||!finite(from)||from<=0||!finite(to)||to<=0)throw new Error(`Invalid split row ${i} for ${s}; date, ratio and factors must be positive.`);
    return{symbol:s,type:'SPLIT' as const,date,ratio,amount:null,availableAt:date,source:'TWELVE_DATA'};
  }).sort((a:HistoricalCorporateAction,b:HistoricalCorporateAction)=>a.date.localeCompare(b.date));
}

export function normalizeTwelveDataDividends(symbol:string,payload:any):HistoricalCorporateAction[]{
  const s=symbolOf(symbol);if(payload?.status==='error')throw new Error(`Twelve Data dividends provider error: ${payload?.message||'unknown error'}`);
  const rows=Array.isArray(payload?.dividends)?payload.dividends:[];
  return rows.map((r:any,i:number)=>{
    const date=String(r?.ex_date||'').slice(0,10),amount=Number(r?.amount);
    if(!dateLike(date)||!finite(amount)||amount<0)throw new Error(`Invalid dividend row ${i} for ${s}; ex-date and non-negative amount are required.`);
    return{symbol:s,type:'DIVIDEND' as const,date,ratio:null,amount,availableAt:date,source:'TWELVE_DATA'};
  }).sort((a:HistoricalCorporateAction,b:HistoricalCorporateAction)=>a.date.localeCompare(b.date));
}

export function auditCorporateActionAdjustments(bars:HistoricalBar[],actions:HistoricalCorporateAction[]):string[]{
  const failures:string[]=[];const bySymbol=new Map<string,HistoricalBar[]>();
  for(const b of bars){const a=bySymbol.get(b.symbol)??[];a.push(b);bySymbol.set(b.symbol,a);}for(const a of bySymbol.values())a.sort((x,y)=>x.date.localeCompare(y.date));
  for(const action of actions){
    if(!dateLike(action.date)||!dateLike(action.availableAt))failures.push(`${action.symbol} corporate action has invalid date/availability.`);
    if(action.type==='SPLIT'&&(!finite(action.ratio)||action.ratio<=0))failures.push(`${action.symbol} split ${action.date} has invalid ratio.`);
    if(action.type==='DIVIDEND'&&(!finite(action.amount)||action.amount<0))failures.push(`${action.symbol} dividend ${action.date} has invalid amount.`);
    if(action.availableAt>action.date)failures.push(`${action.symbol} corporate action ${action.date} is marked available after its effective date.`);
    if(action.type!=='SPLIT')continue;
    const series=bySymbol.get(action.symbol)??[];const afterIndex=series.findIndex(b=>b.date>=action.date);if(afterIndex<=0)continue;
    const before=series[afterIndex-1],after=series[afterIndex];if(!before.adjusted||!after.adjusted){failures.push(`${action.symbol} split ${action.date} touches bars not explicitly adjusted.`);continue;}
    const observed=after.close/before.close,ratio=action.ratio as number;
    const rawSignatureDistance=Math.min(Math.abs(observed-ratio)/ratio,Math.abs(observed-(1/ratio))/(1/ratio));
    if(Math.abs(Math.log(observed))>0.35&&rawSignatureDistance<0.20)failures.push(`${action.symbol} split ${action.date} shows an unadjusted split-like discontinuity in adjusted bars.`);
  }
  return[...new Set(failures)].sort();
}
