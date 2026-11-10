import type { Research } from "./types";
import { scenarioLenses } from "./scenario-lenses.ts";
import { consensusOutlook } from "./outlook.ts";

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
  // Analyst consensus without a supplied low/high: keep the consensus as the base and
  // take bear and bull from a poor and a strong stretch in the stock's own history, so
  // the bear case is a real downside instead of a figure derived from the target itself.
  const consensus = consensusOutlook(r);
  const past = view.lenses.find((x) => x.kind === "history");
  if (
    consensus &&
    consensus.low == null &&
    past?.bear != null &&
    past.bull != null &&
    past.bear < consensus.target &&
    consensus.target < past.bull
  )
    return {
      source: "analyst-history",
      eyebrow: "Analyst consensus with historical range",
      detail: `Base is the analyst consensus target. The provider supplied no low or high target, so bear and bull are a poor and a strong stretch for this stock: the 10th and 90th percentile of its own past moves (${past.horizon}) applied to today's price. Not AURYN fair value or a forecast.`,
      note: `Base: analyst consensus. ${past.note}`,
      bear: past.bear,
      base: consensus.target,
      bull: past.bull,
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
