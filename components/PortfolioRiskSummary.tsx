"use client";
import { useEffect, useMemo, useRef } from "react";
import type { Position, Quote } from "@/lib/types";
import type { HomeFeed } from "@/lib/home-feed";
import { portfolioRiskSummary } from "@/lib/product-attention";
import { amount, percent } from "@/lib/format";
import { useProduct, useResource } from "./Session";
export function usePortfolioCalendar(positions: Position[]) {
  const { demo, workspace } = useProduct(),
    symbols = [
      ...new Set([
        ...positions
          .filter((p) => p.assetType === "stock")
          .map((p) => p.symbol),
        ...(workspace?.watchlist.map((w) => w.symbol) ?? []),
      ]),
    ]
      .filter((s) => /^[A-Z][A-Z0-9.-]{0,14}$/.test(s))
      .slice(0, 30),
    key = symbols.join(",");
  const preview = useMemo(
    () => (demo ? { events: [], issues: [], followed: 0 } : undefined),
    [demo],
  );
  const calendar = useResource<
    Pick<HomeFeed, "events" | "issues" | "followed">
  >(
    key ? `home-feed?kind=events&symbols=${encodeURIComponent(key)}` : null,
    preview,
    300000,
  );
  const refresh = useRef(calendar.refresh);
  refresh.current = calendar.refresh;
  useEffect(() => {
    if (demo || !key) return;
    let checked = Date.now();
    const check = () => {
      if (
        document.visibilityState === "hidden" ||
        Date.now() - checked < 300000
      )
        return;
      checked = Date.now();
      refresh.current();
    };
    const timer = window.setInterval(check, 300000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [demo, key]);
  return calendar;
}
export default function PortfolioRiskSummary({
  positions,
  quotes,
  calendar: events,
}: {
  positions: Position[];
  quotes: Record<string, Quote>;
  calendar: {
    data: Pick<HomeFeed, "events" | "issues" | "followed"> | null;
    error: string;
  };
}) {
  const { demo } = useProduct();
  const preview = useMemo(() => (demo ? { documents: [] } : undefined), [demo]);
  const notes = useResource<{
    documents: { key: string; body: { thesis?: string } }[];
  }>("documents?kind=note", preview, 60000);
  const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()),
    risk = portfolioRiskSummary(
      positions,
      quotes,
      events.data?.events ?? [],
      today,
    ),
    held = new Set(
      positions.filter((p) => p.assetType !== "cash").map((p) => p.symbol),
    );
  const calendarIncomplete =
    !!events.error ||
    !!events.data?.issues.some((i) => /events|connected/i.test(i));
  return (
    <section
      className="portfolio-risk-summary"
      aria-label="Portfolio risk summary"
    >
      <div>
        <span>Top-three concentration</span>
        <strong>{percent(risk.topThree)}</strong>
        <small>Largest investments / priced assets & cash</small>
      </div>
      <div>
        <span>Earnings · next 7 days</span>
        <strong>
          {calendarIncomplete
            ? "Incomplete"
            : events.data
              ? percent(risk.earningsWeight)
              : "Checking…"}
        </strong>
        <small>
          {calendarIncomplete
            ? "Calendar coverage incomplete"
            : events.data
              ? `${amount(risk.earningsValue, "USD", true)} · calendar checked for ${events.data.followed} selected stocks`
              : "Checking supplied dates"}
        </small>
      </div>
      <div>
        <span>Crypto exposure</span>
        <strong>{percent(risk.crypto)}</strong>
        <small>Priced crypto / priced assets & cash</small>
      </div>
      <div>
        <span>Saved holding theses</span>
        <strong>
          {notes.data
            ? notes.data.documents.filter(
                (n) => held.has(n.key) && n.body.thesis?.trim(),
              ).length
            : "—"}
        </strong>
        <small>
          {notes.error
            ? "Records unavailable"
            : "Your written research records"}
        </small>
      </div>
    </section>
  );
}
