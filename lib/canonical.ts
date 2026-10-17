import { createHash } from "node:crypto";
import { decisionGuide } from "./decision-guide.ts";
import { perspective } from "./analysis.ts";
import { modelCoverage, weeklyStudies } from "./research-depth.ts";
import type { Research } from "./types";
export function canonical(r: Research) {
  const p = perspective(r),
    crypto = r.company.assetType === "crypto",
    coverage = modelCoverage(r.company.symbol, r.company.assetType, {
      sector: r.evidence?.profile?.sector || r.company.sector,
      industry: r.evidence?.profile?.industry,
    }),
    closed = r.history
      .filter((b) => b.time < r.retrievedAt.slice(0, 10))
      .at(-1);
  const content = {
    company: r.company,
    policy: "research-v1.5",
    classification: r.evidence?.profile
      ? {
          sector: r.evidence.profile.sector,
          industry: r.evidence.profile.industry,
        }
      : null,
    asOfDay: r.retrievedAt.slice(0, 10),
    history: r.history.filter((b) => b.time < r.retrievedAt.slice(0, 10)),
    facts: [...r.facts].sort((a, b) => a.id.localeCompare(b.id)),
    filings: r.filings,
  };
  const evidenceId = createHash("sha256")
    .update(JSON.stringify(content))
    .digest("hex");
  const id = createHash("sha256")
    .update(JSON.stringify({ evidenceId, quote: r.quote, issues: r.issues }))
    .digest("hex");
  const newCapital = crypto
    ? p.tech.trend === "Not assessed"
      ? "Price history needed"
      : `${p.tech.trend} price trend`
    : !p.last
      ? "Gather evidence"
      : p.strong
        ? "Research candidate"
        : coverage.family === "frontier" || coverage.family === "infrastructure"
          ? "Milestone-led research"
          : "Review business economics";
  return {
    id,
    evidenceId,
    quoteAsOf: r.quote.asOf,
    policy: content.policy,
    symbol: r.company.symbol,
    evidenceAt: closed?.time ?? null,
    financialPeriod: p.last?.end ?? null,
    business: p.business,
    valuation: crypto ? "Corporate valuation does not apply" : p.valuation,
    timing: p.tech.trend,
    monthly: p.dca.confirmed,
    forming: p.dca.forming,
    coverage,
    newCapital,
    decision: decisionGuide(r, p),
    existingOwner: crypto
      ? "Review exposure, custody and price risk"
      : p.strong
        ? "Review thesis and position size"
        : "Review financing and thesis evidence",
    horizons: {
      tactical:
        p.tech.trend === "Constructive"
          ? "Trend aligned; define invalidation"
          : p.tech.trend === "Weak"
            ? "Trend under pressure"
            : "No aligned trend",
      swing: crypto
        ? "Review momentum, volatility and position risk"
        : "Review earnings, valuation assumptions and execution over the next reporting periods",
      longTerm: coverage.drivers.slice(0, 3).join(" · "),
    },
    positives: [
      p.last?.fcf != null && p.last.fcf > 0
        ? "Operating cash flow less capital expenditure is positive"
        : null,
      p.growth != null && p.growth > 0
        ? "Comparable twelve-month revenue increased"
        : null,
    ].filter(Boolean),
    risks: [
      p.last?.fcf != null && p.last.fcf < 0
        ? "Operations and reinvestment consume cash"
        : null,
      r.quote.stale ? "Quote is not current" : null,
      !crypto && !p.valuationInputs.eligible
        ? "A reliable per-share valuation is not established"
        : null,
    ].filter(Boolean),
    weekly: weeklyStudies(r.history, r.retrievedAt),
    sourceIssues: r.issues,
  };
}
export type Canonical = ReturnType<typeof canonical>;
