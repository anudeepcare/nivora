"use client";
import { useState } from "react";
import { useResource } from "./Session";
import type { StockSentimentData } from "@/lib/stock-sentiment";
import s from "./StockSentiment.module.css";
const value = (n: number | null, suffix = "") =>
  n === null
    ? "Not supplied"
    : `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`;
export default function StockSentiment({
  symbol,
  preview = false,
}: {
  symbol: string;
  preview?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const resource = useResource<StockSentimentData & { receivedAt: string }>(
    open && !preview ? `stock-sentiment/${encodeURIComponent(symbol)}` : null,
    undefined,
    300000,
  );
  const data = resource.data?.symbol === symbol ? resource.data : null;
  const history = data?.history ?? [],
    scale = Math.max(1, ...history.map(Math.abs)),
    normalized = history.map((n) => n / scale),
    lo = Math.min(...normalized),
    hi = Math.max(...normalized);
  const points = normalized
    .map(
      (n, i) =>
        `${10 + (i * 580) / Math.max(1, history.length - 1)},${hi === lo ? 40 : 70 - ((n - lo) / (hi - lo)) * 60}`,
    )
    .join(" ");
  return (
    <section className={s.root} aria-label="Stock sentiment">
      <header>
        <div>
          <h3>Conversation &amp; sentiment</h3>
          <p>
            Reported tone and attention, not a valuation or trade instruction.
          </p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close sentiment" : "Open sentiment"}
        </button>
      </header>
      {open &&
        (preview ? (
          <p>Sentiment is not loaded in this design preview.</p>
        ) : resource.loading ? (
          <p role="status">Loading sentiment…</p>
        ) : resource.error ? (
          <div role="status">
            <p>{resource.error}</p>
            <button onClick={() => void resource.refresh()}>
              Retry sentiment
            </button>
          </div>
        ) : !data ? (
          <p role="status">No verified sentiment response is available.</p>
        ) : (
          <>
            <p className={s.note}>
              Evidence date: {data.asOf ?? "Not supplied"} ·{" "}
              {data.isPreview
                ? "Preview, numeric evidence withheld"
                : "Reported snapshot, not live"}
            </p>
            <dl className={s.metrics}>
              <div>
                <dt>30-day composite</dt>
                <dd>{value(data.average30d)}</dd>
                <small>
                  {data.scoreLabel ?? "Regime not supplied"}
                  {data.thin30d === true
                    ? " · Thin sample"
                    : data.thin30d === null
                      ? " · Sample size unknown"
                      : ""}
                </small>
              </div>
              <div>
                <dt>Current daily composite</dt>
                <dd>
                  {data.scoreStatus === "pending"
                    ? "No reading yet"
                    : data.score === null
                      ? "Not available"
                      : value(data.score)}
                </dd>
                <small>
                  {data.latestDirection ?? "Direction unavailable"}
                  {data.thinToday === true
                    ? " · Thin sample"
                    : data.thinToday === null
                      ? " · Sample size unknown"
                      : ""}
                </small>
              </div>
              <div>
                <dt>30-day change</dt>
                <dd>{value(data.change30d, " points")}</dd>
                <small>Unbounded composite scale, not percent</small>
              </div>
              <div>
                <dt>Social share of voice</dt>
                <dd>
                  {data.socialDominance === null
                    ? "Not supplied"
                    : value(data.socialDominance * 100, "%")}
                </dd>
                <small>Fraction converted to percent</small>
              </div>
              <div>
                <dt>Latest available mention bucket</dt>
                <dd>{value(data.mentions)}</dd>
                <small>Bucket date not supplied separately</small>
              </div>
              <div>
                <dt>30-day daily mentions</dt>
                <dd>{value(data.mentionsAverage30d)}</dd>
                <small>Average per day</small>
              </div>
            </dl>
            {history.length > 0 && (
              <figure className={s.history}>
                <svg
                  viewBox="0 0 600 80"
                  role="img"
                  aria-label="Reported score sequence; dates not supplied"
                >
                  <polyline
                    points={points}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                <figcaption>
                  {history.length} reported readings · Dates not supplied; no
                  calendar alignment
                  {data.historyLimited ? " · Last 90 returned points" : ""}
                </figcaption>
                <details>
                  <summary>Exact sequence values</summary>
                  <p>{history.map((n) => value(n)).join(" · ")}</p>
                </details>
              </figure>
            )}
            {data.historyInvalid && <p>Unsupported score sequence withheld.</p>}
            {data.sources.length > 0 && (
              <div
                className={s.scroll}
                role="region"
                tabIndex={0}
                aria-label="Source sentiment"
              >
                <table>
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>30-day polarity (−1 to +1)</th>
                      <th>Mention share</th>
                      <th>Direction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sources.map((r, i) => (
                      <tr key={`${r.source}-${i}`}>
                        <td>{r.source}</td>
                        <td>{value(r.polarity)}</td>
                        <td>{value(r.share, "%")}</td>
                        <td>{r.direction ?? "Not supplied"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className={s.note}>
              Source shares are independently rounded and need not sum to 100%.
              Polarity is not the composite score. A missing daily reading is
              not zero.
            </p>
            {(data.narrative || data.drivers.length > 0) && (
              <details>
                <summary>Reported narrative &amp; story drivers</summary>
                {data.narrative && <p>{data.narrative}</p>}
                <ul>
                  {data.drivers.map((d, i) => (
                    <li key={i}>
                      {d.title} · Tone {value(d.tone)}
                    </li>
                  ))}
                </ul>
                <p>
                  Source commentary; story publication dates are not supplied
                  here.
                </p>
                {data.faq.map((f, i) => (
                  <div key={i}>
                    <strong>{f.question}</strong>
                    <p>{f.answer}</p>
                  </div>
                ))}
              </details>
            )}
            {data.peers.length > 0 && (
              <p className={s.note}>
                Curated peers: {data.peers.map((p) => p.symbol).join(", ")}. Not
                a performance ranking.
              </p>
            )}
            <details>
              <summary>Data source &amp; definitions</summary>
              <p>
                SentiSense stock sentiment. Received {data.receivedAt}; cached
                for 5 minutes and this view may be older. Score is an unbounded
                sentiment × mentions composite, not a 0–100 probability. Daily
                and 30-day thin-sample flags reflect fewer than 10 and 20
                directional mentions respectively; absent flags mean unknown.
              </p>
              <a
                href="https://sentisense.ai/docs/api/stocks/"
                target="_blank"
                rel="noreferrer"
              >
                Source documentation
              </a>
            </details>
          </>
        ))}
    </section>
  );
}
