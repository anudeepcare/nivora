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
export default function HomeUpdates({
  quotes = {},
}: {
  quotes?: Record<string, Quote>;
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
  const headlines = [...(news.data?.news ?? [])].sort(
    (a, b) =>
      (exposure.get(b.symbol) ?? 0) - (exposure.get(a.symbol) ?? 0) ||
      b.date.localeCompare(a.date),
  );
  if (!key) return null;
  return (
    <section className="home-updates" aria-label="Company updates">
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

      <div className="updates-grid">
        <section className="update-panel upcoming-panel">
          <h3>
            <CalendarDays size={18} /> Coming up <small>Next 30 days</small>
          </h3>
          {attention.length ? (
            attention.slice(0, expanded ? undefined : 5).map((e) => (
              <Link
                className="update-row"
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
                  : "No scheduled events returned for the next 30 days."}
            </p>
          )}
          <p className="small muted">
            Ranked by priced holding value, then report date. Percentages use
            priced USD assets and cash, including older usable observations.
            Dates can change; missing coverage is not an all-clear.
          </p>
        </section>
        <section className="update-panel news-panel">
          <h3>
            <Newspaper size={18} /> In the news <small>Past 7 days</small>
          </h3>
          {news.data?.news.length ? (
            headlines.slice(0, expanded ? undefined : 6).map((n) => (
              <a
                className="update-row"
                key={n.url}
                href={n.url}
                target="_blank"
                rel="noreferrer"
              >
                <span className="news-symbol">{n.symbol}</span>
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
                  : "No recent headlines returned."}
            </p>
          )}
          <p className="small muted">
            Headlines ordered by holding exposure; not assessed for materiality.
            Coverage checked for {news.data?.newsFollowed ?? symbols.length}{" "}
            followed stocks.
          </p>
        </section>
      </div>
    </section>
  );
}
