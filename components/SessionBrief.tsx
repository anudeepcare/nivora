"use client";
import Link from "next/link";
import { useProduct } from "./Session";
import { dateLabel } from "@/lib/format";
export default function SessionBrief() {
  const { cache, demo } = useProduct();
  const rows = (cache.get("brief:changes")?.value ?? []) as {
    symbol: string;
    changes: string[];
    at: string;
  }[];
  if (!rows.length) return null;
  return (
    <section className="observed-changes session-digest">
      <span className="eyebrow">Changes observed this session</span>
      {rows.slice(0, 4).map((r) => (
        <Link
          key={r.symbol}
          href={`${demo && demo.routePrefix !== "" ? "/preview" : ""}/research/${encodeURIComponent(r.symbol.replace("/", "-"))}`}
        >
          <b>{r.symbol}</b>
          <span>{r.changes.join(" · ")}</span>
          <small>{dateLabel(r.at)}</small>
        </Link>
      ))}
      <p className="small muted">
        Based on reports you opened or refreshed; no background market-wide
        monitoring.
      </p>
    </section>
  );
}
