"use client";
import { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Research } from "@/lib/types";
import type { EodNews } from "@/lib/eodhd";
import { movementContext } from "@/lib/movement-context";
import { amount, dateLabel, percent } from "@/lib/format";
import { useProduct, useResource } from "./Session";

export default function MovementContext({
  research: r,
  onNews,
}: {
  research: Research;
  onNews: () => void;
}) {
  const { demo } = useProduct();
  const preview = useMemo(
    () =>
      demo
        ? {
            items: [],
            source: "Illustrative preview",
            retrievedAt: r.retrievedAt,
          }
        : undefined,
    [demo, r.retrievedAt],
  );
  const news = useResource<EodNews>(
    `news?symbol=${encodeURIComponent(r.company.symbol)}`,
    preview,
    3600000,
  );
  const m = useMemo(
    () => movementContext(r, news.data?.items ?? []),
    [r, news.data],
  );
  return (
    <section
      className="card movement-context"
      aria-label="Price movement context"
    >
      <div className="movement-summary">
        <div>
          <span>{m.today ? "Today’s move" : "Latest price move"}</span>
          <strong
            className={
              m.change == null
                ? ""
                : m.change < 0
                  ? "red"
                  : m.change > 0
                    ? "green"
                    : ""
            }
          >
            {m.change != null
              ? percent(m.change, true)
              : amount(m.price, r.quote.currency)}
          </strong>
          <small>
            {m.stale ? "Older quote · " : ""}
            {m.session}
            {m.asOf ? ` · ${dateLabel(m.asOf)}` : ""}
          </small>
        </div>
        {m.relativeVolume != null && (
          <div>
            <span>Latest available session volume</span>
            <strong>{m.relativeVolume.toFixed(2)}× usual</strong>
            <small>{dateLabel(m.volumeDate!)} · vs prior 20 sessions</small>
          </div>
        )}
        {m.earnings && (
          <div>
            <span>Next earnings</span>
            <strong>{dateLabel(m.earnings.date)}</strong>
            <small>
              {/before/i.test(m.earnings.time)
                ? "Before market open"
                : /after/i.test(m.earnings.time)
                  ? "After market close"
                  : "Time not confirmed"}
            </small>
          </div>
        )}
        <button className="text-link" onClick={onNews}>
          News & earnings <ArrowUpRight size={15} />
        </button>
      </div>
      <details className="movement-news">
        <summary>
          {m.headlines[0]?.title ??
            (news.loading
              ? "Checking recent company coverage…"
              : news.error
                ? "Recent coverage couldn’t load"
                : "Recent company coverage")}
          <span>{m.headlines.length ? "Read context" : "Details"}</span>
        </summary>
        <div>
          {m.headlines.map((n) => (
            <a
              key={n.url}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <strong>{n.title}</strong>
              <small>
                {n.publisher} · {dateLabel(n.date)} ↗
              </small>
            </a>
          ))}
          {!m.headlines.length && (
            <p>
              {news.loading
                ? "Company headlines are loading."
                : news.error
                  ? "Headlines are temporarily unavailable."
                  : demo
                    ? "Sample mode has no live headlines."
                    : "No recent article was returned for this ticker."}
            </p>
          )}
          {news.error && (
            <button className="text-link" onClick={news.refresh}>
              Retry headlines
            </button>
          )}
          <p>
            Related coverage can provide context; it does not establish what
            caused the price move.
          </p>
        </div>
      </details>
    </section>
  );
}
