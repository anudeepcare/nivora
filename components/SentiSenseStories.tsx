"use client";
import { useState } from "react";
import type { SentiSenseResult } from "@/lib/sentisense-api";
import { storyDetailView, storyListView } from "@/lib/sentisense-stories-view";
import { useResource } from "./Session";
import s from "./SentiSensePanels.module.css";
const stamp = (v: string | null) =>
  v ? v.slice(0, 16).replace("T", " ") + " UTC" : "Not supplied";
export default function SentiSenseStories({ symbol }: { symbol: string }) {
  const list = useResource<SentiSenseResult>(
      `intelligence/${encodeURIComponent(symbol)}?dataset=tickerStories`,
      undefined,
      300000,
    ),
    [selected, setSelected] = useState<string | null>(null);
  const detail = useResource<SentiSenseResult>(
    selected
      ? `stories/${encodeURIComponent(symbol)}/${encodeURIComponent(selected)}`
      : null,
    undefined,
    300000,
  );
  const rows = storyListView(list.data?.data),
    view = storyDetailView(detail.data?.data);
  const available = (r: SentiSenseResult | null | undefined) =>
    r?.status === "available" || r?.status === "preview";
  return (
    <div className={s.content}>
      <div className={s.intro}>
        <h3>The stories behind the headlines</h3>
        <p>
          Provider-authored story clusters, not publisher headlines. Open a
          story for its narrative and original citations. Published and
          assembled dates are distinct.
        </p>
      </div>
      {list.loading ? (
        <p role="status">Loading company stories…</p>
      ) : list.error ? (
        <p role="status">{list.error}</p>
      ) : !available(list.data) ? (
        <p role="status">
          Story coverage is{" "}
          {list.data?.status.replaceAll("-", " ") ?? "unavailable"}. No
          substitute story is shown.
        </p>
      ) : (
        <div className={s.records}>
          {!rows.length ? (
            <p>No stories returned for this company.</p>
          ) : (
            rows.map((row) => (
              <article className={s.record} key={row.id}>
                <header>
                  <h5>{row.title}</h5>
                  <span className={s.provider}>{row.authorship}</span>
                </header>
                <dl className={s.metrics}>
                  <div>
                    <dt>Story broke</dt>
                    <dd>{stamp(row.brokeAt)}</dd>
                  </div>
                  <div>
                    <dt>Cluster assembled</dt>
                    <dd>{stamp(row.assembledAt)}</dd>
                  </div>
                  <div>
                    <dt>Source articles</dt>
                    <dd>{row.articleCount ?? "Not supplied"}</dd>
                  </div>
                  <div>
                    <dt>Coverage state</dt>
                    <dd>
                      {row.developing
                        ? "Developing story"
                        : "Published cluster"}
                    </dd>
                  </div>
                </dl>
                <nav className={s.tabs} aria-label="Story detail">
                  <button
                    type="button"
                    aria-expanded={selected === row.id}
                    onClick={() =>
                      setSelected(selected === row.id ? null : row.id)
                    }
                  >
                    {selected === row.id
                      ? "Close story"
                      : "Read story & sources"}
                  </button>
                </nav>
                {selected === row.id && (
                  <section aria-label="Story narrative">
                    {detail.loading ? (
                      <p role="status">Loading narrative and citations…</p>
                    ) : detail.error ? (
                      <p role="status">{detail.error}</p>
                    ) : !available(detail.data) ? (
                      <p role="status">
                        Story detail is{" "}
                        {detail.data?.status.replaceAll("-", " ") ??
                          "unavailable"}
                        .
                      </p>
                    ) : (
                      <>
                        <p className={s.notice}>
                          {view.authorship}. Perspectives are provider analysis,
                          not facts or AURYN recommendations.
                          {view.archived ? " Archived story." : ""}
                        </p>
                        {view.summary && (
                          <p style={{ whiteSpace: "pre-wrap" }}>
                            {view.summary}
                          </p>
                        )}
                        {view.narrative && (
                          <div className={s.readout}>
                            <p>{view.narrative}</p>
                          </div>
                        )}
                        <div className={s.metrics}>
                          <div>
                            <h4>Provider bullish perspective</h4>
                            <p style={{ whiteSpace: "pre-wrap" }}>
                              {view.bullish ??
                                "No bullish case supplied by the provider."}
                            </p>
                          </div>
                          <div>
                            <h4>Provider bearish perspective</h4>
                            <p style={{ whiteSpace: "pre-wrap" }}>
                              {view.bearish ??
                                "No bearish case supplied by the provider."}
                            </p>
                          </div>
                        </div>
                        <h4>Original sources</h4>
                        {view.citations.length ? (
                          <ul>
                            {view.citations.map((c) => (
                              <li key={c.key}>
                                <a
                                  href={c.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  [{c.key}] {c.publisher} ↗
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No valid source links supplied.</p>
                        )}
                        {view.timeline.length > 0 && (
                          <details className={s.readout}>
                            <summary>Updates & corrections</summary>
                            {view.timeline.map((update, i) => (
                              <article key={i}>
                                <h5>
                                  {update.type} · {stamp(update.date)}
                                </h5>
                                <p>{update.content}</p>
                              </article>
                            ))}
                          </details>
                        )}
                      </>
                    )}
                  </section>
                )}
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
