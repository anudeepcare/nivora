import test from "node:test";
import assert from "node:assert/strict";
import { instrumentReading } from "../lib/pace-instrument.ts";
test("missing confirmed history never promotes forming into confirmed", () => {
  const r = instrumentReading([
    { key: "forming", level: 4, date: "2026-11-04" },
  ]);
  assert.equal(r.level, null);
  assert.equal(r.status, "History pending");
});
test("completed and developing levels retain their period identity", () => {
  const rows = [
    { key: "forming", level: 4, date: "2026-11-04" },
    { key: "confirmed", level: 1, date: "2026-10-30" },
  ];
  assert.equal(instrumentReading(rows).level, 1);
  assert.equal(instrumentReading(rows, "forming").level, 4);
  assert.equal(instrumentReading(rows, "forming").status, "Forming");
});
test("invalid levels never select a stage", () => {
  for (const level of [-1, 5, 2.4, NaN, undefined])
    assert.equal(instrumentReading([{ key: "confirmed", level }]).level, null);
});

test("unavailable timing stays separate from business action and inspection opens a dialog", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync("components/PaceInstrument.tsx", "utf8");
  assert.match(source, /Pace timing unavailable/);
  assert.match(
    source,
    /business\s+decision above is separate from Pace timing/,
  );
  assert.match(source, /dialog\?\.showModal\(\)/);
  assert.match(
    source,
    /Exploring a stage does not change the current decision/,
  );
  assert.doesNotMatch(source, /const exploring = publicGuide \|\| inspect/);
});
