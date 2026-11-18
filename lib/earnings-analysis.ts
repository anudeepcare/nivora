import { calendarDate, earningsWindow } from "./global-earnings.ts";
export type EarningsAnalysisView = "recent" | "statistics" | "ranked";
export function earningsAnalysisQuery(params: URLSearchParams) {
  if (
    [...params.keys()].some(
      (k) => k !== "view" || params.getAll(k).length !== 1,
    )
  )
    throw Error("Choose one earnings view.");
  const view = params.get("view") ?? "recent";
  if (!["recent", "statistics", "ranked"].includes(view))
    throw Error("Unsupported earnings view.");
  const paths = {
    recent: "earnings/recent?days=7&limit=25",
    statistics: "earnings/statistics?window=last_completed_week",
    ranked:
      "earnings/ranked?reportedDays=14&reportedLimit=12&upcomingDays=7&upcomingLimit=12",
  };
  return {
    view: view as EarningsAnalysisView,
    path: paths[view as EarningsAnalysisView],
  };
}
const obj = (x: unknown): Record<string, unknown> =>
  x && typeof x === "object" && !Array.isArray(x)
    ? (x as Record<string, unknown>)
    : {};
const text = (x: unknown, max = 400) =>
  typeof x === "string" ? x.trim().slice(0, max) : "";
const num = (x: unknown) =>
  typeof x === "number" && Number.isFinite(x) ? x : null;
const integer = (x: unknown) => {
  if (typeof x !== "number" || !Number.isSafeInteger(x) || x < 0)
    throw Error("Earnings counts unavailable.");
  return x;
};
const epoch = (x: unknown, now: number) => {
  if (
    typeof x !== "number" ||
    !Number.isSafeInteger(x) ||
    x < 1262304000 ||
    x * 1000 > now
  )
    throw Error("Earnings computation date unavailable.");
  return new Date(x * 1000).toISOString();
};
const shift = (d: string, n: number) =>
  new Date(Date.parse(d) + n * 86400000).toISOString().slice(0, 10);
