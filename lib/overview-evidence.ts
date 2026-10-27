import type { Research, Metric } from "./types";
import { latestFinancialEvidence, perspective } from "./analysis.ts";
import { modelCoverage } from "./research-depth.ts";
import { advancedStudies } from "./advanced-research.ts";
import { metricEvidence } from "./research-integrity.ts";

export type OverviewMetric = {
  key: string;
  label: string;
  value: number;
  unit: "money" | "percent" | "ratio" | "number";
  currency: string;
  help: string;
  tone: "neutral" | "positive" | "risk" | "caution";
  period?: string;
  start?: string;
  basis?: string;
  periodBasis?: "Annual" | "TTM";
  sourceUrl?: string | null;
  sourceUrls?: string[];
};
/** Presentation only: missing inputs never become zero or synthetic evidence. */
export function overviewEvidence(r: Research) {
  const financial = latestFinancialEvidence(r),
    p = financial.latest,
    prior = financial.prior;
  const coverage = modelCoverage(r.company.symbol, r.company.assetType, {
    sector: r.evidence?.profile?.sector || r.company.sector,
    industry: r.evidence?.profile?.industry,
  });
  const specialist = [
    "financial",
    "insurance",
    "specialized-financial",
    "real-estate",
  ].includes(coverage.family);
  const crypto = r.company.assetType === "crypto";
  const business: OverviewMetric[] = [],
    valuation: OverviewMetric[] = [],
    technical: OverviewMetric[] = [],
    ownership: OverviewMetric[] = [];
  const add = (
    list: OverviewMetric[],
    key: string,
    label: string,
    value: number | null | undefined,
    unit: OverviewMetric["unit"],
    help: string,
    tone: OverviewMetric["tone"] = "neutral",
    currency = r.quote.currency,
  ) => {
    if (typeof value === "number" && Number.isFinite(value))
      list.push({ key, label, value, unit, currency, help, tone });
  };
  const ratio = (n: number | null | undefined, d: number | null | undefined) =>
    n != null && d != null && d > 0 ? (n / d) * 100 : null;
  const signTone = (
    value: number | null | undefined,
  ): OverviewMetric["tone"] =>
    value == null || value === 0 ? "neutral" : value < 0 ? "risk" : "positive";
  if (!crypto && p) {
    const sourceCache = new Map<string, string[]>();
    const reported = (
      key: string,
      label: string,
      value: number | null | undefined,
      unit: OverviewMetric["unit"],
      help: string,
      metrics: Metric[],
      tone: OverviewMetric["tone"] = "neutral",
      comparative = false,
    ) => {
      if (value == null || !Number.isFinite(value)) return;
      const sourceKey = metrics.join("|");
      if (!sourceCache.has(sourceKey))
        sourceCache.set(sourceKey, metricEvidence(r, metrics, true).urls);
      const sources = sourceCache.get(sourceKey)!;
      const sourceUrls = [
        ...new Set(
          [
            ...(sources.length ? sources : (p.sourceUrls ?? [p.sourceUrl])),
            ...(comparative && prior
              ? (prior.sourceUrls ?? [prior.sourceUrl])
              : []),
          ].filter((url) => /^https:\/\//.test(url)),
        ),
      ].sort();
      business.push({
        key,
        label,
        value,
        unit,
        currency: p.currency,
        tone,
        help: `${help} ${financial.periodBasis}: ${p.start}–${p.end} · ${p.basis}; filing reference ${p.filed}.${comparative && prior ? ` Comparison period ends ${prior.end} on the same currency and accounting basis.` : ""}`,
        period: p.end,
        start: p.start,
        basis: p.basis,
        periodBasis: financial.periodBasis as "Annual" | "TTM",
        sourceUrl: sources[0] ?? sourceUrls[0] ?? null,
        sourceUrls,
      });
    };
    const growth = (
      value: number | null | undefined,
      old: number | null | undefined,
    ) =>
      value != null && old != null && old > 0 ? (value / old - 1) * 100 : null;
    const revenueGrowth = growth(p.revenue, prior?.revenue);
    const dilutedShareGrowth = growth(p.weightedShares, prior?.weightedShares);
    const averagePositive = (
      value: number | null | undefined,
      old: number | null | undefined,
    ) =>
      value != null && old != null && value > 0 && old > 0
        ? (value + old) / 2
        : null;
    const roe = ratio(p.netIncome, averagePositive(p.equity, prior?.equity));
    const roa = ratio(p.netIncome, averagePositive(p.assets, prior?.assets));
    const returnContext =
      coverage.family === "financial"
        ? "Book returns do not measure regulatory capital, tangible equity or credit quality."
        : coverage.family === "insurance"
          ? "Reported book returns do not measure reserve adequacy, underwriting quality or regulatory capital."
          : coverage.family === "real-estate"
            ? "Depreciation and property accounting affect these returns; they are not FFO/AFFO or property yields."
            : "Book balances, leverage and accounting charges affect comparability; this is not ROIC or a cost-of-capital test.";
    reported(
      "revenue",
      "Revenue",
      p.revenue,
      "money",
      "Reported revenue; compare like-for-like periods and sector definitions.",
      ["revenue"],
    );
    if (!specialist) {
      const days = (Date.parse(p.end) - Date.parse(p.start)) / 86400000 + 1;
      const runway =
        p.cash != null &&
        p.cash >= 0 &&
        p.operatingCashFlow != null &&
        p.operatingCashFlow < 0
          ? ((p.cash / -p.operatingCashFlow) * days) / (365.25 / 12)
          : null;
      reported(
        "operatingRunway",
        "Operating cash runway · months",
        runway,
        "number",
        "Reported cash divided by historical monthly operating cash burn, using actual period days. Excludes capex, debt maturities, restricted-cash adjustments and future funding; it is not a forecast.",
        ["cash", "operatingCashFlow"],
        "caution",
      );
    }
    reported(
      "roe",
      "Return on average equity",
      roe,
      "percent",
      `Net income divided by average positive beginning and ending book equity. ${returnContext}`,
      ["netIncome", "equity"],
      signTone(roe),
      true,
    );
    reported(
      "roa",
      "Return on average assets",
      roa,
      "percent",
      `Net income divided by average positive beginning and ending assets. ${returnContext}`,
      ["netIncome", "assets"],
      signTone(roa),
      true,
    );
    reported(
      "netIncome",
      "Net income",
      p.netIncome,
      "money",
      "Reported earnings for this period; unusual gains and charges can affect the result.",
      ["netIncome"],
      signTone(p.netIncome),
    );
    reported(
      "revenueGrowth",
      "Revenue growth",
      revenueGrowth,
      "percent",
      "Change from the comparable prior annual or TTM period; not an annualized forecast.",
      ["revenue"],
      signTone(revenueGrowth),
      true,
    );
    reported(
      "dilutedShareGrowth",
      "Diluted weighted share growth",
      dilutedShareGrowth,
      "percent",
      "Change in reported diluted weighted-average shares, not current outstanding shares or a forecast of issuance. Review split restatements and changes in dilutive securities before attributing the change to issuance or buybacks.",
      ["weightedShares"],
      dilutedShareGrowth != null && dilutedShareGrowth > 0
        ? "caution"
        : "neutral",
      true,
    );
    reported(
      "sbcRevenue",
      "Stock compensation / revenue",
      p.sbcRevenue,
      "percent",
      "Reported stock compensation divided by revenue. This is an expense comparison, not net dilution after buybacks.",
      ["stockCompensation", "revenue"],
    );
    if (!specialist) {
      reported(
        "grossMargin",
        "Gross margin",
        p.grossMargin,
        "percent",
        "Gross profit divided by revenue; compare similar accounting and business models.",
        ["grossProfit", "revenue"],
        signTone(p.grossMargin),
      );
      reported(
        "operatingMargin",
        "Operating margin",
        p.margin,
        "percent",
        "Operating earnings divided by revenue, before interest and taxes.",
        ["operatingIncome", "revenue"],
        signTone(p.margin),
      );
      reported(
        "operatingCashFlow",
        "Operating cash flow",
        p.operatingCashFlow,
        "money",
        "Cash generated or used in operations before capital spending. Working capital can cause large period changes.",
        ["operatingCashFlow"],
        signTone(p.operatingCashFlow),
      );
      reported(
        "capex",
        "Capital spending",
        p.capex == null ? null : Math.abs(p.capex),
        "money",
        "Absolute reported capital expenditure; this total does not distinguish maintenance from growth investment.",
        ["capex"],
      );
      reported(
        "fcf",
        "Free cash flow",
        p.fcf,
        "money",
        "Operating cash flow less absolute capital spending. Heavy investment can make it negative without operating cash burn.",
        ["operatingCashFlow", "capex"],
        signTone(p.fcf),
      );
      reported(
        "fcfMargin",
        "FCF margin",
        p.fcfMargin,
        "percent",
        "Free cash flow divided by revenue; inspect operating cash flow and capital spending separately.",
        ["operatingCashFlow", "capex", "revenue"],
        signTone(p.fcfMargin),
      );
      reported(
        "fcfPerShare",
        "FCF / diluted weighted share",
        p.fcfPerShare,
        "money",
        "Free cash flow divided by reported diluted weighted-average shares for this period; not current shares outstanding. TTM shares use a day-weighted mean of reported quarterly averages.",
        ["operatingCashFlow", "capex", "weightedShares"],
        signTone(p.fcfPerShare),
      );
      reported(
        "cashConversion",
        "Cash conversion",
        p.cashConversion == null ? null : p.cashConversion * 100,
        "percent",
        "Operating cash flow divided by positive net income. Capex is excluded; working-capital changes affect this measure.",
        ["operatingCashFlow", "netIncome"],
        signTone(p.cashConversion),
      );
      reported(
        "netDebt",
        "Net debt",
        p.netDebt,
        "money",
        "Reported debt less cash at the statement date. A negative value is net cash; restricted cash, leases and other claims need separate review.",
        ["debt", "cash"],
        p.netDebt != null && p.netDebt < 0 ? "positive" : "neutral",
      );
      reported(
        "interestCoverage",
        "Interest coverage",
        p.interestCoverage,
        "ratio",
        "Operating income divided by positive interest expense. Zero or missing expense does not imply unlimited coverage; refinancing and debt maturities remain separate.",
        ["operatingIncome", "interestExpense"],
        p.interestCoverage != null && p.interestCoverage < 0
          ? "risk"
          : p.interestCoverage != null && p.interestCoverage < 1
            ? "caution"
            : "neutral",
      );
      reported(
        "currentRatio",
        "Current ratio",
        p.currentRatio,
        "ratio",
        "Current assets divided by positive current liabilities. Below 1 means reported current liabilities exceed current assets; it is not a standalone solvency test.",
        ["currentAssets", "currentLiabilities"],
        p.currentRatio != null && p.currentRatio < 1 ? "caution" : "neutral",
      );
    }
    reported(
      "cash",
      "Cash balance",
      p.cash,
      "money",
      specialist
        ? "Reported cash at the statement date; sector-specific liquidity, reserves and regulatory restrictions require separate review."
        : "Reported cash at the statement date; not necessarily unrestricted cash.",
      ["cash"],
    );
    reported(
      "debt",
      "Total debt",
      p.debt,
      "money",
      specialist
        ? "Reported debt is not a regulatory capital or sector-specific funding assessment; deposit, policyholder and other obligations require separate review."
        : "Reported interest-bearing debt. Review maturities, interest costs and liquidity.",
      ["debt"],
    );
  }
  if (!crypto) {
    for (const [key, label] of [
      ["ForwardPE", "Forward P/E"],
      ["TrailingPE", "Trailing P/E"],
      ["EnterpriseValueRevenue", "EV / revenue"],
      ["PriceBookMRQ", "Price / book"],
    ] as const) {
      const value = r.evidence?.multiples?.[key];
      if (value != null && value > 0)
        add(
          valuation,
          key,
          label,
          value,
          "ratio",
          "Reported market multiple; observation dates and accounting definitions can differ. A lower multiple alone does not establish value.",
        );
    }
    add(
      ownership,
      "institutions",
      "Institutional ownership",
      r.evidence?.ownership?.institutions,
      "percent",
      "Reported institutional ownership percentage; reporting dates vary and holdings can overlap.",
    );
    add(
      ownership,
      "insiders",
      "Insider ownership",
      r.evidence?.ownership?.insiders,
      "percent",
      "Reported insider ownership, not net purchases or sales. Ownership does not establish the investment case.",
    );
  }
  const tech = perspective(r).tech,
    a = advancedStudies(r.history, r.retrievedAt);
  add(
    technical,
    "rsi",
    "RSI · 14",
    tech.rsi,
    "number",
    "Momentum oscillator from completed closes. Below 30 or above 70 can persist; neither is a standalone trade signal.",
  );
  add(
    technical,
    "ma50",
    "50-session average",
    tech.ma50,
    "money",
    "Mean of the latest 50 completed closes, not an execution price.",
  );
  add(
    technical,
    "ma200",
    "200-session average",
    tech.ma200,
    "money",
    "Mean of the latest 200 completed closes; requires sufficient valid history.",
  );
  add(
    technical,
    "atr",
    "Typical daily range",
    a.atrPct,
    "percent",
    "Mean 14-session true range divided by the latest completed close; describes movement, not a future loss limit.",
  );
  add(
    technical,
    "relativeVolume",
    "Relative volume",
    a.relativeVolume,
    "ratio",
    "Latest completed session volume divided by the study average volume; not institutional buying.",
  );
  add(
    technical,
    "momentum",
    "20-session change",
    a.roc20,
    "percent",
    "Price change across 20 completed sessions; separate from business operating growth.",
    a.roc20 != null && a.roc20 < 0 ? "risk" : "neutral",
  );
  return {
    business,
    valuation,
    technical,
    ownership,
    period: p?.end ?? null,
    currency: p?.currency ?? r.quote.currency,
    specialist,
    crypto,
  };
}
