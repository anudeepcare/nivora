import test from "node:test";
import assert from "node:assert/strict";
const module = await import("../scripts/audit-market-coverage.mjs").catch(
  () => null,
);
const listings = Array.from({ length: 17 }, (_, i) => ({
  symbol: "T" + i,
  name: "Test " + i,
  exchange: "NYSE",
  currency: "USD",
  assetType: "stock",
}));
const directory = {
  listings,
  directories: [
    {
      provider: "eodhd",
      market: "US",
      status: "available",
      total: 17,
      eligible: 17,
    },
  ],
  complete: true,
  retrievedAt: "2026-10-27T00:00:00Z",
};
const features = ["quote", "history", "profile", "fundamentals", "filings"];
const result = (symbol) => ({
  company: { symbol, assetType: "stock" },
  coverage: Object.fromEntries(
    features.map((f) => [
      f,
      { status: f === "fundamentals" ? "unavailable" : "available" },
    ]),
  ),
  evidence: {},
  history: [],
  issues: [],
});
test("coverage audit visits the entire enabled universe and totals each feature without a symbol cutoff", async () => {
  assert.equal(typeof module?.auditUniverse, "function");
  const report = await module.auditUniverse({
    directory,
    research: async (symbol) => result(symbol),
  });
  assert.equal(report.universeSize, 17);
  assert.equal(report.tested, 17);
  assert.equal(report.records.length, 17);
  assert.equal(report.features.fundamentals.unavailable, 17);
  assert.equal(report.features.quote.available, 17);
  assert.equal(report.records.at(-1).symbol, "T16");
});
test("budget interruption distinguishes untested rows from provider coverage failures and resume completes them", async () => {
  assert.equal(typeof module?.auditUniverse, "function");
  let n = 0;
  const partial = await module.auditUniverse({
    directory,
    research: async (symbol) => {
      n++;
      return result(symbol);
    },
    shouldStop: () => n >= 2,
  });
  assert.equal(partial.tested, 2);
  assert.equal(partial.features.quote["not-tested"], 15);
  const complete = await module.auditUniverse(
    { directory, research: async (symbol) => result(symbol) },
    partial,
  );
  assert.equal(complete.tested, 17);
  assert.equal(complete.features.quote["not-tested"], 0);
  assert.equal(complete.records.length, 17);
});
test("a failed directory leaves the universe unknown instead of claiming zero global instruments", async () => {
  assert.equal(typeof module?.auditUniverse, "function");
  const report = await module.auditUniverse({
    directory: { ...directory, listings: [], complete: false, directories: [] },
  });
  assert.equal(report.universeSize, null);
  assert.equal(report.discoveryComplete, false);
  assert.equal(report.knownListings, 0);
});
test("full feature audit recovers independently queried filings without dropping successful market datasets", async () => {
  assert.equal(typeof module?.auditUniverse, "function");
  const report = await module.auditUniverse({
    directory: { ...directory, listings: listings.slice(0, 1) },
    research: async (symbol) => ({
      ...result(symbol),
      coverage: {
        ...result(symbol).coverage,
        filings: { status: "unavailable" },
      },
    }),
    filings: async () => ({ filings: [{ date: "2026-08-01" }], issues: [] }),
  });
  assert.equal(report.features.filings.available, 1);
  assert.equal(report.features.quote.available, 1);
});
test("existing provider-budget denials stop the audit and stay untested instead of becoming coverage failures", async () => {
  assert.equal(typeof module?.auditUniverse, "function");
  const report = await module.auditUniverse({
    directory,
    research: async (symbol) => ({
      ...result(symbol),
      coverage: { quote: { status: "unavailable" } },
      issues: [
        "Quote: Market-data allowance is reserved for this minute. Try again shortly.",
      ],
    }),
  });
  assert.equal(report.tested, 1);
  assert.equal(report.features.quote["not-tested"], 17);
  assert.equal(report.completed, 0);
});
