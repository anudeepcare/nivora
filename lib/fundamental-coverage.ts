import type { Fact, Metric } from "./types";
const core: Metric[] = [
  "revenue",
  "netIncome",
  "operatingIncome",
  "operatingCashFlow",
  "capex",
];
const dayMs = 86400000;
export type FundamentalCoverage = {
  complete: boolean;
  fresh: boolean;
  latestEnd: string | null;
  currency: string | null;
  present: number;
  missing: Metric[];
  reason: string;
};
/** Assess one comparable reported period; metrics from different currencies,
 * accounting bases or start dates cannot make a sparse statement look complete.
 * This is a recovery trigger, not an investment-quality or sector rating. */
export function fundamentalCoverage(
  facts: Fact[],
  now = Date.now(),
): FundamentalCoverage {
  const groups = new Map<
    string,
    { end: string; currency: string; scope: string; metrics: Set<Metric> }
  >();
  for (const f of facts) {
    if (
      !core.includes(f.metric) ||
      !["annual", "quarterly"].includes(f.scope) ||
      !f.start ||
      !f.currency ||
      f.unit !== f.currency ||
      !Number.isFinite(f.value) ||
      !Number.isFinite(Date.parse(f.end)) ||
      !Number.isFinite(Date.parse(f.filed)) ||
      Date.parse(f.end) > now ||
      Date.parse(f.filed) > now
    )
      continue;
    const days = (Date.parse(f.end) - Date.parse(f.start)) / dayMs;
    if (
      !Number.isFinite(days) ||
      (f.scope === "annual"
        ? days < 330 || days > 400
        : days < 60 || days > 110)
    )
      continue;
    const key = [f.scope, f.start, f.end, f.currency, f.basis].join(":");
    const group = groups.get(key) ?? {
      end: f.end,
      currency: f.currency,
      scope: f.scope,
      metrics: new Set<Metric>(),
    };
    group.metrics.add(f.metric);
    groups.set(key, group);
  }
  const latest = [...groups.entries()].sort(
    ([ak, a], [bk, b]) =>
      b.end.localeCompare(a.end) ||
      b.metrics.size - a.metrics.size ||
      ak.localeCompare(bk),
  )[0]?.[1];
  const missing = core.filter((m) => !latest?.metrics.has(m));
  const fresh =
    !!latest &&
    now - Date.parse(latest.end) <=
      (latest.scope === "annual" ? 550 : 220) * dayMs;
  return {
    complete: missing.length === 0,
    fresh,
    latestEnd: latest?.end ?? null,
    currency: latest?.currency ?? null,
    present: core.length - missing.length,
    missing,
    reason: !latest
      ? "No comparable reported operating period is available."
      : `${missing.length ? `Incomplete operating period: missing ${missing.join(", ")}.` : "Core reported operating metrics are available."}${fresh ? "" : ` Latest comparable period ended ${latest.end}; refresh is needed.`}`,
  };
}
/** Keep the primary on ties. Return an entire source collection without splicing
 * financial observations. Independent profiles and filings are handled elsewhere. */
export function preferReportedFacts(
  primary: Fact[],
  reported: Fact[],
  now = Date.now(),
) {
  const a = fundamentalCoverage(primary, now),
    b = fundamentalCoverage(reported, now);
  const quality = (x: FundamentalCoverage) => [
    Number(x.complete && x.fresh),
    Number(x.fresh),
    x.present,
    Date.parse(x.latestEnd ?? "") || 0,
  ];
  const aq = quality(a),
    bq = quality(b);
  for (let i = 0; i < aq.length; i++) {
    if (aq[i] !== bq[i]) return bq[i] > aq[i];
  }
  return false;
}
