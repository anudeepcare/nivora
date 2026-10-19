import type { Position, Watch } from "./types";
import { symbolInput } from "./format.ts";
const savedSymbol = (value: unknown) => {
  try {
    return symbolInput(value);
  } catch {
    return String(value ?? "")
      .trim()
      .toUpperCase();
  }
};
export function normalizePositions(
  rows: Record<string, unknown>[],
): Position[] {
  return rows.map((r) => ({
    id: String(r.id),
    symbol:
      r.asset_type === "CRYPTO" &&
      /^[A-Z0-9]{2,12}$/.test(String(r.symbol).trim().toUpperCase())
        ? `${String(r.symbol).trim().toUpperCase()}/USD`
        : savedSymbol(r.symbol),
    quantity: Number(r.shares),
    cost: Number(r.avg_cost),
    currency: typeof r.currency === "string" ? r.currency : null,
    assetType:
      r.asset_type === "CASH"
        ? "cash"
        : r.asset_type === "CRYPTO"
          ? "crypto"
          : "stock",
  }));
}
export function normalizeWatchlist(rows: Record<string, unknown>[]): Watch[] {
  const unique = new Map<string, Watch>();
  for (const r of rows)
    if (typeof r.symbol === "string" && !unique.has(savedSymbol(r.symbol)))
      unique.set(savedSymbol(r.symbol), {
        symbol:
          r.asset_type === "CRYPTO" &&
          /^[A-Z0-9]{2,12}$/.test(String(r.symbol).trim().toUpperCase())
            ? `${String(r.symbol).trim().toUpperCase()}/USD`
            : savedSymbol(r.symbol),
        note: "",
        createdAt: String(r.created_at),
      });
  return [...unique.values()];
}
export function workspaceSymbolBatches(
  positions: { symbol: string; assetType: string }[],
  watchlist: { symbol: string }[],
  size = 20,
) {
  const symbols = [
    ...new Set([
      ...positions
        .filter((p) => p.assetType !== "cash")
        .map((p) => p.symbol)
        .sort(),
      ...watchlist.map((w) => w.symbol).sort(),
    ]),
  ];
  const groups: string[][] = [];
  for (let i = 0; i < symbols.length; i += size)
    groups.push(symbols.slice(i, i + size));
  return groups;
}
