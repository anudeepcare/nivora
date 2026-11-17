import {resolveListedSecurity} from './security-identity.js';

const usable=status=>status==='live'||status==='preview';
const canonicalOf=row=>{
  const ticker=String(row?.ticker??row?.symbol??row?.code??'').trim().toUpperCase(),exchange=String(row?.exchange??row?.Exchange??'').trim().toUpperCase();
  // SentiSense documents this screener as a US universe and its examples omit
  // exchange (for example, `ticker: "AAPL"`). Explicit exchanges still win,
  // so contradictory qualified identities continue to fail closed.
  const resolved=resolveListedSecurity(ticker,exchange||'US');
  return resolved.status==='resolved'?resolved.canonical:null;
};

export function normalizeDiscoverRows(payload,{limit=25}={}){
  const rows=Array.isArray(payload)?payload:Array.isArray(payload?.results)?payload.results:Array.isArray(payload?.items)?payload.items:null;
  if(!rows)return{status:'malformed-response',results:[],reason:'Screener payload did not contain a documented result list.'};
  const seen=new Set(),accepted=[];
  for(const row of rows){
    const symbol=canonicalOf(row);if(!symbol||seen.has(symbol))continue;
    const exchange=symbol.split('.').at(-1);seen.add(symbol);accepted.push({symbol,name:typeof row?.name==='string'&&row.name.trim()?row.name.trim():null,exchange});
  }
  const contract=payload&&!Array.isArray(payload)?payload:{},matchedCount=Number.isInteger(contract.matched)&&contract.matched>=0?contract.matched:null,totalUniverseCount=Number.isInteger(contract.totalCount)&&contract.totalCount>=0?contract.totalCount:null,results=accepted.slice(0,limit),receivedCount=rows.length,acceptedCount=accepted.length,returnedCount=results.length,rejectedCount=receivedCount-acceptedCount,truncated=returnedCount===limit&&((matchedCount!==null&&matchedCount>returnedCount)||acceptedCount>returnedCount);
  return{status:'available',results,matchedCount,totalUniverseCount,receivedCount,acceptedCount,rejectedCount,returnedCount,truncated};
}

export async function loadDiscoverScreen(senti,{limit=25}={}){
  const safeLimit=[10,25].includes(Number(limit))?Number(limit):25;
  const provider=await senti.screener({plan:{filters:[]},limit:safeLimit});
  if(!usable(provider?.status))return{status:provider?.status??'error',access:'unavailable',results:[],source:'SentiSense Pro',asOf:provider?.asOf??null,reason:provider?.reason??'Provider screen unavailable.',controls:{mode:'broad',limit:safeLimit}};
  const normalized=normalizeDiscoverRows(provider.data,{limit:safeLimit});
  if(normalized.status!=='available')return{...normalized,access:'unavailable',source:'SentiSense Pro',asOf:provider.asOf??null,controls:{mode:'broad',limit:safeLimit}};
  return{status:provider.status,access:provider.status==='preview'?'preview':'live',preview:provider.status==='preview',results:normalized.results,matchedCount:normalized.matchedCount,totalUniverseCount:normalized.totalUniverseCount,receivedCount:normalized.receivedCount,acceptedCount:normalized.acceptedCount,rejectedCount:normalized.rejectedCount,returnedCount:normalized.returnedCount,truncated:normalized.truncated,source:'SentiSense Pro',asOf:provider.asOf??null,controls:{mode:'broad',limit:safeLimit},note:'Broad documented US-universe provider screen only. Quality, Value, Change and Pace filter semantics remain disabled until the entitled fields contract is accepted.'};
}
