"use client";
import { useState } from "react";
import { useResource } from "./Session";
import type {
  EtfAggregateEvidence as Evidence,
  EtfAggregateMode,
} from "@/lib/etf-aggregate-evidence";
import s from "./EtfAggregateEvidence.module.css";
const number = (v: number | null | undefined) =>
  v == null
    ? "Not supplied"
    : v.toLocaleString(undefined, { maximumFractionDigits: 4 });
export default function EtfAggregateEvidence({ symbol }: { symbol: string }) {
  const [mode, setMode] = useState<EtfAggregateMode | null>(null);
  const resource = useResource<Evidence & { retrievedAt: string }>(
    mode
      ? `etf-aggregate-evidence?symbol=${encodeURIComponent(symbol)}&mode=${mode}`
      : null,
    undefined,
    3600000,
  );
  const data =
    resource.data?.symbol === symbol && resource.data.mode === mode
      ? resource.data
      : null;
  return (
    <section className={s.panel} aria-label={`${symbol} constituent activity`}>
      <h3>Constituent activity &amp; sentiment</h3>
      <p>
        Evidence from the fund’s holdings, not trading instructions or activity
        by the fund itself.
      </p>
      <nav
        className={`${s.tabs} auryn-detail-tabs`}
        aria-label="Fund aggregate evidence"
      >
        {(
          [
            ["insider30", "Insider · 30 days"],
            ["insider90", "Insider · 90 days"],
            ["sentiment", "Sentiment"],
          ] as const
        ).map(([value, label]) => (
          <button
            type="button"
            key={value}
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
          >
            {label}
          </button>
        ))}
      </nav>
      {!mode ? (
        <p>
          Select one view to load it. No constituent-by-constituent requests are
          made.
        </p>
      ) : resource.loading ? (
        <p role="status">Loading constituent evidence…</p>
      ) : resource.error ? (
        <div role="status">
          <p>{resource.error}</p>
          <button type="button" onClick={() => resource.refresh()}>
            Retry aggregate
          </button>
        </div>
      ) : data ? (
        <>
          <div className={s.actions}>
            <p>
              Composition {data.asOfDate ?? "date not supplied"} · Computed{" "}
              <time dateTime={data.computedAt}>
                {new Date(data.computedAt).toLocaleString()}
              </time>
            </p>
            <button type="button" onClick={() => resource.refresh()}>
              Refresh aggregate
            </button>
          </div>
          {data.preview && (
            <p role="note">
              Limited provider preview. {data.previewReason} Missing values are
              not zero.
            </p>
          )}
          <p>
            {data.coverage.holdingsCovered} of {data.coverage.holdingsCount}{" "}
            reported holdings covered · {number(data.coverage.weightCovered)}%
            portfolio weight.{" "}
            {data.coverage.partial === true
              ? "Partial composition, not the complete fund."
              : data.coverage.partial === false
                ? "Reported composition; allocations are not live."
                : "Composition completeness not supplied."}{" "}
            {data.coverage.totalKnownHoldings !== null
              ? `${data.coverage.totalKnownHoldings} total holdings known to issuer.`
              : ""}
          </p>
          {data.flow ? (
            <>
              <p>
                Trailing {data.lookbackDays} days of constituent insider
                activity. Weighted dollars are not fund inflows or redemptions;
                trade and insider counts are unweighted.
              </p>
              <dl className={s.stats}>
                {(
                  [
                    ["netDollars", "Weighted net USD"],
                    ["buyDollars", "Weighted buy USD"],
                    ["sellDollars", "Weighted sell USD"],
                    ["buyTradeCount", "Unweighted buy trades"],
                    ["sellTradeCount", "Unweighted sell trades"],
                    ["distinctInsiderCount", "Distinct insiders"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{number(data.flow?.[key])}</dd>
                  </div>
                ))}
              </dl>
              <h4>Largest reported contributors</h4>
              {data.contributors.length ? (
                <div className={s.table}>
                  <table>
                    <thead>
                      <tr>
                        <th>Holding</th>
                        <th>Fund weight %</th>
                        <th>Stock net USD</th>
                        <th>Weighted net USD</th>
                        <th>Trades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.contributors.map((row) => (
                        <tr key={row.ticker}>
                          <th scope="row">{row.ticker}</th>
                          <td>{number(row.weightPct)}</td>
                          <td>{number(row.netDollars)}</td>
                          <td>{number(row.weightedNetDollars)}</td>
                          <td>{number(row.tradeCount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No contributors supplied.</p>
              )}
              <p>
                Top contributors are a partial attribution list, not the
                complete portfolio. Constituent symbols are displayed without
                inferring US listing links.
              </p>
            </>
          ) : (
            <>
              <p>
                Signed, open-ended sentiment Score readings. These are not
                percentages, a 0–100 Rating or return probabilities. Positive
                and negative readings describe the provider’s measured tone, not
                expected returns.
              </p>
              <div className={s.readings}>
                {(
                  [
                    ["weighted", "Constituent-weighted"],
                    ["direct", "Direct fund mentions"],
                  ] as const
                ).map(([key, label]) => {
                  const value = data[key];
                  return (
                    <article key={key}>
                      <h4>{label}</h4>
                      <strong>{number(value?.score)}</strong>
                      <p>{value?.label ?? "Label not supplied"}</p>
                      <p>
                        Metric produced{" "}
                        {value?.asOf ? (
                          <time dateTime={value.asOf}>
                            {new Date(value.asOf).toLocaleString()}
                          </time>
                        ) : (
                          "time not supplied"
                        )}
                      </p>
                    </article>
                  );
                })}
              </div>
              <p>
                These readings may diverge and have different observation times.
                No per-holding sentiment contributors are supplied by this
                endpoint.
              </p>
            </>
          )}
          <details data-info-disclosure>
            <summary>Source &amp; calculation basis</summary>
            <p>
              Source: SentiSense ETF aggregates. Holdings-weighted views depend
              on the reported composition and per-stock coverage. Coverage is
              not a confidence score. Computation time is not the time of an
              insider transaction or a direct sentiment observation.
            </p>
            <p>
              Fetched{" "}
              {data.retrievedAt
                ? new Date(data.retrievedAt).toLocaleString()
                : "time unavailable"}
              . Session reuse lasts one hour; an open view may be older. Refresh
              requests the latest published aggregate, not live underlying data.
            </p>
          </details>
        </>
      ) : null}
    </section>
  );
}
