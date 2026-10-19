import type { Research } from "./types";
import { perspective, latestFinancialEvidence } from "./analysis.ts";
import { researchDecision } from "./decision-research.ts";
import { researchOutlook, consensusOutlook } from "./outlook.ts";
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
    latest = latestFinancialEvidence(r).latest;
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
    businessNumbers: {
      currency: latest?.currency ?? r.quote.currency,
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
    scenario:
      !mismatch && outlook.available
        ? {
            currency: outlook.currency,
            low: outlook.cases[0].target,
            base: outlook.cases[1].target,
            high: outlook.cases[2].target,
            asOf: outlook.asOf,
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
            ? "Use the sector-specific lens"
            : d.stance,
      reason: specialist
        ? coverage.drivers.slice(0, 3).join(" · ")
        : (d.flags.find(x => x.severe)?.text ?? d.forCase[0]?.text ??
          "Review reported profitability, cash generation and funding together."),
    },
    value: {
      title: mismatch
        ? "Resolve listing inputs"
        : outlook.available
          ? "Compare the scenarios"
          : "Value not established",
      reason: mismatch
        ? "Scenario prices should not drive a decision until the input conflict is resolved."
        : outlook.available
          ? `Conditional ${outlook.basis === "revenue" ? "revenue" : "earnings"} scenarios; assumptions and dates are visible in Value.`
          : outlook.reason,
    },
    accumulation: {
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
