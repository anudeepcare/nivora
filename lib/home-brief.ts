import type { MarketEvent, MarketHeadline } from "./home-feed";
type Input = {
  today: string;
  symbols: string[];
  names: Record<string, string>;
  events: MarketEvent[];
  headlines: MarketHeadline[];
  exposure: Map<string, number>;
  eventsReady: boolean;
  newsReady: boolean;
  hasHoldings?: boolean;
};
/** Source-backed editorial selection, not a materiality classifier or trading signal. */
export function homeBrief(input: Input) {
  const { today, symbols, names, exposure } = input,
    start = Date.parse(`${today}T00:00:00Z`),
    end = start + 7 * 86400000;
  const seen = new Set<string>();
  const checkpoints = input.events
    .filter((e) => {
      const at = Date.parse(e.date),
        key = `${e.symbol}:${e.date}:${e.kind}`;
      if (
        !symbols.includes(e.symbol) ||
        !Number.isFinite(at) ||
        at < start ||
        at > end ||
        seen.has(key)
      )
        return false;
      seen.add(key);
      return true;
    })
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (exposure.get(b.symbol) ?? 0) - (exposure.get(a.symbol) ?? 0),
    );
  const status = checkpoints.length
    ? `${checkpoints.length} dated checkpoint${checkpoints.length === 1 ? "" : "s"} in the next 7 days.${input.eventsReady ? "" : " Some company events could not be checked."}`
    : input.eventsReady
      ? "No dated events returned for the next 7 days."
      : "Some company events could not be checked.";
  const base = {
    checkpoints,
    status,
    symbol:
      [...symbols].sort(
        (a, b) =>
          (exposure.get(b) ?? 0) - (exposure.get(a) ?? 0) || a.localeCompare(b),
      )[0] ?? null,
  };
  const earnings = checkpoints.find((e) => /earnings/i.test(e.kind));
  if (earnings)
    return {
      ...base,
      kind: "earnings" as const,
      kicker: "EARNINGS AHEAD",
      title: "Earnings are your next checkpoint.",
      detail: `${names[earnings.symbol] ?? earnings.symbol} · ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(Date.parse(earnings.date))}. Review expectations before results arrive.`,
      symbol: earnings.symbol,
      action: "Prepare for earnings",
    };
  const update = input.headlines
    .filter((n) => {
      const at = Date.parse(n.date);
      return (
        symbols.includes(n.symbol) &&
        /^https?:\/\//.test(n.url) &&
        Number.isFinite(at) &&
        at <= start + 86400000 - 1 &&
        at >= start - 7 * 86400000
      );
    })
    .sort(
      (a, b) =>
        (exposure.get(b.symbol) ?? 0) - (exposure.get(a.symbol) ?? 0) ||
        b.date.localeCompare(a.date),
    )[0];
  if (update)
    return {
      ...base,
      kind: "news" as const,
      kicker: "COMPANY UPDATE",
      title: "A company update to put in context.",
      detail: update.title,
      symbol: update.symbol,
      action: "Open company research",
    };
  if (checkpoints[0])
    return {
      ...base,
      kind: "milestone" as const,
      kicker: "LOOK AHEAD",
      title: "Keep your next milestone in view.",
      detail: `${names[checkpoints[0].symbol] ?? checkpoints[0].symbol} · ${checkpoints[0].kind} · ${checkpoints[0].date}`,
      symbol: checkpoints[0].symbol,
      action: "Review company",
    };
  if (!symbols.length)
    return {
      ...base,
      kind: "start" as const,
      kicker: "YOUR FIRST STEP",
      title: "Make this perspective yours.",
      detail:
        "Find a company you follow, then save it or add a holding to shape your daily view.",
      action: "Find your first company",
    };
  const hasHoldings = input.hasHoldings ?? exposure.size > 0;
  return {
    ...base,
    kind: "review" as const,
    kicker: "YOUR WEEKLY CHECK-IN",
    title: hasHoldings
      ? "A clearer view of what you own."
      : "Revisit the companies you follow.",
    detail: hasHoldings
      ? "Review concentration, revisit the business and keep your plan in focus."
      : "Review your saved ideas and the evidence that would change your next decision.",
    status:
      !input.eventsReady || !input.newsReady
        ? "Some company evidence could not be checked."
        : status,
    action: hasHoldings ? "Review my holdings" : "Review my watchlist",
  };
}
export function dailyPerspective(today: string) {
  const thoughts = [
    "Price moves faster than a business.",
    "A clear thesis makes new evidence easier to judge.",
    "Know what would change your mind.",
    "A good process leaves room for uncertainty.",
    "Patience works best with a plan.",
    "Review the business, not just the price.",
    "Concentration deserves as much attention as conviction.",
  ];
  const day = Math.floor(Date.parse(`${today}T00:00:00Z`) / 86400000);
  return thoughts[
    Number.isFinite(day)
      ? ((day % thoughts.length) + thoughts.length) % thoughts.length
      : 0
  ];
}
