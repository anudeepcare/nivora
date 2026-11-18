import test from "node:test";
import assert from "node:assert/strict";
import * as b from "../lib/bulk-radar.ts";
const raw = [
  { date: "2026-11-16", open: 100, high: 102, low: 98, close: 100, volume: 10 },
  { date: "2026-11-17", open: 50, high: 51, low: 49, close: 50, volume: 20 },
];
test("raw history is preserved and splits affect only prior bars without volume adjustment", () => {
  const state = b.bootstrapRadar(
    "TEST",
    raw,
    [{ date: "2026-11-17", split: "2/1" }],
    "2026-11-18T00:00:00Z",
  );
  assert.equal(state.raw[0].close, 100);
  const bars = b.radarCandles(state);
  assert.equal(bars[0].close, 50);
  assert.equal(bars[1].close, 50);
  assert.equal(bars[0].volume, 10);
});
test("malformed, duplicate, future, wrong-unit and conflicting actions fail closed", () => {
  for (const actions of [
    [{ date: "2026-11-17", split: "bad" }],
    [
      { date: "2026-11-17", split: "2/1" },
      { date: "2026-11-17", split: "3/1" },
    ],
    [{ date: "2026-11-20", split: "2/1" }],
  ])
    assert.throws(() =>
      b.bootstrapRadar("TEST", raw, actions, "2026-11-18T00:00:00Z"),
    );
  assert.throws(() =>
    b.bootstrapRadar("TEST", [...raw, raw[0]], [], "2026-11-18T00:00:00Z"),
  );
});
test("bulk snapshot validates exact requested date and canonical identities without adjusted-close substitution", () => {
  const row = {
    code: "TEST",
    exchange_short_name: "US",
    ...raw[1],
    adjusted_close: 1,
  };
  const out = b.bulkPriceDay([row], "2026-11-17");
  assert.equal(out.status, "ready");
  assert.equal(out.rows[0][5], 50);
  assert.equal(
    b.bulkPriceDay([{ ...row, date: "2026-11-16" }], "2026-11-17").status,
    "unavailable",
  );
  assert.throws(() => b.bulkPriceDay([row, row], "2026-11-17"));
});
import { eodCallCost } from "../lib/market-policy.ts";
test("bulk daily cost is100 per dataset plus every named ticker, never generic10", () => {
  assert.equal(eodCallCost("eod-bulk-last-day/US", { type: "eod" }), 100);
  assert.equal(
    eodCallCost("eod-bulk-last-day/US", { type: "splits", symbols: "A,B" }),
    102,
  );
  assert.equal(
    eodCallCost("eod-bulk-last-day/US", {
      symbols: Array.from({ length: 500 }, (_, i) => `X${i}`).join(","),
    }),
    600,
  );
});
