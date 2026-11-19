"use client";
import { useState } from "react";
import { useResource } from "./Session";
import {
  appMetrics,
  type AppMetric,
  type AppHistory,
} from "@/lib/product-app-history";
import s from "./ProductAppHistory.module.css";
export default function ProductAppHistory({ handle }: { handle: string }) {
  const [open, setOpen] = useState(false),
    [metric, setMetric] = useState<AppMetric>("app_review_count"),
    [days, setDays] = useState(30);
  const resource = useResource<
    AppHistory & { productName: string; receivedAt: string }
  >(
    open
      ? `product-app-history?handle=${encodeURIComponent(handle)}&metric=${metric}&days=${days}`
      : null,
    undefined,
    3600000,
  );
  const r = resource.data,
    data =
      r?.handle === handle && r.metric === metric && r.days === days ? r : null;
  const stars = metric === "app_rating" || metric === "app_all_ratings_avg",
    allocated =
      metric === "app_all_ratings_count" || metric === "app_all_ratings_avg";
  const points = data?.points ?? [],
    maximum = stars ? 5 : Math.max(1, ...points.map((p) => p.value ?? 0));
  const date = (timestamp: number) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(timestamp));
  const show = (value: number | null) =>
    value === null
      ? "Not supplied"
      : value.toLocaleString(undefined, { maximumFractionDigits: 3 });
  return (
    <section className={s.root} aria-label="Product app reviews and ratings">
      <header>
        <div>
          <h4>App reviews &amp; ratings over time</h4>
          <p>
            Tracked iOS App Store evidence for this product, separate from
            conversation or investment ratings.
          </p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "Close app history" : "Open app history"}
        </button>
      </header>
      {open && (
        <>
          <div className={s.controls}>
            <label>
              Metric
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as AppMetric)}
              >
                {Object.entries(appMetrics).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Window
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </label>
            <button type="button" onClick={() => resource.refresh()}>
              Refresh app history
            </button>
          </div>
          {allocated ? (
            <p role="note">
              All ratings combine star-only ratings and written reviews.
              Store-count changes are spread evenly across days, not
              independently measured daily. Missing days can mean no net
              increase or falling store totals, not zero ratings. Compare
              supported periods, not adjacent points. The all-ratings series
              ends before the latest written-review day; this lag is expected.
            </p>
          ) : (
            <p>
              Written reviews are a small, potentially unrepresentative subset
              of all ratings. Mean stars describe only that day’s new written
              reviews, not the app’s lifetime rating.
            </p>
          )}
          <p>
            No period average or growth rate is calculated. A meaningful period
            star average requires matching count weights; one series alone
            cannot establish it.
          </p>
          {resource.loading ? (
            <p role="status">Loading dated app evidence…</p>
          ) : resource.error ? (
            <p role="status">{resource.error}</p>
          ) : data ? (
            <>
              <p>
                {data.productName} · requested {date(data.start)}–
                {date(data.end)} (New York calendar labels). {points.length}{" "}
                reported points. Dates below are provider observations, not
                filled calendar days.
              </p>
              {!points.length ? (
                <p>
                  No app observations returned: coverage may be absent or this
                  window may have no readings. This is not proof of zero reviews
                  or no users.
                </p>
              ) : (
                <>
                  <figure className={s.chart}>
                    <figcaption>
                      {appMetrics[metric]} · {stars ? "stars, 1–5" : "count"} ·
                      dots only, gaps not connected
                    </figcaption>
                    <svg
                      viewBox="0 0 640 160"
                      role="img"
                      aria-label={`${appMetrics[metric]} dated observations`}
                    >
                      <line x1="45" y1="125" x2="625" y2="125" />
                      <text x="5" y="22">
                        {show(maximum)}
                      </text>
                      <text x="5" y="128">
                        {stars ? "1" : "0"}
                      </text>
                      {points
                        .filter((p) => p.value !== null)
                        .map((p) => (
                          <circle
                            key={p.timestamp}
                            cx={
                              45 +
                              ((p.timestamp - data.start) /
                                (data.end - data.start)) *
                                580
                            }
                            cy={
                              stars
                                ? 125 - ((p.value! - 1) / 4) * 105
                                : 125 - (p.value! / maximum) * 105
                            }
                            r="3"
                          >
                            <title>{`${date(p.timestamp)}: ${show(p.value)}${stars ? " stars" : ""}`}</title>
                          </circle>
                        ))}
                      <text x="45" y="150">
                        {date(data.start)}
                      </text>
                      <text x="625" y="150" textAnchor="end">
                        {date(data.end)}
                      </text>
                    </svg>
                  </figure>
                  <details>
                    <summary>
                      Dates &amp; values · {points.length} observations
                    </summary>
                    <div className={s.table}>
                      <table>
                        <thead>
                          <tr>
                            <th>Date · New York</th>
                            <th>{stars ? "Mean stars" : "Count"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {points.map((p) => (
                            <tr key={p.timestamp}>
                              <td>
                                <time
                                  dateTime={new Date(p.timestamp).toISOString()}
                                >
                                  {date(p.timestamp)}
                                </time>
                              </td>
                              <td>{show(p.value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </>
              )}
              <details data-info-disclosure>
                <summary>Source &amp; coverage</summary>
                <p>
                  Source: SentiSense product App Store metrics. Only tracked
                  product apps have coverage; there is no review text,
                  geographic storefront breakdown or consumer index in this
                  view. Identity is checked before each selected metric request.
                  The metric array itself has no mandatory product identity
                  echo.
                </p>
                <p>
                  Received {new Date(data.receivedAt).toLocaleString()}. Session
                  reuse is one hour; an open view can be older. Retrieval does
                  not make older observations current. The latest bucket can be
                  partial; no adjacent-day comparison is inferred.
                </p>
              </details>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
