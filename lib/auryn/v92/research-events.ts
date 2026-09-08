import type {PointInTimeMetric} from '../v91/domain';
const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
const dateLike=(x:unknown)=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}/.test(x);

type ResearchRow=PointInTimeMetric&{family?:string;source?:string};
export function buildTwelveDataEarningsUrl(input:{symbol:string;apiKey:string}){
  const symbol=String(input.symbol||'').trim().toUpperCase();if(!symbol||!input.apiKey)throw new Error('Twelve Data earnings request requires symbol and apiKey.');
  const u=new URL('https://api.twelvedata.com/earnings');u.searchParams.set('symbol',symbol);u.searchParams.set('apikey',input.apiKey);return u.toString();
}

export function normalizePointInTimeResearchRows(input:any[]):PointInTimeMetric[]{
  if(!Array.isArray(input))throw new Error('Point-in-time research rows must be an array.');
  const out:PointInTimeMetric[]=[];
  for(const [i,r] of input.entries()){
    const symbol=String(r?.symbol||'').trim().toUpperCase(),metric=String(r?.metric||'').trim(),value=Number(r?.value);
    if(!symbol||!metric||!finite(value))throw new Error(`Research row ${i} has invalid symbol/metric/value.`);
    if(!dateLike(r?.availableAt))throw new Error(`Research row ${i} is missing valid availableAt; periodEnd cannot substitute for public availability.`);
    if(r?.periodEnd!=null&&!dateLike(r.periodEnd))throw new Error(`Research row ${i} has invalid periodEnd.`);
    out.push({symbol,metric,value,periodEnd:r?.periodEnd?String(r.periodEnd).slice(0,10):null,availableAt:String(r.availableAt).slice(0,10)});
  }
  return out.sort((a,b)=>a.symbol.localeCompare(b.symbol)||a.availableAt.localeCompare(b.availableAt)||a.metric.localeCompare(b.metric)||(a.periodEnd??'').localeCompare(b.periodEnd??'')||a.value-b.value);
}

export function normalizeTwelveDataEarnings(symbol:string,payload:any):PointInTimeMetric[]{
  const s=String(symbol||'').trim().toUpperCase();if(!s)throw new Error('Earnings symbol is required.');if(payload?.status==='error')throw new Error(`Twelve Data earnings provider error: ${payload?.message||'unknown error'}`);
  const rows=(Array.isArray(payload?.earnings)?payload.earnings:[]).map((r:any,i:number)=>({r,i,date:String(r?.date||'').slice(0,10)})).sort((a:any,b:any)=>a.date.localeCompare(b.date));
  const out:PointInTimeMetric[]=[];let streak=0;
  for(const {r,i,date:availableAt} of rows){
    if(!dateLike(availableAt))throw new Error(`Earnings row ${i} for ${s} has no valid release date.`);
    const add=(metric:string,v:unknown)=>{const n=Number(v);if(finite(n))out.push({symbol:s,metric,value:n,periodEnd:null,availableAt});};
    add('earnings_eps_estimate',r?.eps_estimate);add('earnings_eps_actual',r?.eps_actual);add('earnings_surprise',r?.difference);add('earnings_surprise_pct',r?.surprise_prc);
    const explicit=Number(r?.difference),actual=Number(r?.eps_actual),estimate=Number(r?.eps_estimate);const surprise=finite(explicit)?explicit:(finite(actual)&&finite(estimate)?actual-estimate:NaN);
    if(finite(surprise)){if(surprise>0)streak=streak>0?streak+1:1;else if(surprise<0)streak=streak<0?streak-1:-1;else streak=0;add('surprise_streak',streak);}
  }
  return out.sort((a,b)=>a.availableAt.localeCompare(b.availableAt)||a.metric.localeCompare(b.metric));
}
