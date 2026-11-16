"use client";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpRight, FileText, Newspaper, RefreshCw } from "lucide-react";
import type { EodNews } from "@/lib/eodhd";
import type { Filing } from "@/lib/types";
import { newsDesk, type DeskArticle } from "@/lib/news-desk";
import { dateLabel } from "@/lib/format";
import { Help } from "./Ui";
import DetailDialog from "./DetailDialog";
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
  const feed = useMemo(
    () => newsDesk(news?.items ?? [], symbol, name, now),
    [news, symbol, name, now],
  );
  const rows = feed[scope];
  const visible = rows.slice(0, 6);
  const renderArticle = (n: DeskArticle) => (
    <article className={s.story} key={n.url}>
      <div className={s.meta}>
        <span>{n.source}</span>
        <time dateTime={n.date}>{dateLabel(n.date)}</time>
      </div>
      <a href={n.url} target="_blank" rel="noopener noreferrer">
        <h3>{n.title}</h3>
        <ArrowUpRight size={18} aria-hidden="true" />
      </a>
    </article>
  );
  return (
    <div className={s.desk}>
      <section className={s.coverage} aria-label="Company news">
        <header className={s.heading}>
          <div>
            <h2>{symbol} news</h2>
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
            }}
          >
            Company mentions <span>{feed.company.length}</span>
          </button>
          <button
            type="button"
            aria-pressed={scope === "broader"}
            onClick={() => {
              setScope("broader");
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
          <DetailDialog
            title={`${symbol} · ${scope === "company" ? "Company mentions" : "Broader coverage"}`}
            trigger={`Read all ${rows.length} headlines`}
            className={s.more}
            wide
          >
            <div className={s.stories}>{rows.map(renderArticle)}</div>
          </DetailDialog>
        )}
        {error && visible.length > 0 && (
          <p role="status" className={s.basis}>
            {error} Available headlines remain visible.
          </p>
        )}
        <Help label="News information">
          {news?.retrievedAt
            ? `Updated ${dateLabel(news.retrievedAt)}. `
            : "Update date unavailable. "}
          Headlines are reporting, not investment conclusions. Each article
          links to its publisher.
        </Help>
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
              <DetailDialog
                title={`${symbol} · Source filings`}
                trigger={`All supplied filings · ${filings.length}`}
                wide
              >
                <div className={s.moreFilings}>
                  {filings.map((f) => (
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
                </div>
              </DetailDialog>
            )}
          </section>
        )}
      </aside>
    </div>
  );
}
