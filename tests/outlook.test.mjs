import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as outlook from "../lib/outlook.ts";
const load = () => outlook;
function research() {
  return {
    company: { symbol: "CRM", assetType: "stock", currency: "USD" },
    facts: [],
    quote: {
      price: 100,
      currency: "USD",
      stale: false,
      asOf: "2026-10-16T20:00:00Z",
    },
    retrievedAt: "2026-10-17T12:00:00Z",
    evidence: {
      updatedAt: "2026-10-16",
      reportingCurrency: "USD",
      profile: { sector: "Technology", industry: "Software" },
      multiples: { ForwardPE: 20 },
      estimates: [
        {
          date: "2029-10-17",
          period: "FY2029",
          frequency: "annual",
          currency: "USD",
          eps: 8,
          epsLow: 6,
          epsHigh: 10,
          analysts: 15,
        },
        {
          date: "2027-05-31",
          period: "FY2027",
          frequency: "annual",
          currency: "USD",
          eps: 5,
          epsLow: 4,
          epsHigh: 6,
          analysts: 12,
        },
      ],
    },
  };
}

test("a consensus fallback never revives an old target and always carries its observation date", () => {
  const { consensusOutlook } = load();
  assert.equal(typeof consensusOutlook, "function");
  const input = research();
  input.evidence.consensus = { target: 150 };
  assert.equal(consensusOutlook(input).asOf, "2026-10-16");
  input.evidence.updatedAt = "2023-01-01";
  assert.equal(consensusOutlook(input), null);
  input.evidence.updatedAt = "2026-10-16";
  input.quote.stale = true;
  assert.equal(consensusOutlook(input).target, 150);
});
test("outlook prices use actual forecast EPS, disclosed multiple sensitivity, and a common horizon", () => {
  const { researchOutlook } = load();
  assert.equal(typeof researchOutlook, "function");
  const r = researchOutlook(research());
  assert.equal(r.available, true);
  assert.equal(r.cases[0].target, 96);
  assert.equal(r.cases[1].target, 160);
  assert.equal(r.cases[2].target, 240);
  assert(Math.abs(r.cases[1].change - 60) < 1e-10);
  assert(Math.abs((1 + r.cases[1].annual / 100) ** r.years - 1.6) < 1e-10);
  assert.equal(r.period, "FY2029");
  assert.equal(r.cases[0].multiple, 16);
});
test("a missing EPS range cannot become fabricated bear and bull targets", () => {
  const { researchOutlook } = load();
  assert.equal(typeof researchOutlook, "function");
  const input = research();
  input.evidence.estimates[0].epsLow = null;
  const r = researchOutlook(input);
  assert.equal(r.available, false);
  assert.match(r.reason, /range/i);
});
test("crypto, unreconciled foreign listings and mismatched currency withhold corporate targets", () => {
  const { researchOutlook } = load();
  assert.equal(typeof researchOutlook, "function");
  for (const change of [
    (r) => (r.company.assetType = "crypto"),
    (r) => (r.company.foreignListing = true),
    (r) => (r.evidence.estimates[0].currency = "EUR"),
  ]) {
    const input = research();
    change(input);
    assert.equal(researchOutlook(input).available, false);
  }
});
test("quarterly, dated, nonpositive or inverted forecasts never produce a valid outlook", () => {
  const { researchOutlook } = load();
  assert.equal(typeof researchOutlook, "function");
  for (const change of [
    (r) => (r.evidence.estimates[0].frequency = "quarterly"),
    (r) => (r.evidence.updatedAt = "2023-01-01"),
    (r) => (r.evidence.estimates[0].epsLow = -1),
    (r) => (r.evidence.estimates[0].epsLow = 12),
  ]) {
    const input = research();
    change(input);
    assert.equal(researchOutlook(input).available, false);
  }
});

