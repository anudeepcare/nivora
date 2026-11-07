import type { Position } from "./types";
import type { MarketEvent } from "./home-feed";
export type InboxItem = {
  id: string;
  symbol: string;
  title: string;
  detail: string;
  date: string;
  href: string;
};
export type InboxDisposition = Record<
  string,
  { until?: string; reviewed?: boolean }
>;
export function researchInbox({
  today,
  events,
  positions,
  news = [],
  changes = [],
  alerts = [],
  followed,
}: {
  today: string;
  events: MarketEvent[];
  positions: Position[];
  followed?: string[];
  news?: { symbol: string; date: string; title: string; url: string }[];
  changes?: { symbol: string; at: string; changes: string[] }[];
  alerts?: {
    id: string;
    symbol: string;
    created_at: string;
    read_at?: string | null;
    message?: string;
    title?: string;
  }[];
}): InboxItem[] {
  const output = new Map<string, InboxItem>();
  for (const e of events) {
    const days = (Date.parse(e.date) - Date.parse(today)) / 86400000;
    if (
      !Number.isFinite(days) ||
      days < -3 ||
      days > 7 ||
      !/earn/i.test(e.kind + " " + e.detail)
    )
      continue;
    const reported =
      e.date <= today &&
      typeof e.actual === "number" &&
      Number.isFinite(e.actual);
    const id = `${e.symbol}:earnings:${e.date}`;
    output.set(id, {
      id,
      symbol: e.symbol,
      date: e.date,
      title: `${e.symbol} · ${reported ? "Review reported earnings" : days < 0 ? "Check earnings release" : days === 0 ? "Earnings scheduled today" : "Upcoming earnings"}`,
      detail: reported
        ? "Compare reported results with expectations and revisit your research questions."
        : days < 0
          ? "The scheduled date has passed; results are not confirmed in the available feed."
          : "Review expectations and the questions you want this report to answer.",
      href: `/research/${encodeURIComponent(e.symbol)}?tab=News`,
    });
  }
  for (const p of positions) {
    if (p.assetType === "cash" || (Number.isFinite(p.cost) && p.cost >= 0))
      continue;
    const id = `${p.symbol}:cost-basis`;
    output.set(id, {
      id,
      symbol: p.symbol,
      date: today,
      title: `${p.symbol} · Review cost basis`,
      detail:
        "A valid cost basis is missing. Check the position before interpreting its return.",
      href: "/portfolio",
    });
  }
  const allowed = new Set(followed ?? positions.map((p) => p.symbol));
  const recent = (value: string) => {
    const days =
      (Date.parse(today) - Date.parse(value.slice(0, 10))) / 86400000;
    return Number.isFinite(days) && days >= 0 && days <= 7;
  };
  for (const n of news)
    if (allowed.has(n.symbol) && recent(n.date) && /^https:\/\//.test(n.url)) {
      const id = `${n.symbol}:news:${n.url}`;
      output.set(id, {
        id,
        symbol: n.symbol,
        date: n.date.slice(0, 10),
        title: `${n.symbol} · Company update to review`,
        detail: n.title,
        href: `/research/${encodeURIComponent(n.symbol)}?tab=News`,
      });
    }
  for (const c of changes)
    if (allowed.has(c.symbol) && recent(c.at) && c.changes.length) {
      const id = `${c.symbol}:changes:${c.at}`;
      output.set(id, {
        id,
        symbol: c.symbol,
        date: c.at.slice(0, 10),
        title: `${c.symbol} · Evidence changed`,
        detail: c.changes.join(" "),
        href: `/research/${encodeURIComponent(c.symbol)}`,
      });
    }
  for (const a of alerts)
    if (allowed.has(a.symbol) && !a.read_at && recent(a.created_at)) {
      const id = `alert:${a.id}`;
      output.set(id, {
        id,
        symbol: a.symbol,
        date: a.created_at.slice(0, 10),
        title: `${a.symbol} · Saved alert reached`,
        detail:
          a.message ||
          a.title ||
          "Review the dated evidence for your saved alert.",
        href: "/alerts",
      });
    }
  return [...output.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
}
export function visibleInbox<T extends { id: string }>(
  items: T[],
  state: InboxDisposition,
  today: string,
) {
  return items.filter((item) => {
    const s = state[item.id];
    return !s?.reviewed && !(s?.until && s.until > today);
  });
}

/** Home is a short set of timely highlights, never a queue of every news item. */
export function homeHighlights(items: InboxItem[], today: string) {
  const rank = (x: InboxItem) =>
    x.id.includes(":earnings:")
      ? x.date === today
        ? 0
        : 2
      : x.id.startsWith("alert:")
        ? 1
        : 3;
  const seen = new Set<string>();
  return items
    .filter(
      (x) =>
        !x.id.includes(":news:") &&
        !x.id.includes(":changes:") &&
        Number.isFinite(Date.parse(x.date)),
    )
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        (rank(a) === 2
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date)),
    )
    .filter((x) => {
      if (seen.has(x.symbol)) return false;
      seen.add(x.symbol);
      return true;
    })
    .slice(0, 3);
}
