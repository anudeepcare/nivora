"use client";
import Link from "next/link";
import { CalendarDays, ArrowUpRight, Newspaper } from "lucide-react";
import { useMemo } from "react";
import { useProduct, useResource } from "./Session";
import { dateLabel } from "@/lib/format";
import type { HomeFeed } from "@/lib/home-feed";
export default function HomeUpdates() {
  const { workspace, demo } = useProduct(),
    prefix = demo ? "/preview" : "";
  const symbols = [
    ...new Set([
      ...(workspace?.positions
        .filter((p) => p.assetType === "stock")
        .map((p) => p.symbol) ?? []),
      ...(workspace?.watchlist.map((w) => w.symbol) ?? []),
    ]),
  ]
    .filter((s) => /^[A-Z][A-Z0-9.-]{0,14}$/.test(s))
    .slice(0, 30);
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
  const feed = useResource<HomeFeed>(
    key ? `home-feed?symbols=${encodeURIComponent(key)}` : null,
    preview,
    3600000,
  );
  if (!key) return null;
  return (
    <section className="home-updates" aria-label="Company updates">
      <header className="section-head">
        <div>
          <span className="eyebrow">Your companies</span>
          <h2>What’s coming. What changed.</h2>
        </div>
        <span className="muted small">Following {symbols.length} stocks</span>
      </header>
      <div className="updates-grid">
        <section className="update-panel upcoming-panel">
          <h3>
            <CalendarDays size={18} /> Coming up <small>Next 30 days</small>
          </h3>
          {feed.data?.events.length ? (
            feed.data.events.slice(0, 5).map((e) => (
              <Link
                className="update-row"
                key={`${e.symbol}:${e.date}:${e.kind}`}
                href={`${prefix}/research/${encodeURIComponent(e.symbol)}?tab=Thesis`}
                scroll={false}
              >
                <time dateTime={e.date}>
                  {dateLabel(e.date).replace(/, \d{4}$/, "")}
                </time>
                <span>
                  <b>
                    {e.symbol} · {e.kind}
                  </b>
                  <small>{e.detail}</small>
                </span>
                <ArrowUpRight size={17} />
              </Link>
            ))
          ) : (
            <p className="updates-empty">
              {feed.loading
                ? "Checking scheduled reports…"
                : feed.error ||
                    feed.data?.issues.some(
                      (i) => i.includes("events") || i.includes("connected"),
                    )
                  ? "Scheduled events could not be checked. Your research remains available."
                  : "No scheduled events returned for the next 30 days."}
            </p>
          )}
          <p className="small muted">Scheduled dates can change.</p>
        </section>
        <section className="update-panel news-panel">
          <h3>
            <Newspaper size={18} /> In the news <small>Past 7 days</small>
          </h3>
          {feed.data?.news.length ? (
            feed.data.news.slice(0, 4).map((n) => (
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
              {feed.loading
                ? "Loading recent headlines…"
                : feed.error ||
                    feed.data?.issues.some(
                      (i) => i.includes("news") || i.includes("connected"),
                    )
                  ? "Recent coverage is temporarily unavailable."
                  : "No recent headlines returned."}
            </p>
          )}
          <p className="small muted">
            Recent coverage for your first {Math.min(3, symbols.length)}{" "}
            followed stocks.
          </p>
        </section>
      </div>
    </section>
  );
}
