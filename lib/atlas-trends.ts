import { latestFinancialEvidence } from "./analysis.ts";
import type { Research, FinancialPeriod } from "./types";
/** Visualize matched reporting periods only, never fabricate missing samples. */
export function atlasTrends(research: Research) {
  const evidence = latestFinancialEvidence(research),
    latest = evidence.latest;
  if (!latest) return {};
  const rows = evidence.rows
    .filter(
      (r) =>
        r.currency === latest.currency &&
        r.basis === latest.basis &&
        r.end <= latest.end,
    )
    .sort((a, b) => a.end.localeCompare(b.end))
    .slice(-6);
  const metrics: Record<string, (r: FinancialPeriod) => number | null> = {
    Revenue: (r) => r.revenue,
    "Free cash flow": (r) => r.fcf,
    "Operating margin": (r) =>
      r.revenue != null && r.revenue > 0 && r.operatingIncome != null
        ? (r.operatingIncome / r.revenue) * 100
        : null,
  };
  return Object.fromEntries(
    Object.entries(metrics).map(([label, read]) => {
      const values = rows.map(read),
        dates = rows.map((r) => Date.parse(r.end));
      if (
        rows.length < 2 ||
        values.some((v) => v == null || !Number.isFinite(v)) ||
        dates.some((v) => !Number.isFinite(v)) ||
        new Set(dates).size !== dates.length
      )
        return [label, null];
      const valid = values as number[],
        lo = Math.min(...valid),
        hi = Math.max(...valid),
        range = hi - lo;
      const points = valid
        .map(
          (v, i) =>
            `${4 + ((dates[i] - dates[0]) / (dates.at(-1)! - dates[0])) * 192},${range ? 42 - ((v - lo) / range) * 34 : 25}`,
        )
        .join(" ");
      return [
        label,
        {
          points,
          basis: evidence.periodBasis,
          from: rows[0].end,
          to: latest.end,
          count: rows.length,
          observations: rows
            .map(
              (r, i) =>
                `${r.end}: ${valid[i].toLocaleString(undefined, { maximumFractionDigits: 2 })} ${label === "Operating margin" ? "%" : r.currency}`,
            )
            .join("; "),
        },
      ];
    }),
  );
}
