"use client";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Bell, Bookmark } from "lucide-react";
import { useProduct, useResource } from "./Session";
import { researchInbox, homeHighlights } from "@/lib/research-inbox";
import { dateLabel } from "@/lib/format";
import type { MarketEvent } from "@/lib/home-feed";
import type { QuoteRows } from "@/lib/portfolio-quotes";
import styles from "./ResearchInbox.module.css";
export default function ResearchInbox({
  events,
  today,
  ready,
}: {
  events: MarketEvent[];
  today: string;
  ready: boolean;
  quotes: QuoteRows;
  quotesReady: boolean;
  news?: { symbol: string; date: string; title: string; url: string }[];
}) {
  const { workspace, demo } = useProduct();
  const notes = useResource<{
    documents: {
      key: string;
      body: { reviewDate?: string; condition?: string };
    }[];
  }>("documents?kind=note", demo ? { documents: [] } : undefined);
  const alerts = useResource<{
    events: {
      id: string;
      symbol: string;
      created_at: string;
      read_at?: string | null;
      message?: string;
    }[];
  }>("alerts", demo ? { events: [] } : undefined);
  const followed = [
    ...new Set([
      ...(workspace?.watchlist.map((x) => x.symbol) ?? []),
      ...(workspace?.positions.map((x) => x.symbol) ?? []),
    ]),
  ];
  const items = researchInbox({
    today,
    events,
    positions: [],
    followed,
    alerts: alerts.data?.events ?? [],
  });
  for (const note of notes.data?.documents ?? [])
    if (
      followed.includes(note.key) &&
      note.body.reviewDate &&
      note.body.reviewDate <= today
    )
      items.push({
        id: `${note.key}:review:${note.body.reviewDate}`,
        symbol: note.key,
        date: note.body.reviewDate,
        title: `${note.key} · Your saved review`,
        detail:
          note.body.condition ||
          "Revisit the question you saved for this company.",
        href: "/watchlist",
      });
  const highlights = homeHighlights(items, today);
  const prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  if (!highlights.length) return null;
  return (
    <section className={styles.inbox} aria-label="Today’s highlights">
      <header>
        <div>
          <span className="eyebrow">FROM YOUR WATCHLIST & HOLDINGS</span>
          <h2>Worth a look today</h2>
        </div>
        <Link href={`${prefix}/watchlist`}>
          Your watchlist <ArrowUpRight size={16} />
        </Link>
      </header>
      <div className={styles.cards}>
        {highlights.map((item) => {
          const earnings = item.id.includes(":earnings:");
          const alert = item.id.startsWith("alert:");
          const Icon = earnings ? CalendarDays : alert ? Bell : Bookmark;
          return (
            <Link
              className={styles.highlight}
              data-kind={earnings ? "earnings" : alert ? "alert" : "review"}
              key={item.id}
              href={`${prefix}${item.href}`}
            >
              <span className={styles.category}>
                <Icon size={18} />
                {earnings
                  ? "Earnings"
                  : alert
                    ? "Your saved alert"
                    : "Saved review"}
              </span>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
              {earnings &&
                (() => {
                  const event = events.find(
                    (e) => e.symbol === item.symbol && e.date === item.date,
                  );
                  const actual =
                    event?.date &&
                    event.date <= today &&
                    typeof event.actual === "number" &&
                    Number.isFinite(event.actual)
                      ? event.actual
                      : null;
                  const estimate =
                    typeof event?.estimate === "number" &&
                    Number.isFinite(event.estimate)
                      ? event.estimate
                      : null;
                  return actual !== null || estimate !== null ? (
                    <div className={styles.earnings}>
                      <span>
                        EPS reported{" "}
                        <strong>
                          {actual === null ? "Pending" : actual.toFixed(2)}
                        </strong>
                      </span>
                      <span>
                        Estimate{" "}
                        <strong>
                          {estimate === null
                            ? "Not supplied"
                            : estimate.toFixed(2)}
                        </strong>
                      </span>
                    </div>
                  ) : null;
                })()}
              <span className={styles.action}>
                {earnings
                  ? "View earnings"
                  : alert
                    ? "View alert"
                    : "Open saved note"}{" "}
                <ArrowUpRight size={16} />
              </span>
              <time dateTime={item.date}>{dateLabel(item.date)}</time>
            </Link>
          );
        })}
      </div>
      {(!ready || notes.error || alerts.error) && (
        <small>
          Some updates could not be loaded. These highlights may be incomplete.
        </small>
      )}
    </section>
  );
}
