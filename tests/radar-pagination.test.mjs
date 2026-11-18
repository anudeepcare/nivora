import test from "node:test";
import assert from "node:assert/strict";
import { readRadarPages } from "../lib/radar-pagination.ts";
test("radar reads beyond500 and detects1001 rather than claiming truncated completeness", async () => {
  for (const size of [0, 499, 500, 501, 1000, 1001, 1400]) {
    const calls = [];
    const source = Array.from({ length: size }, (_, i) => i);
    const result = await readRadarPages(async (from, to) => {
      calls.push([from, to]);
      return source.slice(from, to + 1);
    });
    assert.deepEqual(result, source.slice(0, 1001));
    assert.ok(calls.length <= 4);
    assert.ok(calls.every(([a, b]) => b - a < 500));
  }
});
test("radar page failure never returns earlier partial pages as complete", async () => {
  await assert.rejects(
    readRadarPages(async (from) => {
      if (from) throw Error("Unavailable");
      return Array(500).fill("A");
    }),
    /Unavailable/,
  );
});

test("cached hydration keeps existing30/min route limit and2.1second client pacing", async () => {
  const fs = await import("node:fs");
  assert.match(
    fs.readFileSync("app/api/daily-radar/route.ts", "utf8"),
    /limit\(`daily-radar:\$\{user.id\}`, 30\)/,
  );
  assert.match(
    fs.readFileSync("components/DailyMarketRadar.tsx", "utf8"),
    /run\(false, result.nextCursor!\), 2100/,
  );
});

test("lower server row caps cannot silently truncate account coverage", async () => {
  for (const cap of [50, 100, 250])
    for (const size of [75, 501, 1000, 1001]) {
      const source = Array.from({ length: size }, (_, i) => i);
      let calls = 0;
      const result = await readRadarPages(async (from, to) => {
        calls++;
        return source.slice(from, Math.min(to + 1, from + cap));
      });
      assert.deepEqual(result, source.slice(0, 1001));
      assert.ok(calls <= 32);
    }
});
test("pathologically low database cap fails closed rather than excessive reads or partial completeness", async () => {
  let calls = 0;
  await assert.rejects(
    readRadarPages(async (from) => {
      calls++;
      return [from];
    }),
    /page limit/i,
  );
  assert.equal(calls, 32);
});
