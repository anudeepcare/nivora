"use client";
import { useState } from "react";
import { useProduct, useResource } from "./Session";
import {
  moodKinds,
  type MoodKind,
  type MoodSnapshot,
  type BreadthPoint,
} from "@/lib/market-mood";
import styles from "./MarketMood.module.css";
const names = {
  mood: "Market mood",
  sectors: "Sector tone",
  breadth: "Sentiment breadth",
};
const show = (v: number | null | undefined, digits = 2) =>
  v == null
    ? "Not supplied"
    : v.toLocaleString(undefined, { maximumFractionDigits: digits });
const pct = (v: number | null) => (v === null ? "Not supplied" : `${show(v)}%`);
function BreadthRow({ row }: { row: BreadthPoint }) {
  return (
    <tr>
      <th scope="row">{row.date}</th>
      <td>{show(row.coveredStocks, 0)}</td>
      <td>{pct(row.bullishPct)}</td>
      <td>{pct(row.neutralPct)}</td>
      <td>{pct(row.bearishPct)}</td>
      <td>{show(row.netBreadth)} pp</td>
      <td>{pct(row.bullishMentionPct)}</td>
      <td>{pct(row.neutralMentionPct)}</td>
      <td>{pct(row.bearishMentionPct)}</td>
      <td>{show(row.totalMentions, 0)}</td>
    </tr>
  );
}
export default function MarketMood() {
  const { demo } = useProduct();
  const [kind, setKind] = useState<MoodKind | null>(null);
  const result = useResource<MoodSnapshot & { retrievedAt: string }>(
    kind && !demo ? `market-mood?kind=${kind}` : null,
    undefined,
    300000,
  );
  const data = result.data?.kind === kind ? result.data : null;
  return (
    <section className={styles.root} aria-label="Market mood and breadth">
      <header>
        <h2>Market mood & breadth</h2>
        <p>
          Dated sentiment observations, not live prices or trading instructions.
          Each view uses a different scale.
        </p>
      </header>
      <div
        className={styles.choices}
        data-nested-navigation
        role="group"
        aria-label="Sentiment datasets"
      >
        {moodKinds.map((k) => (
          <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>
            <span aria-hidden="true" data-nav-icon={names[k]} />
            <span>{names[k]}</span>
          </button>
        ))}
      </div>
      {!kind ? (
        <p>
          Select one dataset. Other views are not fetched in the background.
        </p>
      ) : demo ? (
        <p>Market sentiment is unavailable in the design preview.</p>
      ) : result.loading ? (
        <p role="status">Loading selected snapshot…</p>
      ) : result.error ? (
        <div role="status">
          <p>{result.error}</p>
          <button onClick={result.refresh}>Retry selected view</button>
        </div>
      ) : data ? (
        <>
          <div className={styles.meta}>
            <strong>
              {data.isPreview
                ? "Preview · limited evidence"
                : data.status === "no-coverage"
                  ? "No coverage supplied"
                  : "Dated snapshot"}
            </strong>
            <span>
              {data.asOf
                ? `${kind === "mood" ? "Latest history date" : "Snapshot date"} ${data.asOf}`
                : "Snapshot date not supplied"}
            </span>
            {data.generatedAt && (
              <span>
                Computed{" "}
                {data.generatedAt.replace("T", " ").replace(".000Z", " UTC")}
              </span>
            )}
            <span>
              Retrieved{" "}
              {data.retrievedAt.replace("T", " ").replace("Z", " UTC")}
            </span>
          </div>
          {data.partial && (
            <p>
              Partial display: invalid rows withheld or history bounded to the
              latest ninety records.
            </p>
          )}
          {data.mood && (
            <>
              <div className={styles.reading}>
                <div>
                  <span>Composite · 0–100</span>
                  <strong>{show(data.mood.score, 1)}</strong>
                  <span>{data.mood.phase || "Phase not supplied"}</span>
                </div>
                <div>
                  <span>Reported weekly change</span>
                  <strong>{show(data.mood.weeklyChange, 1)}</strong>
                  <span>score points, not investment return</span>
                </div>
              </div>
              <div className={styles.history} aria-label="Dated mood history">
                {data.mood.history.map((p, i) => (
                  <span
                    key={`${p.date}-${i}`}
                    title={`${p.date}: ${show(p.score)} / 100`}
                  >
                    <i
                      style={{
                        height:
                          p.score === null ? "0px" : `${p.score * 0.75}px`,
                      }}
                    />
                    <small>{p.date.slice(5)}</small>
                  </span>
                ))}
              </div>
              <p className={styles.note}>
                Higher composite readings indicate greedier sentiment. Missing
                history is not filled. Component inputs may refer to the
                previous session; this is not a live tick.
              </p>
              <div
                className={styles.scroll}
                tabIndex={0}
                role="region"
                aria-label="Mood signals"
              >
                <table>
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>0–100 reading</th>
                      <th>Weekly points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.mood.signals.map((s) => (
                      <tr key={s.key}>
                        <th scope="row">{s.label || s.key}</th>
                        <td>{show(s.value)}</td>
                        <td>{show(s.change)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <details>
                <summary>Exact history & sector composite readings</summary>
                <div
                  className={styles.scroll}
                  tabIndex={0}
                  role="region"
                  aria-label="Exact mood history"
                >
                  <table>
                    <tbody>
                      {data.mood.history.map((p, i) => (
                        <tr key={`${p.date}-${i}`}>
                          <th scope="row">{p.date}</th>
                          <td>{show(p.score)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={styles.scroll}>
                  <table>
                    <thead>
                      <tr>
                        <th>Sector</th>
                        <th>Composite</th>
                        <th>Phase</th>
                        <th>Weekly points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.mood.sectors.map((s) => (
                        <tr key={s.name}>
                          <th scope="row">{s.name}</th>
                          <td>{show(s.score)}</td>
                          <td>{s.phase || "Not supplied"}</td>
                          <td>{show(s.weeklyChange)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          )}
          {data.sectors && (
            <>
              <p>
                Market mention-consensus baseline:{" "}
                {show(data.sectors.marketConsensusRatio)}. Sector gap is a ratio
                difference, not a percentage return. Negative means cooler than
                market, not necessarily bearish.
              </p>
              <div
                className={styles.scroll}
                tabIndex={0}
                role="region"
                aria-label="Sector sentiment data"
              >
                <table>
                  <thead>
                    <tr>
                      <th>Sector</th>
                      <th>Gap vs market</th>
                      <th>Own consensus</th>
                      <th>Polarity −1 to 1</th>
                      <th>Score · open scale</th>
                      <th>Stocks</th>
                      <th>Mentions</th>
                      <th>Bull mentions</th>
                      <th>Bear mentions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sectors.rows.map((s) => (
                      <tr key={s.name}>
                        <th scope="row">{s.name}</th>
                        <td>{show(s.consensusVsMarket)}</td>
                        <td>{show(s.consensusRatio)}</td>
                        <td>{show(s.meanSentiment)}</td>
                        <td>{show(s.meanScore)}</td>
                        <td>{show(s.stockCount, 0)}</td>
                        <td>{show(s.totalMentions, 0)}</td>
                        <td>{show(s.bullMentions, 0)}</td>
                        <td>{show(s.bearMentions, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {data.breadth && (
            <>
              <p>
                One vote per covered stock versus mention-volume weighting.
                Neither measures price advances/declines. Minimum mentions per
                covered stock: {show(data.breadth.minMentions, 0)}.
              </p>
              {!data.breadth.latest && (
                <p>
                  No current bucket supplied. Historical records, if any, remain
                  dated below.
                </p>
              )}
              <div
                className={styles.scroll}
                tabIndex={0}
                role="region"
                aria-label="Sentiment breadth history"
              >
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Covered stocks</th>
                      <th>Bullish stocks</th>
                      <th>Neutral stocks</th>
                      <th>Bearish stocks</th>
                      <th>Net breadth</th>
                      <th>Bullish mentions</th>
                      <th>Neutral mentions</th>
                      <th>Bearish mentions</th>
                      <th>Total mentions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.breadth.latest && (
                      <BreadthRow row={data.breadth.latest} />
                    )}
                    {data.breadth.series
                      .filter((p) => p.date !== data.breadth?.latest?.date)
                      .slice()
                      .reverse()
                      .map((p, i) => (
                        <BreadthRow key={`${p.date}-${i}`} row={p} />
                      ))}
                  </tbody>
                </table>
              </div>
              {data.breadth.latest && (
                <p className={styles.note}>
                  Latest stock counts: bullish{" "}
                  {show(data.breadth.latest.bullish, 0)}, neutral{" "}
                  {show(data.breadth.latest.neutral, 0)}, bearish{" "}
                  {show(data.breadth.latest.bearish, 0)}. Polarity dispersion{" "}
                  {show(data.breadth.latest.sentimentDispersion)} (not return
                  volatility).
                </p>
              )}
            </>
          )}
          <details className={styles.note}>
            <summary>Source & interpretation</summary>
            <p>
              Source:{" "}
              <a
                href="https://sentisense.ai/docs/api/market-mood/"
                target="_blank"
                rel="noopener noreferrer"
              >
                SentiSense market mood API
              </a>
              . Cached for five minutes; source observations can be older. A
              retrieval date does not make the data live. Preview and missing
              values are never substitutes for complete coverage.
            </p>
          </details>
        </>
      ) : (
        <p>No snapshot returned.</p>
      )}
    </section>
  );
}
