import type { Research } from "./types";
import { scenarioLenses } from "./scenario-lenses.ts";
import { consensusOutlook } from "./outlook.ts";
import { revenueSensitivity } from "./revenue-sensitivity.ts";

export type ScenarioHeadline = {
  source: "analyst" | "analyst-revenue" | "history";
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
  // Analyst consensus without a supplied low/high: scale it by the spread of the
  // analysts' own revenue forecasts for the same fiscal year. Fundamentals, not price history.
  const consensus = consensusOutlook(r);
  if (consensus && consensus.low == null) {
    const revenue = revenueSensitivity(r);
    if (revenue.available) {
      const [low, , high] = revenue.cases.map(
        (c) => c.revenue / revenue.anchorRevenue,
      );
      if (low > 0 && low < 1 && high > 1)
        return {
          source: "analyst-revenue",
          eyebrow: "Analyst consensus and revenue forecasts",
          detail: `Base is the analyst consensus target. Bear and bull scale it by the lowest and highest analyst revenue forecasts for the fiscal year ending ${revenue.end} relative to the average, assuming the same valuation multiple. Opinions and a stated assumption, not AURYN fair value.`,
          note: "Bear = consensus target × lowest revenue forecast ÷ average forecast; bull uses the highest forecast. The provider did not supply individual low and high price targets. A change in valuation multiple, dilution or financing would move these cases further.",
          bear: consensus.target * low,
          base: consensus.target,
          bull: consensus.target * high,
        };
    }
  }
  const view = scenarioLenses(r);
  if (!view.available) return null;
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
