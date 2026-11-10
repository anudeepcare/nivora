import type { Research } from "./types";
import { scenarioLenses } from "./scenario-lenses.ts";
import { consensusOutlook } from "./outlook.ts";
import { riskAdjustedRange } from "./scenario-calibration.ts";
import { MARKET_STUDY } from "./market-study.ts";

export type ScenarioHeadline = {
  source: "analyst" | "analyst-history" | "history";
  eyebrow: string;
  detail: string;
  note: string;
  bear: number;
  base: number;
  bull: number;
};

/** Headline bear/base/bull for a stock when no earnings or cash-flow model qualifies.
 * Uses, in order, the supplied analyst low/consensus/high range, then the stock's own
 * longest scoreable historical range. The source is always named; nothing is blended.
 * A price-anchored sensitivity (base equal to today's price) is never a headline. */
export function scenarioHeadline(r: Research): ScenarioHeadline | null {
  if (r.company.assetType !== "stock") return null;
  const view = scenarioLenses(r);
  if (!view.available) return null;
  // Bear and bull from price history use the drift-neutral, volatility-adjusted range:
  // across 1,305 stocks it contained the outcome far more often than raw percentiles.
  const asOf = new Date(
    Date.parse(r.priceObservedAt ?? r.retrievedAt),
  ).toISOString();
  const risk = ([252, 63, 20] as const)
    .map((h) => riskAdjustedRange(r.history, asOf, h, "us-equity"))
    .find((x) => x.available);
  const ref = view.reference.price;
  const span =
    risk && risk.available
      ? {
          bear: ref * (1 + risk.bear / 100),
          bull: ref * (1 + risk.bull / 100),
          text:
            risk.horizon === 252
              ? "one year"
              : risk.horizon === 63
                ? "three months"
                : "one month",
          held: MARKET_STUDY.rangeHeld.riskAdjusted[
            risk.horizon as 20 | 63 | 252
          ],
        }
      : null;
  const consensus = consensusOutlook(r);
  if (
    consensus &&
    consensus.low == null &&
    span &&
    span.bear < consensus.target &&
    consensus.target < span.bull
  )
    return {
      source: "analyst-history",
      eyebrow: "Analyst consensus with a measured risk range",
      detail: `Base is the analyst consensus target. The provider supplied no low or high target, so bear and bull show how far this stock could plausibly move over ${span.text} given its own volatility. In a study of ${MARKET_STUDY.stocks.toLocaleString("en-US")} stocks, ranges built this way held about ${span.held.toFixed(0)}% of the time. Not AURYN fair value or a forecast.`,
      note: "Base: analyst consensus. Bear and bull: 10th and 90th percentile of the stock's own past moves with average drift removed and volatility rescaled to current conditions, applied to today's price.",
      bear: span.bear,
      base: consensus.target,
      bull: span.bull,
    };
  if (!view.lenses.some((x) => x.kind === "analyst" && x.bear != null) && span)
    return {
      source: "history",
      eyebrow: "Measured risk range",
      detail: `No AURYN model or analyst range qualifies yet, so no direction is assumed: base is today's price, and bear and bull show how far this stock could plausibly move over ${span.text} given its own volatility. In a study of ${MARKET_STUDY.stocks.toLocaleString("en-US")} stocks, ranges built this way held about ${span.held.toFixed(0)}% of the time. Not fair value or a forecast.`,
      note: "10th and 90th percentile of the stock's own past moves with average drift removed and volatility rescaled to current conditions, applied to today's price.",
      bear: span.bear,
      base: ref,
      bull: span.bull,
    };
  const p = view.primary;
  if (p.bear == null || p.bull == null || p.neutralBase) return null;
  if (p.kind !== "analyst" && p.kind !== "history") return null;
  const record = p.track
    ? p.track.verdict === "too-few"
      ? " Too few past periods to judge how often this range held."
      : ` In past checks this range held ${p.track.inside} of ${p.track.tests} times (${p.track.hitRate.toFixed(0)}%; designed for about 80%).`
    : "";
  return p.kind === "analyst"
    ? {
        source: "analyst",
        eyebrow: "Analyst targets",
        detail:
          "No AURYN earnings or cash-flow model qualifies for this company yet, so these are the lowest, consensus and highest supplied analyst targets. Opinions, not AURYN fair value.",
        note: p.note,
        bear: p.bear,
        base: p.base,
        bull: p.bull,
      }
    : {
        source: "history",
        eyebrow: "Historical range",
        detail: `No AURYN model or analyst range qualifies yet. These are the 10th, 50th and 90th percentile of this stock's own past moves (${p.horizon}) applied to today's price. Not fair value or a forecast.${record}`,
        note: p.note,
        bear: p.bear,
        base: p.base,
        bull: p.bull,
      };
}
