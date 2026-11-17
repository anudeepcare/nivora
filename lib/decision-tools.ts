import type { Candle, Research } from "./types";
import { latestFinancialEvidence } from "./analysis.ts";
import { aurynDecision } from "./auryn-decision.ts";
import { earningsReview, earningsThesisChecks } from "./earnings-review.ts";
const DAY = 86400000;
export function impliedExpectations(x: {
  price: number;
  eps: number | null;
  years: number;
  multiple: number;
  annualReturn: number;
}) {
  if (
    ![x.price, x.years, x.multiple, x.annualReturn].every(Number.isFinite) ||
    x.price <= 0 ||
    x.years <= 0 ||
    x.years > 10 ||
    x.multiple <= 0 ||
    x.multiple > 200 ||
    x.annualReturn <= -100 ||
    x.annualReturn > 100
  )
    return null;
  const requiredPrice = x.price * (1 + x.annualReturn / 100) ** x.years;
  const requiredEps = requiredPrice / x.multiple;
  const eps =
    typeof x.eps === "number" && Number.isFinite(x.eps) && x.eps > 0
      ? x.eps
      : null;
  return {
    requiredPrice,
    requiredEps,
    gapPercent: eps == null ? null : (requiredEps / eps - 1) * 100,
    consensusPrice: eps == null ? null : eps * x.multiple,
    consensusAnnualReturn:
      eps == null
        ? null
        : (((eps * x.multiple) / x.price) ** (1 / x.years) - 1) * 100,
  };
}
export function priceEvidence(
  history: Pick<Candle, "time" | "close">[],
  asOf: string,
) {
  const now = Date.parse(asOf);
  const rows = history
    .filter(
      (x) =>
        Number.isFinite(x.close) &&
        x.close > 0 &&
        Number.isFinite(Date.parse(x.time)) &&
        Date.parse(x.time) <= now &&
        Date.parse(x.time) >= now - 366 * DAY,
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  const last = rows.at(-1),
    high = rows.length ? Math.max(...rows.map((x) => x.close)) : null,
    low = rows.length ? Math.min(...rows.map((x) => x.close)) : null;
  return {
    high,
    low,
    asOf: last?.time ?? null,
    completeYear:
      rows.length >= 200 &&
      !!rows[0] &&
      now - Date.parse(rows[0].time) >= 330 * DAY,
    drawdown:
      last && high ? Number(((last.close / high - 1) * 100).toFixed(6)) : null,
  };
}
export function decisionEvidence(r: Research, owns = false, now = Date.now()) {
  const decision = aurynDecision(r, { ownsPosition: owns, now });
  const financial = latestFinancialEvidence(r),
    price = priceEvidence(r.history, new Date(now).toISOString());
  const report = earningsReview(
    r.evidence?.earnings ?? [],
    new Date(now).toISOString().slice(0, 10),
  );
  const changes = earningsThesisChecks(financial.latest, financial.prior);
  const declining = price.drawdown != null && price.drawdown <= -10;
  const business = decision.business;
  return {
    decision,
    price,
    financial,
    report,
    changes,
    headline: declining
      ? business === "strong"
        ? "Price weakness. Business evidence remains supported."
        : business === "weak"
          ? "Price weakness comes with business concerns."
          : "Price weakness needs more business evidence."
      : business === "strong"
        ? "Business strength still needs a sensible price."
        : "Separate the price signal from the business case.",
    period: financial.latest?.end ?? null,
  };
}

export function contributionAmount(value: string): number | null {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 && amount <= 1e9
    ? amount
    : null;
}
