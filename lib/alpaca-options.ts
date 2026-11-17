import { normalizeOptions } from "./options-analysis";

type Row = Record<string, any>;
export function joinAlpacaOptions(
  snapshots: Record<string, Row>,
  metadata: Row[],
  now = Date.now(),
) {
  const bySymbol = new Map(metadata.map((c) => [c.symbol, c]));
  return normalizeOptions(
    Object.entries(snapshots).flatMap(([symbol, s]) => {
      const match = symbol.match(/^(.*)(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/);
      if (!match) return [];
      const c = bySymbol.get(symbol),
        q = s.latestQuote;
      // Quote timestamps describe quote inputs; a later trade must not refresh an old quote.
      const observed = q?.t ?? s.latestTrade?.t;
      if (!observed) return [];
      const age = c?.open_interest_date
        ? (now - Date.parse(c.open_interest_date)) / 86400000
        : Infinity;
      return [
        {
          contract: symbol,
          type: match[5] === "C" ? "call" : "put",
          strike: Number(match[6]) / 1000,
          exp_date: `20${match[2]}-${match[3]}-${match[4]}`,
          tradetime: observed,
          bid: q?.bp,
          ask: q?.ap,
          open_interest: age >= 0 && age <= 7 ? c?.open_interest : null,
          contract_size: c?.size ?? 100,
          volatility: s.impliedVolatility,
          ...s.greeks,
          // Latest trade size is NOT daily volume.
          volume: null,
        },
      ];
    }),
    now,
  );
}
export async function alpacaOptions(
  _symbol: string,
  _expiry: string | null,
): Promise<any> {
  throw new Error(
    "Alpaca market data is disabled. Options coverage requires EODHD or SentiSense.",
  );
}
