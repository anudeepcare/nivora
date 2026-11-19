export function earningsReview(
  rows: {
    date: string;
    period: string;
    actual: number | null;
    estimate: number | null;
  }[],
  day: string,
) {
  const latest = rows
    .filter(
      (e) =>
        /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
        Number.isFinite(Date.parse(e.date)) &&
        e.date <= day,
    )
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!latest) return null;
  const actual =
    typeof latest.actual === "number" && Number.isFinite(latest.actual)
      ? latest.actual
      : null;
  const estimate =
    typeof latest.estimate === "number" && Number.isFinite(latest.estimate)
      ? latest.estimate
      : null;
  const surprise =
    actual !== null && estimate !== null && estimate !== 0
      ? ((actual - estimate) / Math.abs(estimate)) * 100
      : null;
  return {
    ...latest,
    actual,
    estimate,
    surprise,
    reported: actual !== null,
    label:
      actual === null
        ? "Results not confirmed"
        : estimate === null
          ? "Estimate unavailable"
          : actual > estimate
            ? "EPS above the supplied estimate"
            : actual < estimate
              ? "EPS below the supplied estimate"
              : "EPS matched the supplied estimate",
  };
}

type ThesisPeriod = {
  end: string;
  currency: string;
  basis: string;
  revenue?: number | null;
  margin?: number | null;
  weightedShares?: number | null;
};
/** Descriptive comparisons only; caller supplies comparable annual/TTM periods. */
export function earningsThesisChecks(
  latest: ThesisPeriod | null | undefined,
  prior: ThesisPeriod | null | undefined,
) {
  if (
    !latest ||
    !prior ||
    latest.currency !== prior.currency ||
    latest.basis !== prior.basis ||
    latest.end <= prior.end
  )
    return [];
  const finite = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v);
  const rows: string[] = [];
  if (finite(latest.revenue) && finite(prior.revenue) && prior.revenue > 0)
    rows.push(
      `Revenue changed ${((latest.revenue / prior.revenue - 1) * 100).toFixed(1)}% versus the comparable period. Revisit your demand assumptions.`,
    );
  if (finite(latest.margin) && finite(prior.margin))
    rows.push(
      `Operating margin changed ${(latest.margin - prior.margin).toFixed(1)} percentage points. Revisit pricing and cost assumptions.`,
    );
  if (
    finite(latest.weightedShares) &&
    finite(prior.weightedShares) &&
    prior.weightedShares > 0
  )
    rows.push(
      `Weighted shares changed ${((latest.weightedShares / prior.weightedShares - 1) * 100).toFixed(1)}%. Revisit per-share growth and dilution assumptions.`,
    );
  return rows;
}

type AnnualThesisPeriod = ThesisPeriod & {
  start: string;
  filed: string;
  sourceUrl: string;
  fcf?: number | null;
};
/** Compare filed annual observations, not the earnings surprise or a forecast. */
export function annualThesisBridge(periods: AnnualThesisPeriod[], day: string) {
  const date = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
  if (!date(day)) return null;
  const rows = periods
    .filter(
      (p) =>
        date(p.start) &&
        date(p.end) &&
        date(p.filed) &&
        p.end <= day &&
        p.filed <= day &&
        p.filed >= p.end &&
        p.currency &&
        p.basis,
    )
    .sort(
      (a, b) => b.end.localeCompare(a.end) || b.filed.localeCompare(a.filed),
    );
  const latest = rows[0];
  if (!latest) return null;
  const annual = (p: AnnualThesisPeriod) => {
    const length = (Date.parse(p.end) - Date.parse(p.start)) / 86400000;
    return length >= 300 && length <= 400;
  };
  if (!annual(latest)) return null;
  const prior = rows.find((p) => {
    const gap = (Date.parse(latest.end) - Date.parse(p.end)) / 86400000;
    return (
      annual(p) &&
      Math.abs(
        Date.parse(latest.end) -
          Date.parse(latest.start) -
          (Date.parse(p.end) - Date.parse(p.start)),
      ) <=
        14 * 86400000 &&
      gap >= 300 &&
      gap <= 430 &&
      p.currency === latest.currency &&
      p.basis === latest.basis
    );
  });
  if (!prior) return null;
  const checks = earningsThesisChecks(latest, prior);
  if (
    typeof latest.fcf === "number" &&
    Number.isFinite(latest.fcf) &&
    typeof prior.fcf === "number" &&
    Number.isFinite(prior.fcf) &&
    prior.fcf > 0 &&
    typeof latest.weightedShares === "number" &&
    Number.isFinite(latest.weightedShares) &&
    latest.weightedShares > 0 &&
    typeof prior.weightedShares === "number" &&
    Number.isFinite(prior.weightedShares) &&
    prior.weightedShares > 0
  ) {
    const change =
      (latest.fcf / latest.weightedShares / (prior.fcf / prior.weightedShares) -
        1) *
      100;
    checks.push(
      `Free cash flow per weighted share changed ${change.toFixed(1)}%. Revisit cash generation per share, not just total growth.`,
    );
  }
  return checks.length ? { latest, prior, checks } : null;
}
