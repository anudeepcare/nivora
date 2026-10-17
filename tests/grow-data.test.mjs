import test from "node:test";
import assert from "node:assert/strict";
import { normalizeGrow, websiteUrl, growDatasets } from "../lib/grow-data.ts";
test("Grow company data retains zero, currencies and actual/estimate separation", () => {
  const d = normalizeGrow(
    "APP",
    "earnings",
    {
      meta: { symbol: "APP", currency: "USD" },
      earnings: [
        { date: "2026-02-01", eps_actual: 0, eps_estimate: -1 },
        { date: "2027-01-01", eps_actual: 12, eps_estimate: 4 },
        { date: "bad", eps_actual: 12 },
      ],
    },
    "2026-10-17",
  );
  assert.equal(d.currency, "USD");
  assert.equal(d.earnings.length, 2);
  assert.equal(d.earnings[0].actual, null);
  assert.equal(d.earnings[1].actual, 0);
  assert.equal(d.earnings[1].surprise, 100);
  assert.throws(() =>
    normalizeGrow("APP", "earnings", { meta: { symbol: "ETH" } }, "2026-10-17"),
  );
  assert.equal(websiteUrl("javascript:alert(1)"), null);
  assert.equal(growDatasets.earnings.credits, 20);
  assert.equal(growDatasets.profile.credits, 10);
});
test("a stock split stays an event and does not rewrite portfolio quantities", () => {
  const d = normalizeGrow(
    "APP",
    "splits",
    {
      meta: { symbol: "APP", currency: "USD" },
      splits: [
        { date: "2026-01-01", description: "4-for-1 split", ratio: 0.25 },
      ],
    },
    "2026-10-17",
  );
  assert.deepEqual(d.splits, [
    { date: "2026-01-01", description: "4-for-1 split" },
  ]);
});
