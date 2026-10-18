import type { Candle, Company, Fact, Metric, Quote } from "./types";
import { numeric, normalizeBars } from "./market.ts";
const text = (v: unknown) => (typeof v === "string" ? v.slice(0, 10000) : "");
const date = (v: unknown) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v.slice(0, 10)) &&
  Number.isFinite(Date.parse(v))
    ? v.slice(0, 10)
    : null;
const entries = (v: any): any[] =>
  v && typeof v === "object" ? Object.values(v) : [];
export const eodSource =
  "https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds";
export function eodTicker(symbol: string) {
  if (/^[A-Z0-9]{2,12}\/USD$/.test(symbol))
    return symbol.replace("/", "-") + ".CC";
  if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol))
    throw Error("Invalid instrument");
  return symbol.replaceAll(".", "-") + ".US";
}
export function normalizeEodSearch(raw: unknown): Company[] {
  if (!Array.isArray(raw)) return [];
  const rows: Company[] = [];
  for (const x of raw) {
    if (x.Exchange === "CC" && /^[A-Z0-9]{2,12}-USD$/.test(x.Code))
      rows.push({
        symbol: x.Code.replace("-", "/"),
        name: text(x.Name) || x.Code,
        exchange: "Crypto",
        currency: "USD",
        assetType: "crypto",
      });
    else if (
      x.Exchange === "US" &&
      x.Currency === "USD" &&
      /^[A-Z][A-Z0-9.-]{0,14}$/.test(x.Code) &&
      ["Common Stock", "Preferred Stock", "ETF"].includes(x.Type)
    )
      rows.push({
        symbol: x.Code,
        name: text(x.Name) || x.Code,
        exchange: "US",
        currency: "USD",
        assetType: "stock",
      });
  }
  return [...new Map(rows.map((x) => [x.symbol, x])).values()];
}
export function normalizeEodQuote(
  symbol: string,
  raw: any,
  now = Date.now(),
): Quote {
  if (String(raw?.code ?? "").toUpperCase() !== eodTicker(symbol))
    throw Error("Quote belongs to a different instrument");
  const stamp = numeric(raw.timestamp),
    ms = stamp == null ? NaN : stamp * 1000;
  const asOf =
    Number.isFinite(ms) && Math.abs(ms) < 8.64e15
      ? new Date(ms).toISOString()
      : null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (key: string) => parts.find((x) => x.type === key)?.value ?? "";
  const minute = Number(part("hour")) * 60 + Number(part("minute"));
  const open =
    !["Sat", "Sun"].includes(part("weekday")) && minute >= 570 && minute <= 990;
  const crypto = symbol.includes("/"),
    price = numeric(raw.close);
  return {
    price: price != null && price > 0 ? price : null,
    changePct: numeric(raw.change_p),
    currency: "USD",
    asOf,
    source: "EODHD · delayed / indicative",
    session: crypto
      ? "Continuous market · indicative"
      : open
        ? "Delayed quote"
        : "Last available quote",
    stale:
      !asOf ||
      ms > now + 60000 ||
      now - ms > (crypto ? 20 * 60000 : open ? 45 * 60000 : 4 * 86400000),
  };
}
export function normalizeEodBars(
  raw: unknown,
  intraday = false,
  splits: unknown = [],
  asOf = new Date().toISOString(),
): Candle[] {
  if (!Array.isArray(raw)) return [];
  const day = asOf.slice(0, 10);
  const actions = (Array.isArray(splits) ? splits : []).flatMap((x) => {
    const d = date(x.date),
      match = /^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(String(x.split));
    if (
      !d ||
      d > day ||
      !match ||
      Number(match[1]) <= 0 ||
      Number(match[2]) <= 0
    )
      return [];
    return [{ date: d, ratio: Number(match[1]) / Number(match[2]) }];
  });
  return normalizeBars(
    raw.map((x) => {
      const d = String(x.date ?? x.datetime ?? "").slice(0, 10);
      const factor = intraday
        ? 1
        : actions.filter((s) => s.date > d).reduce((v, s) => v / s.ratio, 1);
      return {
        datetime: intraday ? x.datetime : x.date,
        open: numeric(x.open) == null ? null : Number(x.open) * factor,
        high: numeric(x.high) == null ? null : Number(x.high) * factor,
        low: numeric(x.low) == null ? null : Number(x.low) * factor,
        close: numeric(x.close) == null ? null : Number(x.close) * factor,
        volume: x.volume,
      };
    }),
    intraday,
    Date.parse(asOf),
  ).filter((x) => x.time.slice(0, 10) <= day);
}
export type EodEvidence = {
  updatedAt: string | null;
  source: string;
  reportingCurrency: string | null;
  highlights: Record<string, number | null>;
  multiples: Record<string, number | null>;
  consensus: {
    rating: number | null;
    target: number | null;
    strongBuy: number | null;
    buy: number | null;
    hold: number | null;
    sell: number | null;
    strongSell: number | null;
  };
  ownership: {
    outstanding?: number | null;
    institutions: number | null;
    insiders: number | null;
    float: number | null;
  };
  holders: {
    name: string;
    date: string;
    shares: number | null;
    percent: number | null;
    change: number | null;
  }[];
  earnings: {
    date: string;
    period: string;
    time: string;
    actual: number | null;
    estimate: number | null;
    surprise: number | null;
  }[];
  estimates: {
    date: string;
    period: string;
    frequency: string;
    currency: string | null;
    revenue: number | null;
    revenueLow: number | null;
    revenueHigh: number | null;
    eps: number | null;
    epsLow: number | null;
    epsHigh: number | null;
    analysts: number | null;
  }[];
  insiders: {
    name: string;
    date: string;
    filed: string;
    code: string;
    change: number | null;
    price: number | null;
  }[];
  profile: {
    description: string;
    sector: string;
    industry: string;
    country: string;
    employees: number | null;
    website: string | null;
    logo: string | null;
  };
};
export function normalizeEodFundamentals(
  symbol: string,
  raw: any,
  asOf: string,
) {
  const g = raw?.General;
  if (
    !g ||
    String(g.Code).toUpperCase() !== eodTicker(symbol).slice(0, -3) ||
    (!symbol.includes("/") && g.CurrencyCode !== "USD")
  )
    throw Error(
      "Fundamentals belong to a different instrument or quote currency",
    );
  const day = asOf.slice(0, 10),
    facts: Fact[] = [];
  const maps: Record<string, Partial<Record<Metric, string[]>>> = {
    Income_Statement: {
      revenue: ["totalRevenue"],
      netIncome: ["netIncome"],
      operatingIncome: ["operatingIncome"],
      grossProfit: ["grossProfit"],
      costOfRevenue: ["costOfRevenue"],
      researchExpense: ["researchDevelopment"],
      interestExpense: ["interestExpense"],
    },
    Cash_Flow: {
      operatingCashFlow: ["totalCashFromOperatingActivities"],
      capex: ["capitalExpenditures"],
      stockCompensation: ["stockBasedCompensation"],
      depreciation: ["depreciation"],
      dividends: ["dividendsPaid"],
    },
    Balance_Sheet: {
      assets: ["totalAssets"],
      liabilities: ["totalLiab"],
      cash: ["cashAndEquivalents", "cash"],
      debt: ["shortLongTermDebtTotal"],
      equity: ["totalStockholderEquity"],
      currentAssets: ["totalCurrentAssets"],
      currentLiabilities: ["totalCurrentLiabilities"],
      shares: ["commonStockSharesOutstanding"],
      receivables: ["netReceivables"],
      inventory: ["inventory"],
      payables: ["accountsPayable"],
      retainedEarnings: ["retainedEarnings"],
    },
  };
  for (const [statement, mapping] of Object.entries(maps))
    for (const [frequency, scope] of [
      ["yearly", "annual"],
      ["quarterly", "quarterly"],
    ] as const) {
      const block = raw.Financials?.[statement];
      const rows = entries(block?.[frequency])
        .filter((x) => date(x.date))
        .sort((a, b) => a.date.localeCompare(b.date));
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i],
          end = date(row.date)!;
        // Missing filing dates use observation date, never invent historical availability.
        const filed = date(row.filing_date) ?? day;
        const currency = text(row.currency_symbol || block.currency_symbol);
        if (end > day || filed > day || !/^[A-Z]{3}$/.test(currency)) continue;
        const months = scope === "annual" ? 12 : 3;
        const next = new Date(Date.parse(end) + 86400000);
        next.setUTCMonth(next.getUTCMonth() - months);
        let start = next.toISOString().slice(0, 10);
        const previous = rows[i - 1]?.date,
          gap = previous
            ? (Date.parse(end) - Date.parse(previous)) / 86400000
            : 0;
        if (
          gap >= (scope === "annual" ? 330 : 60) &&
          gap <= (scope === "annual" ? 400 : 110)
        )
          start = new Date(Date.parse(previous) + 86400000)
            .toISOString()
            .slice(0, 10);
        for (const [metric, fields] of Object.entries(mapping)) {
          const key = fields!.find((k) => numeric(row[k]) != null);
          if (!key) continue;
          let value = numeric(row[key])!;
          if (["capex", "dividends"].includes(metric)) value = Math.abs(value);
          facts.push({
            id: `eodhd:${symbol}:${statement}:${frequency}:${end}:${metric}`,
            metric: metric as Metric,
            value,
            unit: metric === "shares" ? "shares" : currency,
            currency: metric === "shares" ? null : currency,
            start: statement === "Balance_Sheet" ? null : start,
            end,
            filed,
            accession: `eodhd:${symbol}:${frequency}:${end}:${filed}`,
            form: "EODHD normalized",
            basis: "Provider",
            scope: statement === "Balance_Sheet" ? "instant" : scope,
            sourceUrl: eodSource,
          });
        }
      }
    }
  const values = (obj: any, keys: string[]) =>
    Object.fromEntries(keys.map((k) => [k, numeric(obj?.[k])]));
  const safeUrl = (v: any) => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" && !u.username && !u.password
        ? u.href
        : null;
    } catch {
      return null;
    }
  };
  const a = raw.AnalystRatings ?? {};
  const evidence: EodEvidence = {
    updatedAt: date(g.UpdatedAt),
    source: "EODHD",
    reportingCurrency:
      text(raw.Financials?.Income_Statement?.currency_symbol) || null,
    highlights: values(raw.Highlights, [
      "MarketCapitalization",
      "EBITDA",
      "RevenueTTM",
      "GrossProfitTTM",
      "DilutedEpsTTM",
      "QuarterlyRevenueGrowthYOY",
      "QuarterlyEarningsGrowthYOY",
      "ProfitMargin",
      "OperatingMarginTTM",
      "ReturnOnAssetsTTM",
      "ReturnOnEquityTTM",
      "DividendYield",
      "BookValue",
    ]),
    multiples: values(raw.Valuation, [
      "TrailingPE",
      "ForwardPE",
      "PriceSalesTTM",
      "PriceBookMRQ",
      "EnterpriseValue",
      "EnterpriseValueRevenue",
      "EnterpriseValueEbitda",
    ]),
    consensus: {
      rating: numeric(a.Rating),
      target: numeric(a.TargetPrice),
      strongBuy: numeric(a.StrongBuy),
      buy: numeric(a.Buy),
      hold: numeric(a.Hold),
      sell: numeric(a.Sell),
      strongSell: numeric(a.StrongSell),
    },
    ownership: {
      outstanding: numeric(raw.SharesStats?.SharesOutstanding),
      institutions: numeric(raw.SharesStats?.PercentInstitutions),
      insiders: numeric(raw.SharesStats?.PercentInsiders),
      float: numeric(raw.SharesStats?.SharesFloat),
    },
    holders: entries(raw.Holders?.Institutions)
      .filter((x) => date(x.date) && x.date <= day)
      .slice(0, 12)
      .map((x) => ({
        name: text(x.name),
        date: x.date,
        shares: numeric(x.currentShares),
        percent: numeric(x.totalShares),
        change: numeric(x.change_p),
      })),
    earnings: entries(raw.Earnings?.History)
      .filter((x) => date(x.reportDate))
      .map((x) => {
        const actual = x.reportDate <= day ? numeric(x.epsActual) : null,
          estimate = numeric(x.epsEstimate);
        return {
          date: x.reportDate,
          period: date(x.date) ?? "",
          time: text(x.beforeAfterMarket),
          actual,
          estimate,
          surprise:
            actual != null && estimate != null && estimate !== 0
              ? ((actual - estimate) / Math.abs(estimate)) * 100
              : null,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20),
    estimates: Object.entries(raw.Earnings?.Trend ?? {})
      .flatMap(([frequency, data]) =>
        (date((data as any)?.date) ? [data] : entries(data))
          .filter((x: any) => date(x.date))
          .map((x: any) => ({
            date: x.date,
            period: text(x.period),
            frequency: date(frequency)
              ? /^[+-]?\d+y$/.test(text(x.period))
                ? "Annual"
                : "Quarterly"
              : frequency,
            currency:
              text(x.currency) ||
              text(raw.Financials?.Income_Statement?.currency_symbol) ||
              null,
            revenue: numeric(x.revenueEstimateAvg),
            revenueLow: numeric(x.revenueEstimateLow),
            revenueHigh: numeric(x.revenueEstimateHigh),
            eps: numeric(x.earningsEstimateAvg),
            epsLow: numeric(x.earningsEstimateLow),
            epsHigh: numeric(x.earningsEstimateHigh),
            analysts: numeric(x.earningsEstimateNumberOfAnalysts),
          })),
      )
      .sort((a, b) => a.date.localeCompare(b.date)),
    insiders: entries(raw.InsiderTransactions)
      .filter(
        (x) =>
          date(x.transactionDate) &&
          x.transactionDate <= day &&
          date(x.date) &&
          x.date <= day,
      )
      .slice(0, 30)
      .map((x) => ({
        name: text(x.ownerName),
        date: x.transactionDate,
        filed: x.date,
        code: text(x.transactionCode),
        change: numeric(x.transactionAmount),
        price: numeric(x.transactionPrice),
      })),
    profile: {
      description: text(g.Description),
      sector: text(g.Sector),
      industry: text(g.Industry),
      country: text(g.CountryName),
      employees: numeric(g.FullTimeEmployees),
      website: safeUrl(g.WebURL),
      logo:
        typeof g.LogoURL === "string" &&
        /^\/img\/logos\/[A-Za-z0-9/_.-]+$/.test(g.LogoURL)
          ? "https://eodhd.com" + g.LogoURL
          : null,
    },
  };
  const company: Company = {
    symbol,
    name: text(g.Name) || symbol,
    currency: g.CurrencyCode,
    exchange: text(g.Exchange),
    assetType: symbol.includes("/") ? "crypto" : "stock",
    description: evidence.profile.description,
    sector: evidence.profile.sector,
    website: evidence.profile.website ?? undefined,
    logoUrl: evidence.profile.logo ?? undefined,
    foreignListing: g.CountryISO !== "US",
  };
  return {
    facts,
    evidence,
    company,
    name: company.name,
    filings: [],
    issues: [] as string[],
  };
}
