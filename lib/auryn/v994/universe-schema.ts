export const validationUniverseColumns="symbol,name,exchange,instrument_type,currency,country";
export type MarketUniverseRow={symbol:string;name?:string|null;exchange?:string|null;instrument_type?:string|null;currency?:string|null;country?:string|null};
const derivativeSymbol=/(\.WT$|\.WS$|\/WS$|\.UN$|\/U$|\.RT$|\/R$|\^[A-Z0-9]+$)/i;
const commonTypes=new Set(["COMMON STOCK","COMMON_STOCK","COMMON","STOCK","EQUITY","CS"]);
export function isEligibleMarketUniverseRow(r:MarketUniverseRow){
 const s=String(r.symbol||"").trim().toUpperCase(),t=String(r.instrument_type||"").trim().toUpperCase();
 if(!s||derivativeSymbol.test(s)||!commonTypes.has(t))return false;
 if(String(r.currency||"").trim().toUpperCase()!=="USD")return false;
 const c=String(r.country||"").trim().toUpperCase();if(c&&!["US","USA","UNITED STATES","UNITED STATES OF AMERICA"].includes(c))return false;
 return /^[A-Z][A-Z0-9.-]{0,9}$/.test(s);
}
function hash(s:string){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h}
export function buildExchangeStratifiedUniverse(rows:MarketUniverseRow[],limit=300){
 const groups=new Map<string,MarketUniverseRow[]>();
 for(const r of rows.filter(isEligibleMarketUniverseRow)){const k=String(r.exchange||"OTHER").trim().toUpperCase()||"OTHER";const a=groups.get(k)||[];a.push(r);groups.set(k,a)}
 for(const a of groups.values())a.sort((x,y)=>hash(x.symbol)-hash(y.symbol));
 const keys=[...groups.keys()].sort((a,b)=>hash(a)-hash(b)),out:string[]=[];let progress=true;
 while(out.length<limit&&progress){progress=false;for(const k of keys){const x=groups.get(k)?.shift();if(x){out.push(x.symbol.toUpperCase());progress=true;if(out.length>=limit)break}}}
 return out;
}
