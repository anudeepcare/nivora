import type { Research } from "./types";
import {
  perspective,
  latestFinancialEvidence,
  annualRows,
} from "./analysis.ts";
import { researchDecision } from "./decision-research.ts";
import { researchOutlook, consensusOutlook } from "./outlook.ts";
import { financingContext } from "./research-integrity.ts";
import { modelCoverage } from "./research-depth.ts";
export function researchBrief(r: Research) {
  const p = perspective(r),
    d = researchDecision(r),
    outlook = researchOutlook(r),
    consensus = consensusOutlook(r),
    coverage = modelCoverage(r.company.symbol, r.company.assetType, {
      sector: r.evidence?.profile?.sector || r.company.sector,
      industry: r.evidence?.profile?.industry,
    }),
    latest = latestFinancialEvidence(r).latest,
    funding = financingContext(r);
  const checks: {
    label: string;
    status: "available" | "missing" | "conflicting";
    detail: string;
  }[] = [];
  checks.push({
    label: "Reporting period",
    status: latest ? "available" : "missing",
    detail: latest
      ? `${latest.end} · ${latest.currency}`
      : "Comparable reported financial periods are unavailable.",
  });
  const now = Date.parse(r.priceObservedAt ?? r.retrievedAt),
    stamp = Date.parse(r.quote.asOf ?? ""),
    recent =
      Number.isFinite(stamp) &&
      stamp <= now + 60000 &&
      now - stamp <= 4 * 86400000 &&
      !r.quote.stale;
  checks.push({
    label: "Price observation",
    status: recent ? "available" : "missing",
    detail: recent
      ? r.quote.asOf!
      : "A current dated quote is needed for an entry assessment.",
  });
  const shares = r.evidence?.ownership?.outstanding,
    cap = r.evidence?.highlights?.MarketCapitalization;
  const canReconcile =
    r.evidence?.reportingCurrency === r.quote.currency &&
    typeof shares === "number" &&
    shares > 0 &&
    typeof cap === "number" &&
    cap > 0 &&
    typeof r.quote.price === "number" &&
    r.quote.price > 0;
  const mismatch =
    canReconcile && Math.abs(cap! / (shares! * r.quote.price!) - 1) > 0.1;
  checks.push({
    label: "Listing reconciliation",
    status: canReconcile ? (mismatch ? "conflicting" : "available") : "missing",
    detail: canReconcile
      ? mismatch
        ? "Market cap, outstanding shares and quote differ by more than 10%. Check dates, listing units or ADR ratios."
        : "Market cap, shares and quote reconcile within the 10% check. This is a consistency check, not an audit."
      : "Comparable market cap, share basis and currencies are required.",
  });
  checks.push({
    label: "Model suitability",
    status:
      coverage.classificationSource === "fallback" ? "missing" : "available",
    detail: coverage.method,
  });
  const specialist = coverage.family !== "operating-company";
  const previous = latestFinancialEvidence(r).prior;
  return {
    trajectory:
      r.company.assetType === "crypto"
        ? []
        : annualRows(r)
            .filter(
              (row) =>
                row.currency === latest?.currency &&
                row.basis === latest?.basis,
            )
            .slice(-5)
            .map((row) => ({
              end: row.end,
              currency: row.currency,
              revenue: row.revenue,
              fcf: row.fcf,
              margin: row.margin,
              shares: row.weightedShares ?? null,
            })),
    timing: {
      ma50: p.tech.ma50,
      ma200: p.tech.ma200,
      rsi: p.tech.rsi,
      trend: p.tech.trend,
    },
    businessNumbers: {
      currency: latest?.currency ?? r.quote.currency,
      revenue: latest?.revenue ?? null,
      runway: funding.investmentRunway,
      dilution: funding.dilution,
      sbcRevenue: funding.sbcRevenue,
      revenueGrowth:
        latest?.revenue != null &&
        previous?.revenue != null &&
        previous.revenue > 0
          ? (latest.revenue / previous.revenue - 1) * 100
          : null,
      fcf: latest?.fcf ?? null,
      operatingMargin:
        latest?.revenue != null &&
        latest.revenue > 0 &&
        latest.operatingIncome != null
          ? (latest.operatingIncome / latest.revenue) * 100
          : null,
    },
    scenarioEligible:
      !mismatch && outlook.available && outlook.basis === "earnings", // Only supported earnings cases precede analyst fallback; not intrinsic value.
    scenario:
      !mismatch && outlook.available
        ? {
            currency: outlook.currency,
            low: outlook.cases[0].target,
            base: outlook.cases[1].target,
            high: outlook.cases[2].target,
            asOf: outlook.asOf,
            end: outlook.end,
            calculatedMultiple: !!outlook.caveat?.startsWith(
              "Calculated EV/revenue",
            ),
          }
        : null,
    version: "research-brief-v2",
    decisionVersion: d.version,
    checks,
    coverage,
    conflicting: mismatch,
    metrics: d.metricsAvailable,
    period: latest?.end ?? null,
    business: {
      title:
        r.company.assetType === "crypto"
          ? "Network & exposure review"
          : specialist
            ? coverage.family === "financial"
              ? "Review bank returns and credit risk"
              : latest?.fcf != null && latest.fcf < 0
                ? "Growth needs cash. Watch funding."
                : "Review the business and its funding"
            : d.stance,
      reason: specialist
        ? latest?.fcf != null && latest.fcf < 0
          ? "Investment exceeds internally generated cash. Check liquidity, financing and progress toward sustainable cash generation."
          : coverage.drivers.slice(0, 3).join(" · ")
        : (d.flags.find((x) => x.severe)?.text ??
          d.forCase[0]?.text ??
          "Review reported profitability, cash generation and funding together."),
    },
    value: {
      title: mismatch
        ? "AURYN valuation is unavailable"
        : outlook.available
          ? "Fair value not established"
          : "Value not established",
      reason: mismatch
        ? `Reported market cap (${cap?.toLocaleString()} ${r.quote.currency}) differs from shares × the reference price (${((shares ?? 0) * (r.quote.price ?? 0)).toLocaleString()} ${r.quote.currency}). These inputs may use different dates or share units. AURYN withholds affected price scenarios; reported company results and published analyst targets remain usable.`
        : outlook.available
          ? "Forecast-multiple sensitivities omit a complete operating and financing plan. Build funded cases in Value; analyst targets remain separate."
          : outlook.reason,
    },
    accumulation: {
      version: p.dca.version,
      forming: p.dca.forming,
      drawdown: p.dca.confirmed?.drawdown ?? null,
      deviation: p.dca.confirmed?.deviation ?? null,
      multiplier: p.dca.confirmed?.multiplier ?? null,
      title: p.dca.confirmed
        ? `${p.dca.confirmed.multiplier}× · ${p.dca.confirmed.multiplier === 0 ? "Pause contributions" : "Monthly contribution condition"}`
        : "Monthly history needed",
      reason: p.dca.confirmed?.reason ?? p.dca.reason,
      month: p.dca.confirmed?.month ?? null,
    },
    risk:
      d.flags[0]?.title ??
      (specialist
        ? coverage.drivers[0]
        : "Review valuation assumptions and position concentration."),
    counterCase: d.against.slice(0, 2).map((x) => x.text),
    support: d.forCase.slice(0, 2).map((x) => x.text),
    consensus,
  };
}
