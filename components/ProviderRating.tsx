"use client";
import { useState } from "react";
import { useResource } from "./Session";
import type { ProviderRatingData } from "@/lib/provider-rating";
import s from "./ProviderRating.module.css";
export default function ProviderRating({ symbol }: { symbol: string }) {
  const [enabled, setEnabled] = useState(false);
  const resource = useResource<ProviderRatingData & { retrievedAt: string }>(
    enabled ? `provider-rating?symbol=${encodeURIComponent(symbol)}` : null,
    undefined,
    3600000,
  );
  const data = resource.data?.symbol === symbol ? resource.data : null;
  const flags = [
    ["clustered_insider_selling", "Clustered insider selling"],
    [
      "institutional_outflow_against_price",
      "Institutional outflows against price",
    ],
    ["unusual_options_flow", "Unusual options flow"],
  ];
  return (
    <section
      className={s.panel}
      aria-label={`${symbol} composite rating evidence`}
    >
      <header className={s.header}>
        <div>
          <h3>Composite rating</h3>
          <p>
            Optional external research evidence. Not a Pace signal, return
            forecast or trading instruction.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (enabled ? resource.refresh() : setEnabled(true))}
        >
          {enabled ? "Refresh rating" : "Load rating"}
        </button>
      </header>
      {!enabled ? (
        <p>
          Load the latest published daily rating and its supporting dimensions.
          No request runs until you choose to load it.
        </p>
      ) : resource.loading ? (
        <p role="status">Loading rating…</p>
      ) : resource.error ? (
        <p role="status">{resource.error}</p>
      ) : data ? (
        <>
          <p>
            Run date <time dateTime={data.asOf}>{data.asOf}</time> ·{" "}
            {data.presentCount} of 7 dimensions available. Run date is not a
            live quote timestamp; inputs include prior-session observations and
            latest available filings.
          </p>
          {data.rated ? (
            <dl className={s.stats}>
              <div>
                <dt>Rating · score</dt>
                <dd>
                  {data.letter} <span>{data.score} / 100</span>
                </dd>
              </div>
              <div>
                <dt>Rank before adjustments</dt>
                <dd>
                  {data.percentile}
                  <small> percentile</small>
                </dd>
              </div>
              <div>
                <dt>Risk adjustment</dt>
                <dd>
                  {data.penaltyPoints}
                  <small> points</small>
                </dd>
              </div>
              <div>
                <dt>Rated universe</dt>
                <dd>
                  {data.ratedCount?.toLocaleString()}
                  <small> stocks</small>
                </dd>
              </div>
            </dl>
          ) : (
            <div role="status">
              <h4>Not rated</h4>
              <p>
                {data.reason?.replaceAll("_", " ")}. This is missing rating
                evidence, not a neutral grade.
              </p>
            </div>
          )}
          <p role="note">{data.disclaimer}</p>
          {data.betaNotice && <p role="note">{data.betaNotice}</p>}
          <div className={s.dimensions}>
            {data.dimensions.map((d) => (
              <article key={d.key}>
                <header>
                  <h4>{d.label}</h4>
                  <span>
                    {d.present ? `${d.percentile} percentile` : "Unavailable"}
                  </span>
                </header>
                {d.present ? (
                  <meter
                    min={0}
                    max={100}
                    value={d.percentile ?? 0}
                    aria-label={`${d.label} percentile`}
                  />
                ) : (
                  <p>
                    {d.unavailableReason?.replaceAll("_", " ") ??
                      "No underlying evidence supplied."}
                  </p>
                )}
                {d.present && (
                  <p>
                    {d.raw === null
                      ? "No single underlying number"
                      : `${d.rawLabel ?? "Underlying reading (unit not supplied)"}: ${d.raw}`}
                  </p>
                )}
                {d.subLegs.length > 0 && (
                  <ul>
                    {d.subLegs.map((l) => (
                      <li key={l.key}>
                        {l.label}:{" "}
                        {l.raw === null ? "Not supplied" : `${l.raw} ${l.unit}`}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
          {data.rated && (
            <details>
              <summary>Risk adjustments · {data.penaltyPoints} points</summary>
              {data.adjustments.length ? (
                <ul>
                  {data.adjustments.map((a) => (
                    <li key={a.condition}>
                      {a.condition.replaceAll("_", " ")}: {a.points} points
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  No adjustments reported. This does not establish absence of
                  risk.
                </p>
              )}
              <p>
                Actual reported adjustment costs are used, not a fixed cost per
                condition. Missing dimensions affect the provider’s methodology;
                unavailable readings above are not observed medians.
              </p>
            </details>
          )}
          <details>
            <summary>Evaluated anomaly flags</summary>
            <ul>
              {flags.map(([key, label]) => {
                const f = data.flags.find((item) => item.key === key);
                return (
                  <li key={key}>
                    {label}:{" "}
                    {f ? (f.active ? "Active" : "Inactive") : "Not assessable"}
                  </li>
                );
              })}
              {data.flags
                .filter((f) => !flags.some(([key]) => key === f.key))
                .map((f) => (
                  <li key={f.key}>
                    {f.label}: {f.active ? "Active" : "Inactive"}
                  </li>
                ))}
            </ul>
            <p>
              An absent flag is not an inactive flag. Informational flags need
              not deduct points.
            </p>
          </details>
          <details data-info-disclosure>
            <summary>Source &amp; methodology</summary>
            <p>
              Source: SentiSense Rating.{" "}
              {data.methodologyVersion
                ? `Methodology ${data.methodologyVersion}. `
                : ""}
              This composite Rating differs from the crowd-sentiment Score.
              Methodology may change, including refinements within one version.
            </p>
            <p>
              Fetched{" "}
              {data.retrievedAt
                ? new Date(data.retrievedAt).toLocaleString()
                : "time unavailable"}
              . Session reuse lasts one hour; an open view can be older. Use
              Refresh for a new request. The provider normally recomputes once
              daily.
            </p>
            <a
              href="https://sentisense.ai/methodology/#sentisense-rating"
              target="_blank"
              rel="noopener noreferrer"
            >
              Provider methodology ↗
            </a>
          </details>
        </>
      ) : null}
    </section>
  );
}
