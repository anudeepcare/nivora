import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  cleanEstimateSnapshot,
  estimateSnapshot,
  compareEstimateSnapshots,
} from "../lib/estimate-revisions.ts";
import { cleanDocument } from "../lib/documents.ts";
const baseline = () => ({
  version: 1,
  symbol: "APP",
  savedAt: "2026-11-01T12:00:00Z",
  observedAt: "2026-11-01",
  source: "Provider",
  rows: [
    {
      period: "FY2026",
      date: "2026-12-31",
      currency: "USD",
      eps: -2,
      revenue: 100,
      epsBasis: "GAAP diluted",
      shareBasis: "post-split shares",
    },
  ],
});
test("owner view document retains a bounded estimate snapshot without altering other views", () => {
  const b = baseline();
  assert.deepEqual(
    cleanDocument("view", { estimateSnapshot: b }).estimateSnapshot,
    b,
  );
  assert.equal(
    cleanDocument("view", { name: "saved", symbols: ["APP"] }).name,
    "saved",
  );
  assert.equal(
    cleanDocument("comparison", { estimateSnapshot: b }).estimateSnapshot,
    undefined,
  );
  for (const mutate of [
    (x) => (x.rows = Array(7).fill(x.rows[0])),
    (x) => (x.rows[0].eps = Infinity),
    (x) => (x.rows[0].revenue = -1),
    (x) => (x.rows[0].date = "2026-02-30"),
    (x) => (x.rows[0].currency = "usd"),
    (x) => x.rows.push({ ...x.rows[0] }),
    (x) => (x.rows[0].period = "FY2030"),
    (x) => (x.savedAt = "invalid"),
    (x) => (x.savedAt = "2099-01-01"),
    (x) => (x.observedAt = "2027-01-01"),
  ]) {
    const x = baseline();
    mutate(x);
    assert.throws(() => cleanDocument("view", { estimateSnapshot: x }));
  }
});
test("matching snapshots compare revenue and label loss-to-profit EPS without misleading percent", () => {
  const before = baseline(),
    now = baseline();
  now.observedAt = "2026-11-04";
  now.rows[0].eps = 2;
  now.rows[0].revenue = 120;
  const [c] = compareEstimateSnapshots(now, before);
  assert.equal(c.epsChange, "Loss to profit");
  assert.equal(c.revenueChange, "+20.0%");
});
test("EPS differences require a known common basis while revenue remains usable", () => {
  const before = baseline(),
    now = baseline();
  before.rows[0].epsBasis = null;
  now.rows[0].epsBasis = null;
  const [c] = compareEstimateSnapshots(now, before);
  assert.equal(c.epsChange, null);
  assert.match(c.epsReason, /basis/);
  assert.equal(c.revenueChange, "0.0%");
});
test("currency, period, date, source, chronology and share-basis mismatches prevent revisions", () => {
  for (const mutate of [
    (x) => (x.rows[0].currency = "EUR"),
    (x) => (x.rows[0].period = "FY2027"),
    (x) => (x.rows[0].date = "2026-12-30"),
    (x) => (x.source = "Other"),
    (x) => (x.source = null),
    (x) => (x.observedAt = "2026-10-31"),
  ]) {
    const now = baseline();
    mutate(now);
    const [c] = compareEstimateSnapshots(now, baseline());
    assert.equal(c.epsChange, null);
    assert.equal(c.revenueChange, null);
  }
  const now = baseline();
  now.rows[0].shareBasis = "post-split";
  assert.equal(compareEstimateSnapshots(now, baseline())[0].epsChange, null);
  now.symbol = "MSFT";
  assert.deepEqual(compareEstimateSnapshots(now, baseline()), []);
});
test("snapshot cleaning strips unrelated fields", () => {
  const b = baseline();
  b.token = "secret";
  b.rows[0].extra = "discard";
  const clean = cleanEstimateSnapshot(b);
  assert.equal(clean.token, undefined);
  assert.equal(clean.rows[0].extra, undefined);
});
test("UI explicitly saves, guards failed loads and demo, and keys state by owner and symbol", () => {
  const ui = fs.readFileSync(
    new URL("../components/EstimateRevisions.tsx", import.meta.url),
    "utf8",
  );
  assert.match(ui, /Save baseline/);
  assert.match(ui, /Replace baseline/);
  assert.match(ui, /owner.*research.company.symbol/s);
  assert.match(ui, /status !== "ready"/);
  assert.match(ui, /if \(demo\)/);
  assert.match(ui, /controller.signal.aborted/);
  assert.match(ui, /result.documents.length >= 200/);
});

test("displayable forecast outside the saved observation window is unavailable without throwing", () => {
  const r = {
    company: { symbol: "APP", assetType: "stock", currency: "USD" },
    quote: { price: 100, currency: "USD", asOf: "2026-11-04", stale: false },
    retrievedAt: "2026-11-05",
    history: [],
    facts: [],
    issues: [],
    evidence: {
      updatedAt: "2026-09-05",
      reportingCurrency: "USD",
      estimates: [
        {
          date: "2030-10-31",
          period: "FY2030",
          frequency: "Annual",
          currency: "USD",
          eps: 5,
          epsLow: null,
          epsHigh: null,
          revenue: 1e9,
          revenueLow: null,
          revenueHigh: null,
          analysts: 12,
        },
      ],
    },
  };
  assert.equal(estimateSnapshot(r, "2026-11-05T12:00:00Z"), null);
  r.evidence.estimates[0].date = "2027-10-31";
  r.evidence.estimates[0].period = "FY2027";
  assert.equal(estimateSnapshot(r, "2026-11-05T12:00:00Z").rows.length, 1);
});

test("unknown share basis with known accounting basis withholds EPS changes", () => {
  const before = baseline(),
    current = baseline();
  before.rows[0].shareBasis = null;
  current.rows[0].shareBasis = null;
  current.rows[0].eps = -1;
  const [result] = compareEstimateSnapshots(current, before);
  assert.equal(result.epsChange, null);
  assert.match(result.epsReason, /share basis/);
  assert.equal(result.revenueChange, "0.0%");
});
