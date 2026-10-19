import test from "node:test";
import assert from "node:assert/strict";
import { candidatePolicy } from "../lib/accumulation-policy.ts";
import { evaluatePolicies } from "../lib/policy-evaluation.ts";
import { monthEndSession } from "../lib/calendar.ts";
function fixture(n = 100) {
  const rows = [];
  for (let i = 0; i < n; i++) {
    const m = new Date(Date.UTC(2017, i, 1)).toISOString().slice(0, 7),
      base = 100 * Math.exp(i * 0.006),
      close = base * (i % 23 > 17 ? 0.55 : 1);
    rows.push(
      {
        time: m + "-02",
        open: base,
        high: Math.max(base, close),
        low: Math.min(base, close),
        close,
        volume: 1000,
      },
      {
        time: monthEndSession(m),
        open: close,
        high: close,
        low: close,
        close,
        volume: 1000,
      },
    );
  }
  return rows;
}
test("candidate requires 36 complete consecutive months and is invariant to future prices", () => {
  const bars = fixture(),
    asOf = "2025-05-01T12:00:00Z";
  const a = candidatePolicy(bars, asOf);
  assert.ok(a.history.length > 20);
  assert.equal(a.version, "monthly-v2-candidate");
  assert.equal(candidatePolicy(bars.slice(0, 60), asOf).history.length, 0);
  assert.deepEqual(
    candidatePolicy(
      [...bars, { ...bars[0], time: "2030-01-31", close: 999999 }],
      asOf,
    ),
    a,
  );
  assert.ok(a.history.every((s) => s.buy2 >= s.buy3 && s.buy3 >= s.buy4));
});
test("candidate rejects missing month ends and keeps forming separate", () => {
  const bars = fixture(50),
    m = bars.at(-1).time.slice(0, 7),
    asOf = new Date(Date.parse(bars.at(-1).time) + 86400000).toISOString();
  const x = candidatePolicy(bars, asOf);
  assert.ok(x.history.length);
  const gap = candidatePolicy(
    bars.filter((b) => !b.time.startsWith("2020-01")),
    asOf,
  );
  assert.ok(gap.history.length < x.history.length);
  const during = candidatePolicy(bars, m + "-15T12:00:00Z");
  assert.ok(!during.history.some((s) => s.month === m));
});
test("evaluation uses common months, equal deposits, cash limits and a later untouched holdout", () => {
  const x = evaluatePolicies(fixture(), "2025-05-01T12:00:00Z", 10);
  assert.ok(x.available);
  assert.equal(x.fixed.contributed, x.original.contributed);
  assert.equal(x.fixed.contributed, x.candidate.contributed);
  assert.ok(x.candidate.cash >= -1e-8);
  assert.ok(x.holdout.start > x.development.end);
  assert.equal(x.holdout.fixed.contributed, x.holdout.candidate.contributed);
  assert.ok(x.history.every((r) => r.executionDate > r.signalDate));
  assert.throws(() => evaluatePolicies(fixture(), "2025-05-01T12:00:00Z", -1));
});
test("flat history remains finite without manufactured extreme readings", () => {
  const flat = fixture(70).map((b) => ({
    ...b,
    open: 100,
    high: 100,
    low: 100,
    close: 100,
  }));
  const x = candidatePolicy(flat, "2023-01-01T12:00:00Z");
  assert.ok(x.history.length);
  assert.ok(
    x.history.every(
      (s) =>
        s.multiplier === 1 &&
        Math.abs(s.z) < 1e-10 &&
        !s.trimReview &&
        Number.isFinite(s.trend),
    ),
  );
  const e = evaluatePolicies(flat, "2023-01-01T12:00:00Z", 0);
  assert.ok(e.available);
  assert.equal(e.fixed.value, e.fixed.contributed);
  assert.equal(e.candidate.value, e.fixed.value);
});
test("an opening loss is not diluted by a deposit made after the gap", () => {
  const bars = fixture(70).map((b) => {
    const i =
        (Number(b.time.slice(0, 4)) - 2017) * 12 +
        Number(b.time.slice(5, 7)) -
        1,
      price = i >= 37 ? 50 : 100;
    return { ...b, open: price, high: price, low: price, close: price };
  });
  const e = evaluatePolicies(bars, "2023-01-01T12:00:00Z", 0);
  assert.ok(e.available);
  assert.ok(Math.abs(e.fixed.drawdown + 50) < 1e-8);
});
test("later data cannot change an earlier policy evaluation", () => {
  const bars = fixture(100),
    asOf = "2025-05-01T12:00:00Z",
    a = evaluatePolicies(bars, asOf, 10),
    b = evaluatePolicies(
      [
        ...bars,
        {
          ...bars[0],
          time: "2030-01-31",
          open: 100000,
          high: 100000,
          low: 100000,
          close: 100000,
        },
      ],
      asOf,
      10,
    );
  assert.deepEqual(a, b);
});
