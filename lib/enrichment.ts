import { eodEnabled, eodEnrichment } from "./eodhd";
import { HttpError } from "./server";
const cache = new Map<string, { until: number; value: Enrichment }>();
export type Enrichment = {
  symbol: string;
  profile: {
    name: string;
    industry: string;
    website: string;
    logo: string;
  } | null;
  insiders: {
    name: string;
    date: string;
    filed: string;
    code: string;
    action: string;
    change: number;
    price: number | null;
  }[];
  earnings: {
    date: string;
    hour: string;
    epsActual: number | null;
    epsEstimate: number | null;
    revenueActual: number | null;
    revenueEstimate: number | null;
  }[];
  issues: string[];
  retrievedAt: string;
  source: string;
};
export async function enrich(symbol: string): Promise<Enrichment> {
  if (eodEnabled()) return eodEnrichment(symbol);
  const prior = cache.get(symbol);
  if (prior && prior.until > Date.now()) return prior.value;
  const key = process.env.FINNHUB_API_KEY;
  if (!key)
    throw new HttpError(
      "Optional company events provider is not configured.",
      503,
    );
  const today = new Date().toISOString().slice(0, 10),
    from = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10),
    to = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
  const get = async (path: string) => {
    const response = await fetch(
      `https://finnhub.io/api/v1/${path}${path.includes("?") ? "&" : "?"}token=${encodeURIComponent(key)}`,
      { signal: AbortSignal.timeout(8000), cache: "no-store" },
    );
    if (!response.ok) throw Error(`Provider status ${response.status}`);
    const data = await response.json();
    if (data.error) throw Error("Provider coverage unavailable");
    return data;
  };
  const results = await Promise.allSettled([
    get(`stock/profile2?symbol=${encodeURIComponent(symbol)}`),
    get(
      `stock/insider-transactions?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${today}`,
    ),
    get(
      `calendar/earnings?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}`,
    ),
  ]);
  const safe = (v: unknown) =>
      typeof v === "string" && v.startsWith("https://") ? v : "",
    number = (v: unknown) =>
      v != null && Number.isFinite(Number(v)) ? Number(v) : null;
  const profile = results[0].status === "fulfilled" ? results[0].value : null,
    insider = results[1].status === "fulfilled" ? results[1].value : null,
    earnings = results[2].status === "fulfilled" ? results[2].value : null;
  const value: Enrichment = {
    symbol,
    profile:
      profile?.ticker === symbol
        ? {
            name: String(profile.name || symbol),
            industry: String(profile.finnhubIndustry || ""),
            website: safe(profile.weburl),
            logo: safe(profile.logo),
          }
        : null,
    insiders: (insider?.data ?? [])
      .filter(
        (v: any) =>
          v.symbol === symbol &&
          v.filingDate <= today &&
          v.transactionDate <= today,
      )
      .slice(0, 50)
      .map((v: any) => ({
        name: String(v.name || "Reported insider"),
        date: String(v.transactionDate),
        filed: String(v.filingDate),
        code: String(v.transactionCode || ""),
        action:
          (
            {
              P: "Open-market purchase",
              S: "Open-market sale",
              A: "Award or grant",
              M: "Exercise or conversion",
              F: "Tax withholding",
              G: "Gift",
            } as Record<string, string>
          )[v.transactionCode] || "Other reported transaction",
        change: number(v.change) ?? 0,
        price: number(v.transactionPrice),
      })),
    earnings: (earnings?.earningsCalendar ?? [])
      .filter((v: any) => v.symbol === symbol)
      .sort((a: any, b: any) => b.date.localeCompare(a.date))
      .slice(0, 12)
      .map((v: any) => ({
        date: String(v.date),
        hour: String(v.hour || ""),
        epsActual: number(v.epsActual),
        epsEstimate: number(v.epsEstimate),
        revenueActual: number(v.revenueActual),
        revenueEstimate: number(v.revenueEstimate),
      })),
    issues: results.flatMap((r, i) =>
      r.status === "rejected"
        ? [
            `${["Company profile", "Insider transactions", "Earnings calendar"][i]} unavailable for this provider entitlement.`,
          ]
        : [],
    ),
    retrievedAt: new Date().toISOString(),
    source: "Finnhub",
  };
  cache.set(symbol, { until: Date.now() + 3600000, value });
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  return value;
}
