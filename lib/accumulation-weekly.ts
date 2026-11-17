import type { Candle } from "./types";
import {
  adaptiveSettledBars,
  trendAccumulationReading,
  type AdaptiveSignal,
} from "./accumulation-policy-v3.ts";
import { evidenceMemo } from "./evidence-memo.ts";
type Market = "us-equity" | "crypto";
const dayMs = 86400000;
/** Week keys are Friday for US equities, Sunday for 24/7 crypto. */
export function weekKey(day: string, market: Market = "us-equity") {
  const d = new Date(day + "T12:00:00Z");
  const weekday = d.getUTCDay();
  // Weekend equity observations belong to the preceding Friday; input filtering rejects them.
  const delta =
    market === "crypto" ? (7 - weekday) % 7 : weekday === 0 ? -2 : 5 - weekday;
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
/** Standard Friday closures only; exceptional/missing final sessions withhold the reading.
 * NYSE calendar: https://www.nyse.com/markets/hours-calendars
 * New Year's Saturday has no preceding-Friday closure (year-end exception).
 */
export function weekEndSession(day: string, market: Market = "us-equity") {
  const key = weekKey(day, market);
  if (market === "crypto") return key;
  const y = Number(key.slice(0, 4)),
    a = y % 19,
    b = Math.floor(y / 100),
    c = y % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    n = Math.floor((a + 11 * h + 22 * l) / 451),
    em = Math.floor((h + l - 7 * n + 114) / 31),
    ed = ((h + l - 7 * n + 114) % 31) + 1;
  const goodFriday = new Date(Date.UTC(y, em - 1, ed - 2))
    .toISOString()
    .slice(0, 10);
  const fridayHolidays = new Set([
    goodFriday,
    `${y}-01-01`,
    `${y}-07-04`,
    `${y}-07-03`,
    `${y}-12-25`,
    `${y}-12-24`,
  ]);
  if (y >= 2022) {
    fridayHolidays.add(`${y}-06-19`);
    fridayHolidays.add(`${y}-06-18`);
  }
  return fridayHolidays.has(key)
    ? new Date(Date.parse(key) - dayMs).toISOString().slice(0, 10)
    : key;
}
function compute(bars: Candle[], asOf: string, market: Market) {
  const empty = {
    version: "weekly-v1",
    confirmed: null as AdaptiveSignal | null,
    forming: null as AdaptiveSignal | null,
    history: [] as AdaptiveSignal[],
    bars: [] as Candle[],
    reason:
      "52 consecutive completed prior weeks and a settled observation are required.",
  };
  if (!Number.isFinite(Date.parse(asOf))) return empty;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: market === "crypto" ? "UTC" : "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(asOf));
  const currentWeek = weekKey(today, market),
    groups = new Map<string, Candle>();
  for (const bar of adaptiveSettledBars(bars, asOf, market)) {
    const key = weekKey(bar.time, market),
      prior = groups.get(key);
    groups.set(
      key,
      prior
        ? {
            ...prior,
            time: bar.time,
            high: Math.max(prior.high, bar.high),
            low: Math.min(prior.low, bar.low),
            close: bar.close,
            volume: prior.volume + bar.volume,
          }
        : { ...bar },
    );
  }
  const rows = [...groups.entries()],
    history: AdaptiveSignal[] = [];
  let forming: AdaptiveSignal | null = null;
  for (let i = 52; i < rows.length; i++) {
    const prior = rows.slice(i - 52, i),
      [key, bar] = rows[i];
    if (
      prior.some(
        ([k, b], j) =>
          b.time !== weekEndSession(k, market) ||
          (j > 0 && Date.parse(k) - Date.parse(prior[j - 1][0]) !== 7 * dayMs),
      ) ||
      Date.parse(key) - Date.parse(prior.at(-1)![0]) !== 7 * dayMs
    )
      continue;
    const complete = bar.time === weekEndSession(key, market);
    if (key < currentWeek && !complete) continue;
    const signal = trendAccumulationReading(
      prior.map(([, b]) => b),
      bar,
      "weekly",
    );
    if (
      !Object.values(signal).every(
        (v) => typeof v !== "number" || Number.isFinite(v),
      )
    )
      continue;
    if (complete) history.push(signal);
    else if (key === currentWeek) forming = signal;
  }
  const end = weekEndSession(currentWeek, market),
    hour = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        hourCycle: "h23",
      }).format(new Date(asOf)),
    );
  const completed =
    today > end || (market === "us-equity" && today === end && hour >= 17);
  const expected = completed
    ? currentWeek
    : new Date(Date.parse(currentWeek) - 7 * dayMs).toISOString().slice(0, 10);
  const latest = history.at(-1),
    confirmed =
      latest && weekKey(latest.date, market) === expected ? latest : null;
  return {
    ...empty,
    history,
    bars: [...groups.values()],
    confirmed,
    forming,
    reason: confirmed
      ? "Weekly price conditions are separate from monthly contribution discipline; no return prediction."
      : empty.reason,
  };
}
const memo = evidenceMemo<ReturnType<typeof compute>>();
export function weeklyAccumulation(
  bars: Candle[],
  asOf: string,
  market: Market = "us-equity",
) {
  return memo(bars, `${asOf}:${market}`, () => compute(bars, asOf, market));
}
