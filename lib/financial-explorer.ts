import type { Research } from "./types";
import {
  applicableMetrics,
  researchPeriods,
  type FinancialScope,
  type FinancialKey,
} from "./financial-catalog.ts";
export function financialMetricSeries(
  r: Research,
  scope: FinancialScope,
  key: FinancialKey,
  years: number,
) {
  const definition = applicableMetrics(r).find((m) => m.key === key) ?? null,
    periods = definition ? researchPeriods(r, scope) : [],
    end = periods.at(-1)?.end,
    cutoff =
      end && years > 0
        ? Date.parse(end) - years * 365.25 * 86400000
        : -Infinity;
  const groups = new Map<string, typeof periods>();
  for (const p of periods.filter((p) => Date.parse(p.end) >= cutoff))
    groups.set(p.end, [...(groups.get(p.end) ?? []), p]);
  const points = [...groups.entries()]
    .map(([end, rows]) => {
      const values = rows
          .map((p) => p[key])
          .filter(
            (x): x is number => typeof x === "number" && Number.isFinite(x),
          ),
        unique = [...new Set(values)];
      return { end, value: unique.length === 1 ? unique[0] : null };
    })
    .sort((a, b) => a.end.localeCompare(b.end));
  const first = points[0],
    last = points.at(-1),
    latest = last?.value ?? null,
    start = first?.value ?? null,
    span =
      first && last
        ? (Date.parse(last.end) - Date.parse(first.end)) / (365.25 * 86400000)
        : 0,
    consecutive = points.every(
      (p, i) =>
        i === 0 ||
        ((Date.parse(p.end) - Date.parse(points[i - 1].end)) / 86400000 >=
          330 &&
          (Date.parse(p.end) - Date.parse(points[i - 1].end)) / 86400000 <=
            400),
    );
  const percentage = definition?.unit === "percent";
  const cagr =
    scope === "annual" &&
    !percentage &&
    definition?.unit !== "ratio" &&
    consecutive &&
    points.every((p) => p.value != null) &&
    span >= 0.9 &&
    start != null &&
    start > 0 &&
    latest != null &&
    latest > 0
      ? ((latest / start) ** (1 / span) - 1) * 100
      : null;
  return {
    definition,
    unit: definition?.unit ?? null,
    currency: periods.at(-1)?.currency ?? null,
    points,
    start,
    latest,
    cagr,
    change:
      start != null && latest != null
        ? percentage
          ? latest - start
          : start > 0 && latest >= 0
            ? (latest / start - 1) * 100
            : null
        : null,
    changeUnit: percentage ? "pp" : "%",
    crossedZero: !percentage && start != null && latest != null && start * latest < 0,
    startDate: first?.end ?? null,
    endDate: last?.end ?? null,
  };
}
