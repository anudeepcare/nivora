import { quoteHealth } from "./quote-health.ts";
import { perspective, latestFinancialEvidence } from "./analysis.ts";
import { modelCoverage } from "./research-depth.ts";
import type { Research } from "./types";

type Tone = "positive" | "neutral" | "caution" | "negative";
type Step = { code: string; label: string; reason: string; tone: Tone };
const step = (
  code: string,
  label: string,
  reason: string,
  tone: Tone = "neutral",
): Step => ({ code, label, reason, tone });

// Original, transparent research triage. This does not set orders, position sizes,
// intrinsic values, or an expected return. It has no demonstrated investing edge.
export function decisionGuide(r: Research, p = perspective(r)) {
  const coverage = modelCoverage(r.company.symbol, r.company.assetType, {
    sector: r.evidence?.profile?.sector || r.company.sector,
    industry: r.evidence?.profile?.industry,
  });
  const now = Date.parse(r.priceObservedAt ?? r.retrievedAt),
    quoteAt = Date.parse(r.quote.asOf ?? "");
  const validQuote =
    Number.isFinite(r.quote.price) &&
    r.quote.price! > 0 &&
    Number.isFinite(now) &&
    !quoteHealth(r.quote, now)?.stale &&
    Number.isFinite(quoteAt) &&
    quoteAt <= now + 60000 &&
    now - quoteAt <= 4 * 86400000;
  const lastCloseAt = Date.parse(p.tech.last ?? "");
  const currentHistory =
    Number.isFinite(lastCloseAt) &&
    lastCloseAt <= now &&
    now - lastCloseAt <= 4 * 86400000;
  const evidence = latestFinancialEvidence(r),
    last = evidence.latest,
    prior = evidence.prior;
  const current = !!last && now - Date.parse(last.end) <= 400 * 86400000;
  const extended =
    p.dca.confirmed?.multiplier === 0 && p.tech.rsi != null && p.tech.rsi >= 70;
  let buying = step(
    "data",
    "Evidence needed",
    "A current price and reporting period are needed before evaluating an entry.",
  );
  let owning = step(
    "review",
    "Review thesis",
    "Check the latest reporting period and your position size.",
  );
  if (!validQuote) {
    buying = step(
      "data",
      "Refresh price",
      "A valid, dated and recent quote is needed for a current entry assessment.",
    );
  } else if (!currentHistory) {
    buying = step(
      "data",
      "Update price history",
      "The last completed daily close is missing or old. A fresh quote alone cannot confirm the price setup.",
    );
  } else if (r.company.assetType === "crypto") {
    buying = step(
      "technical",
      "Price setup only",
      `The price trend is ${p.tech.trend.toLowerCase()}. Company earnings and cash-flow valuation do not apply.`,
    );
    owning = extended
      ? step(
          "trim",
          "Trim review",
          "Price is extended under the monthly rule. Review concentration and your planned allocation.",
          "caution",
        )
      : step(
          "review",
          "Review exposure",
          "Consider allocation, custody and volatility before changing exposure.",
        );
  } else if (
    coverage.family !== "operating-company" ||
    coverage.classificationSource === "fallback"
  ) {
    buying = step("specialist", "Specialist review", coverage.method);
    owning = step(
      "review",
      "Review key drivers",
      coverage.drivers.slice(0, 3).join(" · "),
    );
  } else if (current) {
    const deteriorating =
      prior &&
      last!.netIncome != null &&
      last!.netIncome < 0 &&
      last!.fcf != null &&
      last!.fcf < 0 &&
      prior.netIncome != null &&
      prior.netIncome < 0 &&
      prior.fcf != null &&
      prior.fcf < 0 &&
      p.growth != null &&
      p.growth < 0;
    if (deteriorating) {
      buying = step(
        "wait",
        "Wait",
        "Revenue has declined while both comparable periods show losses and negative cash generation.",
        "caution",
      );
      owning = step(
        "exit",
        "Sell review",
        "Persistent losses, cash outflows and declining revenue warrant reviewing whether the original thesis still holds.",
        "negative",
      );
    } else if (
      last!.netIncome != null &&
      last!.netIncome > 0 &&
      last!.operatingIncome != null &&
      last!.operatingIncome < 0
    ) {
      buying = step(
        "earnings-quality",
        "Check earnings quality",
        "Net income is positive while operations report a loss. Reconcile the non-operating items before treating earnings as sustainable.",
        "caution",
      );
      owning = step(
        "review",
        "Review core earnings",
        "Separate operating results from investment, financing and tax effects in the latest report.",
      );
    } else if (extended) {
      buying = step(
        "wait",
        "Wait for an entry",
        "The confirmed monthly price is extended and RSI is elevated. This does not establish intrinsic value.",
        "caution",
      );
      owning = step(
        "trim",
        "Trim review",
        "Review concentration after the price extension. A trim depends on your allocation and taxes.",
        "caution",
      );
    } else if (p.strong) {
      buying =
        p.tech.trend === "Constructive" &&
        p.growth != null &&
        p.growth > 0 &&
        !r.company.foreignListing
          ? step(
              "candidate",
              "Buy candidate",
              "Profits, cash generation, revenue growth and price trend align. Check valuation assumptions before adding.",
              "positive",
            )
          : step(
              "wait",
              "Watch for entry",
              "Profit and cash generation are positive; entry timing, growth or listing valuation still needs review.",
            );
      owning = step(
        "hold",
        "Hold & monitor",
        "Profits and cash generation support continued research. Monitor the next report and your allocation.",
      );
    } else {
      buying = step(
        "wait",
        "Wait for evidence",
        last!.netIncome != null && last!.netIncome < 0
          ? "The latest period reports a net loss. Review cash generation and the path to sustainable profits."
          : "The available profit and cash-flow evidence does not establish a positive operating-company setup.",
        "caution",
      );
      owning = step(
        "review",
        "Review thesis",
        last!.fcf != null && last!.fcf > 0
          ? "Cash generation is positive despite mixed earnings. Check the reasons for the difference."
          : "Review margins, cash consumption and financing in the company disclosures.",
      );
    }
  }
  return {
    buying,
    owning,
    valuationEstablished: false as const,
    financialPeriod: last?.end ?? null,
    priceAsOf: r.quote.asOf,
    version: "decision-guide-v1.1",
  };
}

