import type { Research } from "./types";
import { targetsEstimates, estimateGrowth } from "./targets-estimates.ts";
export type EstimateSnapshotRow = {
  period: string;
  date: string;
  currency: string;
  eps: number | null;
  revenue: number | null;
  epsBasis: string | null;
  shareBasis: string | null;
};
export type EstimateSnapshot = {
  version: 1;
  symbol: string;
  savedAt: string;
  observedAt: string;
  source: string | null;
  rows: EstimateSnapshotRow[];
};
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 1e18;
const text = (v: unknown, max = 100) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
function date(value: unknown, day = false): string {
  if (
    typeof value !== "string" ||
    value.length > 35 ||
    !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value.slice(0, 10) ||
    (day && value.length !== 10)
  )
    throw Error("Estimate snapshots need valid dates.");
  return value;
}
/** Shared by persisted-document validation and the client read boundary. */
export function cleanEstimateSnapshot(value: unknown): EstimateSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid estimate snapshot.");
  const v = value as Record<string, unknown>;
  if (
    v.version !== 1 ||
    typeof v.symbol !== "string" ||
    !/^[A-Z0-9][A-Z0-9.-]{0,14}$/.test(v.symbol) ||
    !Array.isArray(v.rows) ||
    !v.rows.length ||
    v.rows.length > 6
  )
    throw Error(
      "Estimate snapshots require a symbol and one to six annual rows.",
    );
  const rows = v.rows.map((entry): EstimateSnapshotRow => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      throw Error("Invalid estimate row.");
    const x = entry as Record<string, unknown>,
      period = text(x.period, 40),
      end = date(x.date, true);
    if (
      !period ||
      typeof x.currency !== "string" ||
      !/^[A-Z]{3}$/.test(x.currency)
    )
      throw Error("Estimate rows need a fiscal period and currency.");
    const fiscal = /^FY(\d{4})$/i.exec(period);
    if (fiscal && Math.abs(Number(fiscal[1]) - Number(end.slice(0, 4))) > 1)
      throw Error("Estimate fiscal period conflicts with its date.");
    if (
      (x.eps !== null && !finite(x.eps)) ||
      (x.revenue !== null && (!finite(x.revenue) || x.revenue < 0)) ||
      (x.eps === null && x.revenue === null)
    )
      throw Error("Estimate values must be finite, with nonnegative revenue.");
    return {
      period,
      date: end,
      currency: x.currency,
      eps: x.eps as number | null,
      revenue: x.revenue as number | null,
      epsBasis: text(x.epsBasis),
      shareBasis: text(x.shareBasis),
    };
  });
  if (
    new Set(rows.map((x) => `${x.period}:${x.date}:${x.currency}`)).size !==
    rows.length
  )
    throw Error("Duplicate estimate periods are not allowed.");
  const savedAt = date(v.savedAt),
    observedAt = date(v.observedAt);
  const savedTime = Date.parse(savedAt),
    observedTime = Date.parse(observedAt),
    day = 86400000;
  if (
    savedTime > Date.now() + day ||
    observedTime > savedTime + day ||
    rows.some(
      (row) =>
        Date.parse(row.date) > observedTime + 1461 * day ||
        Date.parse(row.date) < observedTime - 120 * day,
    )
  )
    throw Error(
      "Estimate snapshot dates are outside the supported observation window.",
    );
  return {
    version: 1,
    symbol: v.symbol,
    savedAt,
    observedAt,
    source: text(v.source, 160),
    rows,
  };
}
export function estimateSnapshot(
  r: Research,
  savedAt = new Date().toISOString(),
): EstimateSnapshot | null {
  const current = targetsEstimates(r);
  if (!current.asOf || !current.estimates.length) return null;
  try {
    return cleanEstimateSnapshot({
      version: 1,
      symbol: r.company.symbol,
      savedAt,
      observedAt: current.asOf,
      source: r.evidence?.source ?? null,
      rows: current.estimates.map((row) => {
        const metadata = row as typeof row & {
          epsBasis?: string;
          shareBasis?: string;
        };
        return {
          period: row.period || "Annual forecast",
          date: row.date,
          currency: row.currency,
          eps: row.eps,
          revenue: row.revenue,
          epsBasis: metadata.epsBasis ?? null,
          shareBasis: metadata.shareBasis ?? null,
        };
      }),
    });
  } catch {
    // Displayable provider rows can still fail stricter persistence validation.
    // Keep malformed or incompatible snapshots out of storage without breaking research.
    return null;
  }
}
export function compareEstimateSnapshots(
  current: EstimateSnapshot,
  prior: EstimateSnapshot,
) {
  if (current.symbol !== prior.symbol) return [];
  const sameSource = !!current.source && current.source === prior.source;
  const chronological =
    Date.parse(current.observedAt) >= Date.parse(prior.observedAt);
  return current.rows.map((row) => {
    const baseline = prior.rows.find(
      (x) =>
        x.period === row.period &&
        x.date === row.date &&
        x.currency === row.currency,
    );
    const common = !baseline
      ? "No matching saved fiscal period and currency"
      : !sameSource
        ? "Source is missing or changed"
        : !chronological
          ? "Current dataset predates saved baseline"
          : null;
    const epsReason =
      common ??
      (!row.epsBasis ||
      !baseline?.epsBasis ||
      row.epsBasis !== baseline.epsBasis
        ? "EPS accounting basis is missing or changed"
        : !row.shareBasis ||
            !baseline.shareBasis ||
            row.shareBasis !== baseline.shareBasis
          ? "EPS share basis is missing or changed"
          : row.eps == null || baseline.eps == null
            ? "EPS comparison unavailable"
            : null);
    const revenueReason =
      common ??
      (row.revenue == null || baseline?.revenue == null
        ? "Revenue comparison unavailable"
        : null);
    return {
      row,
      baseline,
      epsReason,
      revenueReason,
      epsChange: epsReason ? null : estimateGrowth(row.eps, baseline!.eps),
      revenueChange: revenueReason
        ? null
        : estimateGrowth(row.revenue, baseline!.revenue),
    };
  });
}
