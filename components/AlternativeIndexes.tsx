"use client";
import { useState } from "react";
import { useResource } from "./Session";
import type {
  IndexCatalogItem,
  IndexDetail,
  IndexHistory,
} from "@/lib/alternative-indexes";
import styles from "./MarketTrackers.module.css";
import visual from "./AlternativeIndexes.module.css";
type Reply<T> = { data: T; source: string; retrievedAt: string };
const number = (v: number | null) =>
  v === null
    ? "Not supplied"
    : v.toLocaleString(undefined, { maximumFractionDigits: 3 });
function ReadingGauge({
  value,
  scale,
  label,
}: {
  value: number | null;
  scale: string;
  label: string;
}) {
  const signed = scale === "SENTIMENT",
    min = signed ? -1 : 0,
    max = signed ? 1 : 100;
  return (
    <div className={visual.gauge}>
      {value !== null ? (
        <div
          className={visual.track}
          role="meter"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${number(value)} on ${min} to ${max} scale`}
        >
          <span className={visual.midpoint} />
          <i
            className={visual.marker}
            style={{ left: `${((value - min) / (max - min)) * 100}%` }}
          />
        </div>
      ) : (
        <p>Not supplied</p>
      )}
      <div className={visual.axis}>
        <span>{signed ? "−1 · Negative tone" : "0 · Lower composite"}</span>
        <span>{signed ? "0" : "50"}</span>
        <span>{signed ? "+1 · Positive tone" : "100 · Higher composite"}</span>
      </div>
    </div>
  );
}
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
    <section
      className={`${styles.root} ${visual.root}`}
      aria-label="Alternative indexes"
    >
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
          className="auryn-detail-tabs"
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
                  <strong className={visual.reading}>
                    {number(detail.value)}
                  </strong>
                  <ReadingGauge
                    value={detail.value}
                    scale={detail.scale}
                    label="Latest index reading"
                  />
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
              <details className={visual.method}>
                <summary>Methodology &amp; interpretation</summary>
                <p>{detail.methodology}</p>
              </details>
              {detail.constituents !== null && (
                <>
                  <p>
                    Carried-forward readings are not fresh. Excluded or
                    out-of-segment rows are not current contributors. Reserved
                    contribution values are not calculated here.
                  </p>
                  <section
                    className={visual.constituents}
                    aria-label="Constituent readings"
                  >
                    <h4>Constituent readings</h4>
                    {detail.constituents.map((c, i) => (
                      <article
                        className={visual.constituent}
                        key={`${c.name}-${i}`}
                      >
                        <div>
                          <strong>{c.name}</strong>
                          <small>
                            {c.role} · {c.state.replaceAll("_", " ")}
                          </small>
                        </div>
                        <div>
                          <ReadingGauge
                            value={c.value}
                            scale={detail.scale}
                            label={`${c.name} reported reading; ${c.state.replaceAll("_", " ")}`}
                          />
                        </div>
                        <div className={visual.value}>
                          <strong>{number(c.value)}</strong>
                          <small>
                            {number(c.mentions)} mentions · weight{" "}
                            {number(c.weight)}
                          </small>
                        </div>
                      </article>
                    ))}
                  </section>
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
                    <line
                      x1="48"
                      x2="585"
                      y1="105"
                      y2="105"
                      stroke="var(--muted)"
                      strokeDasharray="4 4"
                    />
                    <text x="50" y="99" fill="currentColor" fontSize="11">
                      {min === -1 ? "0 · Neutral" : "50 · Scale midpoint"}
                    </text>
                    <text x="50" y="214" fill="currentColor" fontSize="12">
                      {history.points[0].date}
                    </text>
                    {history.points.length > 1 && (
                      <text
                        x="580"
                        y="214"
                        textAnchor="end"
                        fill="currentColor"
                        fontSize="12"
                      >
                        {history.points.at(-1)!.date}
                      </text>
                    )}
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
