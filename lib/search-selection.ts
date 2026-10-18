import { symbolInput } from "./format.ts";
export function cryptoSearchSymbol(query: string): string | null {
  const q = query.trim().replace(/^\$/, "").toUpperCase();
  if (/^(BTC|BTCUSD|BTC-USD|BTC\/USD|BITCOIN)$/.test(q)) return "BTC/USD";
  if (/^(ETH|ETHUSD|ETH-USD|ETH\/USD|ETHEREUM)$/.test(q)) return "ETH/USD";
  return null;
}
export function searchSelection(
  query: string,
  results: { symbol: string; name: string }[],
  selected = -1,
): string {
  if (selected >= 0 && results[selected]) return results[selected].symbol;
  const q = query.trim().replace(/^\$/, "");
  const crypto = cryptoSearchSymbol(q);
  if (crypto) return crypto;
  const exact = results.find(
    (r) =>
      r.symbol.toUpperCase() === q.toUpperCase() ||
      r.name.toLowerCase() === q.toLowerCase(),
  );
  return exact?.symbol ?? symbolInput(q);
}

/** One cache entry for equivalent ticker/company queries. */
export function searchRequestKey(query: string): string {
  const normalized = query
    .trim()
    .replace(/^\$/, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
  return `search?q=${encodeURIComponent(normalized)}`;
}

/** Reveal a selected result without scrolling the document or dialog ancestors. */
export function searchListScrollTop(
  current: number,
  top: number,
  bottom: number,
  itemTop: number,
  itemBottom: number,
) {
  if (itemTop < top) return Math.max(0, current + itemTop - top);
  if (itemBottom > bottom) return Math.max(0, current + itemBottom - bottom);
  return current;
}
