"use client";
import { useState } from "react";
import Link from "next/link";
import { useResource } from "./Session";
import type { MarketInsightsData } from "@/lib/market-insights";
import s from "./GlobalEarningsCalendar.module.css";
export default function MarketInsights() {
  const [kind, setKind] = useState<"market" | "latest" | null>(null);
  return (
    <details>
      <summary>Explore dated market signals</summary>
      <p className={s.note}>
        Separate evidence patterns across the market and tracked companies, not
        another session summary. AI-generated observations may be wrong or
        stale; inspect the sources.
      </p>
      <div className={s.controls}>
        <button
          type="button"
          aria-pressed={kind === "market"}
          onClick={() => setKind("market")}
        >
          Market priorities
        </button>
        <button
          type="button"
          aria-pressed={kind === "latest"}
          onClick={() => setKind("latest")}
        >
          Latest company signals
        </button>
      </div>
      {kind && <InsightFeed key={kind} kind={kind} />}
    </details>
  );
}
function InsightFeed({ kind }: { kind: "market" | "latest" }) {
  const resource = useResource<MarketInsightsData & { receivedAt: string }>(
      `market-insights?kind=${kind}`,
      undefined,
      300000,
    ),
    [page, setPage] = useState(0),
    data = resource.data;
  return (
    <section className={s.root} aria-label="Dated market signals">
      <p className={s.note}>
        {kind === "market"
          ? "Market-wide patterns and high-priority company signals, in provider urgency/confidence order."
          : "Up to 50 signals across tracked companies, newest first. This is not your watchlist or a complete market feed."}
      </p>
      <p className={s.note}>
        Confidence is the provider model’s score, not a probability of
        investment success. Urgency is research priority, not a trade
        instruction.
      </p>
      <div className={s.controls}>
        <button
          type="button"
          disabled={resource.loading}
          onClick={() => {
            setPage(0);
            resource.refresh();
          }}
        >
          Check for updates
        </button>
      </div>
      {resource.loading ? (
        <p role="status">Loading signals…</p>
      ) : resource.error ? (
        <p role="status">{resource.error}</p>
      ) : data ? (
        <>
          {data.preview && (
            <p className={s.notice}>
              Preview: only a limited set of descriptions is available. Full
              provider access requires an eligible plan; this does not establish
              account entitlement.
            </p>
          )}
          <p className={s.note}>
            Received {data.receivedAt}. {data.rows.length} returned
            {data.total === null ? "" : ` of ${data.total} reported`}. Generated
            dates below describe each observation, not its source-event date.
          </p>
          {!data.rows.length && (
            <p>
              No signals in this response. This does not prove no significant
              activity occurred.
            </p>
          )}
          {data.rows.slice(page * 10, (page + 1) * 10).map((r) => (
            <article key={r.id}>
              <h3>
                {r.ticker ? (
                  <Link href={`/research/${encodeURIComponent(r.ticker)}`}>
                    {r.ticker}
                  </Link>
                ) : (
                  "Market-wide"
                )}{" "}
                · {r.type.replaceAll("_", " ")}
              </h3>
              <p className={s.note}>
                {r.category} · {r.urgency} priority · Generated {r.generatedAt}{" "}
                · Confidence{" "}
                {r.confidence === null
                  ? "Not supplied"
                  : `${Math.round(r.confidence * 100)}%`}
              </p>
              <p>
                {r.text ?? "Description withheld in this provider preview."}
              </p>
              {r.sources.length ? (
                <ul>
                  {r.sources.map((ref, i) => (
                    <li key={i}>
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {ref.type ?? "Source document"}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={s.note}>No source documents supplied.</p>
              )}
            </article>
          ))}
          <div className={s.controls}>
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span>
              Page {page + 1} of {Math.max(1, Math.ceil(data.rows.length / 10))}
            </span>
            <button
              type="button"
              disabled={(page + 1) * 10 >= data.rows.length}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      ) : null}
      <details>
        <summary>Source and freshness</summary>
        <p className={s.note}>
          SentiSense insights market/latest feeds. No personalized user feed is
          requested. Server cache 15 minutes, client cache 5 minutes; a loaded
          view can be older. Repeated IDs are rejected rather than shown as
          separate evidence. These signals may also appear in individual company
          research; they are not independent corroboration.
        </p>
      </details>
    </section>
  );
}