const day = (now: number) => earningsWindow(7, new Date(now))!.from;
function ratio(raw: unknown, n: number, d: number) {
  const expected = d ? n / d : null;
  if (expected === null) {
    if (raw !== null) throw Error("Earnings rate lacks a denominator.");
    return null;
  }
  if (
    typeof raw !== "number" ||
    !Number.isFinite(raw) ||
    raw < 0 ||
    raw > 1 ||
    Math.abs(raw - expected) > 0.0002
  )
    throw Error("Earnings rates do not reconcile.");
  return raw;
}
export type EarningsAnalysisRow = {
  ticker: string;
  date: string;
  period: string;
  headline: string;
  generatedAt: string | null;
  eps: number | null;
  estimate: number | null;
  surprisePct: number | null;
  outcome: string;
  movePct: number | null;
  reactionKind: string;
  confirmed: boolean | null;
  session: string;
};
function row(
  value: unknown,
  upcoming: boolean,
  now: number,
): EarningsAnalysisRow {
  const r = obj(value),
    ticker = text(r.ticker, 20),
    date = upcoming ? r.earningsDate : r.reportDate;
  if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(ticker) || !calendarDate(date))
    throw Error("Earnings row identity unavailable.");
  let movePct: number | null = null,
    reactionKind = "Reaction not supplied";
  const final = num(r.movePct),
    live = num(r.liveReactionPct),
    extended = num(r.afterHoursReactionPct);
  if ([final, live, extended].filter((x) => x !== null).length > 1)
    throw Error("Conflicting earnings reaction intervals.");
  if (final !== null) {
    if (r.reactionPending === true)
      throw Error("Final reaction marked pending.");
    movePct = final;
    reactionKind = "Completed session move";
  } else if (r.reactionPending === true) {
    if (live !== null) {
      movePct = live;
      reactionKind = "Provisional session move";
    } else if (extended !== null) {
      movePct = extended;
      reactionKind = "Extended-hours move, not final reaction";
    } else reactionKind = "Reaction pending";
  }
  const eps = r.awaitingConsensus === true ? null : num(r.actualEps),
    estimate =
      r.awaitingConsensus === true
        ? null
        : num(upcoming ? r.estimatedEps : r.estimateEps);
  let surprisePct = num(r.surprisePct);
  if (
    r.surpriseFlag != null ||
    eps === null ||
    estimate === null ||
    estimate === 0 ||
    eps * estimate < 0 ||
    surprisePct === null ||
    Math.abs(surprisePct) > 100 ||
    Math.abs(surprisePct - ((eps - estimate) / Math.abs(estimate)) * 100) > 0.02
  )
    surprisePct = null;
  return {
    ticker,
    date,
    period: text(r.fiscalPeriod, 80),
    headline: text(r.headline),
    generatedAt: r.generatedAt == null ? null : epoch(r.generatedAt, now),
    eps,
    estimate,
    surprisePct,
    outcome:
      r.awaitingConsensus !== true &&
      ["BEAT", "MISS", "INLINE", "UNCLASSIFIED"].includes(String(r.outcome))
        ? String(r.outcome)
        : "Not classified",
    movePct,
    reactionKind,
    confirmed: typeof r.confirmed === "boolean" ? r.confirmed : null,
    session: [
      "before_open",
      "after_close",
      "during_market",
      "unknown",
    ].includes(String(r.earningsTime))
      ? String(r.earningsTime)
      : "Not supplied",
  };
}
export type EarningsStatistics = {
  events: number;
  classified: number;
  unclassified: number;
  measured: number;
  pending: number;
  unavailableReactions: number;
  distinctTickers: number;
  coverage: number | null;
  beatRate: number | null;
  beatsFellRate: number | null;
  beatCount: number;
  beatsMeasured: number;
  beatsFell: number;
  sufficient: boolean;
  reason: string;
  version: string;
  start: string;
  end: string;
};
export type EarningsAnalysis = {
  view: EarningsAnalysisView;
  preview: boolean;
  asOf: string | null;
  retrievedAt: string;
  rows: EarningsAnalysisRow[];
  upcoming: EarningsAnalysisRow[];
  omitted: number;
  reportedTotal: number | null;
  upcomingTotal: number | null;
  windowStart: string;
  windowEnd: string;
  upcomingEnd: string;
  version: string;
  statistics: EarningsStatistics | null;
};
export function projectEarningsAnalysis(
  raw: unknown,
  query: ReturnType<typeof earningsAnalysisQuery>,
  now = Date.now(),
): EarningsAnalysis {
  const root = obj(raw),
    d = obj(root.data),
    today = day(now);
  if (
    typeof root.isPreview !== "boolean" ||
    (query.view !== "ranked" && root.isPreview)
  )
    throw Error("Unexpected earnings preview shape.");
  const result: EarningsAnalysis = {
    view: query.view,
    preview: root.isPreview,
    asOf: null,
    retrievedAt: new Date(now).toISOString(),
    rows: [],
    upcoming: [],
    omitted: 0,
    reportedTotal: null,
    upcomingTotal: null,
    windowStart: "",
    windowEnd: "",
    upcomingEnd: "",
    version: "",
    statistics: null,
  };
  const rows = (
    values: unknown,
    start: string,
    end: string,
    upcoming: boolean,
    max: number,
  ) => {
    if (!Array.isArray(values) || values.length > max)
      throw Error("Earnings response exceeds row limit.");
    const seen = new Set<string>();
    return values.flatMap((v) => {
      try {
        const r = row(v, upcoming, now);
        if (
          r.date < start ||
          r.date > end ||
          seen.has(`${r.ticker}:${r.date}:${r.period}`)
        )
          throw Error("Outside earnings window or duplicate.");
        seen.add(`${r.ticker}:${r.date}:${r.period}`);
        return [r];
      } catch {
        result.omitted++;
        return [];
      }
    });
  };
  if (query.view === "recent") {
    result.windowStart = shift(today, -7);
    result.windowEnd = today;
    result.rows = rows(root.data, result.windowStart, today, false, 25);
    return result;
  }
  result.asOf = epoch(d.asOf, now);
  const computedDay = day(Date.parse(result.asOf));
  if (query.view === "ranked") {
    const reported = obj(d.reported),
      upcoming = obj(d.upcoming);
    result.version = text(d.rankingVersion, 80);
    if (!result.version) throw Error("Ranking version unavailable.");
    if (
      reported.windowStart !== shift(computedDay, -14) ||
      reported.windowEnd !== computedDay ||
      upcoming.windowStart !== computedDay ||
      upcoming.windowEnd !== shift(computedDay, 7)
    )
      throw Error("Ranking window does not match request.");
    result.windowStart = String(reported.windowStart);
    result.windowEnd = computedDay;
    result.upcomingEnd = String(upcoming.windowEnd);
    result.reportedTotal = integer(reported.totalInWindow);
    result.upcomingTotal = integer(upcoming.totalInWindow);
    result.rows = rows(
      reported.rows,
      result.windowStart,
      result.windowEnd,
      false,
      result.preview ? 3 : 12,
    );
    result.upcoming = rows(
      upcoming.rows,
      computedDay,
      result.upcomingEnd,
      true,
      result.preview ? 3 : 12,
    );
    if (
      result.reportedTotal < (reported.rows as unknown[]).length ||
      result.upcomingTotal < (upcoming.rows as unknown[]).length
    )
      throw Error("Ranking totals do not reconcile.");
    return result;
  }
  const w = obj(d.window),
    monday = shift(computedDay, -((new Date(computedDay).getUTCDay() + 6) % 7));
  if (
    w.kind !== "COMPLETED_WEEK" ||
    w.startDate !== shift(monday, -7) ||
    w.endDate !== shift(monday, -1)
  )
    throw Error("Unexpected statistics window.");
  const events = integer(d.eventsInWindow),
    classified = integer(d.classifiedEvents),
    unclassified = integer(d.unclassifiedEvents),
    measured = integer(d.completedReactions),
    pending = integer(d.pendingReactions),
    distinctTickers = integer(d.distinctTickers);
  if (
    classified + unclassified !== events ||
    measured + pending > classified ||
    distinctTickers > events ||
    typeof d.sufficientData !== "boolean"
  )
    throw Error("Earnings statistics do not reconcile.");
  const blocks = ["beat", "miss", "inline"].map((key) => {
    const b = obj(d[key]),
      count = integer(b.count),
      withReaction = integer(b.withReaction),
      fell = integer(b.fell),
      rose = integer(b.rose),
      flat = integer(b.flat);
    if (withReaction > count || fell + rose + flat !== withReaction)
      throw Error("Earnings reaction counts do not reconcile.");
    return {
      count,
      withReaction,
      fell,
      rate: ratio(b.rate, count, classified),
      fellRate: ratio(b.fellRate, fell, withReaction),
    };
  });
  if (
    blocks.reduce((a, b) => a + b.count, 0) !== classified ||
    blocks.reduce((a, b) => a + b.withReaction, 0) !== measured
  )
    throw Error("Earnings outcome counts do not reconcile.");
  const coverage = ratio(d.coverageRatio, measured, classified),
    sufficient = d.sufficientData;
  result.version = text(d.calculationVersion, 80);
  if (!result.version) throw Error("Statistics version unavailable.");
  result.windowStart = String(w.startDate);
  result.windowEnd = String(w.endDate);
  result.statistics = {
    events,
    classified,
    unclassified,
    measured,
    pending,
    unavailableReactions: classified - measured - pending,
    distinctTickers,
    coverage,
    beatRate: sufficient ? blocks[0].rate : null,
    beatsFellRate: sufficient ? blocks[0].fellRate : null,
    beatCount: blocks[0].count,
    beatsMeasured: blocks[0].withReaction,
    beatsFell: blocks[0].fell,
    sufficient,
    reason: text(d.insufficientDataReason, 100),
    version: result.version,
    start: result.windowStart,
    end: result.windowEnd,
  };
  return result;
}
