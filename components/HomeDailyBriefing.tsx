import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, ShieldCheck } from "lucide-react";
import type { MarketEvent } from "@/lib/home-feed";
import { homeBriefing, briefingSourceStatus } from "@/lib/home-briefing";
import { quoteTime } from "@/lib/format";
import styles from "./HomeDailyBriefing.module.css";

export default function HomeDailyBriefing({
  today,
  symbols,
  checkpoints,
  loading,
  eventsReady,
  newsReady,
  error,
  retrievedAt,
  prefix,
  demo,
  children,
}: {
  today: string;
  symbols: string[];
  checkpoints: MarketEvent[];
  loading: boolean;
  eventsReady: boolean;
  newsReady: boolean;
  error: boolean;
  retrievedAt?: string;
  prefix: string;
  demo: boolean;
  children?: ReactNode;
}) {
  const focus = homeBriefing({
    today,
    symbols,
    checkpoints,
    loading,
    eventsReady,
    error,
  });
  const status = (ready: boolean) =>
    briefingSourceStatus({ symbols, loading, ready, error });
  return (
    <section className={styles.root} aria-label="Your 30-second briefing">
      <div className={styles.focus}>
        <div className={styles.eyebrow}>
          <span className={styles.diamond} aria-hidden="true" /> YOUR 30-SECOND
          BRIEFING
        </div>
        <div className={styles.label}>
          <CalendarDays size={15} />{" "}
          {focus.event ? "Next dated checkpoint" : "Your next step"}
        </div>
        <h2>{focus.title}</h2>
        {focus.event && (
          <time className={styles.date} dateTime={focus.event.date}>
            {new Intl.DateTimeFormat("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            }).format(Date.parse(focus.event.date))}
            {focus.event.date === today ? " · Scheduled today" : ""}
          </time>
        )}
        <p>{focus.detail}</p>
        <Link
          className={styles.action}
          href={symbols.length ? "#home-earnings" : `${prefix}/research`}
        >
          {symbols.length ? "Review the agenda" : "Find a company"}
          <ArrowUpRight size={16} />
        </Link>
      </div>
      {children}
      <div className={styles.sources} aria-label="Source coverage">
        <span className={styles.sourceTitle}>
          <ShieldCheck size={15} /> Source coverage
        </span>
        {symbols.length > 0 ? (
          <>
            <a href="#home-earnings">
              Events{" "}
              <strong data-ready={status(eventsReady) === "Checked"}>
                {status(eventsReady)}
              </strong>
            </a>
            <a href="#home-news">
              News{" "}
              <strong data-ready={status(newsReady) === "Checked"}>
                {status(newsReady)}
              </strong>
            </a>
          </>
        ) : (
          <span>Follow a company to check events and news.</span>
        )}
        <small>
          {demo
            ? "Illustrative workspace · news is not simulated."
            : retrievedAt
              ? `Feed checked ${quoteTime(retrievedAt)}. Individual sources may be incomplete.`
              : "Coverage appears after sources respond."}
        </small>
      </div>
    </section>
  );
}
