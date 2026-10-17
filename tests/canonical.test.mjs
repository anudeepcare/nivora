import test from "node:test";
import assert from "node:assert/strict";
import { canonical } from "../lib/canonical.ts";
const r = {
  company: {
    symbol: "MSFT",
    assetType: "stock",
    name: "Microsoft",
    currency: "USD",
    exchange: "NASDAQ",
  },
  quote: {
    price: 100,
    changePct: 0,
    currency: "USD",
    asOf: "2026-10-16T20:00:00Z",
    session: "closed",
    source: "test",
    stale: false,
  },
  history: [],
  facts: [],
  filings: [],
  retrievedAt: "2026-10-17T00:00:00Z",
  issues: [],
};
test("price-only revisions have distinct snapshot IDs but stable evidence identity", () => {
  const a = canonical(r),
    b = canonical({ ...r, quote: { ...r.quote, price: 110 } });
  assert.notEqual(a.id, b.id);
  assert.equal(a.evidenceId, b.evidenceId);
});
test("a corrected historical bar changes evidence identity even when the latest close is unchanged", () => {
  const bars = [
    {
      time: "2026-10-14",
      open: 100,
      high: 100,
      low: 100,
      close: 100,
      volume: 1,
    },
    {
      time: "2026-10-15",
      open: 100,
      high: 100,
      low: 100,
      close: 100,
      volume: 1,
    },
  ];
  assert.notEqual(
    canonical({ ...r, history: bars }).id,
    canonical({ ...r, history: [{ ...bars[0], close: 90 }, bars[1]] }).id,
  );
});
test("crypto snapshots do not demand company accounts or earnings", () => {
  const c = canonical({
    ...r,
    company: { ...r.company, symbol: "BTC/USD", assetType: "crypto" },
  });
  assert.equal(c.newCapital, "Price history needed");
  assert.equal(c.valuation, "Corporate valuation does not apply");
  assert.ok(!c.risks.some((x) => x.includes("per-share")));
  assert.ok(!c.horizons.swing.includes("earnings"));
});
