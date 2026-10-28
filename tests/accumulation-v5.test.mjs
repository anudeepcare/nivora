import test from "node:test";
import assert from "node:assert/strict";
import { monthEndSession } from "../lib/calendar.ts";
const m = await import("../lib/accumulation-policy-v5.ts").catch(() => ({}));
const months = (closes) =>
  closes.map((close, i) => ({
    time: monthEndSession(
      new Date(Date.UTC(2024, i, 1)).toISOString().slice(0, 7),
    ),
    open: close,
    high: close,
    low: close,
    close,
    volume: 100,
  }));
test("v5 includes short listed history without inventing prior monthly bars", () => {
  assert.equal(typeof m.researchAccumulation, "function");
  const bars = months([...Array(18).fill(100), 60]);
  const r = m.researchAccumulation(bars, "2025-08-02T22:00:00Z");
  assert.equal(r.version, "monthly-v5");
  assert.equal(r.confirmed.multiplier, 4);
  assert.equal(r.confirmed.historyBasis, "limited");
  assert.equal(r.confirmed.priorMonths, 18);
  assert.equal(
    m.researchAccumulation(months(Array(12).fill(100)), "2025-08-02T22:00:00Z")
      .confirmed,
    null,
  );
});
test("v5 separates moderate cycle decline from more severe standardized decline", () => {
  assert.equal(typeof m.cycleReading, "function");
  const legacy = { multiplier: 1, trimReview: false, pauseAbove: 300 };
  const make = (mean, sd, price) => {
    const w = Array.from({ length: 12 }, (_, i) => ({
      close: mean + (i % 2 ? 1 : -1) * sd * Math.sqrt(11 / 12),
    }));
    return m.cycleReading(w, { time: "2026-10-22", close: price }, legacy);
  };
  assert.equal(make(20, 5, 14.77).multiplier, 3);
  assert.equal(make(26, 11.5, 13.16).multiplier, 3);
  assert.equal(make(29, 12.3, 12.17).multiplier, 4);
});
test("v5 is scale invariant, excludes future observations and rejects missing completed months", () => {
  assert.equal(typeof m.researchAccumulation, "function");
  const bars = months([...Array(28).fill(100), 60]),
    asOf = "2026-06-02T22:00:00Z",
    r = m.researchAccumulation(bars, asOf);
  const scaled = bars.map((b) => ({
    ...b,
    open: b.open * 7,
    high: b.high * 7,
    low: b.low * 7,
    close: b.close * 7,
  }));
  assert.equal(
    m.researchAccumulation(scaled, asOf).confirmed.multiplier,
    r.confirmed.multiplier,
  );
  assert.deepEqual(
    m.researchAccumulation(
      [
        ...bars,
        { time: "2030-12-31", open: 1, high: 1, low: 1, close: 1, volume: 1 },
      ],
      asOf,
    ),
    r,
  );
  assert.equal(
    m.researchAccumulation(
      bars.filter((b) => b.time.slice(0, 7) !== "2026-01"),
      asOf,
    ).confirmed,
    null,
  );
});

test("aggressive upsize requires corroboration from the longer cycle, not just the latest-year decline", () => {
  assert.equal(typeof m.cycleReading, "function");
  const legacy = { multiplier: 1, trimReview: false, pauseAbove: 300 };
  const last = Array.from({ length: 12 }, (_, i) => ({
      close: 20 + (i % 2 ? 1 : -1) * 5 * Math.sqrt(11 / 12),
    })),
    bar = { time: "2026-10-22", close: 14.77 };
  const conflicting = m.cycleReading(
    [...Array.from({ length: 12 }, () => ({ close: 5 })), ...last],
    bar,
    legacy,
  );
  assert.equal(conflicting.multiplier, 2);
  assert.equal(conflicting.cycleCorroborated, false);
  assert.ok(conflicting.buy3 <= conflicting.longTrend);
  assert.match(conflicting.reason, /longer-cycle/);
  const supported = m.cycleReading(
    [...Array.from({ length: 12 }, () => ({ close: 15 })), ...last],
    bar,
    legacy,
  );
  assert.equal(supported.multiplier, 3);
  assert.equal(supported.cycleCorroborated, true);
});

const historyFrom = (year, count, price = 100) =>
  Array.from({ length: count }, (_, i) => {
    const month = new Date(Date.UTC(year, i, 1)).toISOString().slice(0, 7);
    return {
      time: monthEndSession(month),
      open: price,
      high: price,
      low: price,
      close: price,
      volume: 100,
    };
  });
test("an old June 2020 gap cannot erase a signal with 18 consecutive prior months", () => {
  const bars = historyFrom(2019, 37).filter(
    (b) => !b.time.startsWith("2020-06"),
  );
  const r = m.researchAccumulation(bars, "2022-02-01T22:00:00Z");
  const recent = m.researchAccumulation(
    bars.filter((b) => b.time >= "2020-07-01"),
    "2022-02-01T22:00:00Z",
  );
  assert.ok(r.confirmed);
  assert.deepEqual(r.confirmed, recent.confirmed);
  assert.equal(r.confirmed.priorMonths, 18);
  assert.equal(r.confirmed.historyBasis, "limited");
});
test("a missing 24th prior month never passes as standard 24-month history", () => {
  const bars = historyFrom(2022, 26);
  const incomplete = bars.filter((b) => !b.time.startsWith("2022-02"));
  const r = m.researchAccumulation(incomplete, "2024-03-01T22:00:00Z");
  assert.ok(r.confirmed);
  assert.equal(r.confirmed.priorMonths, 23);
  assert.equal(r.confirmed.historyBasis, "limited");
  assert.equal(
    m.researchAccumulation(bars, "2024-03-01T22:00:00Z").confirmed.historyBasis,
    "standard",
  );
});
test("the forming month remains separate after recovery from an old gap", () => {
  const bars = historyFrom(2019, 37).filter(
    (b) => !b.time.startsWith("2020-06"),
  );
  const partial = {
    time: "2022-02-14",
    open: 60,
    high: 60,
    low: 60,
    close: 60,
    volume: 100,
  };
  const r = m.researchAccumulation([...bars, partial], "2022-02-15T22:00:00Z");
  assert.equal(r.confirmed?.month, "2022-01");
  assert.equal(r.confirmed?.multiplier, 1);
  assert.equal(r.forming?.month, "2022-02");
  assert.equal(r.forming?.multiplier, 4);
  assert.equal(
    r.history.some((s) => s.month === "2022-02"),
    false,
  );
});
