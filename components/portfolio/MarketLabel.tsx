import {quoteStatus} from './quote-status';
export {fetchQuotes} from './quote-client';
export {quoteStatus,quoteCoverage} from './quote-status';
export const money=(x:number|null|undefined)=>x==null?'—':x.toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:2});
export function MarketLabel({market,now}:{market:any;now?:number}){const status=quoteStatus(market,now),date=status.timestamp?new Date(status.timestamp):null;return <small className="pmQuote">{status.label}{market?.session?` · ${String(market.session).replaceAll('_',' ')}`:''}{date?` · ${date.toLocaleString()}`:''}{market?.sources?.length?` · ${Array.from(new Set(market.sources.map((s:any)=>s.provider).filter(Boolean))).join(', ')}`:''}</small>}
