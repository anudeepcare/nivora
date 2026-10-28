import {sharedEodRead,MarketGuardError,pauseSharedEod} from "./shared-market";
import {canonicalMarketKey} from "./market-policy";
import { HttpError } from "./server";
import {
  eodTicker,
  normalizeEodBars,
  normalizeEodQuote,
  normalizeEodSearch,
  normalizeEodFundamentals,
  type EodEvidence,
} from "./eodhd-normalize";
import { cryptoSearchSymbol } from "./search-selection";
import type { Company, Filing } from "./types";
import type { ChartRange } from "./providers";
import type { GrowData, GrowDataset } from "./grow-data";
class EodAccessError extends HttpError {}
class EodBackoffError extends HttpError { seconds:number;constructor(message:string,seconds:number){super(message,503);this.seconds=seconds;} }
const cache = new Map<string, { expires: number; value: Promise<any> }>();
export const eodEnabled = () =>
  Boolean(process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN);
export async function eodRequest(
  path: string,
  params: Record<string, string> = {},
  ttl = 300000,
): Promise<any> {
  const token = process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN;
  if (!token)
    throw new HttpError(
      "Add EODHD_API_KEY to the server environment to connect your subscription.",
      503,
    );
  const key = canonicalMarketKey(path,params),
    old = cache.get(key);
  if (old && old.expires > Date.now()) return old.value;
  const value = sharedEodRead(token,path,params,ttl,async () => {
    const response = await fetch(
      `https://eodhd.com/api/${path}?${new URLSearchParams({ ...params, api_token: token, fmt: "json" })}`,
      {
        next: { revalidate: Math.max(1, Math.ceil(ttl / 1000)) },
        signal: AbortSignal.timeout(15000),
      },
    );
    if(response.status===402 && path.startsWith("mp/unicornbay/options/"))throw new EodAccessError("Options dataset access is not enabled for this account.",503);
    if(response.status===429||response.status===402){
      const raw=response.headers.get('Retry-After'),parsed=raw?Number(raw):NaN;
      const seconds=response.status===402?Math.ceil((Date.parse(new Date(Date.now()+86400000).toISOString().slice(0,10))-Date.now())/1000):Math.max(1,Math.min(3600,Number.isFinite(parsed)?parsed:60));
      await pauseSharedEod(token,seconds);
      throw new EodBackoffError(response.status===402?'Updates temporarily limited: the market-data allowance is exhausted.':'Updates temporarily paused by the data source. Please retry later.',seconds);
    }
    if (response.status === 401 || response.status === 403)
      throw new EodAccessError(
        "EODHD did not authorize this dataset. Check the key and plan entitlement.",
        503,
      );
    if (!response.ok)
      throw new HttpError(
        response.status === 401 || response.status === 403
          ? "EODHD did not authorize this dataset. Check the key and plan entitlement."
          : response.status === 402
            ? "Updates temporarily limited: the market-data allowance is exhausted."
            : response.status === 429
            ? "EODHD request allowance reached. Retry shortly."
            : "EODHD could not return this dataset. Retry shortly.",
        503,
      );
    const data = await response.json();
    if (data?.error || data?.errors)
      throw new HttpError(
        "EODHD returned a dataset error. Check instrument coverage and entitlement.",
        503,
      );
    return data;
  }).catch((e) => {
    if (e instanceof EodAccessError || e instanceof EodBackoffError) {
      const entry = cache.get(key);
      if (entry) entry.expires = Date.now() + (e instanceof EodBackoffError?e.seconds*1000:60000);
    } else cache.delete(key);
    throw e instanceof MarketGuardError?new HttpError(e.message,503):e;
  });
  cache.set(key, { expires: Date.now() + ttl, value });
  // Full fundamental objects are large; bound their lifetime and retained count.
  if (cache.size > 80) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  return value;
}
async function fundamentalPayload(
  symbol: string,
  params: Record<string, string> = {},
  ttl = 21600000,
) {
  try {
    return await eodRequest(
      `v1.1/fundamentals/${eodTicker(symbol)}`,
      params,
      ttl,
    );
  } catch (error) {
    if (!(error instanceof EodAccessError)) throw error;
    // Some accounts authorize the original endpoint only. Use its complete
    // response; never combine financial periods across endpoint versions.
    return eodRequest(`fundamentals/${eodTicker(symbol)}`, params, ttl);
  }
}
export async function eodProfile(symbol: string): Promise<Company> {
  if (symbol.includes("/"))
    return {
      symbol,
      name:
        symbol === "BTC/USD"
          ? "Bitcoin"
          : symbol === "ETH/USD"
            ? "Ethereum"
            : symbol,
      exchange: "Crypto",
      currency: "USD",
      assetType: "crypto",
    };
  const raw = await fundamentalPayload(symbol, { filter: "General" }, 86400000);
  return normalizeEodFundamentals(
    symbol,
    { General: raw.General ?? raw },
    new Date().toISOString(),
  ).company;
}
export async function eodQuote(symbol: string) {
  const [q, profile] = await Promise.all([
    eodRequest(`real-time/${eodTicker(symbol)}`, {}, 60000),
    eodProfile(symbol).catch(() => null),
  ]);
  return {
    quote: normalizeEodQuote(symbol, q),
    company: profile ?? {
      symbol,
      name: symbol,
      currency: "USD",
      exchange: symbol.includes("/") ? "Crypto" : "US",
      assetType: symbol.includes("/")
        ? ("crypto" as const)
        : ("stock" as const),
    },
  };
}
export async function eodHistory(symbol: string, range: ChartRange) {
  const now = Date.now(),
    ticker = eodTicker(symbol),
    intraday = range === "1D" || range === "1W";
  if (intraday) {
    const raw = await eodRequest(
      `intraday/${ticker}`,
      {
        interval: range === "1D" ? "5m" : "1h",
        from: String(
          Math.floor((now - (range === "1D" ? 7 : 10) * 86400000) / 1000),
        ),
        to: String(Math.floor(now / 1000)),
      },
      60000,
    );
    const rows = normalizeEodBars(raw, true),
      end = rows.at(-1)?.time;
    if (!end) return [];
    return rows.filter((x) =>
      range === "1D" && !symbol.includes("/")
        ? x.time.slice(0, 10) === end.slice(0, 10)
        : Date.parse(x.time) >
          Date.parse(end) - (range === "1D" ? 1 : 7) * 86400000,
    );
  }
  const from = new Date(
    now -
      ({ "1M": 40, "6M": 190, "1Y": 370, "5Y": 1850 }[range] ?? 1850) *
        86400000,
  )
    .toISOString()
    .slice(0, 10);
  const [raw, splits] = await Promise.all([
    eodRequest(`eod/${ticker}`, { from, period: "d", order: "a" }, 900000),
    symbol.includes("/")
      ? Promise.resolve([])
      : eodRequest(`splits/${ticker}`, { from }, 86400000),
  ]);
  if (!Array.isArray(raw) || !Array.isArray(splits))
    throw new HttpError(
      "Price history or split history is unavailable; unadjusted prices were not used.",
      503,
    );
  return normalizeEodBars(raw, false, splits);
}
export async function eodFundamentals(symbol: string) {
  const raw = await fundamentalPayload(symbol);
  return normalizeEodFundamentals(symbol, raw, new Date().toISOString());
}
export async function eodSearch(query: string) {
  const crypto = cryptoSearchSymbol(query);
  const raw = await eodRequest(
    `search/${encodeURIComponent(query)}`,
    { limit: "40", ...(crypto ? {} : { exchange: "US" }) },
    3600000,
  );
  const rows = normalizeEodSearch(raw);
  if (crypto && !rows.some((x) => x.symbol === crypto))
    rows.unshift(await eodProfile(crypto));
  return rows
    .sort(
      (a, b) =>
        Number(b.symbol === (crypto ?? query.toUpperCase())) -
        Number(a.symbol === (crypto ?? query.toUpperCase())),
    )
    .slice(0, 12);
}
export async function eodCompanyData(
  symbol: string,
  dataset: GrowDataset,
): Promise<GrowData> {
  const output: GrowData = {
    symbol,
    dataset,
    source: "EODHD",
    retrievedAt: new Date().toISOString(),
    currency: null,
    profile: null,
    earnings: [],
    dividends: [],
    splits: [],
    announcements: [],
  };
  if (dataset === "profile" || dataset === "earnings") {
    const f = await eodFundamentals(symbol),
      p = f.evidence.profile;
    output.currency = f.evidence.reportingCurrency;
    if (dataset === "profile")
      output.profile = {
        name: f.name,
        description: p.description,
        sector: p.sector,
        industry: p.industry,
        ceo: "",
        employees: p.employees,
        country: p.country,
        website: p.website,
      };
    else
      output.earnings = f.evidence.earnings.map((x) => ({
        date: x.date,
        time: x.time,
        actual: x.actual,
        estimate: x.estimate,
        surprise: x.surprise,
      }));
  } else if (dataset === "announcements") {
    const data = await eodNews(symbol);
    output.announcements = data.items.map((x) => ({
      date: x.date,
      title: x.title,
    }));
  } else {
    const data = await eodRequest(
      `${dataset === "dividends" ? "div" : "splits"}/${eodTicker(symbol)}`,
      {
        from: new Date(Date.now() - 5 * 366 * 86400000)
          .toISOString()
          .slice(0, 10),
      },
      86400000,
    );
    const rows = (Array.isArray(data) ? data : [])
      .filter((x: any) => /^\d{4}-\d{2}-\d{2}$/.test(x.date))
      .sort((a: any, b: any) => b.date.localeCompare(a.date))
      .slice(0, 40);
    if (dataset === "splits")
      output.splits = rows.map((x: any) => ({
        date: x.date,
        description: `${x.split} split`,
      }));
    else
      output.dividends = rows.map((x: any) => ({
        date: x.date,
        amount: typeof x.value === "number" ? x.value : null,
      }));
  }
  return output;
}
export type EodNews = {
  items: {
    date: string;
    title: string;
    url: string;
    sentiment: number | null;
  }[];
  source: string;
  retrievedAt: string;
};
export async function eodNews(symbol: string): Promise<EodNews> {
  const raw = await eodRequest(
    "news",
    { s: eodTicker(symbol), limit: "12", offset: "0" },
    3600000,
  );
  const items = (Array.isArray(raw) ? raw : []).flatMap((x: any) => {
    try {
      const u = new URL(x.link);
      if (
        u.protocol !== "https:" ||
        u.username ||
        u.password ||
        !Number.isFinite(Date.parse(x.date)) ||
        Date.parse(x.date) > Date.now()
      )
        return [];
      return [
        {
          date: String(x.date).slice(0, 10),
          title: String(x.title ?? "").slice(0, 400),
          url: u.href,
          sentiment:
            typeof x.sentiment?.polarity === "number"
              ? x.sentiment.polarity
              : null,
        },
      ];
    } catch {
      return [];
    }
  });
  return {
    items,
    source: "EODHD · publisher links",
    retrievedAt: new Date().toISOString(),
  };
}
export async function eodEnrichment(symbol: string) {
  const f = await eodFundamentals(symbol),
    e = f.evidence;
  return {
    symbol,
    profile: {
      name: f.name,
      industry: e.profile.industry,
      website: e.profile.website ?? "",
      logo: e.profile.logo ?? "",
    },
    insiders: e.insiders.map((x) => ({
      ...x,
      change: x.change ?? 0,
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
        )[x.code] ?? "Other reported transaction",
    })),
    earnings: e.earnings.map((x) => ({
      date: x.date,
      hour: x.time,
      epsActual: x.actual,
      epsEstimate: x.estimate,
      revenueActual: null,
      revenueEstimate: null,
    })),
    issues: [],
    retrievedAt: new Date().toISOString(),
    source: "EODHD",
  };
}
export async function eodFilings(
  symbol: string,
): Promise<{ filings: Filing[]; issues: string[] }> {
  const raw = await fundamentalPayload(symbol),
    cik = String(raw.General?.CIK ?? "");
  if (!/^\d{1,10}$/.test(cik))
    return {
      filings: [],
      issues: ["This listing has no SEC identifier in the provider response."],
    };
  const forms = ["10k", "10q", "8k"];
  const results = await Promise.allSettled(
    forms.map((form) =>
      eodRequest(
        `sec-filings/${eodTicker(symbol)}/${form}`,
        { "page[limit]": "4" },
        21600000,
      ),
    ),
  );
  const day = new Date().toISOString().slice(0, 10);
  const filings = results
    .flatMap((r, i) =>
      r.status === "fulfilled" && Array.isArray(r.value?.data)
        ? r.value.data.flatMap((x: any) => {
            if (
              !/^\d{10}-\d{2}-\d{6}$/.test(x.accession_number) ||
              !/^\d{4}-\d{2}-\d{2}$/.test(x.filed_at) ||
              x.filed_at > day
            )
              return [];
            return [
              {
                form: forms[i].replace(/(\d+)([kq])/, "$1-$2").toUpperCase(),
                date: x.filed_at,
                title:
                  forms[i] === "8k"
                    ? (x.item_sections ?? [])
                        .map((s: any) => String(s.title ?? ""))
                        .filter(Boolean)
                        .join(" · ")
                        .slice(0, 250) || "Material event disclosure"
                    : "Financial report",
                url: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${x.accession_number.replaceAll("-", "")}/`,
              },
            ];
          })
        : [],
    )
    .sort((a: Filing, b: Filing) => b.date.localeCompare(a.date));
  return {
    filings,
    issues: results.flatMap((r, i) =>
      r.status === "rejected"
        ? [`${forms[i].toUpperCase()} filings unavailable for this listing.`]
        : [],
    ),
  };
}
