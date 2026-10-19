import type {Company,Quote} from './types';
export type QuoteRows=Record<string,{company?:Company;quote?:Quote;error?:string}>;
export type RefreshMode='balanced'|'live'|'hourly'|'manual';
export const refreshIntervals:Record<RefreshMode,number>={balanced:300000,live:120000,hourly:3600000,manual:0};
export function usablePortfolioQuote(q:Quote|undefined){return !!q&&q.currency==='USD'&&typeof q.price==='number'&&Number.isFinite(q.price)&&q.price>0;}
export function mergePortfolioQuotes(prior:QuoteRows,incoming:QuoteRows,symbols:string[]):QuoteRows{
 const result:QuoteRows={};
 for(const symbol of symbols){const old=prior[symbol],next=incoming[symbol];
  const oldGood=usablePortfolioQuote(old?.quote),nextGood=usablePortfolioQuote(next?.quote);
  const oldTime=Date.parse(old?.quote?.asOf||''),nextTime=Date.parse(next?.quote?.asOf||'');
  if(oldGood&&(!nextGood||(Number.isFinite(oldTime)&&(!Number.isFinite(nextTime)||nextTime<oldTime))))result[symbol]={...old,...(next?.company?{company:next.company}:{}),...(next?.error?{error:next.error}:{})};
  else if(next)result[symbol]=next;else if(old)result[symbol]=old;
 }
 return result;
}
export function quoteCoverage(symbols:string[],rows:QuoteRows){
 const result={current:0,older:0,unpriced:0};for(const s of new Set(symbols)){const q=rows[s]?.quote;if(!usablePortfolioQuote(q))result.unpriced++;else if(q!.stale)result.older++;else result.current++;}return result;
}
