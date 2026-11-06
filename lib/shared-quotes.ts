import type {ResourceCache} from './resource-cache';
import type {QuoteRows} from './portfolio-quotes';
import {mergePortfolioQuotes, usablePortfolioQuote} from './portfolio-quotes.ts';
const listeners = new WeakMap<ResourceCache, Set<(symbols:string[]) => void>>();
/** The cache instance belongs to one account. Never broadcast across accounts. */
export function subscribeQuotes(cache: ResourceCache, listener: (symbols:string[]) => void) {
  let group = listeners.get(cache);
  if (!group) listeners.set(cache, group = new Set());
  group.add(listener);
  return () => { group!.delete(listener); };
}
export function publishQuotes(cache: ResourceCache, rows: QuoteRows) {
  const changed:string[] = [];
  for (const [symbol, row] of Object.entries(rows)) {
    if (!usablePortfolioQuote(row.quote)) continue;
    const key = 'quote:' + symbol;
    const old = cache.get(key)?.value as QuoteRows[string] | undefined;
    const merged = mergePortfolioQuotes(old ? {[symbol]:old} : {}, {[symbol]:row}, [symbol])[symbol];
    if (JSON.stringify(old) === JSON.stringify(merged)) continue;
    cache.set(key, {at:Date.now(), value:merged});
    changed.push(symbol);
  }
  if (changed.length) for (const listener of listeners.get(cache) ?? []) listener(changed);
}
export function cachedQuotes(cache: ResourceCache, symbols: string[]): QuoteRows {
  return Object.fromEntries(symbols.flatMap(symbol => {
    const row = cache.get('quote:'+symbol)?.value as QuoteRows[string] | undefined;
    return row ? [[symbol,row]] : [];
  }));
}