export type RuleCheck = {
  id: string;
  label: string;
  state: "met" | "not-met" | "unknown";
  detail: string;
};
export type RuleTrigger = { id: string; label: string; active: boolean | null; detail: string };
/**
 * Transparent view of the rules behind `decisionGuide`. It adds no new rule: "Buy candidate" holds
 * exactly when every check is met, and the owner triggers mirror the trim and sell-review rules.
 * Unknown inputs are shown as unknown and never count as met.
 */
export function decisionChecklist(r: Research, p = perspective(r)) {
  const coverage = modelCoverage(r.company.symbol, r.company.assetType, {
    sector: r.evidence?.profile?.sector || r.company.sector,
    industry: r.evidence?.profile?.industry,
  });
  const now = Date.parse(r.priceObservedAt ?? r.retrievedAt),
    quoteAt = Date.parse(r.quote.asOf ?? "");
  const validQuote =
    Number.isFinite(r.quote.price) &&
    r.quote.price! > 0 &&
    Number.isFinite(now) &&
    !quoteHealth(r.quote, now)?.stale &&
    Number.isFinite(quoteAt) &&
    quoteAt <= now + 60000 &&
    now - quoteAt <= 4 * 86400000;
  const lastCloseAt = Date.parse(p.tech.last ?? "");
  const currentHistory = Number.isFinite(lastCloseAt) && lastCloseAt <= now && now - lastCloseAt <= 4 * 86400000;
  const evidence = latestFinancialEvidence(r),
    last = evidence.latest,
    prior = evidence.prior;
  const current = !!last && now - Date.parse(last.end) <= 400 * 86400000;
  const extended = p.dca.confirmed?.multiplier === 0 && p.tech.rsi != null && p.tech.rsi >= 70;
  const gate = (ok: boolean | null, yes: string, no: string, unknown: string): Pick<RuleCheck, "state" | "detail"> =>
    ok == null ? { state: "unknown", detail: unknown } : ok ? { state: "met", detail: yes } : { state: "not-met", detail: no };
  const num = (v: number | null | undefined, test: (n: number) => boolean) => (v == null ? null : test(v));
  const ordinary = r.company.assetType !== "crypto" && coverage.family === "operating-company" && coverage.classificationSource !== "fallback";
  const checks: RuleCheck[] = [
    { id: "quote", label: "Dated price is recent", ...gate(validQuote, "A dated quote within four days.", "The quote is missing, old or stale.", "") },
    { id: "history", label: "Completed daily history is recent", ...gate(currentHistory, "The last completed close is within four days.", "The last completed close is missing or old.", "") },
    { id: "company", label: "Ordinary operating company with a known business type", ...gate(ordinary, "Standard operating-company models apply.", r.company.assetType === "crypto" ? "Crypto has no company accounts." : "A specialist or unknown business type needs its own drivers.", "") },
    { id: "period", label: "Financial period ends within 400 days", ...gate(last ? current : null, "The latest period is current.", "The latest period is old.", "No comparable period is available.") },
    { id: "revenue", label: "Revenue is positive", ...gate(num(last?.revenue, (n) => n > 0), "Positive reported revenue.", "Revenue is not positive.", "Revenue is not reported.") },
    { id: "profit", label: "Net income is positive", ...gate(num(last?.netIncome, (n) => n > 0), "A reported net profit.", "A reported net loss.", "Net income is not reported.") },
    { id: "operations", label: "Operations are not reporting a loss", ...gate(num(last?.operatingIncome, (n) => n >= 0), "Operating income is not negative.", "Operating income is negative.", "Operating income is not reported.") },
    { id: "cash", label: "Cash after capital spending is positive", ...gate(num(last?.fcf, (n) => n > 0), "Operating cash flow exceeds reported capital spending.", "Reported capital spending absorbs the cash.", "Matching cash-flow items are missing.") },
    { id: "growth", label: "Comparable revenue is growing", ...gate(num(p.growth, (n) => n > 0), "Revenue grew against the prior comparable period.", "Revenue did not grow.", "A comparable prior period is missing.") },
    { id: "trend", label: "Price trend is constructive", ...gate(p.tech.trend === "Constructive", "Price is above both long averages.", `The trend reads ${p.tech.trend.toLowerCase()}.`, "") },
    { id: "extension", label: "Price is not extended", ...gate(p.dca.confirmed ? !extended : null, "No confirmed monthly 0× with RSI at least 70.", "Confirmed monthly 0× extension with RSI at least 70.", "Confirmed monthly history is not available.") },
    { id: "listing", label: "Not a foreign listing", ...gate(!r.company.foreignListing, "A domestic listing.", "Foreign-listing valuation needs unit and currency review.", "") },
  ];
  const deteriorating = !!(
    prior &&
    last &&
    last.netIncome != null && last.netIncome < 0 &&
    last.fcf != null && last.fcf < 0 &&
    prior.netIncome != null && prior.netIncome < 0 &&
    prior.fcf != null && prior.fcf < 0 &&
    p.growth != null && p.growth < 0
  );
  const triggers: RuleTrigger[] = [
    { id: "trim", label: "Trim review", active: p.dca.confirmed ? extended : null, detail: "Confirmed monthly 0× extension plus RSI of at least 70. It reviews allocation and tax; it sells nothing." },
    { id: "sell", label: "Sell review", active: last && prior ? deteriorating : null, detail: "Two comparable periods with net losses and negative cash after capital spending, and falling revenue." },
  ];
  return { checks, triggers, candidateMet: checks.every((c) => c.state === "met"), version: "decision-checklist-v1" };
}
