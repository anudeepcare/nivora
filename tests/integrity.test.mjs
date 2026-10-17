import test from "node:test";
import assert from "node:assert/strict";
import { normalizeQuote, normalizeBars } from "../lib/market.ts";
import { evidenceFor, validateReport } from "../lib/report.ts";
import { portfolioTotals } from "../lib/engine.ts";
const now = Date.parse("2026-10-17T12:00:00Z");
test("quote provenance rejects missing currency, future timestamps and stale crypto", () => {
  const base = {
    close: "100",
    currency: "USD",
    timestamp: (now - 60000) / 1000,
    is_market_open: false,
    percent_change: "0",
  };
  assert.equal(normalizeQuote(base, "MSFT", now).stale, false);
  assert.equal(
    normalizeQuote({ ...base, timestamp: (now + 3600000) / 1000 }, "MSFT", now)
      .stale,
    true,
  );
  assert.equal(
    normalizeQuote({ ...base, currency: undefined }, "MSFT", now).currency,
    "",
  );
  assert.equal(
    normalizeQuote(
      { ...base, timestamp: (now - 3600000) / 1000 },
      "BTC/USD",
      now,
    ).stale,
    true,
  );
  assert.equal(
    normalizeQuote(
      { ...base, is_market_open: "false", timestamp: (now - 86400000) / 1000 },
      "MSFT",
      now,
    ).stale,
    false,
  );
});
test("malformed bars are discarded; repeated timestamps deduplicate and history sorts", () => {
  const row = (datetime, close = "10") => ({
    datetime,
    open: "10",
    high: "11",
    low: "9",
    close,
    volume: "123",
  });
  const bars = normalizeBars(
    [
      row("2026-10-16 15:30:00"),
      row("bad"),
      row("2026-10-16 15:25:00"),
      row("2026-10-16 15:30:00", "10.5"),
      row("2026-10-16 15:20:00", "50"),
    ],
    true,
  );
  assert.equal(bars.length, 2);
  assert.equal(bars[1].close, 10.5);
  assert.match(bars[0].time, /15:25:00.000Z$/);
  assert.deepEqual(normalizeBars([row("2026-02-30")], false), []);
});
test("USD portfolio cannot silently add foreign currency or unknown-currency prices", () => {
  const p = {
    id: "a",
    symbol: "SAP",
    quantity: 2,
    cost: 10,
    assetType: "stock",
  };
  for (const currency of ["EUR", ""]) {
    const t = portfolioTotals([p], {
      SAP: { price: 20, currency, stale: false },
    });
    assert.equal(t.knownValue, 0);
    assert.equal(t.pnl, null);
  }
});
const evidence = [
  {
    id: "E1",
    label: "Revenue",
    url: "https://www.sec.gov/Archives/a",
    value: 100,
    unit: "USD",
    period: "2025-12-31",
    filed: "2026-02-01",
  },
];
const claim = {
  text: "Revenue alone does not establish durable competitive advantage.",
  evidenceIds: ["E1"],
};
const report = {
  summary: claim,
  strengths: [claim],
  risks: [claim],
  watch: [claim],
};
test("AI report needs supplied citations for every claim, bounded text and valid structure", () => {
  assert.deepEqual(validateReport(report, evidence), report);
  for (const bad of [
    { ...report, summary: { ...claim, evidenceIds: ["E999"] } },
    { ...report, risks: [{ ...claim, evidenceIds: [] }] },
    { ...report, summary: { ...claim, text: "Guaranteed 50% upside." } },
    { ...report, watch: null },
    { ...report, summary: { ...claim, text: "x".repeat(1600) } },
  ])
    assert.throws(() => validateReport(bad, evidence));
});
test("AI evidence excludes future filings and non-SEC source injection", () => {
  const f = {
    id: "a",
    metric: "revenue",
    value: 100,
    unit: "USD",
    end: "2025-12-31",
    filed: "2026-02-01",
    sourceUrl: "https://www.sec.gov/Archives/a",
    scope: "annual",
  };
  const e = evidenceFor({
    retrievedAt: "2026-10-17",
    facts: [
      f,
      { ...f, filed: "2027-01-01" },
      { ...f, sourceUrl: "https://evil.example/a" },
    ],
  });
  assert.equal(e.length, 1);
  assert.equal(e[0].id, "E1");
});

test("unknown quote currency formats without a crash or a dollar assumption", async () => {
  const { amount } = await import("../lib/format.ts");
  assert.equal(amount(123, ""), "123.00 · currency unknown");
});
test("existing non-USD cost basis cannot become a USD unrealized return", () => {
  const result = portfolioTotals(
    [
      {
        id: "x",
        symbol: "ABC",
        assetType: "stock",
        quantity: 2,
        cost: 10,
        currency: "EUR",
      },
    ],
    { ABC: { price: 20, currency: "USD", stale: false } },
  );
  assert.equal(result.pnl, null);
  assert.equal(result.knownValue, 40);
  assert.equal(result.cost, null);
});
test("watchlist adapter deduplicates a ticker saved in multiple lists", async () => {
  const { normalizeWatchlist } = await import("../lib/workspace.ts");
  assert.equal(
    normalizeWatchlist([
      { symbol: "MSFT", created_at: "2026-01-01" },
      { symbol: "MSFT", created_at: "2026-02-01" },
    ]).length,
    1,
  );
});

test("global search cannot resolve a same-named foreign listing as a US company", async () => {
  const { supportedListing } = await import("../lib/market.ts");
  assert.equal(
    supportedListing({
      exchange: "NASDAQ",
      currency: "USD",
      country: "United States",
    }),
    true,
  );
  assert.equal(
    supportedListing({
      exchange: "LSE",
      currency: "GBP",
      country: "United Kingdom",
    }),
    false,
  );
  assert.equal(
    supportedListing({
      exchange: "XETRA",
      currency: "USD",
      country: "Germany",
    }),
    false,
  );
});

test("crypto quote uses explicit USD pair when provider omits currency", () => {
  const q = normalizeQuote(
    {
      symbol: "BTC/USD",
      close: "50000",
      timestamp: (now - 60000) / 1000,
      is_market_open: true,
    },
    "BTC/USD",
    now,
  );
  assert.equal(q.currency, "USD");
  assert.equal(q.stale, false);
});
