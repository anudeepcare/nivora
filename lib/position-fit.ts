import {sameProviderSymbol} from "./provider-symbol.ts";
import type { Position, Quote } from "./types";
export function positionFit(
  positions: Pick<Position, "symbol" | "quantity" | "assetType">[],
  quotes: Record<string, Quote>,
  symbol: string,
  limit: number | null,
  addition = 0,
  now = Date.now(),
) {
  let total = 0,
    held = 0,
    missing = 0;
  const validLimit =
    limit != null && Number.isFinite(limit) && limit > 0 && limit <= 100
      ? limit
      : null;
  for (const p of positions) {
    if (p.assetType === "cash") continue;
    const q = quotes[p.symbol] ?? Object.entries(quotes).find(([key])=>sameProviderSymbol(key,p.symbol))?.[1],
      at = Date.parse(q?.asOf ?? "");
    if (
      !Number.isFinite(p.quantity) ||
      p.quantity <= 0 ||
      !q ||
      !Number.isFinite(q.price) ||
      q.price! <= 0 ||
      q.currency !== "USD" ||
      q.stale ||
      !Number.isFinite(at) ||
      at > now + 60000 ||
      now - at > 4 * 86400000
    ) {
      missing++;
      continue;
    }
    const value = p.quantity * q.price!;
    total += value;
    if (sameProviderSymbol(p.symbol, symbol)) held += value;
  }
  const complete = missing === 0 && total > 0;
  const currentWeight = complete ? (held / total) * 100 : null;
  const add = Number.isFinite(addition) && addition >= 0 ? addition : 0;
  return {
    complete,
    missing,
    total,
    held,
    currentWeight,
    limit: validLimit,
    atLimit: complete && validLimit != null && currentWeight! >= validLimit,
    afterWeight: complete ? ((held + add) / (total + add)) * 100 : null,
  };
}
