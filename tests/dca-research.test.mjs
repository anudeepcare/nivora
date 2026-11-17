import test from "node:test";
import assert from "node:assert/strict";
import { monthlyReadings } from "../lib/dca-research.ts";
import { monthEndSession } from "../lib/calendar.ts";
const bars = Array.from({ length: 28 }, (_, i) => {
  const month = new Date(Date.UTC(2023, i, 1)).toISOString().slice(0, 7);
  const close = i === 26 ? 50 : 100;
  return {
    time: monthEndSession(month),
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 100,
  };
});
test("monthly readings never use future bars or replace a confirmed month with a later observation", () => {
  const a = monthlyReadings(bars, "2025-04-15");
  const b = monthlyReadings(
    [
      ...bars,
      { time: "2027-01-31", open: 1, high: 2, low: 1, close: 1, volume: 1 },
    ],
    "2025-04-15",
  );
  assert.deepEqual(a, b);
  assert(a.every((x) => x.month < "2025-04"));
  assert(a.every((x) => x.strongest >= x.confirmed));
});
