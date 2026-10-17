import { modelCoverage, ttmPeriods } from "./research-depth.ts";
import type { Candle, Research, FinancialPeriod } from "./types";
import { financialPeriods, cashFlowValue, accumulation } from "./engine.ts";
export const annualRows = (r: Research) =>
  financialPeriods(r.facts, "annual", r.retrievedAt);
export function latestFinancialEvidence(r: Research) {
  const annual = annualRows(r),
    ttm = ttmPeriods(r.facts, r.retrievedAt);
  const a = annual.at(-1),
    t = ttm.at(-1);
  const useTtm = !!t && (!a || t.end > a.end) && t.revenue != null;
  const rows = useTtm ? ttm : annual,
    latest = rows.at(-1);
  const prior = latest
    ? rows
        .filter((x) => {
          const days = (Date.parse(latest.end) - Date.parse(x.end)) / 86400000;
          return (
            days >= 330 &&
            days <= 400 &&
            x.currency === latest.currency &&
            x.basis === latest.basis
          );
        })
        .at(-1)
    : undefined;
  return { rows, latest, prior, periodBasis: useTtm ? "TTM" : "Annual" };
}
export function indicators(bars: Candle[], asOf: string) {
  const day = asOf.slice(0, 10),
    rows = bars
      .filter(
        (b) =>
          b.time.length === 10 &&
          b.time < day &&
          Number.isFinite(b.close) &&
          b.close > 0,
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  const close = rows.at(-1)?.close ?? null,
    mean = (n: number) =>
      rows.length >= n
        ? rows.slice(-n).reduce((s, b) => s + b.close, 0) / n
        : null;
  let rsi: number | null = null;
  if (rows.length >= 15) {
    let gain = 0,
      loss = 0;
    for (let i = 1; i <= 14; i++) {
      const d = rows[i].close - rows[i - 1].close;
      gain += Math.max(0, d) / 14;
      loss += Math.max(0, -d) / 14;
    }
    for (let i = 15; i < rows.length; i++) {
      const d = rows[i].close - rows[i - 1].close;
      gain = (gain * 13 + Math.max(0, d)) / 14;
      loss = (loss * 13 + Math.max(0, -d)) / 14;
    }
    rsi =
      gain === 0 && loss === 0
        ? 50
        : loss === 0
          ? 100
          : 100 - 100 / (1 + gain / loss);
  }
  const recent = rows.slice(-126),
    low = recent.length ? Math.min(...recent.map((b) => b.low)) : null,
    high = recent.length ? Math.max(...recent.map((b) => b.high)) : null;
  const fib =
    low != null && high != null && high > low
      ? [0.236, 0.382, 0.5, 0.618, 0.686, 0.786].map((ratio) => ({
          ratio,
          price: high - (high - low) * ratio,
        }))
      : [];
  const averageVolume =
    rows.length >= 21
      ? rows.slice(-21, -1).reduce((s, b) => s + b.volume, 0) / 20
      : null;
  const trueRanges = rows
    .slice(1)
    .map((b, i) =>
      Math.max(
        b.high - b.low,
        Math.abs(b.high - rows[i].close),
        Math.abs(b.low - rows[i].close),
      ),
    );
  const atr =
    close && trueRanges.length >= 14
      ? (trueRanges.slice(-14).reduce((s, n) => s + n, 0) / 14 / close) * 100
      : null;
  const ma50 = mean(50),
    ma200 = mean(200),
    trend =
      close && ma50 && ma200
        ? close > ma50 && ma50 > ma200
          ? "Constructive"
          : close < ma50 && ma50 < ma200
            ? "Weak"
            : "Mixed"
        : "Not assessed";
  return {
    close,
    rsi,
    ma50,
    ma200,
    atr,
    volumeRatio:
      averageVolume && rows.at(-1) ? rows.at(-1)!.volume / averageVolume : null,
    trend,
    fib,
    low,
    high,
    first: recent[0]?.time,
    last: rows.at(-1)?.time,
  };
}
export function valuationInputs(r: Research) {
  const evidence = latestFinancialEvidence(r),
    latest = evidence.latest,
    today = r.retrievedAt.slice(0, 10);
  const share = r.facts
    .filter(
      (f) =>
        f.metric === "shares" &&
        f.scope === "instant" &&
        f.unit === "shares" &&
        f.value > 0 &&
        f.end <= today &&
        f.filed <= today,
    )
    .sort(
      (a, b) => a.end.localeCompare(b.end) || a.filed.localeCompare(b.filed),
    )
    .at(-1);
  const issues: string[] = [];
  if (!latest || latest.fcf == null)
    issues.push(
      "Matching operating cash flow and capital expenditure are needed.",
    );
  else if (latest.fcf <= 0)
    issues.push(
      "This cash-flow method is unsuitable for a business with negative free cash flow.",
    );
  if (latest && Date.parse(today) - Date.parse(latest.end) > 550 * 86400_000)
    issues.push(
      "The reported cash-flow period is too old for a current scenario.",
    );
  if (!share || Date.parse(today) - Date.parse(share.end) > 180 * 86400_000)
    issues.push("A recent outstanding share count is needed.");
  if (latest && latest.currency !== r.quote.currency)
    issues.push(
      "Reported and quote currencies differ; conversion is not available.",
    );
  if (r.company.assetType === "crypto")
    issues.push("Corporate cash-flow valuation does not apply to crypto.");
  // Foreign listings require explicit listed-share/ADR reconciliation, never assume 1:1.
  if (
    r.company.foreignListing ||
    (share && ["20-F", "40-F"].includes(share.form))
  )
    issues.push(
      "Reconcile listed shares or ADR units before using per-share valuation.",
    );
  const coverage = modelCoverage(r.company.symbol, r.company.assetType, {
    sector: r.evidence?.profile?.sector || r.company.sector,
    industry: r.evidence?.profile?.industry,
  });
  if (coverage.family !== "operating-company") issues.push(coverage.method);
  const eligible = issues.length === 0;
  const scenarios = eligible
    ? [-5, 0, 5].map((growth, i) => ({
        name: ["Bear", "Base", "Bull"][i],
        growth,
        discount: [12, 10, 9][i],
        terminal: [0, 2, 2][i],
        value: cashFlowValue(
          latest!.fcf!,
          share!.value,
          growth,
          [12, 10, 9][i],
          [0, 2, 2][i],
          1,
        ),
      }))
    : [];
  return {
    latest,
    share,
    issues,
    eligible,
    scenarios,
    periodBasis: evidence.periodBasis,
  };
}
export function perspective(r: Research) {
  const evidence = latestFinancialEvidence(r),
    rows = evidence.rows,
    last = evidence.latest,
    previous = evidence.prior,
    tech = indicators(r.history, r.retrievedAt),
    dca = accumulation(
      r.history,
      r.retrievedAt,
      false,
      r.company.assetType === "crypto" ? "crypto" : "us-equity",
    ),
    v = valuationInputs(r);
  const current =
    last && Date.parse(r.retrievedAt) - Date.parse(last.end) < 550 * 86400_000;
  const strong =
    current &&
    last.revenue != null &&
    last.revenue > 0 &&
    last.netIncome != null &&
    last.netIncome > 0 &&
    !(last.operatingIncome != null && last.operatingIncome < 0) &&
    last.fcf != null &&
    last.fcf > 0;
  const business =
    r.company.assetType === "crypto"
      ? "Not applicable"
      : !current
        ? "Needs evidence"
        : strong
          ? "Profitable"
          : last.netIncome != null && last.netIncome < 0
            ? "Loss-making"
            : "Mixed economics";
  // A calculator's generic growth/discount settings are not an investment rating.
  const valuation = v.eligible ? "Assumption dependent" : "Not established";
  const heading =
    r.company.assetType === "crypto"
      ? "Price structure, with risk in view."
      : !current
        ? "Build the picture from current evidence."
        : strong
          ? tech.trend === "Weak"
            ? "Profitable business. Weak price trend."
            : "Profitable business. Put the price in context."
          : last.netIncome != null && last.netIncome < 0
            ? "Reported losses. Review cash generation."
            : "Review cash generation and the price together.";
  const gap =
    last && previous
      ? (Date.parse(last.end) - Date.parse(previous.end)) / 86400_000
      : 0;
  const growth =
    last?.revenue != null &&
    previous?.revenue != null &&
    previous.revenue > 0 &&
    last.currency === previous.currency &&
    gap >= 330 &&
    gap <= 400
      ? (last.revenue / previous.revenue - 1) * 100
      : null;
  return {
    business,
    valuation,
    heading,
    tech,
    dca,
    valuationInputs: v,
    rows,
    last,
    growth,
    strong,
    periodBasis: evidence.periodBasis,
  };
}
export function periodLabel(row: FinancialPeriod) {
  return new Date(row.end).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
