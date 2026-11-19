"use client";
import { useState } from "react";
import EntityMetricBreakdown from "./EntityMetricBreakdown";
import { useResource } from "./Session";
import {
  entityMetrics,
  type EntityMetric,
  type EntityMetricHistory as History,
} from "@/lib/entity-metric-history";
import s from "./EntityMetricHistory.module.css";
export default function EntityMetricHistory({
  symbol,
  preview = false,
}: {
  symbol: string;
  preview?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [metric, setMetric] = useState<EntityMetric>("sentiment"),
    [days, setDays] = useState(30);
  const resource = useResource<History & { receivedAt: string }>(
    open && !preview
      ? `entity-metric-history/${encodeURIComponent(symbol)}?metric=${metric}&days=${days}`
      : null,
    undefined,
    300000,
  );
  const r = resource.data,
    data =
      r?.symbol === symbol && r.metric === metric && r.days === days ? r : null;
  const format = (n: number | null) =>
    n === null
      ? "No reading"
      : `${(metric === "social_dominance" ? n * 100 : n).toLocaleString(undefined, { maximumFractionDigits: 3 })}${metric === "social_dominance" ? "%" : ""}`;
  const points = data?.points ?? [],
    numbers = points.flatMap((p) => (p.value === null ? [] : [p.value])),
    scale = Math.max(1, ...numbers.map(Math.abs)),
    low = Math.min(...numbers.map((n) => n / scale)),
    high = Math.max(...numbers.map((n) => n / scale));
  const t0 = points[0]?.timestamp ?? 0,
    t1 = points.at(-1)?.timestamp ?? 0;
  const x = (t: number) => 40 + ((t - t0) / Math.max(1, t1 - t0)) * 520,
    y = (n: number) =>
      high === low ? 70 : 120 - ((n / scale - low) / (high - low)) * 100;
  const latest = points.at(-1);
  return (
    <section className={s.root} aria-label="Dated conversation metrics">
      <header>
        <div>
          <h3>Dated conversation metrics</h3>
          <p>
            Actual reported observations, separate from price and valuation.
          </p>
        </div>
        <button aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? "Close metric history" : "Open metric history"}
        </button>
      </header>
      {open && (
        <>
          <div className={s.controls}>
            <label>
              Metric
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as EntityMetric)}
              >
                {Object.entries(entityMetrics).map(([key, m]) => (
                  <option key={key} value={key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <div role="group" aria-label="Metric history window">
              {[30, 90].map((n) => (
                <button
                  key={n}
                  aria-pressed={days === n}
                  onClick={() => setDays(n)}
                >
                  {n} days
                </button>
              ))}
            </div>
          </div>
          {preview ? (
            <p>Metric history is not loaded in this design preview.</p>
          ) : resource.loading ? (
            <p role="status">Loading dated observations…</p>
          ) : resource.error ? (
            <div role="status">
              <p>{resource.error}</p>
              <button onClick={() => void resource.refresh()}>
                Retry history
              </button>
            </div>
          ) : !data ? (
            <p>No verified metric history is available.</p>
          ) : (
            <>
              <div className={s.caption}>
                <strong>{latest ? format(latest.value) : "No readings"}</strong>
                <span>
                  {entityMetrics[metric].label} ·{" "}
                  {metric === "social_dominance"
                    ? "share of voice, shown as percent"
                    : entityMetrics[metric].unit}
                  {latest ? ` · Latest observed ${latest.at}` : ""}
                </span>
              </div>
              {points.length > 0 && numbers.length > 0 ? (
                <figure>
                  <svg
                    viewBox="0 0 600 160"
                    role="img"
                    aria-label={`${entityMetrics[metric].label}: actual dated observations`}
                  >
                    <line
                      x1="40"
                      y1="125"
                      x2="560"
                      y2="125"
                      stroke="currentColor"
                      opacity=".2"
                    />
                    {points.map((p, i) =>
                      p.value === null ? null : (
                        <g key={p.timestamp}>
                          {i > 0 &&
                            points[i - 1].value !== null &&
                            p.timestamp - points[i - 1].timestamp <=
                              36 * 3600000 && (
                              <line
                                x1={x(points[i - 1].timestamp)}
                                y1={y(points[i - 1].value!)}
                                x2={x(p.timestamp)}
                                y2={y(p.value)}
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                            )}
                          <circle cx={x(p.timestamp)} cy={y(p.value)} r="3">
                            <title>{`${p.at}: ${format(p.value)}`}</title>
                          </circle>
                        </g>
                      ),
                    )}
                    <text x="40" y="148">
                      {points[0].at.slice(0, 10)}
                    </text>
                    <text x="560" y="148" textAnchor="end">
                      {points.at(-1)!.at.slice(0, 10)}
                    </text>
                  </svg>
                  <figcaption>
                    {points.length} returned observations · Timestamps shown in
                    UTC. The current New York day may be incomplete. Missing
                    dates are not filled.
                  </figcaption>
                </figure>
              ) : (
                <p>
                  No numeric observations in this response; absence is not zero.
                </p>
              )}
              <div
                className={s.scroll}
                role="region"
                tabIndex={0}
                aria-label="Reported dated metric readings"
              >
                <table>
                  <thead>
                    <tr>
                      <th>Observation (UTC)</th>
                      <th>{entityMetrics[metric].label}</th>
                      {metric === "sentisense" && (
                        <>
                          <th>Bull / bear mentions</th>
                          <th>Directional sample</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {points
                      .slice()
                      .reverse()
                      .map((p) => (
                        <tr key={p.timestamp}>
                          <td>
                            {p.at.replace("T", " ").replace(".000Z", " UTC")}
                          </td>
                          <td>{format(p.value)}</td>
                          {metric === "sentisense" && (
                            <>
                              <td>
                                {p.bull ?? "Unknown"} / {p.bear ?? "Unknown"}
                              </td>
                              <td>
                                {p.directional ?? "Unknown"}
                                {p.directional !== null && p.directional < 10
                                  ? " · Thin sample"
                                  : ""}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <details>
                <summary>Window, source &amp; interpretation</summary>
                <p>
                  Requested {data.start} through {data.end}. At most 90 original
                  observations; no daily values or gaps are synthesized.
                  Received {data.receivedAt}; cached for 5 minutes and this view
                  may be older.
                </p>
                <p>
                  SentiSense Metrics v2, requested stock endpoint for {symbol};
                  the series does not independently echo its stock identity.
                  Sentiment is polarity, score is unbounded, and mentions are
                  activity rather than direction. Historical readings may be
                  restated by the source; they are not immutable as-known
                  records. Displayed values are rounded to three decimal places.
                  No comparison to baseline averages or trading recommendation
                  is inferred.
                </p>
                <a
                  href="https://sentisense.ai/docs/api/metrics/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Source documentation
                </a>
              </details>
            </>
          )}
          <EntityMetricBreakdown
            key={`${symbol}-${metric}-${days}`}
            symbol={symbol}
            metric={metric}
            days={days}
            preview={preview}
          />
        </>
      )}
    </section>
  );
}
