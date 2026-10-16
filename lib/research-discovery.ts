export type SearchResult = {symbol: string; name: string; exchange?: string; type?: string};
export type RecentResearch = SearchResult & {visitedAt: string};

export function validResearchSymbol(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Z0-9][A-Z0-9.-]{0,19}(?:\/[A-Z0-9]{2,10})?$/.test(value) && !value.includes('..');
}

export function rankSearchResults(query: string, results: unknown[]): SearchResult[] {
  const term = query.trim().toUpperCase();
  if (!term) return [];
  const seen = new Set<string>();
  const matches: SearchResult[] = [];
  for (const value of results) {
    if (!value || typeof value !== 'object') continue;
    const item = value as SearchResult;
    const symbol = typeof item.symbol === 'string' ? item.symbol.toUpperCase().trim() : '';
    if (!validResearchSymbol(symbol) || seen.has(symbol) || typeof item.name !== 'string') continue;
    if (!symbol.includes(term) && !item.name.toUpperCase().includes(term)) continue;
    seen.add(symbol);
    matches.push({...item, symbol, name: item.name.slice(0, 160)});
  }
  const rank = (item: SearchResult) => item.symbol === term ? 0 : item.symbol.split('/')[0] === term ? 1 : item.symbol.startsWith(term) ? 2 : item.name.toUpperCase().startsWith(term) ? 3 : 4;
  return matches.sort((a, b) => rank(a) - rank(b) || a.symbol.localeCompare(b.symbol)).slice(0, 7);
}

export function mergeRecentResearch(previous: unknown, next?: RecentResearch): RecentResearch[] {
  const all = [...(Array.isArray(previous) ? previous : []), ...(next ? [next] : [])];
  const unique = new Map<string, RecentResearch>();
  for (const item of all) {
    if (!item || !validResearchSymbol(item.symbol) || typeof item.name !== 'string' || typeof item.visitedAt !== 'string' || !Number.isFinite(Date.parse(item.visitedAt))) continue;
    const old = unique.get(item.symbol);
    if (!old || Date.parse(old.visitedAt) <= Date.parse(item.visitedAt)) unique.set(item.symbol, {symbol: item.symbol, name: item.name.slice(0, 160), visitedAt: item.visitedAt});
  }
  return [...unique.values()].sort((a, b) => Date.parse(b.visitedAt) - Date.parse(a.visitedAt)).slice(0, 8);
}

export const recentResearchKey = (userId: string) => `auryn-recent-research-v1:${userId}`;
