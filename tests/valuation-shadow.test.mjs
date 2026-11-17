import test from "node:test";
import assert from "node:assert/strict";
import { researchToValuationInput } from "../lib/valuation-adapter.ts";
import { compareShadow } from "../lib/valuation-shadow.ts";

test("adapter preserves currency, dates and only supplied point-in-time facts", () => {
  const snapshot = researchToValuationInput({
    symbol: "MSFT",
    asOf: "2026-10-28",
    quote: { price: 500, currency: "USD", observedAt: "2026-10-28T20:00:00Z" },
    financials: { revenue: 1000, revenuePeriodEnd: "2026-09-30", currency: "USD" },
    pace: { confirmed: "P2" },
  });
  assert.equal(snapshot.symbol, "MSFT");
  assert.equal(snapshot.asOf, "2026-10-28");
  assert.equal(snapshot.metadata.paceConfirmed, "P2");
  assert.ok(snapshot.observations.some((row) => row.metric === "price" && row.periodEnd === "2026-10-28"));
  assert.ok(snapshot.observations.some((row) => row.metric === "revenue" && row.periodEnd === "2026-09-30"));
  assert.ok(!snapshot.observations.some((row) => row.metric === "fcf"));
});

test("crypto identity is explicit and is never converted into corporate facts", () => {
  const snapshot = researchToValuationInput({ symbol: "BTC-USD", asOf: "2026-10-28", assetType: "crypto", quote: { price: 100, currency: "USD" }, financials: { revenue: 9_999 } });
  assert.equal(snapshot.metadata.assetType, "crypto");
  assert.equal(snapshot.observations.filter((row) => row.metric === "revenue").length, 0);
});

test("adapter accepts the real Research shape and preserves each fact's own filed date and currency", () => {
  const snapshot = researchToValuationInput({
    company: { symbol: "SAP", assetType: "stock", sector: "software", currency: "EUR" },
    quote: { price: 200, currency: "USD", asOf: "2026-10-28T20:00:00Z" },
    retrievedAt: "2026-10-28T21:00:00Z",
    facts: [
      { id: "r1", metric: "revenue", value: 1000, unit: "EUR", currency: "EUR", end: "2026-09-30", filed: "2026-10-15", scope: "quarterly", basis: "IFRS", accession: "a", form: "10-Q", sourceUrl: "https://sec.gov/a" },
      { id: "r2", metric: "cash", value: 500, unit: "EUR", currency: "EUR", end: "2026-09-30", filed: "2026-10-15", scope: "instant", basis: "IFRS", accession: "b", form: "10-Q", sourceUrl: "https://sec.gov/b" },
    ],
  });
  assert.equal(snapshot.symbol, "SAP");
  assert.equal(snapshot.metadata.assetType, "stock");
  assert.equal(snapshot.observations.find((row) => row.metric === "revenue")?.filedAt, "2026-10-15");
  assert.equal(snapshot.observations.find((row) => row.metric === "revenue")?.currency, "EUR");
  assert.equal(snapshot.observations.find((row) => row.metric === "price")?.currency, "USD");
});

test("shadow comparison records lineage and never changes the existing Pace decision", () => {
  const current = { symbol: "MSFT", status: "Hold", pace: "P2", price: 500 };
  const candidate = { symbol: "MSFT", status: "ok", family: "profitable-growth", traceId: "valuation-abc", cases: { base: { value: 480 } } };
  const record = compareShadow(current, candidate);
  assert.equal(record.symbol, "MSFT");
  assert.equal(record.currentPace, "P2");
  assert.equal(record.currentStatus, "Hold");
  assert.equal(record.candidateTraceId, "valuation-abc");
  assert.ok(record.differences.some((item) => item.field === "status"));
  assert.equal(record.visibleDecision, "Hold");
});

test("adapter rejects malformed symbols and future observations without fabricating evidence", () => {
  assert.throws(() => researchToValuationInput({ symbol: "not valid", asOf: "2026-10-28" }));
  const snapshot = researchToValuationInput({ symbol: "AAPL", asOf: "2026-10-28", quote: { price: 10, observedAt: "2026-10-29T00:00:00Z" } });
  assert.equal(snapshot.observations.length, 0);
});
