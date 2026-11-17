import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { paceLadder } from "../lib/pace-ladder.ts";
import { pacePriceZones } from "../lib/pace-price-zones.ts";

test("monotonic zones give a descending ladder with the current stage at the reference", () => {
  const steps = paceLadder({
    reference: 50,
    ranges: [
      { level: 4, low: 1, high: 20 },
      { level: 3, low: 20, high: 40 },
      { level: 2, low: 40, high: 60 },
      { level: 1, low: 60, high: 90 },
      { level: 0, low: 90, high: 500 },
    ],
  });
  assert.deepEqual(steps.map((x) => x.price), [90, 60, 50, 40, 20]);
  assert.deepEqual(steps.map((x) => x.relation), ["at-or-above", "at-or-above", "now", "at-or-below", "at-or-below"]);
  assert.equal(steps.filter((x) => x.current).length, 1);
});

test("a deeper stage prefers its nearest band below the reference even when a disconnected band sits closer above", () => {
  // Mirrors the live case: P3 now at 21.41, a small P4 island just above, the main P4 zone below.
  const steps = paceLadder({
    reference: 21.41,
    ranges: [
      { level: 4, low: 2, high: 20.34 },
      { level: 3, low: 20.34, high: 22.5 },
      { level: 4, low: 22.5, high: 24.96 },
      { level: 3, low: 24.96, high: 30 },
      { level: 2, low: 30, high: 38.36 },
      { level: 1, low: 38.36, high: 127.02 },
      { level: 0, low: 127.02, high: 400 },
    ],
  });
  const p4 = steps[4];
  assert.equal(p4.price, 20.34);
  assert.equal(p4.relation, "at-or-below");
  assert.equal(p4.bands, 2);
  assert.equal(steps[3].current, true);
  assert.equal(steps[3].price, 21.41);
  assert.deepEqual([steps[2].price, steps[1].price, steps[0].price], [30, 38.36, 127.02]);
  // Deeper stages never display above today's price when a lower band exists.
  assert.ok(p4.price < 21.41);
});

test("falls back to the other side only when the preferred side has no band, and never invents a price", () => {
  const steps = paceLadder({
    reference: 10,
    ranges: [
      { level: 2, low: 8, high: 12 },
      { level: 4, low: 15, high: 18 },
      { level: 0, low: 1, high: 3 },
    ],
  });
  assert.deepEqual([steps[4].price, steps[4].relation], [15, "at-or-above"]);
  assert.deepEqual([steps[0].price, steps[0].relation], [3, "at-or-below"]);
  assert.deepEqual([steps[1].price, steps[1].relation, steps[1].bands], [null, null, 0]);
  assert.deepEqual([steps[3].price, steps[3].relation], [null, null]);
});

test("real classifier scans produce a ladder whose prices lie on scanned band edges", async () => {
  const fixtures = JSON.parse(fs.readFileSync("tests/fixtures/pace-v6-bars.json", "utf8"));
  for (const { symbol, bars } of fixtures) {
    const zones = await pacePriceZones(bars, "2026-11-06T22:00:00Z", "forming");
    const steps = paceLadder(zones);
    assert.equal(steps.filter((x) => x.current).length, 1, symbol);
    for (const s of steps) {
      if (s.price == null || s.current) continue;
      const edges = zones.ranges.filter((x) => x.level === s.level).flatMap((x) => [x.low, x.high]);
      assert.ok(edges.includes(s.price), `${symbol} P${s.level}`);
      assert.ok(s.relation === "at-or-below" ? s.price <= zones.reference : s.price >= zones.reference, `${symbol} P${s.level}`);
    }
  }
});
