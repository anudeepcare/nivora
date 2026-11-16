import test from "node:test";
import assert from "node:assert/strict";
import {
  paceChartBands,
  currentPaceChartPeriod,
} from "../lib/pace-chart-bands.ts";
const zones = {
  date: "2026-11-13",
  reference: 100,
  from: 10,
  to: 500,
  policy: "monthly-v7",
  ranges: [
    { level: 2, low: 80, high: 90 },
    { level: 3, low: 90, high: 110 },
    { level: 2, low: 110, high: 120 },
  ],
};
test("chart preserves disconnected conditional zones without inventing monotone thresholds", () => {
  assert.deepEqual(paceChartBands(zones, "2026-11-15"), zones.ranges);
});
test("chart refuses missing, future, invalid or stale conditional bands", () => {
  for (const day of ["bad", "2026-11-12", "2026-11-21"])
    assert.deepEqual(paceChartBands(zones, day), []);
  assert.deepEqual(paceChartBands(null, "2026-11-15"), []);
  assert.deepEqual(
    paceChartBands(
      {
        ...zones,
        ranges: [
          { level: 9, low: 1, high: 2 },
          { level: 1, low: NaN, high: 2 },
          { level: 1, low: 5, high: 2 },
        ],
      },
      "2026-11-15",
    ),
    [],
  );
});

test("chart uses same fresh forming or confirmed period as current Pace", () => {
  const now = Date.parse("2026-11-02");
  assert.equal(
    currentPaceChartPeriod(
      { date: "2026-10-30", multiplier: 2, forming: null },
      now,
    ),
    "confirmed",
  );
  assert.equal(
    currentPaceChartPeriod(
      {
        date: "2026-10-30",
        multiplier: 2,
        forming: { date: "2026-11-01", multiplier: 3 },
      },
      now,
    ),
    "forming",
  );
  assert.equal(
    currentPaceChartPeriod({ date: "2026-10-20", multiplier: 2 }, now),
    null,
  );
  assert.deepEqual(paceChartBands(zones, "2026-11-18"), []);
});

test("clock refresh preserves fresh unchanged bands and still expires stale data", () => {
  const initial = "2026-11-15T17:46:53Z";
  const later = "2026-11-15T17:48:33Z";
  assert.deepEqual(
    paceChartBands(zones, initial),
    paceChartBands(zones, later),
  );
  assert.deepEqual(paceChartBands(zones, "2026-11-18T17:48:33Z"), []);
});

test("zone scans are keyed to market input not wall-clock ticks", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync("components/PriceStudyChart.tsx", "utf8");
  assert.match(
    source,
    /observedAt,[\s\S]*?market,[\s\S]*?selectedPeriod,[\s\S]*?scanDay,[\s\S]*?demoAsOf/,
  );
  assert.doesNotMatch(source, /zoneResult.asOf === asOf/);
  assert.match(source, /zoneResult.period === selectedPeriod/);
  assert.match(source, /zoneResult.observedAt === observedAt/);
  assert.match(source, /zoneResult.market === market/);
});

test("chart uses the same present observation cutoff as the decision rather than historical quote time", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync("components/PriceStudyChart.tsx", "utf8");
  assert.match(source, /demoAsOf \?\? new Date\(\).toISOString\(\)/);
  assert.match(source, /zoneResult.scanDay === scanDay/);
});
