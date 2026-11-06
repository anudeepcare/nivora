import test from "node:test";
import assert from "node:assert/strict";
import { evaluateAccumulation } from "../lib/accumulation-evaluation.ts";
import { monthEndSession } from "../lib/calendar.ts";
const bars = Array.from({ length: 60 }, (_, i) => {
  const date = new Date(Date.UTC(2020, i, 1));
  while ([0, 6].includes(date.getUTCDay()))
    date.setUTCDate(date.getUTCDate() + 1);
  const month = date.toISOString().slice(0, 7),
    close = 100;
  return [
    {
      time: date.toISOString().slice(0, 10),
      open: close,
      high: close,
      low: close,
      close,
      volume: 100,
    },
    {
      time: monthEndSession(month),
      open: close,
      high: close,
      low: close,
      close,
      volume: 100,
    },
  ];
}).flat();
const schedule = { p2: 0.5, p3: 1, p4: 2 };
test("explicit zone research schedule leaves P1 cash unspent and preserves equal deposits", () => {
  const result = evaluateAccumulation(
    bars,
    "2025-01-02T22:00:00Z",
    10,
    "us-equity",
    "monthly-v5",
    schedule,
  );
  assert.equal(result.available, true);
  assert.equal(result.adaptive.units, 0);
  assert.equal(result.adaptive.cash, result.adaptive.contributed);
  assert.equal(result.fixed.contributed, result.adaptive.contributed);
  assert.match(result.version, /zone-research/);
  assert.ok(result.limitations.some((x) => /business checks.*not/i.test(x)));
});
test("research budgets reject invalid, decreasing or borrowed-cash assumptions", () => {
  for (const invalid of [
    { p2: -1, p3: 1, p4: 2 },
    { p2: 2, p3: 1, p4: 3 },
    { p2: 1, p3: NaN, p4: 3 },
    { p2: 1, p3: 2, p4: Infinity },
  ])
    assert.throws(() =>
      evaluateAccumulation(
        bars,
        "2025-01-02T22:00:00Z",
        10,
        "us-equity",
        "monthly-v5",
        invalid,
      ),
    );
});
