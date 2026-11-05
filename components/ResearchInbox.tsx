"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useProduct, useResource } from "./Session";
import { useWorkspacePreferences } from "./WorkspacePreferences";
import { portfolioAttention } from "@/lib/portfolio-attention";
import type { QuoteRows } from "@/lib/portfolio-quotes";
import type { MarketEvent } from "@/lib/home-feed";
import {
  researchInbox,
  visibleInbox,
  type InboxDisposition,
} from "@/lib/research-inbox";
import styles from "./ResearchInbox.module.css";
export default function ResearchInbox({
  events,
  today,
  ready,
  quotes,
  quotesReady, news = [],
}: {
  events: MarketEvent[];
  today: string;
  ready: boolean;
  quotes: QuoteRows;
  quotesReady: boolean;
  news?: {symbol:string;date:string;title:string;url:string}[];
}) {
  const { workspace, owner, demo, cache } = useProduct();
  const prefs = useWorkspacePreferences();
  const notes = useResource<{
    documents: {
      key: string;
      body: { reviewDate?: string; condition?: string };
    }[];
  }>("documents?kind=note", demo ? { documents: [] } : undefined);
  const attention = portfolioAttention(
    workspace?.positions ?? [],
    quotes,
    prefs.preferences.concentrationLimit,
  );
  const key = `auryn-inbox-v1:${owner}`;
  const [saved, setSaved] = useState<{ key: string; state: InboxDisposition }>({
    key: "",
    state: {},
  });
  const [error, setError] = useState("");
  useEffect(() => {
    let state: InboxDisposition = {};
    try {
      const raw = JSON.parse(localStorage.getItem(key) || "{}");
      if (raw && typeof raw === "object" && !Array.isArray(raw)) state = raw;
    } catch {}
    setSaved({ key, state });
    setError("");
  }, [key]);
  const alertEvents = useResource<{events:{id:string;symbol:string;created_at:string;read_at?:string|null;message?:string}[]}>('alerts', demo ? {events:[]} : undefined);
  const changes = (cache.get('brief:changes')?.value ?? []) as {symbol:string;at:string;changes:string[]}[];
  const items = researchInbox({
    news, changes, alerts: alertEvents.data?.events ?? [],
    followed: [...(workspace?.watchlist.map(x=>x.symbol)??[]),...(workspace?.positions.map(x=>x.symbol)??[])],
    today,
    events,
    positions: workspace?.positions ?? [],
  });
  const followed = new Set([
    ...(workspace?.watchlist.map((x) => x.symbol) ?? []),
    ...(workspace?.positions.map((x) => x.symbol) ?? []),
  ]);
  for (const note of notes.data?.documents ?? [])
    if (
      followed.has(note.key) &&
      note.body.reviewDate &&
      note.body.reviewDate <= today
    )
      items.push({
        id: `${note.key}:review:${note.body.reviewDate}`,
        symbol: note.key,
        date: note.body.reviewDate,
        title: `${note.key} · Your research review is due`,
        detail:
          note.body.condition ||
          "Revisit your saved research case and the latest evidence.",
        href: "/watchlist",
      });
  const state = saved.key === key ? saved.state : {};
  const visible = visibleInbox(items, state, today);
  const save = (next: InboxDisposition) => {
    setSaved({ key, state: next });
    if (!demo)
      try {
        localStorage.setItem(key, JSON.stringify(next));
        setError("");
      } catch {
        setError("Your changes could not be saved on this device.");
      }
  };
  const snooze = new Date(Date.parse(today) + 86400000)
    .toISOString()
    .slice(0, 10);
  return (
    <section className={styles.inbox} aria-label="Research checklist">
      <header>
        <div>
          <span className="eyebrow">YOUR RESEARCH CHECKLIST</span>
          <h2>
            {visible.length
              ? `${visible.length} ${visible.length === 1 ? "item" : "items"} to review`
              : "Your next review starts here"}
          </h2>
        </div>
        {Object.keys(state).length > 0 && (
          <button onClick={() => save({})}>Show reviewed</button>
        )}
      </header>
      {quotesReady && attention.missing.length > 0 && (
        <p>
          <Link href="/portfolio">
            Review {attention.missing.length} holdings without usable USD prices
            →
          </Link>
        </p>
      )}
      {quotesReady && attention.stale.length > 0 && (
        <p>
          <Link href="/portfolio">
            {attention.stale.length} holdings use older quotes →
          </Link>
        </p>
      )}
      {quotesReady &&
        attention.concentrated.map((x) => (
          <p key={x.symbol}>
            <Link href="/portfolio">
              {x.symbol}: {x.weight.toFixed(1)}% of priced investments, above
              your {prefs.preferences.concentrationLimit}% review threshold →
            </Link>
            {!attention.complete &&
              " Partial price coverage can inflate this weight."}
          </p>
        ))}
      {alertEvents.error && <p role="status">Saved alert history could not be loaded.</p>}
      {notes.error && (
        <p role="status">
          Saved review dates could not be loaded; the checklist is incomplete.
        </p>
      )}
      {notes.loading && <p role="status">Checking your saved review dates…</p>}
      {!ready && (
        <p role="status">
          Event or company-update coverage is incomplete; this is not a complete review list.
        </p>
      )}
      <p className="small muted">Today’s digest · {visible.length} available review items. Updates are grouped here to avoid repeated notifications.</p>
      {visible.length ? (
        <ul>
          {visible.slice(0, 6).map((item) => (
            <li key={item.id}>
              <div>
                <Link
                  href={`${demo && demo.routePrefix !== "" ? "/preview" : ""}${item.href}`}
                >
                  {item.title}
                </Link>
                <p>{item.detail}</p>
                <time dateTime={item.date}>{item.date}</time>
              </div>
              <div className={styles.actions}>
                <button
                  onClick={() =>
                    save({ ...state, [item.id]: { until: snooze } })
                  }
                >
                  Tomorrow
                </button>
                <button
                  onClick={() =>
                    save({ ...state, [item.id]: { reviewed: true } })
                  }
                >
                  Reviewed
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          {items.length
            ? "You’re caught up on the available checklist."
            : "Follow companies and add holdings to surface upcoming earnings and data checks."}
        </p>
      )}
      {visible.length > 6 && (
        <p>{visible.length - 6} more items will appear as you review these.</p>
      )}
      <small>
        Research reminders, not trade instructions. Review state stays on this
        device for this account.
      </small>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
