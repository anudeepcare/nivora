import test from "node:test";
import assert from "node:assert/strict";
import { paceHistoryInsights } from "../lib/pace-history-insights.ts";
import { monthEndSession } from "../lib/calendar.ts";
const fixture = (length = 70) =>
  Array.from({ length }, (_, i) => {
    const month = new Date(Date.UTC(2019, i, 1)).toISOString().slice(0, 7);
    const close = i % 12 === 2 || i % 12 === 3 ? 50 : 100;
    return {
      time: monthEndSession(month),
      open: close,
      high: close + 1,
      low: close - 1,
      close,
      volume: 100,
    };
  });
test("history excludes future bars and incomplete outcome windows", () => {
  const bars = fixture();
  const early = paceHistoryInsights(bars, "2022-01-15T12:00:00Z");
  assert.deepEqual(
    early,
    paceHistoryInsights(
      bars.filter((b) => b.time < "2022-01-15"),
      "2022-01-15T12:00:00Z",
    ),
  );
  assert(early.rows.every((r) => r.month < "2022-01"));
  for (const zone of early.zones)
    for (const outcome of zone.outcomes) {
      assert(outcome.events.every((e) => e.endDate < "2022-01-15"));
      assert(
        outcome.events.every((e, i, a) => !i || e.startDate > a[i - 1].endDate),
      );
    }
});
test("visits count contiguous runs rather than every monthly observation", () => {
  const result = paceHistoryInsights(fixture(), "2025-01-02T12:00:00Z");
  const p4 = result.zones.find((z) => z.zone === 4);
  assert(p4.months > p4.visits);
  assert.equal(p4.medianDuration, 2);
  assert.deepEqual(p4.durationRange, [2, 2]);
  assert(p4.outcomes.find((o) => o.months === 6).count > 0);
  assert(
    p4.outcomes.every((o) =>
      o.events.every((e) => Number.isFinite(e.returnPct) && e.downsidePct <= 0),
    ),
  );
});
test("insufficient history provides no invented durations or outcomes", () => {
  const result = paceHistoryInsights(fixture(10), "2025-01-02T12:00:00Z");
  assert.equal(result.available, false);
  assert.equal(result.rows.length, 0);
  assert(
    result.zones.every(
      (z) =>
        z.medianDuration === null &&
        z.outcomes.every((o) => o.count === 0 && o.medianReturn === null),
    ),
  );
});
test("intra-month touches are separate from a confirmed close", () => {
  const bars = fixture(14);
  const close = 100;
  bars.push({
    time: "2020-02-10",
    open: close,
    high: close,
    low: 40,
    close,
    volume: 100,
  });
  const result = paceHistoryInsights(bars, "2020-03-02T12:00:00Z");
  const row = result.rows.find((r) => r.month === "2020-02");
  assert.equal(row.touched, 4);
  assert.equal(row.confirmed, 1);
});

test("missing month-end invalidates an otherwise elapsed outcome window", () => {
  const bars = fixture(40);
  const complete = paceHistoryInsights(bars, "2023-01-02T12:00:00Z");
  const event = complete.zones.find((z) => z.zone === 4).outcomes[0].events[0];
  assert(event);
  const missingDate = bars.find(
    (b) => b.time > event.startDate && b.time < event.endDate,
  ).time;
  const incomplete = paceHistoryInsights(
    bars.filter((b) => b.time !== missingDate),
    "2023-01-02T12:00:00Z",
  );
  assert(
    !incomplete.zones
      .find((z) => z.zone === 4)
      .outcomes[0].events.some((e) => e.startDate === event.startDate),
  );
});

test("forming observation stays outside confirmed visit and outcome counts", () => {
  const bars = fixture(14);
  const base = paceHistoryInsights(bars, "2020-03-15T12:00:00Z");
  const next = paceHistoryInsights(
    [
      ...bars,
      {
        time: "2020-03-10",
        open: 50,
        high: 51,
        low: 49,
        close: 50,
        volume: 100,
      },
    ],
    "2020-03-15T12:00:00Z",
  );
  assert.equal(next.rows.at(-1).confirmed, null);
  assert.equal(next.rows.at(-1).forming, 4);
  assert.deepEqual(next.zones, base.zones);
});
