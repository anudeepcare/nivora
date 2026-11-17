import test from "node:test";
import assert from "node:assert/strict";
import { universe } from "./helpers/market-universe.mjs";
import { scenarioCases } from "../lib/scenario-cases.ts";
import { scenarioHeadline } from "../lib/scenario-headline.ts";
import { researchOutlook } from "../lib/outlook.ts";
import { aurynDecision } from "../lib/auryn-decision.ts";
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
          date: "2026-12-31",
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
const r = research();
assert.ok(r, "fixture has a competing outlook");
test("qualified cash-flow valuation leads over a market-multiple outlook", () => {
  const d = { reference: null };
  const valuation = {
    basis: "cash-flow",
    label: "Cash-flow valuation",
    bear: 60,
    base: 90,
    bull: 120,
  };
  const actual = scenarioCases(r, { ...d, valuation });
  assert.deepEqual(actual, {
    bear: 60,
    base: 90,
    bull: 120,
    source: valuation.label,
    kind: "model",
  });
});
test("invalid observation timestamp cannot crash headline rendering", () => {
  assert.equal(
    scenarioHeadline({
      ...universe(8)[0].research,
      priceObservedAt: "invalid",
    }),
    null,
  );
});

import { normalizeEodFundamentals } from "../lib/eodhd-normalize.ts";
function revenueInput(symbol = "NBIS") {
  const normalized = normalizeEodFundamentals(
    symbol,
    {
      General: {
        Code: symbol,
        Name: symbol,
        Exchange: "NASDAQ",
        CurrencyCode: "USD",
        CountryISO: "US",
        UpdatedAt: "2026-10-16",
      },
      Highlights: { MarketCapitalization: 5000000000, RevenueTTM: 1060000000 },
      SharesStats: { SharesOutstanding: 100000000 },
      Valuation: { EnterpriseValueRevenue: 5, EnterpriseValue: 5300000000 },
      Financials: {
        Income_Statement: { currency_symbol: "USD" },
        Balance_Sheet: {
          currency_symbol: "USD",
          quarterly: {
            "2026-06-30": {
              date: "2026-06-30",
              filing_date: "2026-08-01",
              cashAndEquivalents: 200000000,
              shortLongTermDebtTotal: 500000000,
            },
          },
        },
      },
      Earnings: {
        Trend: {
          Annual: {
            "2028-12-31": {
              date: "2028-12-31",
              period: "FY2028",
              currency: "USD",
              revenueEstimateLow: 1000000000,
              revenueEstimateAvg: 2000000000,
              revenueEstimateHigh: 3000000000,
              earningsEstimateAvg: -1,
              earningsEstimateNumberOfAnalysts: 10,
            },
          },
        },
      },
    },
    "2026-10-17T00:00:00Z",
  );
  // Explicit economic observation dates are synthetic fixture data; General's
  // dataset update date alone must never populate these in normalization.
  normalized.evidence.listingObservations = {
    marketCap: { asOf: "2026-10-16", currency: "USD", shareBasis: symbol },
    shares: { asOf: "2026-10-16", unit: "shares", shareBasis: symbol },
  };
  return {
    ...normalized,
    quote: { price: 50, currency: "USD", stale: false, asOf: "2026-10-16" },
    history: [],
    historySource: "fixture",
    retrievedAt: "2026-10-17T00:00:00Z",
  };
}
test("rejected revenue outlook preserves a qualified earnings fallback", () => {
  const r = revenueInput();
  for (const e of r.evidence.estimates) {
    e.revenue *= 10;
    e.revenueLow *= 10;
    e.revenueHigh *= 10;
  }
  const o = researchOutlook(r);
  assert.equal(o.available, true);
  assert.ok(o.cases[1].target > r.quote.price * 3);
  const valuation = {
    basis: "earnings",
    label: "Earnings sensitivity",
    bear: 30,
    base: 50,
    bull: 70,
  };
  assert.deepEqual(
    scenarioCases(r, {
      reference: { price: 50, asOf: r.quote.asOf, currency: "USD" },
      valuation,
    }),
    { bear: 30, base: 50, bull: 70, source: valuation.label, kind: "model" },
  );
});
test("malformed qualified values never displace an eligible outlook", () => {
  for (const bounds of [
    [NaN, 90, 120],
    [60, Infinity, 120],
    [120, 90, 60],
    [-1, 90, 120],
  ]) {
    const actual = scenarioCases(r, {
      reference: null,
      valuation: {
        basis: "cash-flow",
        label: "Cash-flow valuation",
        bear: bounds[0],
        base: bounds[1],
        bull: bounds[2],
      },
    });
    assert.equal(actual.source, "AURYN earnings model");
    assert.equal(actual.base, 160);
  }
});