test("healthcare-plan insurers cannot bypass the same sector gate used by the decision guide", () => {
  const { researchOutlook } = load();
  const input = research();
  input.company.symbol = "OSCR";
  input.evidence.profile = {
    sector: "Healthcare",
    industry: "Healthcare Plans",
  };
  input.evidence.multiples.ForwardPE = 700;
  const result = researchOutlook(input);
  assert.equal(result.available, false);
  assert.match(result.reason, /sector-specific/i);
});

test("outlook rejects a fiscal label that contradicts its underlying forecast date", () => {
  const input = research();
  input.evidence.estimates[0].period = "FY2035";
  const result = load().researchOutlook(input);
  assert.equal(result.available, false);
  assert.match(result.reason, /period|date/i);
});

test("a bank can show a labelled earnings sensitivity without applying an operating-cash-flow valuation", () => {
  const r = research();
  r.company.symbol = "NU";
  r.evidence.profile = {
    sector: "Financial Services",
    industry: "Banks - Diversified",
  };
  const result = load().researchOutlook(r);
  assert.equal(result.available, true);
  assert.equal(result.cases[1].target, 160);
});

test("consensus comparison calculates the gap without calling it fair value or inventing high/low targets", () => {
  const input = research();
  input.evidence.consensus = { target: 150 };
  const result = load().consensusOutlook(input);
  assert.equal(result.change, 50);
  assert.equal(result.target, 150);
  assert.equal(result.high, undefined);
  assert.equal(result.low, undefined);
});

test("a malformed nearer fiscal label cannot hide another complete eligible EPS forecast", () => {
  const r = research();
  const good = r.evidence.estimates[0];
  r.evidence.estimates = [
    { ...good, period: "FY2035" },
    { ...good, date: "2028-12-31", period: "FY2028" },
    r.evidence.estimates[1],
  ];
  const result = load().researchOutlook(r);
  assert.equal(result.available, true);
  assert.equal(result.period, "FY2028");
});

test("analyst consensus is listing-currency opinion and does not require a share reconciliation", async () => {
  const fs = await import("node:fs/promises");
  const r = JSON.parse(
    await fs.readFile(
      new URL("./fixtures/iren-observed-20261019.json", import.meta.url),
      "utf8",
    ),
  );
  const { consensusOutlook } = await import("../lib/outlook.ts");
  assert.equal(consensusOutlook(r).target, 77.8056);
  r.company.foreignListing = true;
  assert.equal(consensusOutlook(r).target, 77.8056);
  r.quote.currency = "EUR";
  assert.equal(consensusOutlook(r), null);
});

test("quote freshness transitions do not remove a dated analyst target", () => {
  const r = research();
  r.evidence.consensus = { target: 150 };
  r.quote.asOf = "2026-10-16T20:00:00Z";
  const { consensusOutlook } = load();
  const live = consensusOutlook(r);
  r.quote.stale = true;
  const older = consensusOutlook(r);
  assert.equal(older.target, live.target);
  assert.equal(older.referenceStatus, "older");
  assert.equal(older.change, 50);
  r.quote.price = null;
  const missing = consensusOutlook(r);
  assert.equal(missing.target, 150);
  assert.equal(missing.change, null);
  assert.equal(missing.referenceStatus, "unavailable");
  r.quote.price = 100;
  r.quote.asOf = "2026-01-01";
  assert.equal(consensusOutlook(r).change, null);
});

test("eligible earnings scenarios keep their targets when a recent settled quote becomes older", () => {
  const r = research();
  const { researchOutlook } = load();
  const fresh = researchOutlook(r);
  assert.equal(fresh.available, true);
  r.quote.stale = true;
  const older = researchOutlook(r);
  assert.equal(older.available, true);
  assert.deepEqual(older.cases, fresh.cases);
  r.quote.asOf = "2026-01-01";
  assert.equal(researchOutlook(r).available, false);
});

