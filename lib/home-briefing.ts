import type { MarketEvent } from "./home-feed";

/** Calendar priority is chronological, never an inferred investment signal. */
export function homeBriefing(input: {
  today: string;
  symbols: string[];
  checkpoints: MarketEvent[];
  loading: boolean;
  eventsReady: boolean;
  error: boolean;
}) {
  const start = Date.parse(input.today);
  const event =
    input.checkpoints
      .filter(
        (e) =>
          input.symbols.includes(e.symbol) &&
          Number.isFinite(Date.parse(e.date)) &&
          Date.parse(e.date) >= start &&
          Date.parse(e.date) <= start + 7 * 86400000,
      )
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  if (!input.symbols.length)
    return {
      event: null,
      title: "Start with your first company.",
      detail:
        "Save an idea or add a holding to build a briefing around what matters to you.",
    };
  if (event)
    return {
      event,
      title: `${event.symbol} · ${event.kind}`,
      detail: event.detail || "Event time has not been confirmed.",
    };
  if (input.loading)
    return {
      event: null,
      title: "Checking your next checkpoint…",
      detail: "Looking up the next seven days for your followed stocks.",
    };
  if (!input.eventsReady || input.error)
    return {
      event: null,
      title: "Calendar coverage is incomplete.",
      detail:
        "Missing evidence does not mean a quiet week. Review available research while the calendar is checked.",
    };
  return {
    event: null,
    title: "No dated events returned.",
    detail:
      "No scheduled company event was returned for the next seven days. Your research and saved reviews are below.",
  };
}

export function briefingSourceStatus({
  symbols,
  loading,
  ready,
  error,
}: {
  symbols: string[];
  loading: boolean;
  ready: boolean;
  error: boolean;
}) {
  if (!symbols.length) return "Follow a company";
  if (!symbols.some((symbol) => /^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol)))
    return "Stocks only";
  if (loading) return "Checking…";
  return error || !ready ? "Incomplete" : "Checked";
}
