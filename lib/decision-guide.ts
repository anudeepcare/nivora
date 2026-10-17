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
  const now = Date.parse(r.retrievedAt),
    quoteAt = Date.parse(r.quote.asOf ?? "");
  const validQuote =
    Number.isFinite(r.quote.price) &&
    r.quote.price! > 0 &&
    !r.quote.stale &&
    Number.isFinite(quoteAt) &&
    quoteAt <= now &&
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
    version: "decision-guide-v1",
  };
}
