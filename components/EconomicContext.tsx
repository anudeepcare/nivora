"use client";
import { useState } from "react";
import { useResource } from "./Session";
import { Help } from "./Ui";
import type { EodContextData, EodContextKind } from "../lib/eod-context";
import s from "./EconomicContext.module.css";
const number = (n: number | null) =>
  n === null
    ? "Not supplied"
    : n.toLocaleString(undefined, { maximumFractionDigits: 3 });
export default function EconomicContext({
  symbol,
  preview = false,
}: {
  symbol: string;
  preview?: boolean;
}) {
  const [kind, setKind] = useState<EodContextKind | null>(null);
  const data = useResource<EodContextData>(
    !preview && kind
      ? `market-context?kind=${kind}${kind === "dividends" ? `&symbol=${encodeURIComponent(symbol)}` : ""}`
      : null,
    undefined,
    1800000,
  );
  if (preview) return null;
  const result = data.data?.kind === kind ? data.data : null;
  return (
    <section className={s.context} aria-label="Dividend and economic context">
      <header>
        <h3>Dividend dates &amp; economic context</h3>
        <Help label="Context sources">
          These reported values are from EODHD calendar and US Treasury
          datasets. Calendar dates may change. Treasury par yields are market
          context, not a company discount rate or a trade recommendation. Only
          the selected dataset is requested; data is cached, not streaming.
        </Help>
      </header>
      <div
        className={s.controls}
        role="group"
        aria-label="Select context dataset"
      >
        {(
          [
            ["dividends", "Company dividend dates"],
            ["economy", "US events · next 7 days"],
            ["treasury", "Treasury curve"],
          ] as const
        ).map(([id, label]) => (
          <button
            type="button"
            aria-pressed={kind === id}
            key={id}
            onClick={() => setKind(kind === id ? null : id)}
          >
            {label}
          </button>
        ))}
      </div>
      {kind && (
        <div className={s.body}>
          {data.loading ? (
            <p role="status">Loading selected context…</p>
          ) : data.error ? (
            <p role="alert">
              {data.error}{" "}
              <button type="button" onClick={data.refresh}>
                Retry
              </button>
            </p>
          ) : (
            result && (
              <>
                {result.kind === "dividends" && (
                  <>
                    <p>
                      Reported dividend dates for {symbol}, {result.from}–
                      {result.to}. This feed supplies dates only, not confirmed
                      payment amounts or an explicit ex-date classification.
                    </p>
                    {result.rows.length ? (
                      <ul>
                        {result.rows.map((row) => (
                          <li key={row.date}>
                            <time dateTime={row.date}>{row.date}</time> ·
                            Reported dividend date
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>
                        No dividend dates returned in this window. This does not
                        prove no future dividend.
                      </p>
                    )}
                    {result.truncated && (
                      <p>
                        Only the first available page is shown; coverage is
                        partial.
                      </p>
                    )}
                  </>
                )}
                {result.kind === "economy" && (
                  <>
                    <p>
                      US scheduled releases. Reported times have no supplied
                      timezone. Numeric units are not supplied; values are shown
                      without inferred currency or percent signs.
                    </p>
                    <div
                      className={s.scroll}
                      tabIndex={0}
                      role="region"
                      aria-label="Economic events table"
                    >
                      <table>
                        <thead>
                          <tr>
                            <th>Release / period</th>
                            <th>Reported date / time</th>
                            <th>Actual</th>
                            <th>Estimate</th>
                            <th>Previous</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.rows.map((row, i) => (
                            <tr key={`${row.name}-${row.date}-${i}`}>
                              <th>
                                {row.name}
                                <small>
                                  {[row.period, row.comparison]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </small>
                              </th>
                              <td>
                                {row.date}
                                <small>
                                  {row.reportedTime} · timezone unspecified
                                </small>
                              </td>
                              <td>{number(row.actual)}</td>
                              <td>{number(row.estimate)}</td>
                              <td>{number(row.previous)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!result.rows.length && (
                      <p>No events returned for this window.</p>
                    )}
                    {result.truncated && (
                      <p>
                        First 100 provider rows only; this is not a complete
                        calendar.
                      </p>
                    )}
                  </>
                )}
                {result.kind === "treasury" && (
                  <>
                    <p>
                      Nominal Treasury par yields ·{" "}
                      {result.date
                        ? `observation ${result.date}`
                        : "No observation supplied"}
                      . Missing tenors are not filled from another date.
                    </p>
                    <dl className={s.curve}>
                      {result.rows.map((row) => (
                        <div key={row.tenor}>
                          <dt>{row.tenor}</dt>
                          <dd>{number(row.rate)}%</dd>
                        </div>
                      ))}
                    </dl>
                    {result.spread10y2y !== null && (
                      <p>
                        10Y minus 2Y: {number(result.spread10y2y)} percentage
                        points, same observation date.
                      </p>
                    )}
                    {!result.rows.length && (
                      <p>No current-year yield curve returned.</p>
                    )}
                  </>
                )}
                <small>
                  Checked{" "}
                  <time dateTime={result.checkedAt}>
                    {new Date(result.checkedAt).toLocaleString()}
                  </time>
                  . This check may reuse cached source data up to{" "}
                  {result.cacheMaxAgeSeconds / 3600} hours old. It is not a new
                  source retrieval or observation.
                </small>
              </>
            )
          )}
        </div>
      )}
    </section>
  );
}
