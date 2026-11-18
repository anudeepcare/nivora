"use client";
import { useState } from "react";
import { useResource } from "./Session";
import type {
  IndexCatalogItem,
  IndexDetail,
  IndexHistory,
} from "@/lib/alternative-indexes";
import styles from "./MarketTrackers.module.css";
type Reply<T> = { data: T; source: string; retrievedAt: string };
const number = (v: number | null) =>
  v === null
    ? "Not supplied"
    : v.toLocaleString(undefined, { maximumFractionDigits: 3 });
export default function AlternativeIndexes() {
  const catalog = useResource<Reply<IndexCatalogItem[]>>(
    "alternative-indexes",
    undefined,
    300000,
  );
  const [selected, setSelected] = useState<string | null>(null),
    [mode, setMode] = useState<"detail" | "history">("detail");
  const result = useResource<Reply<IndexDetail | IndexHistory>>(
    selected ? `alternative-indexes?id=${selected}&mode=${mode}` : null,
    undefined,
    300000,
  );
  const data = result.data?.data;
  const detail = data && "constituents" in data ? data : null;
  const history = data && "points" in data ? data : null;
  const min = data?.scale === "SENTIMENT" ? -1 : 0,
    max = data?.scale === "SENTIMENT" ? 1 : 100;
  const start = history?.points.length ? Date.parse(history.points[0].date) : 0,
    end = history?.points.length ? Date.parse(history.points.at(-1)!.date) : 0;
  return (
    <section className={styles.root} aria-label="Alternative indexes">
      <header>
        <h2>Alternative indexes</h2>
        <p>
          Provider sentiment indexes, not Auryn investment scores. Scales
          differ; values are not directly comparable across scales.
        </p>
      </header>
      {catalog.loading ? (
        <p role="status">Loading index catalog…</p>
      ) : catalog.error ? (
        <p role="status">{catalog.error}</p>
      ) : (
        <div className={styles.choices}>
          {catalog.data?.data.map((item) => (
            <button
              key={item.id}
              aria-pressed={selected === item.id}
              onClick={() => {
                setSelected(item.id);
                setMode("detail");
              }}
            >
              <strong>{item.name}</strong>
              <span>{item.description}</span>
              <small>
                {item.scale === "SENTIMENT"
                  ? "Signed sentiment −1 to +1"
                  : "Composite 0 to 100"}{" "}
                · Provider {item.tier}
              </small>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div
          className={styles.paging}
          role="group"
          aria-label="Selected index evidence"
        >
          <button
            aria-pressed={mode === "detail"}
            onClick={() => setMode("detail")}
          >
            Latest & constituents
          </button>
          <button
            aria-pressed={mode === "history"}
            onClick={() => setMode("history")}
          >
            180-day history
          </button>
        </div>
      )}
      {!selected ? (
        <p>Select one index. Other index readings are not requested.</p>
      ) : result.loading ? (
        <p role="status">Loading selected index…</p>
      ) : result.error ? (
        <p role="status">{result.error}</p>
      ) : data && data.id === selected ? (
        <section className={styles.board} aria-label={data.name}>
          <h3>{data.name}</h3>
          <p>
            {data.scale === "SENTIMENT"
              ? "Signed polarity −1 to +1: negative/positive describe bearish/bullish tone, not expected returns."
              : "0 to 100 composite: higher describes greedier sentiment, not an expected return."}{" "}
            Retrieved {result.data?.retrievedAt}.
          </p>
          {detail && (
            <>
              <div className={styles.headlines}>
                <div>
                  <span>Latest reading</span>
                  <strong>{number(detail.value)}</strong>
                  <small>
                    As of {detail.asOf ?? "not supplied"}; weekly dates mark the
                    start of the bucket.
                  </small>
                </div>
                <div>
                  <span>Constituent coverage</span>
                  <strong>
                    {detail.constituents === null
                      ? "Not applicable"
                      : `${number(detail.coverage)} / ${number(detail.basketSize)}`}
                  </strong>
                  <small>
                    {detail.constituents === null
                      ? "Composite constructed without an entity basket."
                      : `${number(detail.totalMentions)} reported mentions. Coverage is not confidence.`}
                  </small>
                </div>
              </div>
              <p>{detail.methodology}</p>
              {detail.constituents !== null && (
                <>
                  <p>
                    Carried-forward readings are not fresh. Excluded or
                    out-of-segment rows are not current contributors. Reserved
                    contribution values are not calculated here.
                  </p>
                  <div className={styles.rows}>
                    {detail.constituents.map((c, i) => (
                      <article key={`${c.name}-${i}`}>
                        <h3>{c.name}</h3>
                        <p>
                          {c.role} · {c.state.replaceAll("_", " ")}
                        </p>
                        <dl>
                          <div>
                            <dt>Reported reading</dt>
                            <dd>{number(c.value)}</dd>
                          </div>
                          <div>
                            <dt>Role weight</dt>
                            <dd>{number(c.weight)}</dd>
                          </div>
                          <div>
                            <dt>Mentions</dt>
                            <dd>{number(c.mentions)}</dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          {history && (
            <>
              <p>
                {history.points.length} supplied observations returned for the
                requested 180-day query. Missing dates are absent, never zero or
                interpolated. Daily, weekly and trading-day series have
                different spacing.
              </p>
              {history.points.length ? (
                <>
                  <svg
                    viewBox="0 0 600 220"
                    role="img"
                    aria-label={`${data.name} supplied observations, scale ${min} to ${max}; dates and values below`}
                    style={{ width: "100%", maxHeight: 260 }}
                  >
                    <text x="8" y="18" fill="currentColor">
                      {max}
                    </text>
                    <text x="8" y="194" fill="currentColor">
                      {min}
                    </text>
                    <line
                      x1="48"
                      x2="585"
                      y1="190"
                      y2="190"
                      stroke="var(--line)"
                    />
                    {history.points.map((p) =>
                      p.value === null ? null : (
                        <circle
                          key={p.date}
                          cx={
                            end === start
                              ? 315
                              : 50 +
                                ((Date.parse(p.date) - start) / (end - start)) *
                                  530
                          }
                          cy={190 - ((p.value - min) / (max - min)) * 170}
                          r="3"
                          fill="var(--blue)"
                        >
                          <title>{`${p.date}: ${number(p.value)}`}</title>
                        </circle>
                      ),
                    )}
                  </svg>
                  <details>
                    <summary>All supplied dates & values</summary>
                    <div className={styles.rows}>
                      {history.points.map((p) => (
                        <article key={p.date}>
                          <span>{p.date}</span>
                          <strong> {number(p.value)}</strong>
                        </article>
                      ))}
                    </div>
                  </details>
                </>
              ) : (
                <p>No historical observations supplied.</p>
              )}
            </>
          )}
          <a
            href="https://sentisense.ai/docs/api/indexes/"
            target="_blank"
            rel="noreferrer"
          >
            Index definitions ↗
          </a>
        </section>
      ) : null}
    </section>
  );
}
