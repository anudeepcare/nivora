"use client";
import Link from "next/link";
import {useState} from "react";
import type {MarketEvent} from "@/lib/home-feed";
import { ArrowUpRight, Bell, Bookmark } from "lucide-react";
import { useProduct, useResource } from "./Session";
import { researchInbox, homeHighlights } from "@/lib/research-inbox";
import { dateLabel } from "@/lib/format";
import styles from "./ResearchInbox.module.css";
export default function ResearchInbox({ today,events=[],coverageIssue=false }: { today: string;events?:MarketEvent[];coverageIssue?:boolean }) {
  const [expanded,setExpanded]=useState(false);
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
    positions: workspace?.positions??[],
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
        href: `/research/${encodeURIComponent(note.key)}?tab=Case`,
      });
  const highlights = expanded ? [...items].sort((a,b)=>a.date.localeCompare(b.date)) : homeHighlights(items, today);
  const prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  if (!highlights.length&&!notes.error&&!alerts.error&&!coverageIssue) return null;
  return (
    <section className={styles.inbox} aria-label="Today’s highlights">
      <header>
        <div>
          <h2>Needs your attention</h2>
        </div>
        <Link href={`${prefix}/watchlist`}>
          Your watchlist <ArrowUpRight size={16} />
        </Link>
      </header>
      <div className={styles.cards}>
        {highlights.map((item) => {
          const alert = item.id.startsWith("alert:");
          const earnings=item.id.includes(":earnings:");
          const Icon = alert ? Bell : Bookmark;
          return (
            <Link
              className={styles.highlight}
              data-kind={alert ? "alert" : "review"}
              key={item.id}
              href={`${prefix}${item.href}`}
            >
              <span className={styles.category}>
                <Icon size={18} />
                {alert ? "Your saved alert" : earnings ? "Earnings checkpoint" : "Research review"}
              </span>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
              <span className={styles.action}>
                {alert ? "View alert" : earnings ? "Review earnings" : "Open research"}{" "}
                <ArrowUpRight size={16} />
              </span>
              <time dateTime={item.date}>{dateLabel(item.date)}</time>
            </Link>
          );
        })}
      </div>
      {items.length>3&&<button className={styles.expand} onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded}>{expanded?"Show highlights":`Show all ${items.length} items`}</button>}
      {(notes.error || alerts.error || coverageIssue) && (
        <small>
          Some updates could not be loaded. These highlights may be incomplete.
        </small>
      )}
    </section>
  );
}
