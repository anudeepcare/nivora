import type { Research } from "./types";
import { latestFinancialEvidence, perspective } from "./analysis.ts";
import { modelCoverage } from "./research-depth.ts";
import { advancedStudies } from "./advanced-research.ts";

export type OverviewMetric = {
  key: string;
  label: string;
  value: number;
  unit: "money" | "percent" | "ratio" | "number";
  currency: string;
  help: string;
  tone: "neutral" | "positive" | "risk" | "caution";
};
/** Presentation only: missing inputs never become zero or synthetic evidence. */
export function overviewEvidence(r: Research) {
  const p = latestFinancialEvidence(r).latest;
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
  if (!crypto && p) {
    const cur = p.currency;
    add(
      business,
      "revenue",
      "Revenue",
      p.revenue,
      "money",
      "Reported revenue for the financial period shown below. Compare like-for-like periods.",
      "neutral",
      cur,
    );
    add(
      business,
      "grossMargin",
      "Gross margin",
      ratio(p.grossProfit, p.revenue),
      "percent",
      "Gross profit divided by revenue; compare with businesses using similar accounting.",
    );
    add(
      business,
      "operatingMargin",
      "Operating margin",
      ratio(p.operatingIncome, p.revenue),
      "percent",
      "Operating earnings divided by revenue, before interest and taxes.",
      (p.operatingIncome ?? 0) < 0 ? "risk" : "neutral",
    );
    if (!specialist) {
      add(
        business,
        "fcf",
        "Free cash flow",
        p.fcf,
        "money",
        "Operating cash flow less capital expenditure. Heavy investment can make it negative.",
        p.fcf != null && p.fcf < 0 ? "risk" : "neutral",
        cur,
      );
      add(
        business,
        "fcfMargin",
        "FCF margin",
        ratio(p.fcf, p.revenue),
        "percent",
        "Free cash flow divided by revenue. Check operating cash generation and capital spending separately.",
        p.fcf != null && p.fcf < 0 ? "risk" : "neutral",
      );
      add(
        business,
        "cashConversion",
        "Cash conversion",
        ratio(p.fcf, p.netIncome),
        "percent",
        "Free cash flow divided by positive net income. Working capital and investment timing can cause volatility.",
      );
    }
    add(
      business,
      "cash",
      "Cash balance",
      p.cash,
      "money",
      "Reported cash at the statement date; not necessarily unrestricted cash.",
      "neutral",
      cur,
    );
    add(
      business,
      "debt",
      "Total debt",
      p.debt,
      "money",
      "Reported interest-bearing debt. Review maturity, interest cost and available liquidity.",
      "neutral",
      cur,
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
