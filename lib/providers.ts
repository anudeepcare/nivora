import {
  preferredMarketSources,
  readPreferred,
  readFreshQuote,
  providerCacheSeconds,
} from "./provider-routing";
import {
  eodEnabled,
  eodQuote,
  eodHistory,
  eodFundamentals,
  eodSearch,
} from "./eodhd";
import { normalizeGrow } from "./grow-data";
import { secObservations } from "./sec-observations";
import { reserveProvider } from "./provider-budget";
import type {
  Candle,
  Company,
  Fact,
  Filing,
  Metric,
  Quote,
  Research,
} from "./types";
import { HttpError } from "./server";
import {
  normalizeQuote,
  normalizeBars,
  numeric,
  supportedListing,
} from "./market";
const cache = new Map<string, { expires: number; value: Promise<any> }>();
async function cached<T>(
  key: string,
  ttl: number,
  read: () => Promise<T>,
): Promise<T> {
  const old = cache.get(key);
  if (old && old.expires > Date.now()) return old.value;
  const value = read().catch((e) => {
    cache.delete(key);
    throw e;
  });
  cache.set(key, { expires: Date.now() + ttl, value });
  if (cache.size > 250) cache.delete(cache.keys().next().value!);
  return value;
}
async function json(
  url: string,
  headers: Record<string, string> = {},
  ttl = 0,
) {
  const r = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(18_000),
    ...(ttl > 0
      ? { next: { revalidate: ttl } }
      : { cache: "no-store" as const }),
  });
  if (!r.ok)
    throw new HttpError(
      r.status === 429
        ? "The data provider is at its request limit. Try again shortly."
        : "The requested source is temporarily unavailable.",
      503,
    );
  return r.json();
}
export async function twelve(
  endpoint: string,
  params: Record<string, string>,
  cost = 1,
) {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) throw new HttpError("Market data is not configured.", 503);
  await reserveProvider(cost);
  const data = await json(
    `https://api.twelvedata.com/${endpoint}?${new URLSearchParams({ ...params, apikey: key })}`,
    {},
    providerCacheSeconds(endpoint, params),
  );
  if (data.status === "error")
    throw new HttpError(
      data.code === 429
        ? "Market-data allowance reached. Try again later."
        : "The provider did not return this instrument.",
      503,
    );
  return data;
}
const num = numeric;
const configuredSources = () => ({
  twelve: Boolean(process.env.TWELVE_DATA_API_KEY),
  eodhd: eodEnabled(),
});
export async function quote(
  symbol: string,
): Promise<{ company: Company; quote: Quote }> {
  const sources = preferredMarketSources("quote", configuredSources());
  return cached(
    `selected-quote:${sources.join(",")}:${symbol}`,
    60000,
    async () => {
      const result = await readFreshQuote(sources, async (source) => {
        const value = await (source === "twelve"
          ? twelveQuote(symbol)
          : eodQuote(symbol));
        if (value.quote.price == null)
          throw new HttpError("The quote source returned no price.", 503);
        return value;
      });
      return result.fallback
        ? {
            ...result.value,
            quote: {
              ...result.value.quote,
              source: result.value.quote.source + " · fallback",
            },
          }
        : result.value;
    },
  );
}
async function twelveQuote(
  symbol: string,
): Promise<{ company: Company; quote: Quote }> {
  return cached(`quote:${symbol}`, 60_000, async () => {
    const q = await twelve("quote", { symbol });
    if (String(q.symbol ?? "").toUpperCase() !== symbol)
      throw new HttpError(
        "The provider returned a different instrument. The quote was not used.",
        502,
      );
    if (!symbol.includes("/") && !supportedListing(q))
      throw new HttpError(
        "This listing is outside the supported US/USD equity universe.",
        422,
      );
    let normalized = normalizeQuote(q, symbol);
    if (symbol.endsWith("/USD") || normalized.stale || (normalized.asOf && Date.now()-Date.parse(normalized.asOf)>90000)) {
      // The crypto quote timestamp is often the daily candle's midnight, not a
      // quote observation time. Use a completed minute bar, never fetch time.
      try {
        const series = await twelve("time_series", {
          symbol,
          interval: "1min",
          outputsize: "2",
          timezone: "UTC",
          order: "DESC",
        });
        if (series.meta?.symbol === symbol) {
          const bar = normalizeBars(series.values, true)
            .filter((b) => Date.parse(b.time) + 60000 <= Date.now())
            .at(-1);
          if (
            bar &&
            (!normalized.asOf ||
              Date.parse(bar.time) > Date.parse(normalized.asOf))
          ) {
            const previous = numeric(q.previous_close);
            normalized = normalizeQuote(
              {
                ...q,
                close: bar.close,
                timestamp: Date.parse(bar.time) / 1000,
                percent_change:
                  previous != null && previous > 0
                    ? (bar.close / previous - 1) * 100
                    : null,
              },
              symbol,
            );
            normalized.source = "Twelve Data · 1-minute close";
            normalized.session = "1-minute close";
          }
        }
      } catch {
        // Keep the provider's dated daily observation explicitly stale on outage.
      }
    }
    return {
      company: {
        symbol,
        name: typeof q.name === "string" ? q.name : symbol,
        exchange: q.exchange || "",
        currency: normalized.currency,
        assetType: symbol.includes("/") ? "crypto" : "stock",
      },
      quote: normalized,
    };
  });
}
export type ChartRange = "1D" | "1W" | "1M" | "6M" | "1Y" | "5Y";
export async function marketHistory(symbol: string, range: ChartRange = "5Y") {
  const sources = preferredMarketSources(
    range === "1D" || range === "1W" ? "intraday" : "daily",
    configuredSources(),
  );
  return cached(
    `selected-history:${sources.join(",")}:${symbol}:${range}`,
    range === "1D" || range === "1W" ? 60000 : 900000,
    async () => {
      const result = await readPreferred(sources, async (source) => {
        const candles = await (source === "eodhd"
          ? eodHistory(symbol, range)
          : twelveHistory(symbol, range));
        if (!candles.length)
          throw new HttpError(
            "No price observations were returned for this period.",
            503,
          );
        return candles;
      });
      return {
        candles: result.value,
        source:
          (result.provider === "eodhd" ? "EODHD" : "Twelve Data") +
          (result.fallback ? " · fallback" : ""),
      };
    },
  );
}
export async function history(
  symbol: string,
  range: ChartRange = "5Y",
): Promise<Candle[]> {
  return (await marketHistory(symbol, range)).candles;
}
async function twelveHistory(
  symbol: string,
  range: ChartRange,
): Promise<Candle[]> {
  return cached(
    `history:${symbol}:${range}`,
    range === "1D" || range === "1W" ? 60_000 : 15 * 60_000,
    async () => {
      const intraday = range === "1D" || range === "1W",
        interval = range === "1D" ? "5min" : range === "1W" ? "1h" : "1day",
        count = {
          "1D": "400",
          "1W": "168",
          "1M": "32",
          "6M": "184",
          "1Y": "367",
          "5Y": "1830",
        }[range];
      const data = await twelve("time_series", {
        symbol,
        interval,
        outputsize: count,
        timezone: "UTC",
        order: "ASC",
        adjust: "splits",
      });
      if (String(data.meta?.symbol ?? "").toUpperCase() !== symbol)
        throw new HttpError(
          "Price history belongs to a different instrument and was not used.",
          502,
        );
      const bars = normalizeBars(data.values, intraday);
      if (range === "1D" && bars.length) {
        const end = Date.parse(bars.at(-1)!.time),
          continuous = symbol.includes("/");
        return bars.filter((b) =>
          continuous
            ? Date.parse(b.time) > end - 86400_000
            : b.time.slice(0, 10) === bars.at(-1)!.time.slice(0, 10),
        );
      }
      if (range === "1W" && bars.length) {
        const end = Date.parse(bars.at(-1)!.time);
        return bars.filter((b) => Date.parse(b.time) > end - 7 * 86400_000);
      }
      return bars;
    },
  );
}
const tags: Record<Metric, string[]> = {
  depreciation: ["DepreciationDepletionAndAmortization", "DepreciationDepletionAndAmortizationPropertyPlantAndEquipment"],
  receivables: ["AccountsReceivableNetCurrent", "ReceivablesNetCurrent"],
  inventory: ["InventoryNet"],
  payables: ["AccountsPayableCurrent"],
  retainedEarnings: ["RetainedEarningsAccumulatedDeficit"],
  revenue: [
    "RevenueFromContractWithCustomerExcludingAssessedTax",
    "RevenueFromContractWithCustomerIncludingAssessedTax",
    "Revenues",
    "SalesRevenueNet",
    "Revenue",
  ],
  netIncome: ["NetIncomeLoss", "ProfitLoss"],
  operatingIncome: ["OperatingIncomeLoss", "ProfitLossFromOperatingActivities"],
  operatingCashFlow: [
    "NetCashProvidedByUsedInOperatingActivities",
    "CashFlowsFromUsedInOperatingActivities",
  ],
  capex: [
    "PaymentsToAcquirePropertyPlantAndEquipment",
    "PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities",
  ],
  cash: ["CashAndCashEquivalentsAtCarryingValue", "CashAndCashEquivalents"],
  debt: [
    "LongTermDebtAndCapitalLeaseObligationsIncludingCurrentMaturities",
    "LongTermDebtCurrentAndNoncurrent",
  ],
  assets: ["Assets"],
  liabilities: ["Liabilities"],
  shares: [
    "CommonStockSharesOutstanding",
    "EntityCommonStockSharesOutstanding",
  ],
  eps: ["EarningsPerShareDiluted", "DilutedEarningsLossPerShare"],
  grossProfit: ["GrossProfit"],
  costOfRevenue: ["CostOfRevenue", "CostOfGoodsAndServicesSold", "CostOfSales"],
  researchExpense: ["ResearchAndDevelopmentExpense"],
  stockCompensation: ["ShareBasedCompensation", "SharebasedPaymentExpense"],
  buybacks: [
    "PaymentsForRepurchaseOfCommonStock",
    "PaymentsForRepurchaseOfEquity",
  ],
  dividends: [
    "PaymentsOfDividendsCommonStock",
    "PaymentsOfDividends",
    "DividendsPaidClassifiedAsFinancingActivities",
  ],
  weightedShares: [
    "WeightedAverageNumberOfDilutedSharesOutstanding",
    "AdjustedWeightedAverageShares",
  ],
  equity: ["StockholdersEquity", "EquityAttributableToOwnersOfParent"],
  currentAssets: ["AssetsCurrent", "CurrentAssets"],
  currentLiabilities: ["LiabilitiesCurrent", "CurrentLiabilities"],
  interestExpense: [
    "InterestExpense",
    "InterestAndDebtExpense",
    "InterestExpenseNonOperating",
  ],
};
async function sec(path: string) {
  const agent = process.env.SEC_USER_AGENT;
  if (!agent || agent.includes("example.com"))
    throw new HttpError(
      "Configure a valid SEC contact identity to load filings.",
      503,
    );
  return json(path, { "User-Agent": agent, Accept: "application/json" });
}
export async function fundamentals(
  symbol: string,
): Promise<Awaited<ReturnType<typeof secFundamentals>>> {
  if (!eodEnabled()) return secFundamentals(symbol);
  try {
    return await eodFundamentals(symbol);
  } catch {
    const [reported, profile] = await Promise.allSettled([
      secFundamentals(symbol),
      process.env.TWELVE_DATA_API_KEY
        ? cached(`fallback-profile:${symbol}`, 86400000, async () => {
            const raw = await twelve("profile", { symbol }, 10);
            const p = normalizeGrow(
              symbol,
              "profile",
              raw,
              new Date().toISOString(),
            ).profile;
            if (!p) throw new Error("Company profile unavailable");
            return {
              symbol,
              name: p.name,
              sector: p.sector,
              description: p.description,
              assetType: "stock" as const,
              exchange: String(raw.exchange || ""),
              currency: /^[A-Z]{3}$/.test(raw.currency) ? raw.currency : "USD",
            };
          })
        : Promise.reject(new Error("Profile provider not configured")),
    ]);
    const result =
      reported.status === "fulfilled"
        ? reported.value
        : {
            facts: [],
            filings: [],
            name: symbol,
            issues: [
              "Reported financials unavailable from the fallback source.",
            ],
          };
    const company = profile.status === "fulfilled" ? profile.value : undefined;
    return {
      ...result,
      name: company?.name || result.name,
      ...(company ? { company } : {}),
      issues: [
        "Primary company data unavailable; fallback coverage is shown where available.",
        ...result.issues,
      ],
    };
  }
}
async function secFundamentals(symbol: string): Promise<{
  facts: Fact[];
  filings: Filing[];
  name: string;
  issues: string[];
  evidence?: import("./eodhd-normalize").EodEvidence;
  company?: Company;
}> {
  const result = await cached(`sec:${symbol}`, 6 * 3600_000, async () => {
    const tickers = await cached<Record<string, any>>(
      "sec-tickers",
      86400_000,
      () => sec("https://www.sec.gov/files/company_tickers.json"),
    );
    const match = Object.values(tickers).find(
      (v: any) => v.ticker === symbol.replaceAll(".", "-"),
    );
    if (!match)
      throw new HttpError(
        "SEC company facts are not available for this listing.",
        404,
      );
    const cik = String(match.cik_str).padStart(10, "0");
    const sources = await Promise.allSettled([
      sec(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`),
      sec(`https://data.sec.gov/submissions/CIK${cik}.json`),
    ]);
    const company = sources[0].status === "fulfilled" ? sources[0].value : null;
    const submissions =
      sources[1].status === "fulfilled" ? sources[1].value : null;
    const issues = sources.flatMap((source, i) =>
      source.status === "rejected"
        ? [
            `${i === 0 ? "Financial facts" : "Company disclosures"}: Source temporarily unavailable. Retry to refresh this source.`,
          ]
        : [],
    );
    const facts: Fact[] = [];
    for (const [metric, names] of Object.entries(tags))
      for (const [taxonomy, basis] of [
        ["us-gaap", "GAAP"],
        ["ifrs-full", "IFRS"],
        ["dei", "GAAP"],
      ] as const) {
        for (const { tag, unit, row } of secObservations(
          company?.facts?.[taxonomy],
          names,
        )) {
          if (
            !["10-K", "10-Q", "20-F", "40-F", "10-K/A", "10-Q/A"].includes(
              row.form,
            ) ||
            num(row.val) == null ||
            !row.end ||
            !row.filed ||
            !row.accn
          )
            continue;
          const days = row.start
            ? (Date.parse(row.end) - Date.parse(row.start)) / 86400_000
            : 0;
          const scope = !row.start
            ? "instant"
            : days >= 330 && days <= 400
              ? "annual"
              : days >= 60 && days <= 110
                ? "quarterly"
                : days > 110 && days < 330
                  ? "ytd"
                  : null;
          if (!scope) continue;
          facts.push({
            id: [taxonomy, tag, unit, row.start, row.end, row.accn].join(":"),
            metric: metric as Metric,
            value: Number(row.val),
            unit,
            currency: /^[A-Z]{3}$/.test(unit)
              ? unit
              : unit.endsWith("/shares")
                ? unit.split("/")[0]
                : null,
            start: row.start ?? null,
            end: row.end,
            filed: row.filed,
            accession: row.accn,
            form: row.form,
            basis,
            scope,
            sourceUrl: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${row.accn.replaceAll("-", "")}/`,
          });
        }
      }
    const recent = submissions?.filings?.recent,
      filings: Filing[] = [];
    // Insider forms can occupy the first hundreds of rows. Filter before limiting.
    for (
      let i = 0;
      i < (recent?.form?.length ?? 0) && filings.length < 20;
      i++
    ) {
      if (
        ![
          "10-K",
          "10-Q",
          "8-K",
          "6-K",
          "20-F",
          "40-F",
          "10-K/A",
          "10-Q/A",
          "20-F/A",
          "40-F/A",
        ].includes(recent.form[i]) ||
        !/^\d{10}-\d{2}-\d{6}$/.test(recent.accessionNumber?.[i] ?? "") ||
        !recent.primaryDocument?.[i] ||
        !/^\d{4}-\d{2}-\d{2}$/.test(recent.filingDate?.[i] ?? "")
      )
        continue;
      filings.push({
        form: recent.form[i],
        date: recent.filingDate[i],
        title: recent.primaryDocDescription?.[i] || recent.form[i],
        url: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${recent.accessionNumber[i].replaceAll("-", "")}/${recent.primaryDocument[i]}`,
      });
    }
    return { facts, filings, name: company?.entityName || match.title, issues };
  });
  // A partial provider failure must be retryable, not cached for six hours.
  if (result.issues.length) cache.delete(`sec:${symbol}`);
  return result;
}
export async function research(symbol: string): Promise<Research> {
  const results = await Promise.allSettled([
    quote(symbol),
    marketHistory(symbol),
    symbol.includes("/")
      ? Promise.resolve({
          facts: [],
          filings: [],
          name: symbol,
          issues: [],
          evidence: undefined,
          company: undefined,
        })
      : fundamentals(symbol),
  ]);
  const q = results[0].status === "fulfilled" ? results[0].value : null,
    h =
      results[1].status === "fulfilled"
        ? results[1].value
        : { candles: [], source: "Unavailable" },
    f = results[2].status === "fulfilled" ? results[2].value : null;
  const issues = results.flatMap((r, i) =>
    r.status === "rejected"
      ? [
          `${["Quote", "Price history", "Company fundamentals"][i]}: ${r.reason instanceof HttpError ? r.reason.message : "Source unavailable."}`,
        ]
      : [],
  );
  return {
    company: f?.company ??
      q?.company ?? {
        symbol,
        name: f?.name || symbol,
        currency: "USD",
        exchange: "",
        assetType: symbol.includes("/") ? "crypto" : "stock",
      },
    quote: q?.quote ?? {
      price: null,
      changePct: null,
      currency: "USD",
      asOf: null,
      session: "Unavailable",
      source: process.env.TWELVE_DATA_API_KEY
        ? "Twelve Data"
        : eodEnabled()
          ? "EODHD"
          : "Unconfigured",
      stale: true,
    },
    history: h.candles,
    historySource: h.source,
    facts: f?.facts ?? [],
    evidence: f?.evidence,
    filings: f?.filings ?? [],
    retrievedAt: new Date().toISOString(),
    issues: [...issues, ...(f?.issues ?? [])],
  };
}
export async function search(query: string) {
  query = query.trim().toUpperCase();
  return cached(`search:${query}`, 3600_000, async () => {
    if (eodEnabled()) {
      try {
        const rows = await eodSearch(query);
        if (rows.length || !process.env.TWELVE_DATA_API_KEY) return rows;
      } catch (error) {
        if (!process.env.TWELVE_DATA_API_KEY) throw error;
      }
    }
    const result = await twelve("symbol_search", {
      symbol: query,
      outputsize: "50",
    });
    return (result.data ?? [])
      .filter(
        (v: any) =>
          supportedListing(v) ||
          (v.instrument_type === "Digital Currency" &&
            String(v.symbol).endsWith("/USD")),
      )
      .sort(
        (a: any, b: any) =>
          Number(b.symbol === query) - Number(a.symbol === query),
      )
      .slice(0, 12)
      .map((v: any) => ({
        symbol: v.symbol,
        name: v.instrument_name,
        exchange: v.exchange,
        currency: v.currency,
        assetType:
          v.instrument_type === "Digital Currency" ? "crypto" : "stock",
      }));
  });
}
