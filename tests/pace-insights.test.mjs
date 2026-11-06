import test from "node:test";
import assert from "node:assert/strict";
import { researchAccumulation } from "../lib/accumulation-policy-v5.ts";
import { monthEndSession } from "../lib/calendar.ts";
const m = await import("../lib/pace-insights.ts").catch(() => ({}));
const bars = (closes) =>
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
test("boundary uses inclusive lower zones and exclusive exits, with signed distance from observed close", () => {
  assert.equal(typeof m.paceBoundary, "function");
  const d = researchAccumulation(
    bars([...Array(24).fill(100), 80]),
    "2026-02-03T22:00:00Z",
  );
  const b = m.paceBoundary(d.confirmed);
  assert.equal(b.price, 75);
  assert.equal(b.level, 3);
  assert.equal(b.operator, "at or below");
  assert.equal(b.distancePercent, -6.25);
  const exact = m.paceBoundary({ ...d.confirmed, close: 75, multiplier: 3 });
  assert.equal(exact.price, 75);
  assert.equal(exact.level, 2);
  assert.equal(exact.operator, "above");
  assert.equal(exact.distancePercent, 0);
});
test("forming thresholds include the previous completed month; confirmed thresholds exclude their own month", () => {
  assert.equal(typeof m.paceEvidence, "function");
  const history = [
    ...bars([...Array(24).fill(100), 60]),
    { time: "2026-02-03", open: 80, high: 80, low: 80, close: 80, volume: 100 },
  ];
  const a = m.paceEvidence(history, "2026-02-04T22:00:00Z", "confirmed");
  const b = m.paceEvidence(history, "2026-02-04T22:00:00Z", "forming");
  assert.equal(a.reading.month, "2026-01");
  assert.equal(b.reading.month, "2026-02");
  assert.equal(a.reading.trend, 100);
  assert.ok(b.reading.trend < 100);
  assert.notEqual(a.boundary.price, b.boundary.price);
});
test("insufficient and stale history never acquire a boundary or borrow a different period", () => {
  assert.equal(typeof m.paceEvidence, "function");
  const history = bars([...Array(24).fill(100), 60]);
  assert.equal(
    m.paceEvidence(history, "2026-04-04T22:00:00Z", "confirmed").boundary,
    null,
  );
  assert.equal(
    m.paceEvidence(history, "2026-02-04T22:00:00Z", "forming").reading,
    null,
  );
  assert.equal(
    m.paceEvidence(
      bars(Array(12).fill(100)),
      "2025-01-04T22:00:00Z",
      "confirmed",
    ).boundary,
    null,
  );
});
test("overlapping deep boundaries report the actual destination and extension takes priority", () => {
  assert.equal(typeof m.paceBoundary, "function");
  const base = {
    close: 100,
    multiplier: 1,
    buy2: 90,
    buy3: 70,
    buy4: 70,
    pauseAbove: 125,
  };
  assert.equal(m.paceBoundary({ ...base, close: 75, multiplier: 2 }).level, 4);
  assert.equal(
    m.paceBoundary({ ...base, close: 125, multiplier: 0 }).operator,
    "below",
  );
  assert.equal(m.paceBoundary(null), null);
});
test("reported destinations agree with the real policy on either side of each returned boundary", async () => {
  const { cycleReading } = await import("../lib/accumulation-policy-v5.ts");
  const { trendAccumulationReading } = await import(
    "../lib/accumulation-policy-v3.ts"
  );
  for (const closes of [
    Array(24).fill(100),
    Array.from({ length: 24 }, (_, i) => 50 + i * 5),
    Array.from({ length: 24 }, (_, i) => 100 + (i % 2 ? 35 : -35)),
  ]) {
    const prior = bars(closes);
    for (const close of [10, 30, 50, 70, 85, 100, 150, 250, 400]) {
      const bar = {
        time: "2026-01-30",
        open: close,
        high: close,
        low: close,
        close,
        volume: 100,
      };
      const read = cycleReading(
        prior,
        bar,
        trendAccumulationReading(prior, bar),
      );
      const boundary = m.paceBoundary(read);
      assert.ok(boundary);
      const target =
        boundary.price *
        (boundary.operator.includes("below") ? 1 - 1e-7 : 1 + 1e-7);
      const changed = {
        ...bar,
        open: target,
        high: target,
        low: target,
        close: target,
      };
      assert.equal(
        cycleReading(prior, changed, trendAccumulationReading(prior, changed))
          .multiplier,
        boundary.level,
      );
    }
  }
});
