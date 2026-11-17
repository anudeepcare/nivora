import type { Research } from "./types";
import { professionalStudies } from "./professional-studies.ts";
import { advancedStudies } from "./advanced-research.ts";
export function riskBrief(r: Research) {
  const s = professionalStudies(
      r.history,
      r.retrievedAt,
      r.company.assetType === "crypto" ? 365 : 252,
    ),
    a = advancedStudies(r.history, r.retrievedAt);
  return {
    asOf: a.asOf,
    observations: a.count,
    drawdown: s.currentDrawdown,
    belowPeak: s.drawdownSessions,
    cards: [
      {
        key: "range",
        label: "Typical daily movement",
        value: a.atrPct,
        note: "Average true range over 14 completed sessions. Use this to judge whether a planned stop sits inside normal price noise.",
      },
      {
        key: "tail",
        label: "Average of the worst 5% of days",
        value: s.es95,
        note: "Historical daily expected shortfall across supplied history. Losses can exceed this sample average.",
      },
      {
        key: "gap",
        label: "Largest observed opening gap",
        value: a.largestGap,
        note: "Largest absolute open-to-prior-close move. A stop order does not protect against a gap through its price.",
      },
    ],
  };
}
