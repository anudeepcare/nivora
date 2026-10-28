import test from "node:test";
import assert from "node:assert/strict";
import { homeBrief } from "../lib/home-brief.ts";
const input = {
  today: "2026-10-27",
  symbols: ["SOFI", "NOW", "META"],
  names: { SOFI: "SoFi" },
  headlines: [],
  exposure: new Map(),
  eventsReady: true,
  newsReady: true,
};
test("reported SOFI leaves upcoming hero and moves to recent results, including actual zero", () => {
  for (const actual of [0, -0.1, 0.2]) {
    const b = homeBrief({
      ...input,
      events: [
        { symbol: "SOFI", date: "2026-10-27", kind: "Earnings", actual },
        { symbol: "NOW", date: "2026-10-27", kind: "Earnings" },
        { symbol: "META", date: "2026-10-28", kind: "Earnings" },
      ],
    });
    assert.deepEqual(
      b.reported.map((e) => e.symbol),
      ["SOFI"],
    );
    assert.deepEqual(
      b.checkpoints.map((e) => e.symbol),
      ["NOW", "META"],
    );
    assert.deepEqual(
      b.earnings.map((e) => e.symbol),
      ["NOW"],
    );
    assert.equal(b.symbol, "NOW");
    assert.match(b.status, /2 dated/);
  }
});
test("an all-reported day does not remain an upcoming earnings hero", () => {
  const b = homeBrief({
    ...input,
    events: [
      { symbol: "SOFI", date: "2026-10-27", kind: "Earnings", actual: 0.2 },
    ],
  });
  assert.equal(b.reported.length, 1);
  assert.equal(b.checkpoints.length, 0);
  assert.notEqual(b.kind, "earnings");
});
test("duplicate calendar entries cannot erase reported results and old results expire", () => {
  const b = homeBrief({
    ...input,
    events: [
      { symbol: "SOFI", date: "2026-10-27", kind: "Earnings" },
      { symbol: "SOFI", date: "2026-10-27", kind: "Earnings", actual: 0 },
      { symbol: "NOW", date: "2026-10-01", kind: "Earnings", actual: 1 },
    ],
  });
  assert.equal(b.reported.length, 1);
  assert.equal(b.reported[0].actual, 0);
  assert.equal(b.checkpoints.length, 0);
});
