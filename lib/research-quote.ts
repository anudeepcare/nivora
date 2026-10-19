import type { Quote } from './types';
/** Preserve the last usable observation when a refresh has no usable newer price. */
export function retainResearchQuote(prior: Quote | undefined, incoming: Quote | undefined): Quote | undefined {
  const usable = (q: Quote | undefined) => q?.price != null && Number.isFinite(q.price) && q.price > 0;
  if (!usable(prior)) return incoming;
  if (incoming && incoming.currency !== prior!.currency) return incoming;
  if (!usable(incoming)) return prior;
  const oldTime = Date.parse(prior!.asOf || ''), newTime = Date.parse(incoming!.asOf || '');
  return Number.isFinite(oldTime) && (!Number.isFinite(newTime) || newTime < oldTime) ? prior : incoming;
}
