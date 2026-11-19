import { productHandle } from "./product-entities.ts";
export function companyProductSymbol(v: unknown) {
  return typeof v === "string" && /^[A-Z][A-Z0-9.-]{0,14}$/.test(v) ? v : null;
}
const obj = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const text = (x: unknown, max = 300): x is string =>
  typeof x === "string" &&
  x.trim().length > 0 &&
  x.length <= max &&
  !/[\u0000-\u001f\u007f]/.test(x);
export function companyProducts(raw: unknown, symbol: string) {
  if (!companyProductSymbol(symbol) || !Array.isArray(raw) || raw.length > 1000)
    return null;
  const products: {
    name: string;
    handle: string;
    category: string | null;
    trackedApp: true | null;
  }[] = [];
  const seen = new Set<string>();
  let omittedHandles = 0;
  for (const row of raw) {
    if (!obj(row) || row.relatedStock !== symbol || !text(row.type))
      return null;
    if (row.type !== "PRODUCT") continue;
    if (!text(row.displayName)) return null;
    if (row.urlSlug == null) {
      omittedHandles++;
      continue;
    }
    const handle = productHandle(row.urlSlug);
    if (!handle || seen.has(handle)) return null;
    seen.add(handle);
    products.push({
      name: row.displayName,
      handle,
      category: text(row.category) ? row.category : null,
      trackedApp:
        typeof row.appId === "string" && /^\d{1,20}$/.test(row.appId)
          ? true
          : null,
    });
  }
  return {
    symbol,
    products: products.slice(0, 50),
    returnedEntities: raw.length,
    omittedHandles,
    truncated: products.length > 50,
    retrievedAt: new Date().toISOString(),
  };
}
export type CompanyProducts = NonNullable<ReturnType<typeof companyProducts>>;
