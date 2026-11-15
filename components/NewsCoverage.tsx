"use client";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpRight, FileText, Newspaper, RefreshCw } from "lucide-react";
import type { EodNews } from "@/lib/eodhd";
import type { Filing } from "@/lib/types";
import { newsDesk, type DeskArticle } from "@/lib/news-desk";
import { dateLabel } from "@/lib/format";
import s from "./NewsCoverage.module.css";
export default function NewsCoverage({
  symbol,
  name,
  now,
  news,
  loading,
  error,
  refresh,
  filings,
  filingsLoading,
  filingsError,
  stock,
  children,
}: {
  symbol: string;
  name: string;
  now: number;
  news?: EodNews;
  loading: boolean;
  error?: string | null;
  refresh: () => void;
  filings?: Filing[];
  filingsLoading: boolean;
  filingsError?: string | null;
  stock: boolean;
  children?: ReactNode;
}) {
  const [scope, setScope] = useState<"company" | "broader">("company");
  const [expanded, setExpanded] = useState(false);
  const feed = useMemo(
    () => newsDesk(news?.items ?? [], symbol, name, now),
    [news, symbol, name, now],
  );
  const rows = feed[scope];
  const visible = expanded ? rows : rows.slice(0, 6);
  const renderArticle = (n: DeskArticle, index: number) => (
    <article className={index === 0 ? s.lead : s.story} key={n.url}>
      <div className={s.meta}>
        <span>{n.source}</span>
        <time dateTime={n.date}>{dateLabel(n.date)}</time>
      </div>
      <a href={n.url} target="_blank" rel="noopener noreferrer">
        {index === 0 && (
          <span className={s.leadLabel}>
            {scope === "company"
              ? "Latest company mention"
              : "Latest broader coverage"}
          </span>
        )}
        <h3>{n.title}</h3>
        <ArrowUpRight size={index === 0 ? 23 : 18} aria-hidden="true" />
      </a>
    </article>
  );
  return (
    <div className={s.desk}>
      <section className={s.coverage} aria-label="Company news">
        <header className={s.heading}>
          <div>
            <span className={s.eyebrow}>THE NEWS DESK</span>
            <h2>{symbol}, in the news</h2>
            <p>Read the source. Separate reporting from the investment case.</p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            aria-label="Refresh news"
          >
            <RefreshCw size={17} />
          </button>
        </header>
        <div className={s.filters} aria-label="Headline relevance">
          <button
            type="button"
            aria-pressed={scope === "company"}
            onClick={() => {
              setScope("company");
              setExpanded(false);
            }}
          >
            Company mentions <span>{feed.company.length}</span>
          </button>
          <button
            type="button"
            aria-pressed={scope === "broader"}
            onClick={() => {
              setScope("broader");
              setExpanded(false);
            }}
          >
            Broader coverage <span>{feed.broader.length}</span>
          </button>
        </div>
        <p className={s.basis}>
          {scope === "company"
            ? "Titles mentioning the company name or explicit ticker. Headline matching does not verify the article or explain a price move."
            : "Other articles returned for this ticker. Company relevance is not established from the headline."}
        </p>
        {visible.length ? (
          <div className={s.stories}>{visible.map(renderArticle)}</div>
        ) : (
          <div className={s.empty}>
            <Newspaper size={27} />
            <h3>
              {loading
                ? "Checking the latest coverage…"
                : error
                  ? "Coverage could not be checked"
                  : scope === "company"
                    ? "No clear company mentions returned"
                    : "No broader coverage returned"}
            </h3>
            <p>
              {error ||
                (feed.broader.length && scope === "company"
                  ? "Other supplied headlines remain available under Broader coverage."
                  : "This does not establish that there are no company developments.")}
            </p>
          </div>
        )}
        {rows.length > 6 && (
          <button
            type="button"
            className={s.more}
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded
              ? "Show six headlines"
              : `Read all ${rows.length} headlines`}
          </button>
        )}
        {error && visible.length > 0 && (
          <p role="status" className={s.basis}>
            {error} Available headlines remain visible.
          </p>
        )}
        <p className={s.sourceNote}>
          {news?.source || "News source not yet available"}
          {news?.retrievedAt
            ? ` · Fetched ${dateLabel(news.retrievedAt)}`
            : ""}{" "}
          · Headlines are not investment conclusions.
        </p>
      </section>
      <aside className={s.rail} aria-label="Company source records">
        {children}
        {stock && (
          <section className={s.filings}>
            <header>
              <FileText size={18} />
              <h2>Source filings</h2>
            </header>
            <p className={s.basis}>
              Primary records, separate from news coverage.
            </p>
            {filings?.length ? (
              filings.slice(0, 6).map((f) => (
                <a
                  key={f.url}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${f.form} · ${dateLabel(f.date)} · ${f.title}`}
                >
                  <span>
                    <small>
                      {f.form} · {dateLabel(f.date)}
                    </small>
                    <strong>
                      {/^10-Q(?:\/A)?$/i.test(f.form)
                        ? "Quarterly report"
                        : /^10-K(?:\/A)?$/i.test(f.form)
                          ? "Annual report"
                          : /^8-K(?:\/A)?$/i.test(f.form)
                            ? "Current report"
                            : f.title}
                    </strong>
                  </span>
                  <ArrowUpRight size={16} />
                </a>
              ))
            ) : (
              <p className={s.basis}>
                {filingsLoading
                  ? "Loading disclosures…"
                  : filingsError || "No source filings returned."}
              </p>
            )}
            {filingsError && !!filings?.length && (
              <p role="status" className={s.basis}>
                {filingsError} Available records remain visible.
              </p>
            )}
            {!!filings && filings.length > 6 && (
              <details className={s.moreFilings}>
                <summary>All supplied filings · {filings.length}</summary>
                {filings.slice(6).map((f) => (
                  <a
                    key={f.url}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>
                      <small>
                        {f.form} · {dateLabel(f.date)}
                      </small>
                      <strong>{f.title}</strong>
                    </span>
                    <ArrowUpRight size={16} />
                  </a>
                ))}
              </details>
            )}
          </section>
        )}
      </aside>
    </div>
  );
}
