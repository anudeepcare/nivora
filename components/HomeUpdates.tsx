"use client";
import Link from "next/link";
import { CalendarDays, ArrowUpRight, Newspaper } from "lucide-react";
import { useMemo, useState } from "react";
import { useProduct, useResource } from "./Session";
import { amount, percent } from "@/lib/format";
import { companyFeedPage, holdingAttention } from "@/lib/product-attention";
import type { Quote } from "@/lib/types";
import { dateLabel } from "@/lib/format";
import type { HomeFeed } from "@/lib/home-feed";
import { relevantHoldingHeadlines } from "@/lib/home-feed";
export default function HomeUpdates({
  quotes = {},
  companyNames = {},
}: {
  quotes?: Record<string, Quote>;
  companyNames?: Record<string, string>;
}) {
  const { workspace, demo } = useProduct(),
    prefix = demo ? "/preview" : "";
  const [requestedPage, setRequestedPage] = useState(0);
  const feed = companyFeedPage(
    [
      ...new Set([
        ...(workspace?.positions
          .filter((p) => p.assetType === "stock")
          .map((p) => p.symbol) ?? []),
        ...(workspace?.watchlist.map((w) => w.symbol) ?? []),
      ]),
    ],
    requestedPage,
  );
  const symbols = feed.symbols;
  const key = symbols.join(",");
  const preview = useMemo(
    () =>
      demo
        ? ({
            events: [],
            news: [],
            issues: [],
            retrievedAt: "2026-10-18",
            followed: 0,
            newsFollowed: 0,
          } as HomeFeed)
        : undefined,
    [demo],
  );
  const events = useResource<HomeFeed>(
    key ? `home-feed?kind=events&symbols=${encodeURIComponent(key)}` : null,
    preview,
    21600000,
  );
  const news = useResource<HomeFeed>(
    key ? `home-feed?kind=news&symbols=${encodeURIComponent(key)}` : null,
    preview,
    3600000,
  );
  const [expanded, setExpanded] = useState(false);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const attention = holdingAttention(
    workspace?.positions ?? [],
    quotes,
    events.data?.events ?? [],
    today,
  );
  const exposure = new Map<string, number>();
  for (const p of workspace?.positions ?? []) {
    const q = quotes[p.symbol];
    if (
      p.assetType !== "cash" &&
      q &&
      q.currency === "USD" &&
      typeof q.price === "number" &&
      Number.isFinite(q.price) &&
      q.price > 0 &&
      p.currency === "USD" &&
      Number.isFinite(p.quantity) &&
      p.quantity > 0
    )
      exposure.set(
        p.symbol,
        (exposure.get(p.symbol) ?? 0) + p.quantity * q.price,
      );
  }
  const headlines = relevantHoldingHeadlines(
    news.data?.news ?? [],
    companyNames,
    exposure,
  );
  const agenda=[...attention].sort((a,b)=>a.date.localeCompare(b.date)||(b.value??0)-(a.value??0));
  const next=agenda[0];
  if (!key) return null;
  return (
    <section className="home-updates home-desk" aria-label="Company updates">
      <header className="section-head">
        <div>
          <span className="eyebrow">Your companies</span>
          <h2>Needs your attention</h2>
        </div>
        <div className="home-update-actions">
          {feed.pageCount > 1 ? (
            <label className="home-feed-batch">
              <span>Company updates</span>
              <select
                aria-label="Company update coverage"
                value={feed.page}
                onChange={(e) => setRequestedPage(Number(e.target.value))}
              >
                {Array.from({ length: feed.pageCount }, (_, i) => (
                  <option key={i} value={i}>
                    Companies {i * 30 + 1}–{Math.min(feed.total, (i + 1) * 30)}{" "}
                    of {feed.total}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="muted small">
              Following {symbols.length} stocks
            </span>
          )}
          <button
            className="text-button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            {expanded ? "Highlights" : "View all updates"}
          </button>
        </div>
      </header>

      {next&&<Link className="agenda-lead" href={`${prefix}/research/${encodeURIComponent(next.symbol)}?tab=News`} scroll={false}><div className="agenda-lead-date"><CalendarDays size={21}/><span>Next on your calendar</span><strong>{dateLabel(next.date).replace(/, \d{4}$/, "")}</strong></div><div className="agenda-lead-company"><span>{next.kind} · {next.detail}</span><h3>{next.symbol}</h3><p>{next.value!=null?`${amount(next.value,"USD",true)} of your priced holdings exposed`:"Review the business before its next report"}</p></div><div className="agenda-lead-action"><span>Open company brief</span><ArrowUpRight size={24}/></div></Link>}
      <div className="agenda-layout">
        <section className="agenda-calendar">
          <h3>
            <CalendarDays size={18} /> On the horizon <small>Next 30 days</small>
          </h3>
          {agenda.length>(next?1:0) ? (
            agenda.slice(next?1:0, expanded ? undefined : 4).map((e) => (
              <Link
                className="agenda-item"
                key={`${e.symbol}:${e.date}:${e.kind}`}
                href={`${prefix}/research/${encodeURIComponent(e.symbol)}?tab=News`}
                scroll={false}
              >
                <time dateTime={e.date}>
                  {dateLabel(e.date).replace(/, \d{4}$/, "")}
                </time>
                <span>
                  <b>
                    {e.symbol} · {e.kind}
                  </b>
                  <small>
                    {e.detail}
                    {e.value != null
                      ? ` · ${amount(e.value, "USD", true)} exposed${e.weight != null ? ` · ${percent(e.weight)}` : ""}`
                      : " · Exposure not priced"}
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </Link>
            ))
          ) : (
            <p className="updates-empty">
              {events.loading
                ? "Checking scheduled reports…"
                : events.error ||
                    events.data?.issues.some(
                      (i) => i.includes("events") || i.includes("connected"),
                    )
                  ? "Scheduled events could not be checked. Your research remains available."
                  : next ? "No further scheduled events returned for the next 30 days." : "No scheduled events returned for the next 30 days."}
            </p>
          )}

        </section>
        <section className="agenda-news">
          <h3>
            <Newspaper size={18} /> In the news <small>Past 7 days</small>
          </h3>
          {headlines.length ? (
            headlines.slice(0, expanded ? undefined : 4).map((n) => (
              <a
                className="agenda-item"
                key={n.url}
                href={n.url}
                target="_blank"
                rel="noreferrer"
              >
                <span className="agenda-symbol">{n.symbol}</span>
                <span>
                  <b>{n.title}</b>
                  <small>
                    {dateLabel(n.date)} ·{" "}
                    {new URL(n.url).hostname.replace(/^www\./, "")}
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </a>
            ))
          ) : (
            <p className="updates-empty">
              {news.loading
                ? "Loading recent headlines…"
                : news.error ||
                    news.data?.issues.some(
                      (i) => i.includes("news") || i.includes("connected"),
                    )
                  ? "Recent coverage is temporarily unavailable."
                  : "No recent headlines matching your company names or explicit tickers were returned."}
            </p>
          )}

        </section>
      </div>
      <details className="agenda-context"><summary>About these updates</summary><p>Calendar ordered by date, then priced holding exposure. Exposure can use older usable USD prices. News is matched to company names or explicit tickers, with one story per company before repeats; it is ranked by holding exposure. Coverage checked for {news.data?.newsFollowed??symbols.length} followed stocks. Dates can change and missing coverage is not an all-clear.</p></details>
    </section>
  );
}
