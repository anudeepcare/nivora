import { isSentiSenseMarket } from "./market-source-mode";
import { sentiSenseRequest } from "./sentisense-api";
import { eodEnabled, eodProfile } from "./eodhd";
import { sameProviderSymbol } from "./provider-symbol";
import { safeLogoUrl } from "./logo-policy";
import { twelve } from "./providers";
export type LogoProfile = { symbol: string; logoUrl: string | null };
const cache = new Map<string, { until: number; value: Promise<LogoProfile> }>();
export async function companyLogo(symbol: string): Promise<LogoProfile> {
  if (isSentiSenseMarket()) {
    const raw = await sentiSenseRequest(
      `stocks/${encodeURIComponent(symbol)}/profile`,
      {},
      3600,
    );
    const body =
      raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    return {
      symbol,
      logoUrl: safeLogoUrl(
        sameProviderSymbol(body.ticker, symbol) &&
          typeof body.logoUrl === "string"
          ? body.logoUrl
          : null,
      ),
    };
  }
  const old = cache.get(symbol);
  if (old && old.until > Date.now()) return old.value;
  const key = process.env.FINNHUB_API_KEY;
  if (!eodEnabled() && !key && !process.env.TWELVE_DATA_API_KEY)
    return { symbol, logoUrl: null };
  const value = (async () => {
    if (eodEnabled()) {
      try {
        const logoUrl = safeLogoUrl((await eodProfile(symbol)).logoUrl);
        if (logoUrl) return { symbol, logoUrl };
      } catch {
        /* Try the other configured logo source. */
      }
    }
    if (process.env.TWELVE_DATA_API_KEY) {
      try {
        const p = await twelve("logo", { symbol });
        const logoUrl =
          !p.meta?.symbol || p.meta.symbol === symbol
            ? safeLogoUrl(symbol.includes("/") ? p.logo_base : p.url)
            : null;
        if (logoUrl) return { symbol, logoUrl };
      } catch {
        /* A failed optional logo must not block research. */
      }
    }
    if (!key || symbol.includes("/")) return { symbol, logoUrl: null };
    const r = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(key)}`,
      { signal: AbortSignal.timeout(6000), cache: "no-store" },
    );
    if (!r.ok) throw Error("Company logo unavailable");
    const p = await r.json();
    return {
      symbol,
      logoUrl: p.ticker === symbol ? safeLogoUrl(p.logo) : null,
    };
  })().catch(() => {
    cache.delete(symbol);
    return { symbol, logoUrl: null };
  });
  cache.set(symbol, { until: Date.now() + 86400000, value });
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  return value;
}
