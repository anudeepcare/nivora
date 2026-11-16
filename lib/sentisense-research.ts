import { normalizeSentiSenseEstimates } from "./sentisense-estimates.ts";
import type { Company, Fact, Filing, Metric } from "./types";
import type { EodEvidence } from "./eodhd-normalize";

// Contract: https://sentisense.ai/docs/api/stocks/ and /analyst-ratings/.
// No numeric strings, null coercion, currency inference or basic/diluted mixing.
type Row = Record<string, unknown>;
const rec = (v: unknown): Row | null =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Row) : null;
const body = (v: unknown): Row | null => {
  const r = rec(v);
  return r && ("data" in r ? rec(r.data) : r);
};
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const txt = (v: unknown): string => (typeof v === "string" ? v : "");
const symbolKey = (v: unknown) => txt(v).toUpperCase().replace("-", ".");
const date = (v: unknown): string | null => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const t = Date.parse(v);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === v
    ? v
    : null;
};
const currency = (v: unknown) =>
  typeof v === "string" && /^[A-Za-z]{3}$/.test(v) ? v.toUpperCase() : null;
const safeUrl = (v: unknown) => {
  try {
    const u = new URL(txt(v));
    return u.protocol === "https:" && !u.username && !u.password
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
};
const SOURCE = "https://sentisense.ai/docs/api/stocks/#get-fundamentalshistory";
export type SentiSenseFundamentalPayloads = {
  profile: unknown;
  quarterly?: unknown;
  annual?: unknown;
  current?: unknown;
  estimates?: unknown;
};
export type SentiSenseRequest = (
  path: string,
  params?: Record<string, string>,
) => Promise<unknown>;
const flowFields: Partial<Record<Metric, string>> = {
  revenue: "revenue",
  netIncome: "netIncome",
  operatingIncome: "operatingIncome",
  grossProfit: "grossProfit",
  costOfRevenue: "costOfRevenue",
  operatingCashFlow: "operatingCashFlow",
  capex: "capitalExpenditure",
  eps: "epsDiluted",
  weightedShares: "weightedAverageSharesDiluted",
};
// Do not map deprecated sharesOutstanding, ambiguous debt fallback or mixed-basis eps.
const instantFields: Partial<Record<Metric, string>> = {
  assets: "totalAssets",
  liabilities: "totalLiabilities",
  equity: "totalEquity",
  currentAssets: "currentAssets",
  currentLiabilities: "currentLiabilities",
  cash: "cash",
};

export function normalizeSentiSenseFundamentals(
  symbol: string,
  payloads: SentiSenseFundamentalPayloads,
  observedAt: string,
) {
  const now = Date.parse(observedAt);
  if (!Number.isFinite(now)) throw Error("Invalid observation date.");
  const day = observedAt.slice(0, 10),
    p = body(payloads.profile);
  if (!p || symbolKey(p.ticker) !== symbolKey(symbol))
    throw Error("Company profile belongs to a different security.");
  const quoteCurrency = currency(p.currency);
  if (!quoteCurrency) throw Error("Trading currency is not supplied.");
  const company: Company = {
    symbol,
    name: txt(p.name) || symbol,
    exchange: txt(p.primaryExchange),
    currency: quoteCurrency,
    assetType: "stock",
    description: txt(p.description),
    sector: txt(p.sector),
    website: safeUrl(p.homepageUrl),
    logoUrl: safeUrl(p.logoUrl) || safeUrl(p.iconUrl),
  };
  const facts: Fact[] = [],
    filings: Filing[] = [],
    issues: string[] = [];
  const currencies = new Set<string>();
  for (const timeframe of ["quarterly", "annual"] as const) {
    const env = body(payloads[timeframe]);
    if (
      !env ||
      symbolKey(env.ticker) !== symbolKey(symbol) ||
      env.timeframe !== timeframe ||
      !Array.isArray(env.periods)
    ) {
      issues.push(
        `${timeframe === "annual" ? "Annual" : "Quarterly"} statements unavailable.`,
      );
      continue;
    }
    const rows = env.periods
      .map(rec)
      .filter(
        (x): x is Row =>
          !!x &&
          symbolKey(x.ticker) === symbolKey(symbol) &&
          !!date(x.periodEndDate) &&
          txt(x.periodEndDate) <= day &&
          num(x.fetchedAt) !== null &&
          Number(x.fetchedAt) * 1000 <= now + 60_000,
      )
      .sort(
        (a, b) =>
          txt(a.periodEndDate).localeCompare(txt(b.periodEndDate)) ||
          (num(a.fetchedAt) ?? 0) - (num(b.fetchedAt) ?? 0),
      );
    const unique = [
      ...new Map(rows.map((r) => [txt(r.periodEndDate), r])).values(),
    ];
    for (let index = 0; index < unique.length; index++) {
      const row = unique[index],
        end = date(row.periodEndDate)!,
        c = currency(row.reportedCurrency);
      const fetched = num(row.fetchedAt);
      if (!c || fetched === null || fetched * 1000 > now + 60_000) continue;
      currencies.add(c);
      const filed = date(row.filingDate);
      // Observation time is not the filing date. Unknown filings cannot become dated facts.
      if (!filed || filed > day || filed < end) continue;
      const months = num(row.periodMonths),
        previous = unique[index - 1],
        previousEnd = previous ? date(previous.periodEndDate) : null;
      const gap = previousEnd
        ? (Date.parse(end) - Date.parse(previousEnd)) / 86400000
        : 0;
      const spanOkay =
        timeframe === "annual"
          ? months === 12 && gap >= 330 && gap <= 400
          : months === 3 && gap >= 60 && gap <= 110;
      // We only derive a precise start from an adjacent actual reporting date.
      // Half-years and unknown spans never masquerade as individual quarters.
      const start =
        spanOkay && previousEnd
          ? new Date(Date.parse(previousEnd) + 86400000)
              .toISOString()
              .slice(0, 10)
          : null;
      for (const [metric, field] of Object.entries({
        ...instantFields,
        ...(start ? flowFields : {}),
      })) {
        const raw = num(row[field]);
        if (raw === null) continue;
        if (metric === "capex" && raw > 0) continue;
        if (metric === "weightedShares" && raw <= 0) continue;
        const line = rec(rec(row.lineSources)?.[field]);
        const lineFiled = date(line?.filed),
          accession = txt(line?.accession);
        if (lineFiled && (lineFiled > day || lineFiled < end)) continue;
        const originalAcc =
          line?.source === "SEC" && /^\d{10}-\d{2}-\d{6}$/.test(accession)
            ? accession
            : null;
        const sourceUrl = originalAcc
          ? `https://www.sec.gov/Archives/edgar/data/${Number(originalAcc.slice(0, 10))}/${originalAcc.replaceAll("-", "")}/${originalAcc}-index.html`
          : SOURCE;
        const instant = metric in instantFields;
        facts.push({
          id: `sentisense:${symbol}:${timeframe}:${end}:${metric}`,
          metric: metric as Metric,
          value: metric === "capex" ? Math.abs(raw) : raw,
          unit:
            metric === "weightedShares"
              ? "shares"
              : metric === "eps"
                ? `${c}/shares`
                : c,
          currency: metric === "weightedShares" ? null : c,
          start: instant ? null : start,
          end,
          filed: lineFiled ?? filed,
          accession:
            originalAcc ?? `sentisense:${symbol}:${timeframe}:${end}:${filed}`,
          form: "SentiSense statement",
          sourceUrl,
          basis: "Provider",
          scope: instant ? "instant" : timeframe,
        });
        if (
          originalAcc &&
          lineFiled &&
          !filings.some((f) => f.url === sourceUrl)
        )
          filings.push({
            form: "SEC filing",
            date: lineFiled,
            url: sourceUrl,
            title: `Statement source · ${end}`,
          });
      }
    }
  }
  if (!facts.length)
    issues.push(
      "No financial statements with verified reporting currency and period coverage.",
    );
  const evidence: EodEvidence = {
    updatedAt: null,
    source: "SentiSense",
    reportingCurrency: currencies.size === 1 ? [...currencies][0] : null,
    highlights: {},
    multiples: {},
    consensus: {
      rating: null,
      target: null,
      strongBuy: null,
      buy: null,
      hold: null,
      sell: null,
      strongSell: null,
    },
    ownership: { institutions: null, insiders: null, float: null },
    holders: [],
    earnings: [],
    estimates: [],
    insiders: [],
    profile: {
      description: txt(p.description),
      sector: txt(p.sector),
      industry: txt(p.industry),
      country: txt(p.country),
      employees: num(p.employees),
      website: safeUrl(p.homepageUrl) ?? null,
      logo: safeUrl(p.logoUrl) ?? null,
    },
  };
  // Current/TTM is separate from reported periods; never turn it into annual facts.
  const current = body(payloads.current),
    currentCurrency = currency(current?.reportedCurrency);
  const currentFetch = num(current?.fetchedAt);
  if (
    current &&
    current.available === true &&
    symbolKey(current.ticker) === symbolKey(symbol) &&
    currentCurrency &&
    currentFetch !== null &&
    currentFetch * 1000 <= now + 60000 &&
    now - currentFetch * 1000 <= 7 * 86400000 &&
    [2, 4].includes(Number(current.quartersIncluded))
  ) {
    evidence.reportingCurrency = currentCurrency;
    evidence.updatedAt = new Date(currentFetch * 1000).toISOString();
    evidence.highlights = {
      RevenueTTM: num(current.revenueTTM),
      // The compact endpoint does not guarantee a diluted-only share basis.
      // Per-period epsDiluted facts remain the source of diluted earnings.
    };
    if (currentCurrency === quoteCurrency)
      evidence.multiples = {
        TrailingPE: num(current.peTTM),
        PriceSalesTTM: num(current.psTTM),
      };
  }
  const estimates = body(payloads.estimates);
  const validatedEstimates = normalizeSentiSenseEstimates(
    payloads.estimates,
    symbol,
  );
  if (validatedEstimates && estimates) {
    for (const row of validatedEstimates.estimates) {
      // An undated provider forecast must not enter the dated research/model contract.
      if (!row.date) continue;
      evidence.estimates.push({
        date: row.date,
        period: row.periodType,
        frequency: row.frequency === "annual" ? "Annual" : "Quarterly",
        currency: row.currency,
        revenue: row.revenue,
        revenueLow: row.revenueLow,
        revenueHigh: row.revenueHigh,
        eps: row.eps,
        epsLow: row.epsLow,
        epsHigh: row.epsHigh,
        analysts: row.analysts,
      });
    }
    for (const row of Array.isArray(estimates.surprises)
      ? estimates.surprises.map(rec)
      : []) {
      if (!row) continue;
      const report = date(row.reportDate);
      if (!report || report > day) continue;
      evidence.earnings.push({
        date: report,
        period: txt(row.periodLabel),
        time: "",
        actual: num(row.actualEps),
        estimate: num(row.estimateEps),
        surprise: row.surpriseFlag ? null : num(row.surprisePct),
      });
    }
  }
  return { name: company.name, company, facts, filings, issues, evidence };
}

export async function fetchSentiSenseFundamentals(
  symbol: string,
  request: SentiSenseRequest,
  observedAt = new Date().toISOString(),
) {
  const profile = await request(`stocks/${encodeURIComponent(symbol)}/profile`);
  const settled = await Promise.allSettled([
    request("stocks/fundamentals/history", {
      ticker: symbol,
      timeframe: "quarterly",
      limit: "40",
    }),
    request("stocks/fundamentals/history", {
      ticker: symbol,
      timeframe: "annual",
      limit: "20",
    }),
    request("stocks/fundamentals/current", { ticker: symbol }),
    request(`analyst/${encodeURIComponent(symbol)}/estimates`),
  ]);
  const value = (index: number) =>
    settled[index].status === "fulfilled" ? settled[index].value : undefined;
  return normalizeSentiSenseFundamentals(
    symbol,
    {
      profile,
      quarterly: value(0),
      annual: value(1),
      current: value(2),
      estimates: value(3),
    },
    observedAt,
  );
}
