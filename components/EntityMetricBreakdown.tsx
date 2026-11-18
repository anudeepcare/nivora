"use client";
import { useState } from "react";
import { useResource } from "./Session";
import type {
  MetricBreakdown,
  BreakdownMode,
  BreakdownDimension,
} from "@/lib/entity-metric-breakdown";
import s from "./EntityMetricHistory.module.css";
export default function EntityMetricBreakdown({
  symbol,
  metric,
  days,
  preview = false,
}: {
  symbol: string;
  metric: string;
  days: number;
  preview?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [mode, setMode] = useState<BreakdownMode>("distribution"),
    [dimension, setDimension] = useState<BreakdownDimension>("source");
  const supported = metric === "mentions" || metric === "sentiment";
  const resource = useResource<MetricBreakdown & { receivedAt: string }>(
    open && supported && !preview
      ? `entity-metric-breakdown/${encodeURIComponent(symbol)}?metric=${metric}&dimension=${dimension}&mode=${mode}&days=${days}`
      : null,
    undefined,
    300000,
  );
  const r = resource.data,
    data =
      r?.symbol === symbol &&
      r.metric === metric &&
      r.mode === mode &&
      r.dimension === dimension &&
      r.requestedDays === days
        ? r
        : null;
  if (!supported)
    return (
      <p>
        No per-source breakdown is available for this metric. Select Mentions or
        Sentiment polarity to explore source evidence.
      </p>
    );
  return (
    <div className={s.root} aria-label="Metric source breakdown">
      <button aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? "Close breakdown" : "Explore source breakdown"}
      </button>
      {open && (
        <>
          <div className={s.controls}>
            <label>
              Evidence
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as BreakdownMode)}
              >
                <option value="distribution">Window breakdown</option>
                <option value="slices">Available slice dimensions</option>
              </select>
            </label>
            {mode === "distribution" && (
              <label>
                Group by
                <select
                  value={dimension}
                  onChange={(e) =>
                    setDimension(e.target.value as BreakdownDimension)
                  }
                >
                  <option value="source">Source</option>
                  <option value="publisher">Publisher</option>
                  <option value="type">Type</option>
                </select>
              </label>
            )}
          </div>
          {preview ? (
            <p>Breakdown is not loaded in this design preview.</p>
          ) : resource.loading ? (
            <p role="status">Loading selected breakdown…</p>
          ) : resource.error ? (
            <div role="status">
              <p>{resource.error}</p>
              <button onClick={() => void resource.refresh()}>
                Retry breakdown
              </button>
            </div>
          ) : !data ? (
            <p>No verified breakdown is available.</p>
          ) : (
            <>
              {mode === "slices" ? (
                <>
                  <p>
                    Coverage metadata, not observations for the selected {days}
                    -day window. No source observation date is supplied.
                  </p>
                  {data.slices.length === 0 ? (
                    <p>No eligible slice dimensions returned.</p>
                  ) : (
                    <div
                      className={s.scroll}
                      role="region"
                      tabIndex={0}
                      aria-label="Available metric slices"
                    >
                      <table>
                        <thead>
                          <tr>
                            <th>Dimension</th>
                            <th>Reported categories</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.slices.map((d) => (
                            <tr key={d.dimension}>
                              <td>{d.label}</td>
                              <td style={{ whiteSpace: "normal" }}>
                                {d.values.join(", ") || "None"}
                                {d.totalValues > d.values.length
                                  ? ` · Showing ${d.values.length} of ${d.totalValues}`
                                  : ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p>
                    {data.unit === "SHARE_PERCENT"
                      ? "Share of represented mention activity (%)"
                      : "Mean sentiment polarity (−1 to +1), each day counts equally"}{" "}
                    · {days}-day requested window
                  </p>
                  {data.unit === "SHARE_PERCENT" ? (
                    <p>
                      These are shares of the represented categories, not raw
                      counts or all headline mentions. Source breakdowns exclude
                      App Store reviews and inputs without public source slices.
                    </p>
                  ) : (
                    <p>
                      These means are not percentages, mention-weighted readings
                      or the composite score. No comparison with a daily
                      baseline is inferred.
                    </p>
                  )}
                  {data.rows.length === 0 ? (
                    <p>No eligible data in this response. Empty is not zero.</p>
                  ) : (
                    <div
                      className={s.scroll}
                      role="region"
                      tabIndex={0}
                      aria-label="Reported metric breakdown"
                    >
                      <table>
                        <thead>
                          <tr>
                            <th>{dimension}</th>
                            <th>
                              {data.unit === "SHARE_PERCENT"
                                ? "Share (%)"
                                : "Mean polarity"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.rows.map((row) => (
                            <tr key={row.label}>
                              <td>{row.label}</td>
                              <td title={String(row.value)}>
                                {row.value.toLocaleString(undefined, {
                                  maximumFractionDigits: 3,
                                })}
                                {data.unit === "SHARE_PERCENT" ? "%" : ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {data.partial && (
                    <p>
                      Showing {data.rows.length} of {data.totalRows} returned
                      categories; displayed shares are not renormalized.
                    </p>
                  )}
                  <p>
                    Computed {data.computedAt ?? "time not supplied"} ·
                    Underlying granularity {data.granularity ?? "not supplied"}
                  </p>
                </>
              )}
              <details>
                <summary>Source and window details</summary>
                <p>
                  SentiSense Metrics v2, requested stock endpoint for {symbol};
                  the source does not independently echo stock identity.
                  Received {data.receivedAt}. Cached for 5 minutes; this view
                  may be older. Values are rounded for display, full supplied
                  values on hover. Source history may be restated.
                </p>
                {data.start && (
                  <p>
                    Window {data.start} through {data.end}.
                  </p>
                )}
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
        </>
      )}
    </div>
  );
}
