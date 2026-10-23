import type { Research } from "./types";
import { adaptiveSettledBars } from "./accumulation-policy-v3.ts";
type PriceRiskCase = {
  name: "Bear" | "Base" | "Bull";
  target: number;
  change: number;
  percentile: number;
};
export type PriceRiskScenarios =
  | { available: false; reason: string }
  | {
      available: true;
      basis: "historical-price-risk";
      cases: PriceRiskCase[];
      currency: string;
      reference: number;
      referenceDate: string;
      referenceBasis: "quote" | "settled-close";
      horizon: number;
      samples: number;
      from: string;
      through: string;
      caveat: string;
    };
/** Empirical overlapping-window outcomes. Not probabilities, analyst targets or fair value. */
export function priceRiskScenarios(r: Research): PriceRiskScenarios {
  const unavailable = (reason: string): PriceRiskScenarios => ({
    available: false,
    reason,
  });
  const now = Date.parse(r.priceObservedAt ?? r.retrievedAt);
  if (!Number.isFinite(now))
    return unavailable("A dated observation is required.");
  if (r.company.currency !== r.quote.currency)
    return unavailable(
      "Price and listing currencies differ; scenarios are withheld.",
    );
  const crypto = r.company.assetType === "crypto";
  const bars = adaptiveSettledBars(
    r.history,
    new Date(now).toISOString(),
    crypto ? "crypto" : "us-equity",
  ).slice(-1260);
  if (bars.length < 80)
    return unavailable(
      "At least 80 valid settled daily observations are needed for historical price-risk cases.",
    );
  const last = bars.at(-1)!;
  if (now - Date.parse(last.time) > 10 * 86400000)
    return unavailable(
      "The latest settled history is too old for a current price-risk range.",
    );
  const at = Date.parse(r.quote.asOf ?? "");
  const useQuote =
    r.quote.price != null &&
    Number.isFinite(r.quote.price) &&
    r.quote.price > 0 &&
    Number.isFinite(at) &&
    at <= now + 60000 &&
    now - at <= 7 * 86400000;
  const reference = useQuote ? r.quote.price! : last.close,
    referenceDate = useQuote ? r.quote.asOf! : last.time;
  const horizon = bars.length >= 252 ? 63 : 20;
  const returns: number[] = [];
  const gaps = bars.map((b, i) =>
    i > 0 &&
    Date.parse(b.time) - Date.parse(bars[i - 1].time) >
      (crypto ? 3 : 10) * 86400000
      ? 1
      : 0,
  );
  for (let i = 1; i < gaps.length; i++) gaps[i] += gaps[i - 1];
  for (let i = horizon; i < bars.length; i++) {
    if (gaps[i] !== gaps[i - horizon]) continue;
    const move = Math.log(bars[i].close / bars[i - horizon].close);
    if (Number.isFinite(move)) returns.push(move);
  }
  if (returns.length < 40)
    return unavailable(
      "At least 40 intact historical return windows are needed; the supplied history is too short or discontinuous.",
    );
  returns.sort((a, b) => a - b);
  const quantile = (p: number) => {
    const rank = p * (returns.length - 1),
      lo = Math.floor(rank);
    return returns[lo] + (returns[Math.ceil(rank)] - returns[lo]) * (rank - lo);
  };
  const cases = (
    [
      ["Bear", 0.1],
      ["Base", 0.5],
      ["Bull", 0.9],
    ] as const
  ).map(([name, p]) => {
    const target = reference * Math.exp(quantile(p));
    return {
      name,
      target,
      change: (target / reference - 1) * 100,
      percentile: p * 100,
    };
  });
  if (cases.some((c) => !Number.isFinite(c.target) || c.target <= 0))
    return unavailable(
      "Historical outcomes do not produce finite positive prices.",
    );
  return {
    available: true,
    basis: "historical-price-risk",
    cases,
    currency: r.quote.currency,
    reference,
    referenceDate,
    referenceBasis: useQuote ? "quote" : "settled-close",
    horizon,
    samples: returns.length,
    from: bars[0].time,
    through: last.time,
    caveat:
      "Historical 10th / median / 90th percentile price outcomes, not company fair value or forecast probabilities. Overlapping samples are dependent. Future moves can exceed both bounds; dividends, costs and changing business conditions are excluded.",
  };
}