test("headline policy prefers eligible earnings cases and uses analyst fallback for revenue-only cases", async () => {
  const { researchBrief } = await import("../lib/research-brief.ts");
  const r = JSON.parse(
    fs.readFileSync("tests/fixtures/iren-observed-20261019.json", "utf8"),
  );
  r.company.symbol = "QATEST";
  r.company.sector = "Technology";
  r.evidence.profile.sector = "Technology";
  r.evidence.profile.industry = "Software - Application";
  r.evidence.multiples.ForwardPE = 20;
  r.evidence.estimates = [
    {
      date: "2028-06-30",
      period: "FY2028",
      frequency: "Annual",
      currency: "USD",
      epsLow: 5,
      eps: 6,
      epsHigh: 7,
      analysts: 10,
      revenueLow: 1e9,
      revenue: 2e9,
      revenueHigh: 3e9,
    },
  ];
  r.evidence.estimates.push({
    date: "2027-03-31",
    period: "FY2027",
    frequency: "Annual",
    currency: "USD",
    eps: r.quote.price / 20,
    epsLow: r.quote.price / 22,
    epsHigh: r.quote.price / 18,
    analysts: 10,
  });
  assert.equal(researchBrief(r).scenarioEligible, true);
  r.quote.stale = true;
  assert.equal(researchBrief(r).scenarioEligible, true);
  r.quote.stale = false;
  r.evidence.estimates[0].epsLow = -1;
  const unsupported = researchBrief(r);
  assert.equal(unsupported.scenarioEligible, false);
  assert.equal(unsupported.consensus.target, 77.8056);
});

test("unreconciled forward P/E is withheld but explicit assumptions remain conditional", () => {
  const r = research();
  r.company.symbol = "APP";
  r.evidence.multiples.ForwardPE = 12;
  r.evidence.estimates[0].eps = 19.57;
  r.evidence.estimates[0].epsLow = 18;
  r.evidence.estimates[0].epsHigh = 21;
  const automatic = outlook.researchOutlook(r);
  assert.equal(automatic.available, false);
  assert.match(automatic.reason, /cannot be reconciled/);
  const explicit = outlook.researchOutlook(r, { earningsMultiple: 12 });
  assert.equal(explicit.available, true);
  assert.equal(explicit.multipleSource, "user-assumption");
  assert.equal(explicit.cases[1].target, 19.57 * 12);
  r.evidence.estimates[0].currency = "EUR";
  assert.equal(
    outlook.researchOutlook(r, { earningsMultiple: 12 }).available,
    false,
  );
});
test("missing near-year EPS and invalid manual multiples cannot silently use provider P/E", () => {
  const r = research();
  r.evidence.estimates.pop();
  assert.equal(outlook.researchOutlook(r).available, false);
  for (const earningsMultiple of [NaN, Infinity, -1, 0, 501])
    assert.equal(
      outlook.researchOutlook(r, { earningsMultiple }).available,
      false,
    );
});

test("price-anchored scenarios disclose the anchor and select only supplied fiscal ends", () => {
  const r = research();
  r.evidence.multiples.ForwardPE = 3;
  r.evidence.estimates.push({date:"2028-10-17", period:"FY2028",frequency:"annual",currency:"USD",eps:7,epsLow:5,epsHigh:9,analysts:12});
  assert.equal(outlook.researchOutlook(r).available,false);
  const result = outlook.researchOutlook(r,{priceAnchored:true,fiscalEnd:"2028-10-17"});
  assert.equal(result.available,true);
  assert.equal(result.multipleSource,"price-implied");
  assert.equal(result.end,"2028-10-17");
  assert.deepEqual(result.cases.map(x=>x.target),[80,140,216]);
  assert.match(result.caveat,/not independent fair value/);
  assert.equal(outlook.researchOutlook(r,{priceAnchored:true,fiscalEnd:"2030-10-17"}).available,false);
  r.evidence.estimates[1].epsLow = null;
  assert.equal(outlook.researchOutlook(r,{priceAnchored:true}).available,false);
});
