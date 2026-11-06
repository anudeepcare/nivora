import type { Candle } from "./types";
import {
  adaptiveSettledBars,
  cycleReading,
  researchAccumulation,
} from "./accumulation-policy-v5.ts";
import { trendAccumulationReading } from "./accumulation-policy-v3.ts";
import { monthEndSession } from "./calendar.ts";
const index = (month: string) =>
  Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1;
const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b),
    middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};
/** Descriptive price history, not a trading simulation or independent return estimate. */
export function paceHistoryInsights(
  bars: Candle[],
  asOf: string,
  market: "us-equity" | "crypto" = "us-equity",
) {
  const settled = adaptiveSettledBars(bars, asOf, market);
  const policy = researchAccumulation(bars, asOf, market);
  const months = new Map<string, Candle[]>();
  for (const bar of settled) {
    const month = bar.time.slice(0, 7);
    months.set(month, [...(months.get(month) ?? []), bar]);
  }
  const closes = [...months].map(([month, prices]) => ({
    month,
    bar: prices.at(-1)!,
  }));
  const rows = [
    ...policy.history,
    ...(policy.forming ? [policy.forming] : []),
  ].map((signal) => {
    const previous = closes
      .filter((r) => r.month < signal.month)
      .slice(-signal.priorMonths)
      .map((r) => r.bar);
    let strongest = signal.multiplier as number;
    let touched: number | null = null;
    const observations = months.get(signal.month) ?? [];
    for (const bar of observations) {
      const reading = cycleReading(
        previous,
        bar,
        trendAccumulationReading(previous, bar),
      );
      if (reading) strongest = Math.max(strongest, reading.multiplier);
      const touch =
        bar.low <= signal.buy4
          ? 4
          : bar.low <= signal.buy3
            ? 3
            : bar.low <= signal.buy2
              ? 2
              : null;
      if (touch !== null) touched = Math.max(touched ?? 0, touch);
    }
    return {
      month: signal.month,
      date: signal.date,
      confirmed: signal === policy.forming ? null : signal.multiplier,
      forming: signal === policy.forming ? signal.multiplier : null,
      strongest,
      touched,
      observations: observations.length,
    };
  });
  const runs: {
    zone: number;
    start: number;
    end: number;
    entered: boolean;
    completed: boolean;
  }[] = [];
  policy.history.forEach((signal, i, history) => {
    const prior = history[i - 1],
      run = runs.at(-1);
    const consecutive =
      !!prior && index(signal.month) - index(prior.month) === 1;
    if (run && consecutive && run.zone === signal.multiplier) run.end = i;
    else {
      if (run) run.completed = consecutive;
      runs.push({
        zone: signal.multiplier,
        start: i,
        end: i,
        entered: consecutive,
        completed: false,
      });
    }
  });
  const zones = [0, 1, 2, 3, 4].map((zone) => {
    const visits = runs.filter((run) => run.zone === zone);
    const durations = visits
      .filter((run) => run.entered && run.completed)
      .map((run) => run.end - run.start + 1);
    const outcomes = [6, 12, 24].map((horizon) => {
      const events: {
        startDate: string;
        endDate: string;
        returnPct: number;
        downsidePct: number;
      }[] = [];
      for (const run of visits.filter((run) => run.entered)) {
        const signal = policy.history[run.start];
        if (events.length && signal.date <= events.at(-1)!.endDate) continue;
        const start = closes.findIndex((row) => row.month === signal.month);
        const window = closes.slice(start + 1, start + horizon + 1);
        if (
          start < 0 ||
          window.length !== horizon ||
          !window.every(
            (row, i) =>
              index(row.month) === index(signal.month) + i + 1 &&
              row.bar.time === monthEndSession(row.month, market),
          )
        )
          continue;
        const end = window.at(-1)!.bar;
        const entry = closes[start].bar.close;
        const lows = settled
          .filter((bar) => bar.time > signal.date && bar.time <= end.time)
          .map((bar) => bar.low);
        events.push({
          startDate: signal.date,
          endDate: end.time,
          returnPct: (end.close / entry - 1) * 100,
          downsidePct: Math.min(0, (Math.min(...lows) / entry - 1) * 100),
        });
      }
      return {
        months: horizon,
        count: events.length,
        medianReturn: median(events.map((e) => e.returnPct)),
        worstDownside: events.length
          ? Math.min(...events.map((e) => e.downsidePct))
          : null,
        events,
      };
    });
    return {
      zone,
      months: policy.history.filter((s) => s.multiplier === zone).length,
      visits: visits.length,
      completedVisits: durations.length,
      medianDuration: median(durations),
      durationRange: durations.length
        ? [Math.min(...durations), Math.max(...durations)]
        : null,
      outcomes,
    };
  });
  return { available: rows.length > 0, reason: policy.reason, rows, zones };
}
